const Ticket = require("../models/Ticket");
const Feedback = require("../models/Feedback");
const Technician = require("../models/Technician");
const SLA = require("../models/SLA");
const { query } = require("../config/database");

class ReportController {
  async getTicketReport(req, res) {
    try {
      const dateFrom =
        req.query.date_from ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const dateTo =
        req.query.date_to || new Date().toISOString().split("T")[0];

      const statistics = await Ticket.getStatistics({
        date_from: dateFrom,
        date_to: dateTo,
      });

      // Tickets por prioridad
      const byPriority = await query(
        `
        SELECT p.name, p.level, COUNT(*) as count
        FROM tickets t
        LEFT JOIN priorities p ON t.priority_id = p.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.level
        ORDER BY p.level
      `,
        [dateFrom, dateTo]
      );

      // Tickets por categoría
      const byCategory = await query(
        `
        SELECT c.name, COUNT(*) as count
        FROM tickets t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        ORDER BY count DESC
      `,
        [dateFrom, dateTo]
      );

      // Tickets por técnico
      const byTechnician = await query(
        `
        SELECT u.first_name, u.last_name, 
               COUNT(*) as total,
               SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
               AVG(TIMESTAMPDIFF(HOUR, t.created_at, t.resolution_time)) as avg_resolution_time
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        AND t.assigned_to IS NOT NULL
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY total DESC
      `,
        [dateFrom, dateTo]
      );

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          summary: statistics,
          byPriority,
          byCategory,
          byTechnician,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al generar reporte",
        error: error.message,
      });
    }
  }

  async getSLAReport(req, res) {
    try {
      const dateFrom =
        req.query.date_from ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const dateTo =
        req.query.date_to || new Date().toISOString().split("T")[0];

      const compliance = await SLA.getSLACompliance({
        date_from: dateFrom,
        date_to: dateTo,
      });

      // SLA por prioridad
      const byPriority = await query(
        `
        SELECT p.name, p.level,
               COUNT(*) as total,
               SUM(CASE WHEN t.sla_breached = 0 THEN 1 ELSE 0 END) as compliant,
               SUM(CASE WHEN t.sla_breached = 1 THEN 1 ELSE 0 END) as breached
        FROM tickets t
        LEFT JOIN priorities p ON t.priority_id = p.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.level
        ORDER BY p.level
      `,
        [dateFrom, dateTo]
      );

      // Tiempos promedio
      const avgTimes = await query(
        `
        SELECT 
          AVG(TIMESTAMPDIFF(HOUR, created_at, response_time)) as avg_response_time,
          AVG(TIMESTAMPDIFF(HOUR, created_at, resolution_time)) as avg_resolution_time
        FROM tickets
        WHERE DATE(created_at) BETWEEN ? AND ?
        AND status IN ('resolved', 'closed')
      `,
        [dateFrom, dateTo]
      );

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          compliance,
          byPriority,
          avgTimes: avgTimes[0] || {},
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al generar reporte SLA",
        error: error.message,
      });
    }
  }

  async getTechnicianReport(req, res) {
    try {
      const dateFrom =
        req.query.date_from ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const dateTo =
        req.query.date_to || new Date().toISOString().split("T")[0];

      const technicians = await Technician.findAll();

      const report = await Promise.all(
        technicians.map(async (tech) => {
          const performance = await Technician.getPerformance(
            tech.id,
            dateFrom,
            dateTo
          );
          const feedbackStats = await Feedback.getStatistics({
            technician_id: tech.user_id,
            date_from: dateFrom,
            date_to: dateTo,
          });

          return {
            technician: {
              id: tech.id,
              name: `${tech.first_name} ${tech.last_name}`,
              specialty: tech.specialty,
            },
            performance,
            feedback: feedbackStats,
          };
        })
      );

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          technicians: report,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al generar reporte de técnicos",
        error: error.message,
      });
    }
  }

  async getIncidentReport(req, res) {
    try {
      const dateFrom =
        req.query.date_from ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const dateTo =
        req.query.date_to || new Date().toISOString().split("T")[0];

      // Incidentes recurrentes
      const recurring = await query(
        `
        SELECT t.title, t.description, COUNT(*) as occurrence_count
        FROM tickets t
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        GROUP BY t.title, t.description
        HAVING occurrence_count > 1
        ORDER BY occurrence_count DESC
        LIMIT 10
      `,
        [dateFrom, dateTo]
      );

      // Por tipo de incidencia
      const byType = await query(
        `
        SELECT it.name, COUNT(*) as count,
               AVG(TIMESTAMPDIFF(HOUR, t.created_at, t.resolution_time)) as avg_resolution_time
        FROM tickets t
        LEFT JOIN incident_types it ON t.incident_type_id = it.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        AND t.incident_type_id IS NOT NULL
        GROUP BY it.id, it.name
        ORDER BY count DESC
      `,
        [dateFrom, dateTo]
      );

      // Por departamento
      const byDepartment = await query(
        `
        SELECT t.department, COUNT(*) as count
        FROM tickets t
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        AND t.department IS NOT NULL
        GROUP BY t.department
        ORDER BY count DESC
      `,
        [dateFrom, dateTo]
      );

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          recurring,
          byType,
          byDepartment,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al generar reporte de incidentes",
        error: error.message,
      });
    }
  }

  async getTechnicianStats(req, res) {
    try {
      const technicians = await query(`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          t.is_available,
          COUNT(tk.id) as total_tickets,
          SUM(CASE WHEN tk.status = 'assigned' OR tk.status = 'in_progress' THEN 1 ELSE 0 END) as assigned_tickets,
          SUM(CASE WHEN tk.status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          AVG(CASE WHEN tk.resolution_time IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, tk.created_at, tk.resolution_time) END) as avg_resolution_time,
          AVG(f.rating) as satisfaction_rating
        FROM users u
        INNER JOIN technicians t ON u.id = t.user_id
        LEFT JOIN tickets tk ON u.id = tk.assigned_to
        LEFT JOIN feedback f ON tk.id = f.ticket_id
        WHERE u.role = 'technician'
        GROUP BY u.id, u.first_name, u.last_name, u.email, t.is_available
        ORDER BY total_tickets DESC
      `);

      res.json({
        success: true,
        data: { technicians },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de técnicos",
        error: error.message,
      });
    }
  }

  async getIncidentReports(req, res) {
    try {
      // Tickets por categoría
      const byCategory = await query(`
        SELECT c.name as category_name, COUNT(*) as count
        FROM tickets t
        LEFT JOIN categories c ON t.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY count DESC
      `);

      // Tickets por prioridad
      const byPriority = await query(`
        SELECT p.name as priority_name, COUNT(*) as count
        FROM tickets t
        LEFT JOIN priorities p ON t.priority_id = p.id
        GROUP BY p.id, p.name
        ORDER BY p.level
      `);

      // Tickets por estado
      const byStatus = await query(`
        SELECT status as name, COUNT(*) as count
        FROM tickets
        GROUP BY status
        ORDER BY count DESC
      `);

      // Tendencias generales
      const trends = await query(`
        SELECT 
          COUNT(*) as totalTickets,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as openTickets,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressTickets,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedTickets
        FROM tickets
      `);

      res.json({
        success: true,
        data: {
          byCategory,
          byPriority,
          byStatus,
          trends: trends[0] || {},
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener reportes de incidentes",
        error: error.message,
      });
    }
  }

  async getFeedbackReports(req, res) {
    try {
      // Promedio de calificaciones
      const avgRating = await query(`
        SELECT 
          AVG(rating) as averageRating,
          COUNT(*) as totalFeedbacks
        FROM feedback
      `);

      // Distribución de calificaciones
      const ratingDistribution = await query(`
        SELECT rating, COUNT(*) as count
        FROM feedback
        GROUP BY rating
        ORDER BY rating DESC
      `);

      // Feedbacks recientes
      const recentFeedbacks = await query(`
        SELECT 
          f.id,
          f.rating,
          f.comment,
          f.created_at,
          t.id as ticket_id,
          t.title as ticket_title,
          u.first_name as user_name,
          tech.first_name as technician_name
        FROM feedback f
        INNER JOIN tickets t ON f.ticket_id = t.id
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN users tech ON t.assigned_to = tech.id
        ORDER BY f.created_at DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          averageRating: avgRating[0]?.averageRating || 0,
          totalFeedbacks: avgRating[0]?.totalFeedbacks || 0,
          ratingDistribution,
          recentFeedbacks,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener reportes de feedback",
        error: error.message,
      });
    }
  }
}

module.exports = new ReportController();
