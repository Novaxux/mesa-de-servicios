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
} from "react-native";
import { useRouter } from 'expo-router';
import { usePermissions } from "../../hooks/usePermissions";
import { departmentService } from "../../services/api";

const DepartmentsScreen = () => {
  const router = useRouter();
  const { can, isAdmin } = usePermissions();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const initScreen = async () => {
      if (!isAdmin) {
        Alert.alert(
          "Error",
          "No tienes permisos para gestionar departamentos",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }
      loadDepartments();
    };
    initScreen();
  }, [isAdmin]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      Alert.alert("Error", "No se pudieron cargar los departamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    try {
      let response;
      if (editingId) {
        response = await departmentService.update(editingId, formData);
      } else {
        response = await departmentService.create(formData);
      }

      if (response.success) {
        Alert.alert(
          "Éxito",
          editingId ? "Departamento actualizado" : "Departamento creado"
        );
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: "", description: "" });
        loadDepartments();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Error al guardar departamento"
      );
    }
  };

  const handleEdit = (department) => {
    setEditingId(department.id);
    setFormData({
      name: department.name,
      description: department.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (department) => {
    console.log("handleDelete called with:", department);
    
    // Prevenir eliminación de "Sin Asignar" en el frontend también
    if (department.name === "Sin Asignar") {
      Alert.alert(
        "No permitido",
        "El departamento 'Sin Asignar' no se puede eliminar"
      );
      return;
    }

    // Confirmación directa compatible con Web
    const confirmed = confirm(`¿Estás seguro de eliminar el departamento "${department.name}"?`);
    if (!confirmed) {
      console.log("Delete cancelled by user");
      return;
    }

    try {
      console.log("Calling departmentService.delete with id:", department.id);
      const response = await departmentService.delete(department.id);
      console.log("Delete response:", response);
      
      if (response.success) {
        Alert.alert("Éxito", "Departamento eliminado correctamente");
        loadDepartments();
      } else {
        Alert.alert(
          "Error",
          response.message || "No se pudo eliminar el departamento"
        );
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      console.error("Error details:", error.response?.data);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "No se pudo eliminar el departamento";
      Alert.alert("Error", errorMsg);
    }
  };

  // Funcionalidad de ver usuarios por departamento pendiente
  // const handleViewUsers = (department) => {
  //   navigation.navigate("DepartmentUsers", {
  //     departmentId: department.id,
  //     departmentName: department.name,
  //   });
  // };

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
        <Text style={styles.headerTitle}>Departamentos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: "", description: "" });
          }}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingId ? "Editar Departamento" : "Nuevo Departamento"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre del departamento"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción (opcional)"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={3}
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: "", description: "" });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          {departments.length} Departamento{departments.length !== 1 ? "s" : ""}
        </Text>

        {Array.isArray(departments) && departments.length > 0 ? (
          departments.map((department) => (
            <View key={department.id} style={styles.departmentCard}>
              <View style={styles.departmentContent}>
                <Text style={styles.departmentName}>{department.name}</Text>
                {department.description && (
                  <Text style={styles.departmentDescription}>
                    {department.description}
                  </Text>
                )}
                {department.manager_first_name && (
                  <Text style={styles.departmentManager}>
                    👤 Manager: {department.manager_first_name}{" "}
                    {department.manager_last_name}
                  </Text>
                )}
              </View>

              <View style={styles.departmentActions}>
                {/* Funcionalidad de ver usuarios pendiente
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewUsers(department)}
              >
                <Text style={styles.actionButtonText}>👥</Text>
              </TouchableOpacity>
              */}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(department)}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>

                {department.name !== "Sin Asignar" && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(department)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay departamentos disponibles</Text>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los departamentos se usan para organizar usuarios
        </Text>
        <Text style={styles.infoText}>
          • El departamento "Sin Asignar" no se puede eliminar
        </Text>
        <Text style={styles.infoText}>
          • No se pueden eliminar departamentos con usuarios asignados
        </Text>
        <Text style={styles.infoText}>
          • La especialidad del técnico es diferente al departamento
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
  formContainer: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#2196F3",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  departmentCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  departmentContent: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  departmentDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  departmentManager: {
    fontSize: 13,
    color: "#2196F3",
    fontStyle: "italic",
  },
  departmentActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  actionButtonText: {
    fontSize: 20,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
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
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
});

export default DepartmentsScreen;
