const Technician = require("../models/Technician");
const User = require("../models/User");
const Ticket = require("../models/Ticket");

class TechnicianController {
  async create(req, res) {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        phone,
        department_id,
        specialty,
        schedule_start,
        schedule_end,
        max_tickets,
      } = req.body;

      // Crear usuario primero
      const userId = await User.create({
        email,
        password,
        first_name,
        last_name,
        role: "technician",
        phone,
        department_id,
      });

      // Crear registro de técnico
      const technician = await Technician.create({
        user_id: userId,
        specialty,
        schedule_start,
        schedule_end,
        max_tickets,
      });

      const fullTechnician = await Technician.findById(technician.id);

      res.status(201).json({
        success: true,
        message: "Técnico creado exitosamente",
        data: { technician: fullTechnician },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear técnico",
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};

      // Convertir is_available de string a booleano/número para MySQL
      if (req.query.is_available !== undefined) {
        const isAvailableValue = req.query.is_available;
        if (
          isAvailableValue === "true" ||
          isAvailableValue === "1" ||
          isAvailableValue === true
        ) {
          filters.is_available = 1;
        } else if (
          isAvailableValue === "false" ||
          isAvailableValue === "0" ||
          isAvailableValue === false
        ) {
          filters.is_available = 0;
        }
      }

      if (req.query.specialty) {
        filters.specialty = req.query.specialty;
      }

      const technicians = await Technician.findAll(filters);

      res.json({
        success: true,
        data: { technicians },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener técnicos",
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const technician = await Technician.findById(req.params.id);
      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "Técnico no encontrado",
        });
      }

      res.json({
        success: true,
        data: { technician },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener técnico",
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const technician = await Technician.findById(req.params.id);
      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "Técnico no encontrado",
        });
      }

      const updatedTechnician = await Technician.update(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        message: "Técnico actualizado exitosamente",
        data: { technician: updatedTechnician },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar técnico",
        error: error.message,
      });
    }
  }

  async getWorkload(req, res) {
    try {
      const workload = await Technician.getWorkload(req.params.id);
      res.json({
        success: true,
        data: { workload },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener carga de trabajo",
        error: error.message,
      });
    }
  }

  async getPerformance(req, res) {
    try {
      const dateFrom =
        req.query.date_from ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const dateTo =
        req.query.date_to || new Date().toISOString().split("T")[0];

      const performance = await Technician.getPerformance(
        req.params.id,
        dateFrom,
        dateTo
      );

      res.json({
        success: true,
        data: { performance },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener desempeño",
        error: error.message,
      });
    }
  }

  async getMyTickets(req, res) {
    try {
      const technician = await Technician.findByUserId(req.user.id);
      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "No se encontró información de técnico",
        });
      }

      const tickets = await Ticket.findAll({
        assigned_to: req.user.id,
        status: req.query.status,
        limit: req.query.limit,
        offset: req.query.offset,
      });

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
}

module.exports = new TechnicianController();
