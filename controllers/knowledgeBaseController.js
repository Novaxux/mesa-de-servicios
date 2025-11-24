const KnowledgeBase = require("../models/KnowledgeBase");

class KnowledgeBaseController {
  async create(req, res) {
    try {
      const article = await KnowledgeBase.create({
        title: req.body.title,
        content: req.body.content,
        category_id: req.body.category_id,
        tags: req.body.tags,
        created_by: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Artículo creado exitosamente",
        data: { article },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear artículo",
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};

      if (req.query.category_id) {
        filters.category_id = req.query.category_id;
      }

      if (req.query.search) {
        filters.search = req.query.search;
      }

      // Convertir is_published de string a booleano/número para MySQL
      if (req.query.is_published !== undefined) {
        const isPublishedValue = req.query.is_published;
        if (
          isPublishedValue === "true" ||
          isPublishedValue === "1" ||
          isPublishedValue === true
        ) {
          filters.is_published = 1;
        } else if (
          isPublishedValue === "false" ||
          isPublishedValue === "0" ||
          isPublishedValue === false
        ) {
          filters.is_published = 0;
        }
      }

      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit, 10) || 50;
      }

      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset, 10) || 0;
      }

      const articles = await KnowledgeBase.findAll(filters);

      res.json({
        success: true,
        data: { articles },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener artículos",
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Artículo no encontrado",
        });
      }

      res.json({
        success: true,
        data: { article },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener artículo",
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Artículo no encontrado",
        });
      }

      // Solo el autor o admin puede editar
      if (req.user.role !== "admin" && article.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para editar este artículo",
        });
      }

      const updatedArticle = await KnowledgeBase.update(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        message: "Artículo actualizado exitosamente",
        data: { article: updatedArticle },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar artículo",
        error: error.message,
      });
    }
  }

  async markHelpful(req, res) {
    try {
      const article = await KnowledgeBase.incrementHelpful(req.params.id);
      res.json({
        success: true,
        message: "Gracias por tu feedback",
        data: { article },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al marcar como útil",
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Artículo no encontrado",
        });
      }

      // Solo admin puede eliminar
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para eliminar este artículo",
        });
      }

      await KnowledgeBase.delete(req.params.id);

      res.json({
        success: true,
        message: "Artículo eliminado exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar artículo",
        error: error.message,
      });
    }
  }
}

module.exports = new KnowledgeBaseController();
