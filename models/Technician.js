const { query } = require("../config/database");

class Technician {
  static async create(technicianData) {
    const { user_id, specialty, schedule_start, schedule_end, max_tickets } =
      technicianData;

    const sql = `INSERT INTO technicians (user_id, specialty, schedule_start, schedule_end, max_tickets) 
                 VALUES (?, ?, ?, ?, ?)`;
    const result = await query(sql, [
      user_id,
      specialty,
      schedule_start,
      schedule_end,
      max_tickets || 10,
    ]);
    return await this.findById(result.insertId);
  }

  static async findById(id) {
    const sql = `SELECT t.*, u.email, u.first_name, u.last_name, u.phone, u.department_id,
                 d.name as department_name,
                 (SELECT COUNT(*) FROM tickets WHERE assigned_to = t.user_id AND status NOT IN ('resolved', 'closed')) as assigned_tickets,
                 (SELECT COUNT(*) FROM tickets WHERE assigned_to = t.user_id AND status IN ('resolved', 'closed')) as resolved_tickets,
                 (SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, resolution_time)), 1) 
                  FROM tickets WHERE assigned_to = t.user_id AND status IN ('resolved', 'closed') AND resolution_time IS NOT NULL) as avg_resolution_time,
                 (SELECT ROUND(AVG(rating), 1) FROM feedback WHERE technician_id = t.user_id) as satisfaction_rating,
                 (SELECT COUNT(*) FROM feedback WHERE technician_id = t.user_id) as total_ratings
                 FROM technicians t
                 LEFT JOIN users u ON t.user_id = u.id
                 LEFT JOIN departments d ON u.department_id = d.id
                 WHERE t.id = ?`;
    const results = await query(sql, [id]);
    const tech = results[0] || null;
    if (tech && tech.schedule_start && tech.schedule_end) {
      tech.schedule = `${tech.schedule_start} - ${tech.schedule_end}`;
    }
    return tech;
  }

  static async findByUserId(userId) {
    const sql = `SELECT t.*, u.email, u.first_name, u.last_name, u.phone, u.department_id,
                 d.name as department_name
                 FROM technicians t
                 LEFT JOIN users u ON t.user_id = u.id
                 LEFT JOIN departments d ON u.department_id = d.id
                 WHERE t.user_id = ?`;
    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = `SELECT t.*, u.email, u.first_name, u.last_name, u.phone, u.department_id,
               d.name as department_name,
               (SELECT COUNT(*) FROM tickets WHERE assigned_to = t.user_id AND status NOT IN ('resolved', 'closed')) as assigned_tickets
               FROM technicians t
               LEFT JOIN users u ON t.user_id = u.id
               LEFT JOIN departments d ON u.department_id = d.id
               WHERE 1=1`;
    const params = [];

    if (filters.is_available !== undefined) {
      sql += " AND t.is_available = ?";
      params.push(filters.is_available);
    }

    if (filters.specialty) {
      sql += " AND t.specialty = ?";
      params.push(filters.specialty);
    }

    sql += " ORDER BY u.first_name, u.last_name";
    return await query(sql, params);
  }

  static async update(id, technicianData) {
    const fields = [];
    const params = [];

    if (technicianData.specialty !== undefined) {
      fields.push("specialty = ?");
      params.push(technicianData.specialty);
    }

    if (technicianData.schedule_start !== undefined) {
      fields.push("schedule_start = ?");
      params.push(technicianData.schedule_start);
    }

    if (technicianData.schedule_end !== undefined) {
      fields.push("schedule_end = ?");
      params.push(technicianData.schedule_end);
    }

    if (technicianData.max_tickets !== undefined) {
      fields.push("max_tickets = ?");
      params.push(technicianData.max_tickets);
    }

    if (technicianData.is_available !== undefined) {
      fields.push("is_available = ?");
      params.push(technicianData.is_available);
    }

    if (fields.length === 0) return await this.findById(id);

    params.push(id);
    const sql = `UPDATE technicians SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);
    return await this.findById(id);
  }

  static async getWorkload(technicianId) {
    // Obtener información del técnico
    const techInfo = await this.findById(technicianId);
    if (!techInfo) return {};

    const sql = `SELECT 
                 COUNT(CASE WHEN status IN ('open', 'in_progress', 'pending') THEN 1 END) as assigned_tickets,
                 COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
                 COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
                 COUNT(CASE WHEN status IN ('resolved', 'closed') AND DATE(resolution_time) = CURDATE() THEN 1 END) as resolved_today
                 FROM tickets 
                 WHERE assigned_to = ?`;
    const results = await query(sql, [techInfo.user_id]);
    const workloadData = results[0] || {};

    return {
      assigned_tickets: workloadData.assigned_tickets || 0,
      in_progress_tickets: workloadData.in_progress_tickets || 0,
      pending_tickets: workloadData.pending_tickets || 0,
      resolved_today: workloadData.resolved_today || 0,
      max_tickets: techInfo.max_tickets || 10,
      is_available: techInfo.is_available || false,
    };
  }

  static async getPerformance(technicianId, dateFrom, dateTo) {
    // Obtener información del técnico
    const techInfo = await this.findById(technicianId);
    if (!techInfo) return {};

    const sql = `SELECT 
                 COUNT(*) as total_resolved,
                 ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.response_time)) / 60, 1) as avg_response_hours,
                 ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.resolution_time)) / 60, 1) as avg_resolution_hours,
                 SUM(CASE WHEN t.sla_breached = 0 THEN 1 ELSE 0 END) as within_sla,
                 COUNT(*) as total_tickets
                 FROM tickets t
                 WHERE t.assigned_to = ?
                 AND t.status IN ('resolved', 'closed')
                 AND DATE(t.created_at) BETWEEN ? AND ?`;
    const results = await query(sql, [techInfo.user_id, dateFrom, dateTo]);
    const perfData = results[0] || {};

    // Obtener rating promedio
    const ratingSQL = `SELECT ROUND(AVG(rating), 1) as avg_rating 
                       FROM feedback 
                       WHERE technician_id = ?
                       AND DATE(created_at) BETWEEN ? AND ?`;
    const ratingResults = await query(ratingSQL, [
      techInfo.user_id,
      dateFrom,
      dateTo,
    ]);
    const avgRating = ratingResults[0]?.avg_rating || null;

    const totalResolved = perfData.total_resolved || 0;
    const withinSLA = perfData.within_sla || 0;
    const slaRate =
      totalResolved > 0 ? Math.round((withinSLA / totalResolved) * 100) : 0;

    return {
      total_resolved: totalResolved,
      avg_response_time: perfData.avg_response_hours
        ? `${perfData.avg_response_hours} hrs`
        : "N/A",
      avg_resolution_time: perfData.avg_resolution_hours
        ? `${perfData.avg_resolution_hours} hrs`
        : "N/A",
      within_sla: withinSLA,
      sla_compliance_rate: slaRate,
      avg_rating: avgRating,
    };
  }
}

module.exports = Technician;
