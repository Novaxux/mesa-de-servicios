import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { usePermissions } from "../../hooks/usePermissions";
import { reportService, getAuthToken } from "../../services/api";

const FeedbackReportsScreen = () => {
  const router = useRouter();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    averageRating: 0,
    totalFeedbacks: 0,
    ratingDistribution: [],
    recentFeedbacks: [],
  });

  useEffect(() => {
    if (!can.viewReports) {
      alert("No tienes permisos para ver estos reportes");
      router.back();
      return;
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportService.getFeedbackReports();
      if (response.success) {
        setFeedbackData({
          averageRating: response.data.averageRating || 0,
          totalFeedbacks: response.data.totalFeedbacks || 0,
          ratingDistribution: response.data.ratingDistribution || [],
          recentFeedbacks: response.data.recentFeedbacks || [],
        });
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      alert("No se pudieron cargar los reportes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleExportCSV = async () => {
    try {
      const token = getAuthToken();
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const dateTo = new Date().toISOString().split("T")[0];

      const url = await reportService.exportFeedbackCSV(dateFrom, dateTo);
      const urlWithAuth = `${url}&token=${token}`;

      const supported = await Linking.canOpenURL(urlWithAuth);
      if (supported) {
        await Linking.openURL(urlWithAuth);
        window.alert("Descargando reporte de feedback...");
      } else {
        window.alert("No se puede abrir el enlace de descarga");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      window.alert("Error al exportar el reporte");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? "⭐" : "☆"}
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "#4CAF50";
    if (rating >= 3.5) return "#8BC34A";
    if (rating >= 2.5) return "#FFC107";
    if (rating >= 1.5) return "#FF9800";
    return "#F44336";
  };

  const renderFeedbackItem = ({ item }) => (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <View style={styles.feedbackUser}>
          <Text style={styles.feedbackUserName}>
            {item.user_name || "Usuario Anónimo"}
          </Text>
          <Text style={styles.feedbackDate}>
            {new Date(item.created_at).toLocaleDateString("es-ES")}
          </Text>
        </View>
        {renderStars(item.rating)}
      </View>

      <Text style={styles.feedbackTicket}>
        Ticket #{item.ticket_id}: {item.ticket_title}
      </Text>

      {item.comment && (
        <Text style={styles.feedbackComment}>"{item.comment}"</Text>
      )}

      {item.technician_name && (
        <Text style={styles.feedbackTechnician}>
          Técnico: {item.technician_name}
        </Text>
      )}
    </View>
  );

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ Reportes de Feedback</Text>
        <Text style={styles.headerSubtitle}>
          Calificaciones y comentarios de usuarios
        </Text>

        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Text style={styles.exportButtonText}>📥 Exportar a CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Resumen General */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>📊 Resumen de Satisfacción</Text>

          <View style={styles.averageRatingContainer}>
            <Text
              style={[
                styles.averageRating,
                { color: getRatingColor(feedbackData.averageRating) },
              ]}
            >
              {feedbackData.averageRating.toFixed(1)}
            </Text>
            {renderStars(Math.round(feedbackData.averageRating))}
          </View>

          <Text style={styles.totalFeedbacks}>
            Basado en {feedbackData.totalFeedbacks} evaluaciones
          </Text>
        </View>

        {/* Distribución de Calificaciones */}
        <View style={styles.distributionCard}>
          <Text style={styles.cardTitle}>
            📈 Distribución de Calificaciones
          </Text>
          {feedbackData.ratingDistribution.map((item, index) => {
            const percentage =
              feedbackData.totalFeedbacks > 0
                ? (item.count / feedbackData.totalFeedbacks) * 100
                : 0;

            return (
              <View key={index} style={styles.distributionRow}>
                <Text style={styles.ratingLabel}>{item.rating} ⭐</Text>
                <View style={styles.distributionBarContainer}>
                  <View
                    style={[
                      styles.distributionBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: getRatingColor(item.rating),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>

        {/* Feedbacks Recientes */}
        <View style={styles.recentCard}>
          <Text style={styles.cardTitle}>💬 Comentarios Recientes</Text>
          {feedbackData.recentFeedbacks.length === 0 ? (
            <Text style={styles.emptyText}>No hay comentarios disponibles</Text>
          ) : (
            <FlatList
              data={feedbackData.recentFeedbacks}
              renderItem={renderFeedbackItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
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
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E3F2FD",
  },
  exportButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  exportButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 15,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  averageRatingContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  averageRating: {
    fontSize: 56,
    fontWeight: "bold",
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  totalFeedbacks: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  distributionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingLabel: {
    width: 50,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  distributionBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  distributionBar: {
    height: "100%",
    borderRadius: 12,
  },
  distributionCount: {
    width: 40,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
  },
  recentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  feedbackCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  feedbackUser: {
    flex: 1,
  },
  feedbackUserName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  feedbackDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  feedbackTicket: {
    fontSize: 13,
    color: "#2196F3",
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    marginBottom: 8,
    lineHeight: 20,
  },
  feedbackTechnician: {
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
});

export default FeedbackReportsScreen;
