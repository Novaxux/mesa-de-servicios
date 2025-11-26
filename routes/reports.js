const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

// Todas las rutas requieren autenticación y rol admin o technician
router.use(authenticate);
router.use(authorize("admin", "technician"));

// Reportes en JSON
router.get("/tickets", reportController.getTicketReport);
router.get("/sla", reportController.getSLAReport);
router.get("/technicians", reportController.getTechnicianReport);
router.get("/incidents", reportController.getIncidentReport);
router.get("/technician-stats", reportController.getTechnicianStats);
router.get("/incident-reports", reportController.getIncidentReports);
router.get("/feedback-reports", reportController.getFeedbackReports);

// Exportación de reportes
router.get("/export/tickets/csv", reportController.exportTicketsCSV);
router.get("/export/sla/csv", reportController.exportSLACSV);
router.get("/export/technicians/csv", reportController.exportTechniciansCSV);
router.get("/export/incidents/csv", reportController.exportIncidentsCSV);
router.get("/export/feedback/csv", reportController.exportFeedbackCSV);

module.exports = router;
