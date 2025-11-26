import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from 'expo-router';
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { technicianService } from "../../services/api";

const TechnicianDashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { can, isTechnician } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workload, setWorkload] = useState(null);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (!isTechnician) {
      router.back();
      return;
    }
    loadTechnicianData();
  }, []);

  const loadTechnicianData = async () => {
    try {
      // Cargar carga de trabajo
      const workloadResponse = await technicianService.getWorkload(user?.id);
      if (workloadResponse.success) {
        setWorkload(workloadResponse.data);
      }

      // Cargar desempeño
      const performanceResponse = await technicianService.getPerformance(
        user?.id
      );
      if (performanceResponse.success) {
        setPerformance(performanceResponse.data);
      }
    } catch (error) {
      console.error("Error loading technician data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTechnicianData();
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Panel de Técnico</Text>
        <Text style={styles.headerSubtitle}>
          {user?.first_name} {user?.last_name}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Mi Carga de Trabajo</Text>

        <View style={styles.statsRow}>
          <StatCard
            title="Asignados"
            value={workload?.assigned_tickets || 0}
            color="#2196F3"
            subtitle={`Max: ${workload?.max_tickets || 10}`}
          />
          <StatCard
            title="En Proceso"
            value={workload?.in_progress_tickets || 0}
            color="#FF9800"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Pendientes"
            value={workload?.pending_tickets || 0}
            color="#9C27B0"
          />
          <StatCard
            title="Resueltos Hoy"
            value={workload?.resolved_today || 0}
            color="#4CAF50"
          />
        </View>

        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityLabel}>Estado:</Text>
          <Text
            style={[
              styles.availabilityValue,
              { color: workload?.is_available ? "#4CAF50" : "#F44336" },
            ]}
          >
            {workload?.is_available ? "✓ Disponible" : "✗ No Disponible"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Mi Desempeño</Text>

        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Total Resueltos:</Text>
          <Text style={styles.performanceValue}>
            {performance?.total_resolved || 0}
          </Text>
        </View>

        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>
            Tiempo Promedio de Respuesta:
          </Text>
          <Text style={styles.performanceValue}>
            {performance?.avg_response_time || "N/A"}
          </Text>
        </View>

        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>
            Tiempo Promedio de Resolución:
          </Text>
          <Text style={styles.performanceValue}>
            {performance?.avg_resolution_time || "N/A"}
          </Text>
        </View>

        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Tickets dentro de SLA:</Text>
          <Text style={[styles.performanceValue, { color: "#4CAF50" }]}>
            {performance?.within_sla || 0} (
            {performance?.sla_compliance_rate || 0}%)
          </Text>
        </View>

        {performance?.avg_rating && (
          <View style={styles.performanceCard}>
            <Text style={styles.performanceLabel}>Calificación Promedio:</Text>
            <Text style={[styles.performanceValue, { color: "#FF9800" }]}>
              ⭐ {performance.avg_rating.toFixed(1)} / 5.0
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            router.push({ pathname: '/(tabs)/tickets', params: { filter: "assigned" } })
          }
        >
          <Text style={styles.actionButtonText}>
            🎫 Ver Mis Tickets Asignados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/knowledge')}
        >
          <Text style={styles.actionButtonText}>📚 Base de Conocimientos</Text>
        </TouchableOpacity>

        {can.createArticle && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/create-article')}
          >
            <Text style={styles.actionButtonText}>✍️ Crear Artículo</Text>
          </TouchableOpacity>
        )}

        {can.viewTechnicianFeedback && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/my-feedback')}
          >
            <Text style={styles.actionButtonText}>⭐ Ver Mi Feedback</Text>
          </TouchableOpacity>
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginTop: 5,
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
  availabilityCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityLabel: {
    fontSize: 16,
    color: "#666",
  },
  availabilityValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  performanceCard: {
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
  performanceLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  actionButton: {
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
  actionButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
});

export default TechnicianDashboardScreen;
