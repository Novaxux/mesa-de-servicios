const Notification = require("../models/Notification");

class NotificationController {
  async getAll(req, res) {
    try {
      const filters = {};

      // Convertir is_read de string a booleano/número para MySQL
      if (req.query.is_read !== undefined) {
        const isReadValue = req.query.is_read;
        if (
          isReadValue === "true" ||
          isReadValue === "1" ||
          isReadValue === true
        ) {
          filters.is_read = 1;
        } else if (
          isReadValue === "false" ||
          isReadValue === "0" ||
          isReadValue === false
        ) {
          filters.is_read = 0;
        }
      }

      // Convertir limit a número
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit, 10) || 50;
      } else {
        filters.limit = 50;
      }

      const notifications = await Notification.findByUser(req.user.id, filters);
      const unreadCount = await Notification.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener notificaciones",
        error: error.message,
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const notification = await Notification.markAsRead(
        req.params.id,
        req.user.id
      );
      res.json({
        success: true,
        message: "Notificación marcada como leída",
        data: { notification },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al marcar notificación",
        error: error.message,
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      await Notification.markAllAsRead(req.user.id);
      res.json({
        success: true,
        message: "Todas las notificaciones marcadas como leídas",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al marcar notificaciones",
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      await Notification.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: "Notificación eliminada exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar notificación",
        error: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
