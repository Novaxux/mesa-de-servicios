const Department = require("../models/Department");

class DepartmentController {
  // Obtener todos los departamentos
  async getAll(req, res) {
    try {
      const departments = await Department.getAll();
      console.log("Departments from DB:", JSON.stringify(departments, null, 2));
      console.log("Is Array?", Array.isArray(departments));
      res.json({
        success: true,
        data: { departments },
      });
    } catch (error) {
      console.error("Error getting departments:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener departamentos",
        error: error.message,
      });
    }
  }

  // Obtener departamento por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const department = await Department.getWithManager(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Departamento no encontrado",
        });
      }

      // Obtener estadísticas
      const stats = await Department.getStats(id);

      res.json({
        success: true,
        data: {
          ...department,
          stats,
        },
      });
    } catch (error) {
      console.error("Error getting department:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener departamento",
        error: error.message,
      });
    }
  }

  // Crear departamento (solo admin)
  async create(req, res) {
    try {
      const { name, description, manager_id } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "El nombre del departamento es requerido",
        });
      }

      // Verificar si ya existe
      const existing = await Department.getByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un departamento con ese nombre",
        });
      }

      const departmentId = await Department.create({
        name,
        description,
        manager_id,
      });

      const department = await Department.getById(departmentId);

      res.status(201).json({
        success: true,
        message: "Departamento creado exitosamente",
        data: department,
      });
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear departamento",
        error: error.message,
      });
    }
  }

  // Actualizar departamento (solo admin)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, manager_id, is_active } = req.body;

      const department = await Department.getById(id);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Departamento no encontrado",
        });
      }

      // Si se cambia el nombre, verificar que no exista otro con ese nombre
      if (name && name !== department.name) {
        const existing = await Department.getByName(name);
        if (existing && existing.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: "Ya existe un departamento con ese nombre",
          });
        }
      }

      await Department.update(id, {
        name: name || department.name,
        description:
          description !== undefined ? description : department.description,
        manager_id:
          manager_id !== undefined ? manager_id : department.manager_id,
        is_active: is_active !== undefined ? is_active : department.is_active,
      });

      const updated = await Department.getWithManager(id);

      res.json({
        success: true,
        message: "Departamento actualizado exitosamente",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar departamento",
        error: error.message,
      });
    }
  }

  // Eliminar departamento (solo admin)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const department = await Department.getById(id);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Departamento no encontrado",
        });
      }

      // Prevenir eliminación del departamento "Sin Asignar"
      if (department.name === "Sin Asignar") {
        return res.status(400).json({
          success: false,
          message: "No se puede eliminar el departamento 'Sin Asignar'",
        });
      }

      // Verificar si tiene usuarios asignados
      const users = await Department.getUsers(id);
      if (users.length > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar el departamento. Tiene ${users.length} usuarios asignados`,
        });
      }

      await Department.delete(id);

      res.json({
        success: true,
        message: "Departamento eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar departamento",
        error: error.message,
      });
    }
  }

  // Obtener usuarios de un departamento
  async getUsers(req, res) {
    try {
      const { id } = req.params;

      const department = await Department.getById(id);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Departamento no encontrado",
        });
      }

      const users = await Department.getUsers(id);

      res.json({
        success: true,
        data: {
          department,
          users,
          total: users.length,
        },
      });
    } catch (error) {
      console.error("Error getting department users:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener usuarios del departamento",
        error: error.message,
      });
    }
  }

  // Buscar departamentos
  async search(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "La búsqueda debe tener al menos 2 caracteres",
        });
      }

      const departments = await Department.search(q.trim());

      res.json({
        success: true,
        data: departments,
        total: departments.length,
      });
    } catch (error) {
      console.error("Error searching departments:", error);
      res.status(500).json({
        success: false,
        message: "Error al buscar departamentos",
        error: error.message,
      });
    }
  }
}

module.exports = new DepartmentController();
