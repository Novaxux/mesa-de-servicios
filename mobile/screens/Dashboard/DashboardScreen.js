import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    try {
      // Solo cargar estadísticas si el usuario tiene permisos (admin o technician)
      if (user?.role === 'admin' || user?.role === 'technician') {
        const response = await ticketService.getStatistics();
        if (response.success) {
          setStatistics(response.data.statistics);
        }
      } else {
        // Para usuarios normales, cargar solo sus propios tickets
        const response = await ticketService.getAll({ created_by: user?.id });
        if (response.success) {
          const tickets = response.data.tickets || [];
          setStatistics({
            total: tickets.length,
            open: tickets.filter((t) => t.status === 'open').length,
            in_progress: tickets.filter((t) => t.status === 'in_progress')
              .length,
            resolved: tickets.filter((t) => t.status === 'resolved').length,
            closed: tickets.filter((t) => t.status === 'closed').length,
          });
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Si hay error, establecer estadísticas en 0
      setStatistics({
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const StatCard = ({ title, value, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statTitle}>{title}</Text>
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenido,</Text>
        <Text style={styles.userName}>
          {user?.first_name} {user?.last_name}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Tickets"
            value={statistics?.total}
            color="#2196F3"
            onPress={() => navigation.navigate('TicketList')}
          />
          <StatCard
            title="Abiertos"
            value={statistics?.open}
            color="#2196F3"
            onPress={() =>
              navigation.navigate('TicketList', { filter: 'open' })
            }
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="En Proceso"
            value={statistics?.in_progress}
            color="#FF9800"
            onPress={() =>
              navigation.navigate('TicketList', { filter: 'in_progress' })
            }
          />
          <StatCard
            title="Resueltos"
            value={statistics?.resolved}
            color="#4CAF50"
            onPress={() =>
              navigation.navigate('TicketList', { filter: 'resolved' })
            }
          />
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateTicket')}
        >
          <Text style={styles.actionButtonText}>➕ Crear Nuevo Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('KnowledgeBase')}
        >
          <Text style={styles.actionButtonText}>📚 Base de Conocimientos</Text>
        </TouchableOpacity>

        {user?.role === 'technician' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MyTickets')}
          >
            <Text style={styles.actionButtonText}>
              🎫 Mis Tickets Asignados
            </Text>
          </TouchableOpacity>
        )}

        {user?.role === 'admin' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reports')}
            >
              <Text style={styles.actionButtonText}>📊 Reportes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Technicians')}
            >
              <Text style={styles.actionButtonText}>
                👥 Gestión de Técnicos
              </Text>
            </TouchableOpacity>
          </>
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
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statsContainer: {
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default DashboardScreen;
