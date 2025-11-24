const { query } = require("../config/database");

class KnowledgeBase {
  static async create(articleData) {
    const { title, content, category_id, tags, created_by } = articleData;

    const sql = `INSERT INTO knowledge_base (title, content, category_id, tags, created_by) 
                 VALUES (?, ?, ?, ?, ?)`;
    const result = await query(sql, [
      title,
      content,
      category_id || null,
      tags || null,
      created_by,
    ]);
    return await this.findById(result.insertId);
  }

  static async findById(id) {
    const sql = `SELECT kb.*, c.name as category_name, 
                 u.first_name as created_by_name, u.last_name as created_by_lastname
                 FROM knowledge_base kb
                 LEFT JOIN categories c ON kb.category_id = c.id
                 LEFT JOIN users u ON kb.created_by = u.id
                 WHERE kb.id = ?`;
    const results = await query(sql, [id]);

    if (results[0]) {
      // Incrementar vistas
      await query("UPDATE knowledge_base SET views = views + 1 WHERE id = ?", [
        id,
      ]);
      results[0].views += 1;
    }

    return results[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = `SELECT kb.*, c.name as category_name,
               u.first_name as created_by_name, u.last_name as created_by_lastname
               FROM knowledge_base kb
               LEFT JOIN categories c ON kb.category_id = c.id
               LEFT JOIN users u ON kb.created_by = u.id
               WHERE 1=1`;
    const params = [];

    if (filters.category_id) {
      sql += " AND kb.category_id = ?";
      params.push(filters.category_id);
    }

    if (filters.search) {
      sql += " AND (kb.title LIKE ? OR kb.content LIKE ? OR kb.tags LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.is_published !== undefined) {
      sql += " AND kb.is_published = ?";
      params.push(filters.is_published);
    } else {
      sql += " AND kb.is_published = 1";
    }

    sql += " ORDER BY kb.helpful_count DESC, kb.views DESC";

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

  static async update(id, articleData) {
    const fields = [];
    const params = [];

    if (articleData.title) {
      fields.push("title = ?");
      params.push(articleData.title);
    }

    if (articleData.content) {
      fields.push("content = ?");
      params.push(articleData.content);
    }

    if (articleData.category_id !== undefined) {
      fields.push("category_id = ?");
      params.push(articleData.category_id);
    }

    if (articleData.tags !== undefined) {
      fields.push("tags = ?");
      params.push(articleData.tags);
    }

    if (articleData.is_published !== undefined) {
      fields.push("is_published = ?");
      params.push(articleData.is_published);
    }

    if (fields.length === 0) return await this.findById(id);

    params.push(id);
    const sql = `UPDATE knowledge_base SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);
    return await this.findById(id);
  }

  static async incrementHelpful(id) {
    await query(
      "UPDATE knowledge_base SET helpful_count = helpful_count + 1 WHERE id = ?",
      [id]
    );
    return await this.findById(id);
  }

  static async delete(id) {
    const sql = "DELETE FROM knowledge_base WHERE id = ?";
    await query(sql, [id]);
    return true;
  }
}

module.exports = KnowledgeBase;
