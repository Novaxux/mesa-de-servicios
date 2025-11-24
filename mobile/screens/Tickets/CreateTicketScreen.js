import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Picker,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ticketService, categoryService } from '../../services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const CreateTicketScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority_id: 2, // Media por defecto
    category_id: null,
    department: user?.department || '',
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.data.categories || []);
        if (response.data.categories?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category_id: response.data.categories[0].id,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachments((prev) => [...prev, ...result.assets]);
      } else if (!result.canceled && result.uri) {
        // Fallback para versiones antiguas de expo-document-picker
        setAttachments((prev) => [...prev, result]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('No se pudo seleccionar el archivo');
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesita permiso para acceder a las imágenes');
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
      console.error('Error picking image:', error);
      alert('No se pudo seleccionar la imagen');
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category_id) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      // Primero crear el ticket
      const result = await ticketService.create(formData);

      if (result.success && result.data?.ticket?.id) {
        const ticketId = result.data.ticket.id;
        let uploadErrors = [];

        // Subir archivos adjuntos si hay
        if (attachments.length > 0) {
          for (const attachment of attachments) {
            try {
              const uri = attachment.uri;
              const fileExtension = uri ? uri.split('.').pop() : 'jpg';
              const fileType =
                attachment.type || attachment.mimeType || 'image/jpeg';
              const fileName =
                attachment.name ||
                attachment.fileName ||
                `attachment_${Date.now()}.${fileExtension}`;

              await ticketService.uploadAttachment(ticketId, {
                uri,
                type: fileType,
                name: fileName,
              });
            } catch (error) {
              console.error('Error uploading attachment:', error);
              uploadErrors.push(attachment.name || 'archivo');
              // Continuar con los demás archivos aunque uno falle
            }
          }
        }

        let message = 'Ticket creado exitosamente';
        if (uploadErrors.length > 0) {
          message +=
            '\n\nAlgunos archivos no se pudieron subir: ' +
            uploadErrors.join(', ');
        }

        alert(message);
        navigation.goBack();
      } else {
        alert(result.message || 'Error al crear ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error de conexión. Verifica tu conexión a internet.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
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
          <TextInput
            style={styles.input}
            placeholder="IT"
            value={formData.department}
            onChangeText={(value) =>
              setFormData((prev) => ({ ...prev, department: value }))
            }
          />
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
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name || attachment.fileName}
                  </Text>
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
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 120,
    paddingTop: 15,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  attachmentButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  attachmentButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  attachmentsList: {
    marginTop: 10,
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTicketScreen;
