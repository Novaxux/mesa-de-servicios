import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { usePermissions } from "../../hooks/usePermissions";
import { reportService, getAuthToken } from "../../services/api";

const ReportsScreen = () => {
  const router = useRouter();
  const { can, isAdmin } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState(null);
  const [slaStats, setSlaStats] = useState(null);
  const [dateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!can.viewReports) {
      router.back();
      return;
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // Cargar estadísticas de tickets
      const ticketResponse = await reportService.getTicketReport(
        dateFrom,
        dateTo
      );
      if (ticketResponse.success) {
        setTicketStats(ticketResponse.data.summary);
      }

      // Cargar estadísticas de SLA
      const slaResponse = await reportService.getSLAReport(dateFrom, dateTo);
      if (slaResponse.success) {
        setSlaStats(slaResponse.data.compliance);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (exportType) => {
    try {
      let url;
      const token = getAuthToken();

      switch (exportType) {
        case "tickets":
          url = await reportService.exportTicketsCSV(dateFrom, dateTo);
          break;
        case "sla":
          url = await reportService.exportSLACSV(dateFrom, dateTo);
          break;
        case "technicians":
          url = await reportService.exportTechniciansCSV(dateFrom, dateTo);
          break;
        case "incidents":
          url = await reportService.exportIncidentsCSV(dateFrom, dateTo);
          break;
        case "feedback":
          url = await reportService.exportFeedbackCSV();
          break;
        default:
          return;
      }

      // Agregar token a la URL para autenticación
      const urlWithAuth = `${url}&token=${token}`;

      // Abrir URL en el navegador para descargar el CSV
      const supported = await Linking.canOpenURL(urlWithAuth);
      if (supported) {
        await Linking.openURL(urlWithAuth);
        window.alert("Descargando reporte CSV...");
      } else {
        window.alert("No se puede abrir el enlace de descarga");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      window.alert("Error al exportar el reporte");
    }
  };

  const StatCard = ({ title, value, color, subtitle }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Estadísticas de Tickets</Text>

        <View style={styles.statsRow}>
          <StatCard
            title="Total"
            value={ticketStats?.total || 0}
            color="#2196F3"
          />
          <StatCard
            title="Abiertos"
            value={ticketStats?.open || 0}
            color="#2196F3"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="En Proceso"
            value={ticketStats?.in_progress || 0}
            color="#FF9800"
          />
          <StatCard
            title="Resueltos"
            value={ticketStats?.resolved || 0}
            color="#4CAF50"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Cerrados"
            value={ticketStats?.closed || 0}
            color="#757575"
          />
          <StatCard
            title="Pendientes"
            value={ticketStats?.pending || 0}
            color="#9C27B0"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Cumplimiento SLA</Text>

        <View style={styles.slaCard}>
          <Text style={styles.slaLabel}>Tickets dentro de SLA:</Text>
          <Text style={[styles.slaValue, { color: "#4CAF50" }]}>
            {slaStats?.within_sla || 0} ({slaStats?.within_sla_percentage || 0}
            %)
          </Text>
        </View>

        <View style={styles.slaCard}>
          <Text style={styles.slaLabel}>Tickets fuera de SLA:</Text>
          <Text style={[styles.slaValue, { color: "#F44336" }]}>
            {slaStats?.breached_sla || 0} (
            {slaStats?.breached_sla_percentage || 0}%)
          </Text>
        </View>

        <View style={styles.slaCard}>
          <Text style={styles.slaLabel}>Tiempo promedio de respuesta:</Text>
          <Text style={styles.slaValue}>
            {slaStats?.avg_response_time || "N/A"}
          </Text>
        </View>

        <View style={styles.slaCard}>
          <Text style={styles.slaLabel}>Tiempo promedio de resolución:</Text>
          <Text style={styles.slaValue}>
            {slaStats?.avg_resolution_time || "N/A"}
          </Text>
        </View>
      </View>

      {/* Sección de Reportes Detallados */}
      {can.viewTechnicianReports && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Reportes Adicionales</Text>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/technician-reports")}
          >
            <Text style={styles.reportButtonText}>📈 Reporte de Técnicos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/incident-reports")}
          >
            <Text style={styles.reportButtonText}>
              🔍 Reporte de Incidentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/feedback-reports")}
          >
            <Text style={styles.reportButtonText}>⭐ Reporte de Feedback</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sección de Exportación CSV */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📥 Exportar Reportes (CSV)</Text>
        <Text style={styles.dateRangeText}>
          Período: {dateFrom} a {dateTo}
        </Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => handleExportCSV("tickets")}
        >
          <Text style={styles.exportButtonText}>📊 Exportar Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => handleExportCSV("sla")}
        >
          <Text style={styles.exportButtonText}>⏱️ Exportar SLA</Text>
        </TouchableOpacity>

        {isAdmin && (
          <>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExportCSV("technicians")}
            >
              <Text style={styles.exportButtonText}>👥 Exportar Técnicos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExportCSV("incidents")}
            >
              <Text style={styles.exportButtonText}>
                🔍 Exportar Incidentes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => handleExportCSV("feedback")}
            >
              <Text style={styles.exportButtonText}>⭐ Exportar Feedback</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  slaCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  slaLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  slaValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  reportButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  dateRangeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    fontStyle: "italic",
  },
  exportButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ReportsScreen;
