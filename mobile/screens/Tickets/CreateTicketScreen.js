import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Picker,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  ticketService,
  categoryService,
  departmentService,
} from "../../services/api";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const CreateTicketScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const ticketId = params?.ticketId;
  const isEditMode = !!ticketId;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority_id: 2, // Media por defecto
    category_id: null,
    department_id: user?.department_id || null,
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    loadCategories();
    loadDepartments();
    if (isEditMode) {
      loadTicket();
    }
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.data.categories || []);
        if (response.data.categories?.length > 0 && !isEditMode) {
          setFormData((prev) => ({
            ...prev,
            category_id: response.data.categories[0].id,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      if (response.success) {
        setDepartments(response.data.departments || []);
        // Si el usuario tiene departamento pero no está en formData, asignarlo
        if (user?.department_id && !formData.department_id && !isEditMode) {
          setFormData((prev) => ({
            ...prev,
            department_id: user.department_id,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getById(ticketId);
      if (response.success && response.data.ticket) {
        const ticket = response.data.ticket;
        setFormData({
          title: ticket.title || "",
          description: ticket.description || "",
          priority_id: ticket.priority_id || 2,
          category_id: ticket.category_id || null,
          department_id: ticket.department_id || user?.department_id || null,
        });

        // Cargar archivos adjuntos existentes con formato especial para distinguirlos
        if (response.data.attachments && response.data.attachments.length > 0) {
          const existingAttachments = response.data.attachments.map((att) => ({
            id: att.id,
            name: att.file_name,
            fileName: att.file_name,
            existing: true, // Marca como existente
            file_path: att.file_path,
            file_size: att.file_size,
          }));
          setAttachments(existingAttachments);
        }
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      alert("No se pudo cargar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachments((prev) => [...prev, ...result.assets]);
      } else if (!result.canceled && result.uri) {
        // Fallback para versiones antiguas de expo-document-picker
        setAttachments((prev) => [...prev, result]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      alert("No se pudo seleccionar el archivo");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Se necesita permiso para acceder a las imágenes");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachments((prev) => [...prev, ...result.assets]);
      } else if (!result.canceled && result.uri) {
        // Fallback para versiones antiguas
        setAttachments((prev) => [...prev, result]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("No se pudo seleccionar la imagen");
    }
  };

  const removeAttachment = async (index) => {
    const attachment = attachments[index];

    // Si es un archivo existente, preguntar confirmación
    if (attachment.existing) {
      if (window.confirm("¿Estás seguro de eliminar este archivo?")) {
        try {
          // Llamar al backend para eliminar el archivo
          await ticketService.deleteAttachment(attachment.id);
          setAttachments((prev) => prev.filter((_, i) => i !== index));
          alert("Archivo eliminado correctamente");
        } catch (error) {
          console.error("Error deleting attachment:", error);
          alert("Error al eliminar el archivo");
        }
      }
    } else {
      // Si es un archivo nuevo (no subido aún), simplemente removerlo de la lista
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category_id) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      // Crear o actualizar el ticket
      const result = isEditMode
        ? await ticketService.update(ticketId, formData)
        : await ticketService.create(formData);

      if (result.success && (isEditMode || result.data?.ticket?.id)) {
        const currentTicketId = isEditMode ? ticketId : result.data.ticket.id;
        let uploadErrors = [];

        // Subir archivos adjuntos nuevos (tanto en creación como en edición)
        const newAttachments = attachments.filter((att) => !att.existing);
        if (newAttachments.length > 0) {
          for (const attachment of newAttachments) {
            try {
              const uri = attachment.uri;
              const fileExtension = uri ? uri.split(".").pop() : "jpg";
              const fileType =
                attachment.type || attachment.mimeType || "image/jpeg";
              const fileName =
                attachment.name ||
                attachment.fileName ||
                `attachment_${Date.now()}.${fileExtension}`;

              await ticketService.uploadAttachment(currentTicketId, {
                uri,
                type: fileType,
                name: fileName,
              });
            } catch (error) {
              console.error("Error uploading attachment:", error);
              uploadErrors.push(attachment.name || "archivo");
              // Continuar con los demás archivos aunque uno falle
            }
          }
        }

        let message = isEditMode
          ? "Ticket actualizado exitosamente"
          : "Ticket creado exitosamente";
        if (uploadErrors.length > 0) {
          message +=
            "\n\nAlgunos archivos no se pudieron subir: " +
            uploadErrors.join(", ");
        }

        alert(message);
        router.back();
      } else {
        alert(result.message || "Error al crear ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error de conexión. Verifica tu conexión a internet.";
      alert(errorMessage);
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
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe brevemente el problema"
            value={formData.title}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, title: value }))
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el problema en detalle..."
            value={formData.description}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.priority_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority_id: value }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Baja" value={1} />
              <Picker.Item label="Media" value={2} />
              <Picker.Item label="Alta" value={3} />
              <Picker.Item label="Crítica" value={4} />
            </Picker>
          </View>
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
          <Text style={styles.label}>Archivos Adjuntos</Text>
          <View style={styles.attachmentButtons}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={pickImage}
            >
              <Text style={styles.attachmentButtonText}>📷 Imagen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={pickDocument}
            >
              <Text style={styles.attachmentButtonText}>📄 Documento</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map((attachment, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <View style={styles.attachmentInfo}>
                    {attachment.existing && (
                      <Text style={styles.existingBadge}>📎 Existente</Text>
                    )}
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.name || attachment.fileName}
                    </Text>
                    {attachment.file_size && (
                      <Text style={styles.attachmentSize}>
                        {(attachment.file_size / 1024).toFixed(2)} KB
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Crear Ticket</Text>
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
  textArea: {
    height: 120,
    paddingTop: 15,
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
  attachmentButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  attachmentButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  attachmentButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  attachmentsList: {
    marginTop: 10,
  },
  attachmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  attachmentInfo: {
    flex: 1,
  },
  existingBadge: {
    fontSize: 10,
    color: "#2196F3",
    fontWeight: "600",
    marginBottom: 4,
  },
  attachmentName: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: "#999",
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: "#F44336",
    fontSize: 18,
    fontWeight: "bold",
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

export default CreateTicketScreen;
