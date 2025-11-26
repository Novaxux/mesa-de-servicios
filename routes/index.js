const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const ticketRoutes = require("./tickets");
const technicianRoutes = require("./technicians");
const knowledgeBaseRoutes = require("./knowledgeBase");
const feedbackRoutes = require("./feedback");
const reportRoutes = require("./reports");
const slaRoutes = require("./sla");
const notificationRoutes = require("./notifications");
const categoryRoutes = require("./categories");
const userRoutes = require("./users");
const departmentRoutes = require("./departments");

// Rutas de la API
router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/technicians", technicianRoutes);
router.use("/knowledge-base", knowledgeBaseRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/reports", reportRoutes);
router.use("/sla", slaRoutes);
router.use("/notifications", notificationRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);

// Ruta de salud
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
