import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { usePermissions } from "../../hooks/usePermissions";
import { reportService } from "../../services/api";

const ReportsScreen = ({ navigation }) => {
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState(null);
  const [slaStats, setSlaStats] = useState(null);

  useEffect(() => {
    if (!can.viewReports) {
      navigation.goBack();
      return;
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // Cargar estadísticas de tickets
      const ticketResponse = await reportService.getTicketReport();
      if (ticketResponse.success) {
        setTicketStats(ticketResponse.data);
      }

      // Cargar estadísticas de SLA
      const slaResponse = await reportService.getSLAReport();
      if (slaResponse.success) {
        setSlaStats(slaResponse.data);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
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

      {can.viewTechnicianReports && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Reportes Adicionales</Text>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate("TechnicianReports")}
          >
            <Text style={styles.reportButtonText}>📈 Reporte de Técnicos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate("IncidentReports")}
          >
            <Text style={styles.reportButtonText}>
              🔍 Reporte de Incidentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate("FeedbackReports")}
          >
            <Text style={styles.reportButtonText}>⭐ Reporte de Feedback</Text>
          </TouchableOpacity>
        </View>
      )}
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
});

export default ReportsScreen;
