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
import { Picker } from "@react-native-picker/picker";
import { usePermissions } from "../../hooks/usePermissions";
import { authService } from "../../services/api";

const CreateUserScreen = ({ navigation }) => {
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    department: "",
    phone: "",
  });

  React.useEffect(() => {
    if (!can.createUser) {
      Alert.alert("Error", "No tienes permisos para crear usuarios");
      navigation.goBack();
      return;
    }
  }, []);

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return false;
    }

    if (!formData.last_name.trim()) {
      Alert.alert("Error", "El apellido es requerido");
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert("Error", "El email es requerido");
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "El formato del email no es válido");
      return false;
    }

    if (!formData.password) {
      Alert.alert("Error", "La contraseña es requerida");
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || null,
        phone: formData.phone || null,
      };

      const response = await authService.register(dataToSend);

      if (response.success) {
        Alert.alert("Éxito", "Usuario creado correctamente", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "No se pudo crear el usuario");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "No se pudo crear el usuario";
      Alert.alert("Error", errorMsg);
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
        <Text style={styles.sectionTitle}>👤 Información Personal</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={formData.first_name}
            onChangeText={(value) =>
              setFormData({ ...formData, first_name: value })
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
              setFormData({ ...formData, last_name: value })
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
              setFormData({ ...formData, email: value.toLowerCase() })
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono (opcional)"
            value={formData.phone}
            onChangeText={(value) => setFormData({ ...formData, phone: value })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Departamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Departamento (opcional)"
            value={formData.department}
            onChangeText={(value) =>
              setFormData({ ...formData, department: value })
            }
          />
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>🔐 Seguridad</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChangeText={(value) =>
              setFormData({ ...formData, password: value })
            }
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmar Contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            value={formData.confirmPassword}
            onChangeText={(value) =>
              setFormData({ ...formData, confirmPassword: value })
            }
            secureTextEntry
          />
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>🎭 Rol del Usuario</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Rol *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Usuario" value="user" />
              <Picker.Item label="Técnico" value="technician" />
              <Picker.Item label="Administrador" value="admin" />
            </Picker>
          </View>
        </View>

        <View style={styles.roleInfo}>
          <Text style={styles.roleInfoTitle}>ℹ️ Información de roles:</Text>
          <Text style={styles.roleInfoText}>
            • <Text style={styles.bold}>Usuario:</Text> Puede crear y ver sus
            propios tickets
          </Text>
          <Text style={styles.roleInfoText}>
            • <Text style={styles.bold}>Técnico:</Text> Puede gestionar tickets
            asignados y crear artículos
          </Text>
          <Text style={styles.roleInfoText}>
            • <Text style={styles.bold}>Administrador:</Text> Acceso completo al
            sistema
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Crear Usuario</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    marginTop: 10,
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
    padding: 12,
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
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
  roleInfo: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  roleInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 10,
  },
  roleInfoText: {
    fontSize: 13,
    color: "#1565C0",
    marginBottom: 5,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateUserScreen;
