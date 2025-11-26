const { query } = require("../config/database");
const moment = require("moment");

class Ticket {
  static generateTicketNumber() {
    const prefix = "TKT";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  static async create(ticketData) {
    const ticketNumber = this.generateTicketNumber();
    const {
      title,
      description,
      priority_id,
      category_id,
      incident_type_id,
      created_by,
      assigned_to,
    } = ticketData;

    // Obtener tiempos de SLA para la prioridad
    const slaConfigResults = await query(
      "SELECT response_time_hours, resolution_time_hours FROM sla_config WHERE priority_id = ?",
      [priority_id]
    );
    const slaConfig = slaConfigResults.length > 0 ? slaConfigResults[0] : null;

    const responseTimeHours = slaConfig?.response_time_hours || 8;
    const resolutionTimeHours = slaConfig?.resolution_time_hours || 48;

    const slaResponseDeadline = moment()
      .add(responseTimeHours, "hours")
      .toDate();
    const slaResolutionDeadline = moment()
      .add(resolutionTimeHours, "hours")
      .toDate();

    const sql = `INSERT INTO tickets 
                 (ticket_number, title, description, priority_id, category_id, incident_type_id, 
                  created_by, assigned_to, sla_response_deadline, sla_resolution_deadline) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await query(sql, [
      ticketNumber,
      title,
      description,
      priority_id,
      category_id,
      incident_type_id || null,
      created_by,
      assigned_to || null,
      slaResponseDeadline,
      slaResolutionDeadline,
    ]);

    // Registrar en historial
    await this.addHistory(
      result.insertId,
      "created",
      null,
      "Ticket creado",
      created_by
    );

    return await this.findById(result.insertId);
  }

  static async findById(id) {
    const sql = `SELECT t.*, 
                 p.name as priority_name, p.level as priority_level,
                 c.name as category_name,
                 it.name as incident_type_name,
                 u1.first_name as created_by_name, u1.last_name as created_by_lastname,
                 u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname
                 FROM tickets t
                 LEFT JOIN priorities p ON t.priority_id = p.id
                 LEFT JOIN categories c ON t.category_id = c.id
                 LEFT JOIN incident_types it ON t.incident_type_id = it.id
                 LEFT JOIN users u1 ON t.created_by = u1.id
                 LEFT JOIN users u2 ON t.assigned_to = u2.id
                 WHERE t.id = ?`;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = `SELECT t.*, 
               p.name as priority_name, p.level as priority_level,
               c.name as category_name,
               u1.first_name as created_by_name, u1.last_name as created_by_lastname,
               u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname
               FROM tickets t
               LEFT JOIN priorities p ON t.priority_id = p.id
               LEFT JOIN categories c ON t.category_id = c.id
               LEFT JOIN users u1 ON t.created_by = u1.id
               LEFT JOIN users u2 ON t.assigned_to = u2.id
               WHERE 1=1`;
    const params = [];

    if (filters.status) {
      sql += " AND t.status = ?";
      params.push(filters.status);
    }

    if (filters.priority_id) {
      sql += " AND t.priority_id = ?";
      params.push(filters.priority_id);
    }

    if (filters.category_id) {
      sql += " AND t.category_id = ?";
      params.push(filters.category_id);
    }

    if (filters.created_by) {
      sql += " AND t.created_by = ?";
      params.push(filters.created_by);
    }

    if (filters.assigned_to) {
      sql += " AND t.assigned_to = ?";
      params.push(filters.assigned_to);
    }

    if (filters.department_id) {
      sql += " AND u1.department_id = ?";
      params.push(filters.department_id);
    }

    if (filters.date_from) {
      sql += " AND DATE(t.created_at) >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += " AND DATE(t.created_at) <= ?";
      params.push(filters.date_to);
    }

    sql += " ORDER BY t.created_at DESC";

    if (filters.limit) {
      const limitValue = parseInt(filters.limit, 10);
      const offsetValue = filters.offset ? parseInt(filters.offset, 10) : 0;

      if (!isNaN(limitValue) && limitValue > 0 && limitValue <= 1000) {
        // Interpolar LIMIT y OFFSET directamente para evitar error de MySQL
        sql += ` LIMIT ${limitValue}`;
        if (!isNaN(offsetValue) && offsetValue >= 0) {
          sql += ` OFFSET ${offsetValue}`;
        }
      }
    }

    return await query(sql, params);
  }

  static async update(id, ticketData, changedBy) {
    const fields = [];
    const params = [];

    if (ticketData.status) {
      fields.push("status = ?");
      params.push(ticketData.status);

      // Actualizar tiempos según el estado
      if (ticketData.status === "in_progress" && !ticketData.response_time) {
        fields.push("response_time = NOW()");
      }
      if (ticketData.status === "resolved" && !ticketData.resolution_time) {
        fields.push("resolution_time = NOW()");
      }
      if (ticketData.status === "closed" && !ticketData.closed_at) {
        fields.push("closed_at = NOW()");
      }
    }

    if (ticketData.priority_id) {
      fields.push("priority_id = ?");
      params.push(ticketData.priority_id);
    }

    if (ticketData.assigned_to !== undefined) {
      fields.push("assigned_to = ?");
      params.push(ticketData.assigned_to || null);
    }

    if (ticketData.title) {
      fields.push("title = ?");
      params.push(ticketData.title);
    }

    if (ticketData.description) {
      fields.push("description = ?");
      params.push(ticketData.description);
    }

    if (fields.length === 0) return await this.findById(id);

    params.push(id);
    const sql = `UPDATE tickets SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    // Registrar cambios en historial
    if (ticketData.status) {
      await this.addHistory(
        id,
        "status_changed",
        null,
        ticketData.status,
        changedBy
      );
    }

    return await this.findById(id);
  }

  static async addHistory(ticketId, action, oldValue, newValue, changedBy) {
    const sql = `INSERT INTO ticket_history (ticket_id, action, old_value, new_value, changed_by) 
                 VALUES (?, ?, ?, ?, ?)`;
    await query(sql, [ticketId, action, oldValue, newValue, changedBy]);
  }

  static async getHistory(ticketId) {
    const sql = `SELECT th.*, u.first_name, u.last_name 
                 FROM ticket_history th
                 LEFT JOIN users u ON th.changed_by = u.id
                 WHERE th.ticket_id = ?
                 ORDER BY th.created_at DESC`;
    return await query(sql, [ticketId]);
  }

  static async getStatistics(filters = {}) {
    let sql = `SELECT 
               COUNT(*) as total,
               SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
               SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
               SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
               SUM(CASE WHEN sla_breached = 1 THEN 1 ELSE 0 END) as sla_breached
               FROM tickets WHERE 1=1`;
    const params = [];

    if (filters.date_from) {
      sql += " AND DATE(created_at) >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += " AND DATE(created_at) <= ?";
      params.push(filters.date_to);
    }

    const results = await query(sql, params);
    return results[0] || {};
  }
}

module.exports = Ticket;
