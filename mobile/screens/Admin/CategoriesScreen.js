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
import { usePermissions } from "../../hooks/usePermissions";
import { categoryService } from "../../services/api";

const CategoriesScreen = ({ navigation }) => {
  const { can } = usePermissions();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!can.viewCategories) {
      Alert.alert("Error", "No tienes permisos para ver categorías");
      navigation.goBack();
      return;
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las categorías");
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
        response = await categoryService.update(editingId, formData);
      } else {
        response = await categoryService.create(formData);
      }

      if (response.success) {
        Alert.alert(
          "Éxito",
          editingId ? "Categoría actualizada" : "Categoría creada"
        );
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: "", description: "" });
        loadCategories();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Error al guardar categoría"
      );
    }
  };

  const handleEdit = (category) => {
    if (!can.updateCategory) {
      Alert.alert("Error", "No tienes permisos para editar categorías");
      return;
    }
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    console.log("handleDelete called with categoryId:", categoryId);
    
    if (!can.deleteCategory) {
      Alert.alert("Error", "No tienes permisos para eliminar categorías");
      return;
    }

    // Confirmación directa compatible con Web
    const confirmed = confirm("¿Estás seguro de eliminar esta categoría?");
    if (!confirmed) {
      console.log("Delete cancelled by user");
      return;
    }

    try {
      console.log("Calling categoryService.delete with id:", categoryId);
      const response = await categoryService.delete(categoryId);
      console.log("Delete response:", response);
      
      if (response.success) {
        Alert.alert("Éxito", "Categoría eliminada correctamente");
        loadCategories();
      } else {
        Alert.alert(
          "Error",
          response.message || "No se pudo eliminar la categoría"
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      console.error("Error details:", error.response?.data);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "No se pudo eliminar la categoría";
      Alert.alert("Error", errorMsg);
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
        <Text style={styles.headerTitle}>Categorías</Text>
        {can.createCategory && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: "", description: "" });
            }}
          >
            <Text style={styles.addButtonText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingId ? "Editar Categoría" : "Nueva Categoría"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción"
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
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.description && (
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              )}
            </View>

            <View style={styles.categoryActions}>
              {can.updateCategory && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(category)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
              )}

              {can.deleteCategory && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(category.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
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
  categoryCard: {
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
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#666",
  },
  categoryActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  editButtonText: {
    fontSize: 20,
  },
  deleteButtonText: {
    fontSize: 20,
  },
});

export default CategoriesScreen;
