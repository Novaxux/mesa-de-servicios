const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middleware/auth");

// Rutas públicas (requieren autenticación)
router.get("/", authenticate, departmentController.getAll);
router.get("/search", authenticate, departmentController.search);
router.get("/:id", authenticate, departmentController.getById);
router.get("/:id/users", authenticate, departmentController.getUsers);

// Rutas de administrador
router.post(
  "/",
  authenticate,
  authorize("admin"),
  departmentController.create
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  departmentController.update
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  departmentController.delete
);

module.exports = router;
