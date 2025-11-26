const db = require("../config/database");

class Department {
  // Obtener todos los departamentos activos
  static async getAll() {
    // db.query ya desestructura [results] del pool.execute
    const rows = await db.query(
      "SELECT * FROM departments WHERE is_active = TRUE ORDER BY name"
    );
    console.log("Department.getAll - rows type:", typeof rows, "isArray:", Array.isArray(rows));
    console.log("Department.getAll - rows:", JSON.stringify(rows));
    return rows;
  }

  // Obtener departamento por ID
  static async getById(id) {
    // db.query ya desestructura [results] del pool.execute
    const rows = await db.query("SELECT * FROM departments WHERE id = ?", [
      id,
    ]);
    console.log("Department.getById - id:", id, "rows:", rows);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  // Obtener departamento por nombre
  static async getByName(name) {
    // db.query ya desestructura [results] del pool.execute
    const rows = await db.query("SELECT * FROM departments WHERE name = ?", [
      name,
    ]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  // Crear nuevo departamento
  static async create(departmentData) {
    const { name, description, manager_id } = departmentData;
    try {
      // db.query ya desestructura y devuelve solo results
      const result = await db.query(
        "INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)",
        [name, description, manager_id || null]
      );
      console.log("Department.create - result:", result);
      return result.insertId;
    } catch (error) {
      console.error("Department.create error:", error);
      throw error;
    }
  }

  // Actualizar departamento
  static async update(id, departmentData) {
    const { name, description, manager_id, is_active } = departmentData;
    const result = await db.query(
      "UPDATE departments SET name = ?, description = ?, manager_id = ?, is_active = ? WHERE id = ?",
      [name, description, manager_id || null, is_active, id]
    );
    return result.affectedRows > 0;
  }

  // Eliminar departamento (soft delete)
  static async delete(id) {
    const result = await db.query(
      "UPDATE departments SET is_active = FALSE WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Obtener usuarios de un departamento
  static async getUsers(departmentId) {
    const rows = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone
       FROM users u
       WHERE u.department_id = ? AND u.is_active = TRUE
       ORDER BY u.last_name, u.first_name`,
      [departmentId]
    );
    return rows;
  }

  // Obtener estadísticas del departamento
  static async getStats(departmentId) {
    // Total de usuarios
    const userCount = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE department_id = ? AND is_active = TRUE",
      [departmentId]
    );

    // Tickets abiertos del departamento
    const openTickets = await db.query(
      `SELECT COUNT(*) as count FROM tickets t
       INNER JOIN users u ON t.created_by = u.id
       WHERE u.department_id = ? AND t.status IN ('open', 'in_progress', 'pending')`,
      [departmentId]
    );

    // Tickets cerrados este mes
    const closedThisMonth = await db.query(
      `SELECT COUNT(*) as count FROM tickets t
       INNER JOIN users u ON t.created_by = u.id
       WHERE u.department_id = ? 
       AND t.status = 'closed'
       AND t.closed_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
      [departmentId]
    );

    return {
      total_users: (userCount && userCount[0]) ? userCount[0].count : 0,
      open_tickets: (openTickets && openTickets[0]) ? openTickets[0].count : 0,
      closed_this_month: (closedThisMonth && closedThisMonth[0]) ? closedThisMonth[0].count : 0,
    };
  }

  // Obtener departamento con manager info
  static async getWithManager(id) {
    const rows = await db.query(
      `SELECT 
        d.*,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name,
        m.email as manager_email
       FROM departments d
       LEFT JOIN users m ON d.manager_id = m.id
       WHERE d.id = ?`,
      [id]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  }

  // Buscar departamentos
  static async search(query) {
    const rows = await db.query(
      `SELECT * FROM departments 
       WHERE is_active = TRUE 
       AND (name LIKE ? OR description LIKE ?)
       ORDER BY name`,
      [`%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = Department;
