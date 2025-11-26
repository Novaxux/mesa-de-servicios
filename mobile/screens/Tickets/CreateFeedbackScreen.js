import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { feedbackService } from "../../services/api";

const CreateFeedbackScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { ticketId, ticketNumber } = params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      window.alert("Por favor selecciona una calificación");
      return;
    }

    if (window.confirm("¿Estás seguro de enviar esta calificación?")) {
      setSubmitting(true);
      try {
        const result = await feedbackService.create({
          ticket_id: ticketId,
          rating: rating,
          comment: comment.trim() || null,
        });

        if (result.success) {
          window.alert("¡Gracias por tu feedback!");
          router.back();
        } else {
          window.alert(result.message || "Error al enviar feedback");
        }
      } catch (error) {
        console.error("Feedback error:", error);
        const errorMessage = error.response?.data?.message || "Error de conexión. Intenta nuevamente.";
        window.alert(errorMessage);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={styles.starText}>{star <= rating ? "⭐" : "☆"}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingLabel = () => {
    const labels = {
      1: "😞 Muy Insatisfecho",
      2: "😕 Insatisfecho",
      3: "😐 Regular",
      4: "😊 Satisfecho",
      5: "😄 Muy Satisfecho",
    };
    return rating > 0 ? labels[rating] : "Selecciona tu calificación";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Califica el Servicio</Text>
        <Text style={styles.headerSubtitle}>
          Ticket: {ticketNumber || `#${ticketId}`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ¿Cómo calificas la atención recibida?
        </Text>

        {renderStars()}

        <Text style={styles.ratingLabel}>{getRatingLabel()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Comentarios adicionales (opcional)
        </Text>
        <Text style={styles.hint}>
          Ayúdanos a mejorar contándonos sobre tu experiencia
        </Text>

        <TextInput
          style={styles.textArea}
          placeholder="Escribe tus comentarios aquí..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>{comment.length}/500</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Tu opinión es importante</Text>
        <Text style={styles.infoText}>
          • Tu feedback ayuda a mejorar la calidad del servicio
        </Text>
        <Text style={styles.infoText}>
          • Permite identificar áreas de mejora
        </Text>
        <Text style={styles.infoText}>
          • Reconoce el buen trabajo de nuestros técnicos
        </Text>
        <Text style={styles.infoText}>• Es completamente confidencial</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (submitting || rating === 0) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting || rating === 0}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar Calificación</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={submitting}
      >
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
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
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  starButton: {
    padding: 5,
  },
  starText: {
    fontSize: 48,
  },
  ratingLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2196F3",
    textAlign: "center",
    marginTop: 10,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  textArea: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 5,
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
  submitButton: {
    backgroundColor: "#4CAF50",
    margin: 15,
    marginTop: 0,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#fff",
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateFeedbackScreen;
