import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { knowledgeBaseService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";

const ArticleDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { articleId } = params;
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      const response = await knowledgeBaseService.getById(articleId);
      if (response.success) {
        setArticle(response.data.article);
        setHasLiked(response.data.article.user_has_liked || false);
      }
    } catch (error) {
      console.error("Error loading article:", error);
      window.alert("Error al cargar el artículo");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async () => {
    if (hasLiked) {
      window.alert("Ya has marcado este artículo como útil");
      return;
    }

    try {
      const response = await knowledgeBaseService.markHelpful(articleId);
      if (response.success) {
        window.alert("¡Gracias por tu feedback!");
        setHasLiked(true);
        // Recargar el artículo para actualizar el contador
        loadArticle();
      }
    } catch (error) {
      console.error("Error marking as helpful:", error);
      const errorMessage = error.response?.data?.message || "Ya has marcado este artículo como útil";
      window.alert(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await knowledgeBaseService.delete(articleId);
      if (response.success) {
        window.alert("Artículo eliminado exitosamente");
        router.back();
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      const errorMessage = error.response?.data?.message || "Error al eliminar el artículo";
      window.alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Artículo no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.metadata}>
          {article.category_name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category_name}</Text>
            </View>
          )}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👁</Text>
              <Text style={styles.statText}>{article.views || 0} vistas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👍</Text>
              <Text style={styles.statText}>
                {article.helpful_count || 0} útil
              </Text>
            </View>
          </View>
        </View>

        {article.tags && (
          <View style={styles.tagsContainer}>
            {article.tags.split(",").map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.content}>{article.content}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.helpfulButton,
            hasLiked && styles.helpfulButtonDisabled
          ]}
          onPress={handleMarkHelpful}
          disabled={hasLiked}
        >
          <Text style={[
            styles.helpfulButtonText,
            hasLiked && styles.helpfulButtonTextDisabled
          ]}>
            {hasLiked ? "✓ Ya marcaste como útil" : "👍 ¿Te fue útil este artículo?"}
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>
              🗑️ Eliminar Artículo
            </Text>
          </TouchableOpacity>
        )}

        {article.created_at && (
          <Text style={styles.dateText}>
            Creado el{" "}
            {new Date(article.created_at).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
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
  scrollContent: {
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    lineHeight: 32,
  },
  metadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  categoryBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    color: "#666",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: "#666",
  },
  contentContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  helpfulButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  helpfulButtonDisabled: {
    backgroundColor: "#4CAF50",
  },
  helpfulButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  helpfulButtonTextDisabled: {
    color: "#fff",
  },
  deleteButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});

export default ArticleDetailScreen;
