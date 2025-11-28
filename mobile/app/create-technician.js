import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Picker,
} from "react-native";
import { useRouter } from "expo-router";
import { usePermissions } from "../hooks/usePermissions";
import { technicianService, departmentService } from "../services/api";

const CreateTechnicianScreen = () => {
  const router = useRouter();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    department_id: null,
    specialty: "",
    schedule_start: "08:00",
    schedule_end: "17:00",
    max_tickets: 10,
  });

  useEffect(() => {
    if (!can.createTechnician) {
      Alert.alert("Error", "No tienes permisos para crear técnicos");
      router.back();
      return;
    }
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const handleSubmit = async () => {
    // Validación
    if (
      !formData.email ||
      !formData.password ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.specialty
    ) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const result = await technicianService.create(formData);

      if (result.success) {
        Alert.alert("Éxito", "Técnico creado exitosamente");
        router.back();
      } else {
        Alert.alert("Error", result.message || "Error al crear técnico");
      }
    } catch (error) {
      console.error("Error creating technician:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Error de conexión. Verifica tu conexión a internet."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Nuevo Técnico</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={formData.first_name}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, first_name: value }))
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido *</Text>
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={formData.last_name}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, last_name: value }))
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, email: value }))
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, password: value }))
            }
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Número de teléfono"
            value={formData.phone}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, phone: value }))
            }
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Departamento</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.department_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, department_id: value }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar departamento" value={null} />
              {departments.map((dept) => (
                <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Especialidad *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Hardware, Software, Redes"
            value={formData.specialty}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, specialty: value }))
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Hora de Inicio</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (Ej: 08:00)"
            value={formData.schedule_start}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, schedule_start: value }))
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Hora de Fin</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (Ej: 17:00)"
            value={formData.schedule_end}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, schedule_end: value }))
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Máximo de Tickets</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            value={formData.max_tickets?.toString()}
            onChangeText={(value) =>
              setFormData((prev) => ({
                ...prev,
                max_tickets: parseInt(value) || 10,
              }))
            }
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Crear Técnico</Text>
          )}
        </TouchableOpacity>
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
  form: {
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateTechnicianScreen;
