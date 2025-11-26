import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { usePermissions } from "../../hooks/usePermissions";
import { technicianService } from "../../services/api";

const TechniciansScreen = () => {
  const router = useRouter();
  const { can } = usePermissions();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can.viewTechnicians) {
      Alert.alert("Error", "No tienes permisos para ver técnicos");
      router.back();
      return;
    }
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    try {
      const response = await technicianService.getAll();
      if (response.success) {
        setTechnicians(response.data.technicians || []);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los técnicos");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (technicianId, currentStatus) => {
    if (!can.updateTechnician) {
      Alert.alert("Error", "No tienes permisos para actualizar técnicos");
      return;
    }

    try {
      const response = await technicianService.update(technicianId, {
        is_available: !currentStatus,
      });

      if (response.success) {
        loadTechnicians();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const handleViewDetails = (technician) => {
    router.push({
      pathname: "/technician-detail",
      params: { technicianId: technician.id },
    });
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
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Técnicos</Text>
        {can.createTechnician && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/create-technician")}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listContainer}>
        {technicians.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay técnicos registrados</Text>
          </View>
        ) : (
          technicians.map((technician) => (
            <TouchableOpacity
              key={technician.id}
              style={styles.technicianCard}
              onPress={() => handleViewDetails(technician)}
            >
              <View style={styles.technicianHeader}>
                <View>
                  <Text style={styles.technicianName}>
                    {technician.first_name} {technician.last_name}
                  </Text>
                  <Text style={styles.technicianEmail}>{technician.email}</Text>
                  {technician.specialty && (
                    <Text style={styles.technicianSpecialty}>
                      🔧 {technician.specialty}
                    </Text>
                  )}
                </View>

                {can.updateTechnician && (
                  <View style={styles.availabilityContainer}>
                    <Text style={styles.availabilityLabel}>
                      {technician.is_available ? "Disponible" : "No Disponible"}
                    </Text>
                    <Switch
                      value={technician.is_available}
                      onValueChange={() =>
                        toggleAvailability(
                          technician.id,
                          technician.is_available
                        )
                      }
                      trackColor={{ false: "#767577", true: "#81b0ff" }}
                      thumbColor={
                        technician.is_available ? "#2196F3" : "#f4f3f4"
                      }
                    />
                  </View>
                )}
              </View>

              <View style={styles.technicianStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Asignados</Text>
                  <Text style={styles.statValue}>
                    {technician.assigned_tickets || 0} /{" "}
                    {technician.max_tickets || 10}
                  </Text>
                </View>

                {technician.schedule_start && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Horario</Text>
                    <Text style={styles.statValue}>
                      {technician.schedule_start} - {technician.schedule_end}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  technicianCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  technicianHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  technicianName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  technicianEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  technicianSpecialty: {
    fontSize: 14,
    color: "#2196F3",
    marginTop: 5,
  },
  availabilityContainer: {
    alignItems: "flex-end",
  },
  availabilityLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  technicianStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});

export default TechniciansScreen;
