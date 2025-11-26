const { query } = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone,
      department_id,
    } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (email, password, first_name, last_name, role, phone, department_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const result = await query(sql, [
      email,
      hashedPassword,
      first_name,
      last_name,
      role,
      phone,
      department_id || null,
    ]);
    return result.insertId;
  }

  static async findByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ?";
    const results = await query(sql, [email]);
    return results[0] || null;
  }

  static async findById(id) {
    const sql = `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.department_id, 
                 d.name as department_name, u.is_active, u.created_at 
                 FROM users u
                 LEFT JOIN departments d ON u.department_id = d.id
                 WHERE u.id = ?`;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.department_id,
               d.name as department_name, u.is_active, u.created_at 
               FROM users u
               LEFT JOIN departments d ON u.department_id = d.id
               WHERE 1=1`;
    const params = [];

    if (filters.role) {
      sql += " AND u.role = ?";
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      sql += " AND u.is_active = ?";
      params.push(filters.is_active);
    }

    if (filters.department_id) {
      sql += " AND u.department_id = ?";
      params.push(filters.department_id);
    }

    sql += " ORDER BY u.created_at DESC";
    return await query(sql, params);
  }

  static async update(id, userData) {
    const fields = [];
    const params = [];

    if (userData.first_name) {
      fields.push("first_name = ?");
      params.push(userData.first_name);
    }
    if (userData.last_name) {
      fields.push("last_name = ?");
      params.push(userData.last_name);
    }
    if (userData.phone) {
      fields.push("phone = ?");
      params.push(userData.phone);
    }
    if (userData.department_id !== undefined) {
      fields.push("department_id = ?");
      params.push(userData.department_id);
    }
    if (userData.role) {
      fields.push("role = ?");
      params.push(userData.role);
    }
    if (userData.is_active !== undefined) {
      fields.push("is_active = ?");
      params.push(userData.is_active);
    }
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      fields.push("password = ?");
      params.push(hashedPassword);
    }

    if (fields.length === 0) return null;

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);
    return await this.findById(id);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async delete(id) {
    const sql = "DELETE FROM users WHERE id = ?";
    await query(sql, [id]);
    return true;
  }
}

module.exports = User;
