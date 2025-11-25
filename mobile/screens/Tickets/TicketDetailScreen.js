import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { ticketService } from "../../services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const { user } = useAuth();
  const { can, isAdmin, isTechnician } = usePermissions();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isInternalComment, setIsInternalComment] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const response = await ticketService.getById(ticketId);
      if (response.success) {
        setTicket(response.data.ticket);
        setComments(response.data.comments || []);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "El comentario no puede estar vacío");
      return;
    }

    if (!can.addComment) {
      Alert.alert("Error", "No tienes permisos para agregar comentarios");
      return;
    }

    setSubmitting(true);
    try {
      const result = await ticketService.addComment(
        ticketId,
        commentText,
        isInternalComment && can.addInternalComment
      );
      if (result.success) {
        setCommentText("");
        setIsInternalComment(false);
        loadTicket();
      } else {
        Alert.alert("Error", result.message || "Error al agregar comentario");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const canEditTicket = () => {
    // Admin puede editar cualquier ticket
    if (can.updateAnyTicket) return true;

    // Técnico puede editar tickets asignados a él
    if (can.updateAssignedTicket && ticket?.assigned_to === user?.id)
      return true;

    // Usuario puede editar sus propios tickets si están abiertos
    if (ticket?.created_by === user?.id && ticket?.status === "open")
      return true;

    return false;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "#2196F3",
      in_progress: "#FF9800",
      pending: "#9C27B0",
      resolved: "#4CAF50",
      closed: "#757575",
    };
    return colors[status] || "#666";
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ticket no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(ticket.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {ticket.status === "open"
              ? "Abierto"
              : ticket.status === "in_progress"
              ? "En Proceso"
              : ticket.status === "pending"
              ? "Pendiente"
              : ticket.status === "resolved"
              ? "Resuelto"
              : "Cerrado"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>{ticket.title}</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Prioridad:</Text>
          <Text style={styles.infoValue}>{ticket.priority_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Categoría:</Text>
          <Text style={styles.infoValue}>{ticket.category_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Creado:</Text>
          <Text style={styles.infoValue}>
            {format(new Date(ticket.created_at), "dd MMM yyyy HH:mm", {
              locale: es,
            })}
          </Text>
        </View>
        {ticket.assigned_to_name && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Asignado a:</Text>
            <Text style={styles.infoValue}>
              {ticket.assigned_to_name} {ticket.assigned_to_lastname}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentarios ({comments.length})</Text>

        {comments.map((comment) => {
          // Ocultar comentarios internos si el usuario no tiene permiso
          if (comment.is_internal && !can.viewInternalComments) {
            return null;
          }

          return (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAuthorContainer}>
                  <Text style={styles.commentAuthor}>
                    {comment.first_name} {comment.last_name}
                  </Text>
                  {comment.is_internal && (
                    <Text style={styles.internalBadge}>Interno</Text>
                  )}
                </View>
                <Text style={styles.commentDate}>
                  {format(new Date(comment.created_at), "dd MMM yyyy HH:mm", {
                    locale: es,
                  })}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.comment}</Text>
            </View>
          );
        })}

        {can.addComment && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />

            {can.addInternalComment && (
              <TouchableOpacity
                style={styles.internalToggle}
                onPress={() => setIsInternalComment(!isInternalComment)}
              >
                <Text style={styles.internalToggleText}>
                  {isInternalComment ? "🔒 Interno" : "🌐 Público"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.commentButton,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={submitting}
            >
              <Text style={styles.commentButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}

        {canEditTicket() && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate("CreateTicket", { ticketId: ticket.id })
            }
          >
            <Text style={styles.editButtonText}>✏️ Editar Ticket</Text>
          </TouchableOpacity>
        )}

        {can.createFeedback && ticket.status === "resolved" && (
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() =>
              navigation.navigate("CreateFeedback", { ticketId: ticket.id })
            }
          >
            <Text style={styles.feedbackButtonText}>⭐ Dar Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  ticketNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 15,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  commentCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  commentAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  internalBadge: {
    backgroundColor: "#FF9800",
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  commentInputContainer: {
    marginTop: 15,
  },
  commentInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  internalToggle: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  internalToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  feedbackButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  feedbackButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
  },
});

export default TicketDetailScreen;
