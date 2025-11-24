import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { knowledgeBaseService } from '../../services/api';

const ArticleDetailScreen = ({ route, navigation }) => {
  const { articleId } = route.params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      const response = await knowledgeBaseService.getById(articleId);
      if (response.success) {
        setArticle(response.data.article);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      alert('Error al cargar el artículo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async () => {
    try {
      await knowledgeBaseService.markHelpful(articleId);
      alert('¡Gracias por tu feedback!');
      // Recargar el artículo para actualizar el contador
      loadArticle();
    } catch (error) {
      console.error('Error marking as helpful:', error);
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
    <ScrollView style={styles.container}>
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
            {article.tags.split(',').map((tag, index) => (
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
          style={styles.helpfulButton}
          onPress={handleMarkHelpful}
        >
          <Text style={styles.helpfulButtonText}>
            👍 ¿Te fue útil este artículo?
          </Text>
        </TouchableOpacity>

        {article.created_at && (
          <Text style={styles.dateText}>
            Creado el{' '}
            {new Date(article.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
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
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    lineHeight: 32,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  contentContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  helpfulButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  helpfulButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ArticleDetailScreen;
