import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { knowledgeBaseService } from "../../services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const KnowledgeBaseScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadArticles();
  }, [searchQuery]);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      if (params?.refresh) {
        loadArticles();
      }
    }, [params?.refresh])
  );

  const loadArticles = async () => {
    try {
      const response = await knowledgeBaseService.getAll({
        search: searchQuery || undefined,
      });
      if (response.success) {
        setArticles(response.data.articles || []);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() =>
        router.push({
          pathname: "/article-detail",
          params: { articleId: item.id },
        })
      }
    >
      <Text style={styles.articleTitle}>{item.title}</Text>
      <Text style={styles.articleContent} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.articleFooter}>
        <Text style={styles.articleCategory}>{item.category_name}</Text>
        <View style={styles.articleStats}>
          <Text style={styles.articleStat}>👁 {item.views}</Text>
          <Text style={styles.articleStat}>👍 {item.helpful_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Base de Conocimientos</Text>
        {can.createArticle && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/create-article")}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar artículos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay artículos disponibles</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  searchContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  articleCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  articleContent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    lineHeight: 20,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleCategory: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  articleStats: {
    flexDirection: "row",
    gap: 10,
  },
  articleStat: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default KnowledgeBaseScreen;
