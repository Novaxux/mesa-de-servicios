const { query } = require("../config/database");

class Notification {
  static async create(notificationData) {
    const { user_id, ticket_id, type, title, message } = notificationData;

    const sql = `INSERT INTO notifications (user_id, ticket_id, type, title, message) 
                 VALUES (?, ?, ?, ?, ?)`;
    const result = await query(sql, [
      user_id,
      ticket_id || null,
      type,
      title,
      message,
    ]);
    return await this.findById(result.insertId);
  }

  static async findById(id) {
    const sql = `SELECT n.*, t.ticket_number 
                 FROM notifications n
                 LEFT JOIN tickets t ON n.ticket_id = t.id
                 WHERE n.id = ?`;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  static async findByUser(userId, filters = {}) {
    let sql = `SELECT n.*, t.ticket_number 
               FROM notifications n
               LEFT JOIN tickets t ON n.ticket_id = t.id
               WHERE n.user_id = ?`;
    const params = [userId];

    if (filters.is_read !== undefined) {
      sql += " AND n.is_read = ?";
      params.push(filters.is_read);
    }

    sql += " ORDER BY n.created_at DESC";

    if (filters.limit) {
      const limitValue = parseInt(filters.limit, 10);
      if (!isNaN(limitValue) && limitValue > 0 && limitValue <= 1000) {
        // Interpolar LIMIT directamente en lugar de usar parámetro preparado
        // Esto evita el error "Incorrect arguments to mysqld_stmt_execute"
        sql += ` LIMIT ${limitValue}`;
      }
    }

    return await query(sql, params);
  }

  static async markAsRead(id, userId) {
    const sql =
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
    await query(sql, [id, userId]);
    return await this.findById(id);
  }

  static async markAllAsRead(userId) {
    const sql =
      "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0";
    await query(sql, [userId]);
    return true;
  }

  static async getUnreadCount(userId) {
    const sql =
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0";
    const results = await query(sql, [userId]);
    return results[0]?.count || 0;
  }

  static async delete(id, userId) {
    const sql = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
    await query(sql, [id, userId]);
    return true;
  }
}

module.exports = Notification;
