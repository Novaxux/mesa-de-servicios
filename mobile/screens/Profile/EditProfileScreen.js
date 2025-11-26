import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

const EditProfileScreen = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!formData.first_name || !formData.last_name) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      // No enviar email ya que el backend no permite actualizarlo
      const { email, ...updateData } = formData;
      const result = await updateUser(updateData);
      if (result.success) {
        alert("Perfil actualizado exitosamente");
        router.back();
      } else {
        alert(result.message || "Error al actualizar perfil");
      }
    } catch (error) {
      alert("Error de conexión. Verifica tu conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={formData.first_name}
            onChangeText={(value) => updateField("first_name", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido *</Text>
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={formData.last_name}
            onChangeText={(value) => updateField("last_name", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email (no editable)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="email@ejemplo.com"
            value={formData.email}
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="1234567890"
            value={formData.phone}
            onChangeText={(value) => updateField("phone", value)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Departamento</Text>
          <TextInput
            style={styles.input}
            placeholder="IT"
            value={formData.department}
            onChangeText={(value) => updateField("department", value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar Cambios</Text>
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
  button: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#999",
  },
});

export default EditProfileScreen;
