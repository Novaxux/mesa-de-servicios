import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { usePermissions } from "../../hooks/usePermissions";
import { reportService, getAuthToken } from "../../services/api";

const IncidentReportsScreen = () => {
  const router = useRouter();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incidentData, setIncidentData] = useState({
    byCategory: [],
    byPriority: [],
    byStatus: [],
    trends: {},
  });

  useEffect(() => {
    if (!can.viewReports) {
      alert("No tienes permisos para ver estos reportes");
      router.back();
      return;
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportService.getIncidentReports();
      if (response.success) {
        setIncidentData({
          byCategory: response.data.byCategory || [],
          byPriority: response.data.byPriority || [],
          byStatus: response.data.byStatus || [],
          trends: response.data.trends || {},
        });
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

      const url = await reportService.exportIncidentsCSV(dateFrom, dateTo);
      const urlWithAuth = `${url}&token=${token}`;

      const supported = await Linking.canOpenURL(urlWithAuth);
      if (supported) {
        await Linking.openURL(urlWithAuth);
        window.alert("Descargando reporte de incidentes...");
      } else {
        window.alert("No se puede abrir el enlace de descarga");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      window.alert("Error al exportar el reporte");
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: "#D32F2F",
      high: "#F57C00",
      medium: "#FBC02D",
      low: "#388E3C",
    };
    return colors[priority?.toLowerCase()] || "#666";
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "#2196F3",
      assigned: "#9C27B0",
      in_progress: "#FF9800",
      resolved: "#4CAF50",
      closed: "#757575",
    };
    return colors[status?.toLowerCase()] || "#666";
  };

  const renderBarChart = (data, colorFunction, title) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((item) => item.count || 0));

    return (
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.barChart}>
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
            return (
              <View key={index} style={styles.barRow}>
                <Text style={styles.barLabel}>
                  {item.name || item.category_name || item.priority_name}
                </Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: colorFunction
                          ? colorFunction(item.name || item.priority_name)
                          : "#2196F3",
                      },
                    ]}
                  />
                  <Text style={styles.barValue}>{item.count}</Text>
                </View>
              </View>
            );
          })}
        </View>
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
        <Text style={styles.headerTitle}>📈 Reportes de Incidentes</Text>
        <Text style={styles.headerSubtitle}>
          Análisis de tickets y tendencias
        </Text>

        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Text style={styles.exportButtonText}>📥 Exportar a CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Tendencias */}
        <View style={styles.trendsCard}>
          <Text style={styles.cardTitle}>📊 Resumen General</Text>
          <View style={styles.trendsGrid}>
            <View style={styles.trendItem}>
              <Text style={styles.trendValue}>
                {incidentData.trends.totalTickets || 0}
              </Text>
              <Text style={styles.trendLabel}>Total Tickets</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={[styles.trendValue, { color: "#2196F3" }]}>
                {incidentData.trends.openTickets || 0}
              </Text>
              <Text style={styles.trendLabel}>Abiertos</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={[styles.trendValue, { color: "#FF9800" }]}>
                {incidentData.trends.inProgressTickets || 0}
              </Text>
              <Text style={styles.trendLabel}>En Progreso</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={[styles.trendValue, { color: "#4CAF50" }]}>
                {incidentData.trends.resolvedTickets || 0}
              </Text>
              <Text style={styles.trendLabel}>Resueltos</Text>
            </View>
          </View>
        </View>

        {/* Gráficos */}
        {renderBarChart(
          incidentData.byCategory,
          null,
          "📁 Tickets por Categoría"
        )}

        {renderBarChart(
          incidentData.byPriority,
          getPriorityColor,
          "🚨 Tickets por Prioridad"
        )}

        {renderBarChart(
          incidentData.byStatus,
          getStatusColor,
          "📋 Tickets por Estado"
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
  trendsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  trendsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  trendItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  trendValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  trendLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  chartSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  barChart: {
    width: "100%",
  },
  barRow: {
    marginBottom: 15,
  },
  barLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "600",
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
  },
  bar: {
    height: "100%",
    borderRadius: 4,
    minWidth: 2,
  },
  barValue: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});

export default IncidentReportsScreen;
