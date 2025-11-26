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
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePermissions } from "../../hooks/usePermissions";
import { knowledgeBaseService, categoryService } from "../../services/api";
import { Picker } from "@react-native-picker/picker";

const CreateArticleScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { can } = usePermissions();
  const articleId = params?.articleId;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    tags: "",
  });

  React.useEffect(() => {
    if (!can.createArticle && !articleId) {
      Alert.alert("Error", "No tienes permisos para crear artículos");
      router.back();
      return;
    }
    loadCategories();

    if (articleId) {
      loadArticle();
    }
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await knowledgeBaseService.getById(articleId);
      if (response.success && response.data.article) {
        const article = response.data.article;
        setFormData({
          title: article.title || "",
          content: article.content || "",
          category_id: String(article.category_id || ""),
          tags: article.tags || "",
        });
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el artículo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "El título es requerido");
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert("Error", "El contenido es requerido");
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : null,
        tags: formData.tags,
      };

      let response;
      if (articleId) {
        response = await knowledgeBaseService.update(articleId, dataToSend);
      } else {
        response = await knowledgeBaseService.create(dataToSend);
      }

      if (response.success) {
        Alert.alert(
          "Éxito",
          articleId
            ? "Artículo actualizado correctamente"
            : "Artículo creado correctamente",
          [
            {
              text: "OK",
              onPress: () => {
                // Navegar de vuelta y forzar recarga
                router.push({
                  pathname: "/(tabs)/knowledge",
                  params: { refresh: Date.now() },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "No se pudo guardar el artículo"
        );
      }
    } catch (error) {
      console.error("Error saving article:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo guardar el artículo"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && articleId) {
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
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {articleId ? "Editar Artículo" : "Nuevo Artículo"}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Título del artículo"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category_id}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Sin categoría" value="" />
              {categories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={String(category.id)}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contenido *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escribe el contenido del artículo..."
            value={formData.content}
            onChangeText={(text) => setFormData({ ...formData, content: text })}
            multiline
            numberOfLines={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Etiquetas</Text>
          <TextInput
            style={styles.input}
            placeholder="Separadas por comas (ej: impresora, hardware, red)"
            value={formData.tags}
            onChangeText={(text) => setFormData({ ...formData, tags: text })}
          />
          <Text style={styles.hint}>
            Las etiquetas ayudan a encontrar el artículo más fácilmente
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {articleId ? "Actualizar Artículo" : "Crear Artículo"}
            </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    padding: 15,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
  textArea: {
    minHeight: 200,
    textAlignVertical: "top",
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
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateArticleScreen;
