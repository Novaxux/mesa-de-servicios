const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");
const Attachment = require("../models/Attachment");
const Notification = require("../models/Notification");
const Technician = require("../models/Technician");
const { query } = require("../config/database");

class TicketController {
  async create(req, res) {
    try {
      const ticketData = {
        title: req.body.title,
        description: req.body.description,
        priority_id: req.body.priority_id,
        category_id: req.body.category_id,
        incident_type_id: req.body.incident_type_id,
        created_by: req.user.id,
        assigned_to: req.body.assigned_to,
      };

      // Asignación automática si está habilitada y no se especifica técnico
      if (!ticketData.assigned_to) {
        const availableTechnicians = await Technician.findAll({
          is_available: true,
        });
        if (availableTechnicians.length > 0) {
          // Asignar al técnico con menos tickets activos
          const techniciansWithWorkload = await Promise.all(
            availableTechnicians.map(async (tech) => {
              const workload = await Technician.getWorkload(tech.id);
              return {
                ...tech,
                activeTickets:
                  workload.open_tickets + workload.in_progress_tickets,
              };
            })
          );

          techniciansWithWorkload.sort(
            (a, b) => a.activeTickets - b.activeTickets
          );
          if (
            techniciansWithWorkload[0].activeTickets <
            techniciansWithWorkload[0].max_tickets
          ) {
            ticketData.assigned_to = techniciansWithWorkload[0].user_id;
          }
        }
      }

      const ticket = await Ticket.create(ticketData);

      // Crear notificación para el técnico asignado
      if (ticket.assigned_to) {
        await Notification.create({
          user_id: ticket.assigned_to,
          ticket_id: ticket.id,
          type: "ticket_assigned",
          title: "Nuevo ticket asignado",
          message: `Se te ha asignado el ticket ${ticket.ticket_number}`,
        });
      }

      res.status(201).json({
        success: true,
        message: "Ticket creado exitosamente",
        data: { ticket },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear ticket",
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        priority_id: req.query.priority_id,
        category_id: req.query.category_id,
        created_by: req.query.created_by,
        assigned_to:
          req.query.assigned_to ||
          (req.user.role === "technician" ? req.user.id : undefined),
        department_id: req.query.department_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit,
        offset: req.query.offset,
      };

      // Remover filtros undefined
      Object.keys(filters).forEach(
        (key) => filters[key] === undefined && delete filters[key]
      );

      const tickets = await Ticket.findAll(filters);

      res.json({
        success: true,
        data: { tickets },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener tickets",
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
      }

      // Verificar permisos
      if (req.user.role === "user" && ticket.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para ver este ticket",
        });
      }

      // Obtener comentarios
      const comments = await Comment.findByTicket(
        req.params.id,
        req.user.role !== "user"
      );

      // Obtener archivos adjuntos
      const attachments = await Attachment.findByTicket(req.params.id);

      // Obtener historial
      const history = await Ticket.getHistory(req.params.id);

      res.json({
        success: true,
        data: {
          ticket,
          comments,
          attachments,
          history,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener ticket",
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
      }

      // Verificar permisos
      if (req.user.role === "user" && ticket.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para actualizar este ticket",
        });
      }

      const updatedTicket = await Ticket.update(
        req.params.id,
        req.body,
        req.user.id
      );

      // Crear notificaciones según cambios
      if (req.body.status && req.body.status !== ticket.status) {
        await Notification.create({
          user_id: ticket.created_by,
          ticket_id: ticket.id,
          type: "status_changed",
          title: "Estado del ticket actualizado",
          message: `El ticket ${ticket.ticket_number} cambió a ${req.body.status}`,
        });

        if (ticket.assigned_to) {
          await Notification.create({
            user_id: ticket.assigned_to,
            ticket_id: ticket.id,
            type: "status_changed",
            title: "Estado del ticket actualizado",
            message: `El ticket ${ticket.ticket_number} cambió a ${req.body.status}`,
          });
        }

        // Solicitar feedback cuando el ticket se marca como resuelto o cerrado
        if (req.body.status === "resolved" || req.body.status === "closed") {
          await Notification.create({
            user_id: ticket.created_by,
            ticket_id: ticket.id,
            type: "feedback_request",
            title: "⭐ Califica el servicio recibido",
            message: `El ticket ${ticket.ticket_number} ha sido ${
              req.body.status === "resolved" ? "resuelto" : "cerrado"
            }. Por favor, califica la atención del técnico para ayudarnos a mejorar nuestro servicio.`,
          });
        }
      }

      if (req.body.assigned_to && req.body.assigned_to !== ticket.assigned_to) {
        await Notification.create({
          user_id: req.body.assigned_to,
          ticket_id: ticket.id,
          type: "ticket_assigned",
          title: "Ticket asignado",
          message: `Se te ha asignado el ticket ${ticket.ticket_number}`,
        });
      }

      res.json({
        success: true,
        message: "Ticket actualizado exitosamente",
        data: { ticket: updatedTicket },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar ticket",
        error: error.message,
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      const statistics = await Ticket.getStatistics(filters);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: error.message,
      });
    }
  }

  async addComment(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket no encontrado",
        });
      }

      const comment = await Comment.create({
        ticket_id: req.params.id,
        user_id: req.user.id,
        comment: req.body.comment,
        is_internal: req.body.is_internal || false,
      });

      // Crear notificaciones
      const notifyUsers = [];
      if (ticket.created_by !== req.user.id) {
        notifyUsers.push(ticket.created_by);
      }
      if (ticket.assigned_to && ticket.assigned_to !== req.user.id) {
        notifyUsers.push(ticket.assigned_to);
      }

      for (const userId of notifyUsers) {
        await Notification.create({
          user_id: userId,
          ticket_id: ticket.id,
          type: "comment_added",
          title: "Nuevo comentario",
          message: `Se agregó un comentario al ticket ${ticket.ticket_number}`,
        });
      }

      res.status(201).json({
        success: true,
        message: "Comentario agregado exitosamente",
        data: { comment },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al agregar comentario",
        error: error.message,
      });
    }
  }
}

module.exports = new TicketController();
