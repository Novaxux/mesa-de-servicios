import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { usePermissions } from "../../hooks/usePermissions";
import { slaService } from "../../services/api";

const SLAConfigScreen = ({ navigation }) => {
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([
    {
      priority_id: 1,
      priority_name: "Baja",
      response_time_hours: 24,
      resolution_time_hours: 72,
      escalation_enabled: true,
      escalation_time_hours: 12,
    },
    {
      priority_id: 2,
      priority_name: "Media",
      response_time_hours: 8,
      resolution_time_hours: 48,
      escalation_enabled: true,
      escalation_time_hours: 4,
    },
    {
      priority_id: 3,
      priority_name: "Alta",
      response_time_hours: 4,
      resolution_time_hours: 24,
      escalation_enabled: true,
      escalation_time_hours: 2,
    },
    {
      priority_id: 4,
      priority_name: "Crítica",
      response_time_hours: 1,
      resolution_time_hours: 8,
      escalation_enabled: true,
      escalation_time_hours: 0.5,
    },
  ]);

  React.useEffect(() => {
    if (!can.viewSLAConfig) {
      Alert.alert("Error", "No tienes permisos para ver la configuración SLA");
      navigation.goBack();
      return;
    }
    loadSLAConfig();
  }, []);

  const loadSLAConfig = async () => {
    try {
      setLoading(true);
      const response = await slaService.getConfig();
      if (response.success && response.data.sla_configs) {
        setConfigs(response.data.sla_configs);
      }
    } catch (error) {
      console.error("Error loading SLA config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (priorityId, field, value) => {
    if (!can.updateSLAConfig) {
      Alert.alert(
        "Error",
        "No tienes permisos para actualizar la configuración SLA"
      );
      return;
    }

    const updatedConfigs = configs.map((config) => {
      if (config.priority_id === priorityId) {
        return { ...config, [field]: value };
      }
      return config;
    });
    setConfigs(updatedConfigs);
  };

  const handleSave = async () => {
    if (!can.updateSLAConfig) {
      Alert.alert(
        "Error",
        "No tienes permisos para actualizar la configuración SLA"
      );
      return;
    }

    try {
      setLoading(true);

      // Guardar cada configuración
      for (const config of configs) {
        await slaService.updateConfig({
          priority_id: config.priority_id,
          response_time_hours: parseInt(config.response_time_hours),
          resolution_time_hours: parseInt(config.resolution_time_hours),
          escalation_enabled: config.escalation_enabled,
          escalation_time_hours: parseFloat(config.escalation_time_hours),
        });
      }

      Alert.alert("Éxito", "Configuración SLA actualizada correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la configuración SLA");
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Configuración SLA</Text>
        <Text style={styles.headerSubtitle}>
          Define los tiempos de respuesta y resolución por prioridad
        </Text>
      </View>

      {configs.map((config) => (
        <View key={config.priority_id} style={styles.configCard}>
          <Text style={styles.priorityName}>
            Prioridad: {config.priority_name}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiempo de Respuesta (horas)</Text>
            <TextInput
              style={styles.input}
              value={String(config.response_time_hours)}
              onChangeText={(text) =>
                handleUpdateConfig(
                  config.priority_id,
                  "response_time_hours",
                  text
                )
              }
              keyboardType="numeric"
              editable={can.updateSLAConfig}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiempo de Resolución (horas)</Text>
            <TextInput
              style={styles.input}
              value={String(config.resolution_time_hours)}
              onChangeText={(text) =>
                handleUpdateConfig(
                  config.priority_id,
                  "resolution_time_hours",
                  text
                )
              }
              keyboardType="numeric"
              editable={can.updateSLAConfig}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiempo de Escalación (horas)</Text>
            <TextInput
              style={styles.input}
              value={String(config.escalation_time_hours)}
              onChangeText={(text) =>
                handleUpdateConfig(
                  config.priority_id,
                  "escalation_time_hours",
                  text
                )
              }
              keyboardType="numeric"
              editable={can.updateSLAConfig}
            />
          </View>
        </View>
      ))}

      {can.updateSLAConfig && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Tiempo de Respuesta: Tiempo máximo para dar una primera respuesta al
          ticket
        </Text>
        <Text style={styles.infoText}>
          • Tiempo de Resolución: Tiempo máximo para resolver el ticket
          completamente
        </Text>
        <Text style={styles.infoText}>
          • Tiempo de Escalación: Tiempo antes de escalar el ticket si no hay
          respuesta
        </Text>
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
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  configCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#1565C0",
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default SLAConfigScreen;
