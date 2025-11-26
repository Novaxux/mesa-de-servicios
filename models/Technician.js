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
                 d.name as department_name
                 FROM technicians t
                 LEFT JOIN users u ON t.user_id = u.id
                 LEFT JOIN departments d ON u.department_id = d.id
                 WHERE t.id = ?`;
    const results = await query(sql, [id]);
    return results[0] || null;
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
               (SELECT COUNT(*) FROM tickets WHERE assigned_to = t.user_id AND status NOT IN ('resolved', 'closed')) as active_tickets
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
    const sql = `SELECT 
                 COUNT(*) as total_tickets,
                 SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
                 SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
                 AVG(TIMESTAMPDIFF(HOUR, created_at, resolution_time)) as avg_resolution_time
                 FROM tickets 
                 WHERE assigned_to = (SELECT user_id FROM technicians WHERE id = ?)
                 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    const results = await query(sql, [technicianId]);
    return results[0] || {};
  }

  static async getPerformance(technicianId, dateFrom, dateTo) {
    const sql = `SELECT 
                 COUNT(*) as total_resolved,
                 AVG(TIMESTAMPDIFF(HOUR, created_at, response_time)) as avg_response_time,
                 AVG(TIMESTAMPDIFF(HOUR, created_at, resolution_time)) as avg_resolution_time,
                 SUM(CASE WHEN sla_breached = 1 THEN 1 ELSE 0 END) as sla_breached_count,
                 AVG((SELECT AVG(rating) FROM feedback WHERE technician_id = t.assigned_to)) as avg_rating
                 FROM tickets t
                 WHERE t.assigned_to = (SELECT user_id FROM technicians WHERE id = ?)
                 AND t.status IN ('resolved', 'closed')
                 AND DATE(t.created_at) BETWEEN ? AND ?`;
    const results = await query(sql, [technicianId, dateFrom, dateTo]);
    return results[0] || {};
  }
}

module.exports = Technician;
