import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter } from 'expo-router';
import { usePermissions } from "../../hooks/usePermissions";
import { reportService, getAuthToken } from "../../services/api";

const TechnicianReportsScreen = () => {
  const router = useRouter();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [technicianStats, setTechnicianStats] = useState([]);

  useEffect(() => {
    if (!can.viewTechnicianReports) {
      alert("No tienes permisos para ver estos reportes");
      router.back();
      return;
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportService.getTechnicianStats();
      if (response.success) {
        setTechnicianStats(response.data.technicians || []);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      alert("No se pudieron cargar los reportes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleExportCSV = async () => {
    try {
      const token = getAuthToken();
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const dateTo = new Date().toISOString().split("T")[0];

      const url = await reportService.exportTechniciansCSV(dateFrom, dateTo);
      const urlWithAuth = `${url}&token=${token}`;

      const supported = await Linking.canOpenURL(urlWithAuth);
      if (supported) {
        await Linking.openURL(urlWithAuth);
        window.alert("Descargando reporte de técnicos...");
      } else {
        window.alert("No se puede abrir el enlace de descarga");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      window.alert("Error al exportar el reporte");
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "#4CAF50";
    if (percentage >= 60) return "#FF9800";
    return "#F44336";
  };

  const renderTechnicianCard = (technician) => {
    const resolvedPercentage =
      technician.total_tickets > 0
        ? Math.round(
            (technician.resolved_tickets / technician.total_tickets) * 100
          )
        : 0;

    return (
      <View key={technician.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.technicianName}>
            {technician.first_name} {technician.last_name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: technician.is_available
                  ? "#4CAF50"
                  : "#F44336",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {technician.is_available ? "Disponible" : "No disponible"}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {technician.total_tickets || 0}
            </Text>
            <Text style={styles.statLabel}>Total Tickets</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {technician.assigned_tickets || 0}
            </Text>
            <Text style={styles.statLabel}>En Progreso</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {technician.resolved_tickets || 0}
            </Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>

          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: getPerformanceColor(resolvedPercentage) },
              ]}
            >
              {resolvedPercentage}%
            </Text>
            <Text style={styles.statLabel}>Efectividad</Text>
          </View>
        </View>

        {technician.avg_resolution_time && (
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>
              ⏱️ Tiempo promedio de resolución:
            </Text>
            <Text style={styles.timeValue}>
              {technician.avg_resolution_time} horas
            </Text>
          </View>
        )}

        {technician.satisfaction_rating && (
          <View style={styles.ratingInfo}>
            <Text style={styles.ratingLabel}>⭐ Calificación promedio:</Text>
            <Text style={styles.ratingValue}>
              {technician.satisfaction_rating} / 5.0
            </Text>
          </View>
        )}
      </View>
    );
  };

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Reportes de Técnicos</Text>
        <Text style={styles.headerSubtitle}>
          Desempeño y estadísticas del equipo
        </Text>

        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Text style={styles.exportButtonText}>📥 Exportar a CSV</Text>
        </TouchableOpacity>
      </View>

      {technicianStats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {technicianStats.map(renderTechnicianCard)}
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
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E3F2FD",
  },
  exportButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  exportButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  technicianName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  timeInfo: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 16,
    color: "#1976D2",
    fontWeight: "bold",
  },
  ratingInfo: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#F57C00",
    fontWeight: "600",
  },
  ratingValue: {
    fontSize: 16,
    color: "#F57C00",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default TechnicianReportsScreen;
