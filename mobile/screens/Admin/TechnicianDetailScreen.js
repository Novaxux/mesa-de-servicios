import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { usePermissions } from "../../hooks/usePermissions";
import { technicianService } from "../../services/api";

const TechnicianDetailScreen = ({ navigation, route }) => {
  const { can } = usePermissions();
  const technicianId = route.params?.technicianId;
  const [loading, setLoading] = useState(true);
  const [technician, setTechnician] = useState(null);

  useEffect(() => {
    if (!technicianId) {
      Alert.alert("Error", "ID de técnico no válido");
      navigation.goBack();
      return;
    }
    loadTechnician();
  }, [technicianId]);

  const loadTechnician = async () => {
    try {
      setLoading(true);
      const response = await technicianService.getById(technicianId);
      if (response.success && response.data.technician) {
        setTechnician(response.data.technician);
      } else {
        Alert.alert("Error", "No se pudo cargar el técnico");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading technician:", error);
      Alert.alert("Error", "No se pudo cargar el técnico");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!can.updateTechnician) {
      Alert.alert("Error", "No tienes permisos para actualizar técnicos");
      return;
    }

    try {
      const newAvailability = !technician.is_available;
      const response = await technicianService.update(technicianId, {
        is_available: newAvailability,
      });

      if (response.success) {
        setTechnician({ ...technician, is_available: newAvailability });
        Alert.alert(
          "Éxito",
          `Técnico ${newAvailability ? "disponible" : "no disponible"}`
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la disponibilidad");
    }
  };

  const handleUpdateSchedule = () => {
    Alert.alert(
      "Función en desarrollo",
      "La actualización de horarios estará disponible próximamente"
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!technician) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Técnico no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {technician.first_name?.charAt(0)}
            {technician.last_name?.charAt(0)}
          </Text>
        </View>

        <Text style={styles.name}>
          {technician.first_name} {technician.last_name}
        </Text>
        <Text style={styles.email}>{technician.email}</Text>

        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityLabel}>Disponibilidad:</Text>
          <Switch
            value={technician.is_available}
            onValueChange={handleToggleAvailability}
            disabled={!can.updateTechnician}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={technician.is_available ? "#2196F3" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Estadísticas</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {technician.assigned_tickets || 0}
            </Text>
            <Text style={styles.statLabel}>Tickets Asignados</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{technician.max_tickets || 0}</Text>
            <Text style={styles.statLabel}>Capacidad Máxima</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#4CAF50" }]}>
              {technician.resolved_tickets || 0}
            </Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#FF9800" }]}>
              {technician.avg_resolution_time || "N/A"}
            </Text>
            <Text style={styles.statLabel}>Tiempo Promedio (hrs)</Text>
          </View>
        </View>
      </View>

      {/* Skills/Specialties Card */}
      {technician.skills && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Habilidades</Text>
          <Text style={styles.skillsText}>{technician.skills}</Text>
        </View>
      )}

      {/* Schedule Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Horario</Text>
        <Text style={styles.scheduleText}>
          {technician.schedule || "No especificado"}
        </Text>

        {can.updateTechnician && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateSchedule}
          >
            <Text style={styles.updateButtonText}>Actualizar Horario</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📞 Información de Contacto</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{technician.email}</Text>
        </View>

        {technician.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{technician.phone}</Text>
          </View>
        )}

        {technician.department && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departamento:</Text>
            <Text style={styles.infoValue}>{technician.department}</Text>
          </View>
        )}
      </View>

      {/* Rating */}
      {technician.satisfaction_rating && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⭐ Calificación</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingValue}>
              {technician.satisfaction_rating}
            </Text>
            <Text style={styles.ratingMax}> / 5.0</Text>
          </View>
          <Text style={styles.ratingCount}>
            Basado en {technician.total_ratings || 0} evaluaciones
          </Text>
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
  headerCard: {
    backgroundColor: "#2196F3",
    padding: 30,
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2196F3",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: "#E3F2FD",
    marginBottom: 20,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  availabilityLabel: {
    color: "#fff",
    fontSize: 16,
    marginRight: 10,
  },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    marginTop: 0,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
  skillsText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  scheduleText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 10,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF9800",
  },
  ratingMax: {
    fontSize: 24,
    color: "#666",
  },
  ratingCount: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
  },
});

export default TechnicianDetailScreen;
