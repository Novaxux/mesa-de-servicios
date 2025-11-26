import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { ticketService } from "../../services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TicketListScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { can, isAdmin, isTechnician, isUser } = usePermissions();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [filters, setFilters] = useState({
    status: params?.filter || null,
    priority_id: null,
  });

  const loadTickets = useCallback(async () => {
    try {
      let queryFilters = { ...filters };

      // Admin puede ver todos los tickets
      if (can.viewAllTickets) {
        // No se necesita filtro adicional
      }
      // Técnicos ven tickets asignados a ellos
      else if (can.viewAssignedTickets && filters.status === "assigned") {
        queryFilters.assigned_to = user?.id;
        delete queryFilters.status; // Remover el filtro 'assigned' ya que no es un status válido
      }
      // Usuarios normales solo ven sus propios tickets
      else if (can.viewOwnTickets && !can.viewAllTickets) {
        queryFilters.created_by = user?.id;
      }

      const response = await ticketService.getAll(queryFilters);
      if (response.success) {
        let filteredTickets = response.data.tickets || [];

        // Filtrar según la vista (activos o cerrados)
        if (showClosed) {
          // Mostrar solo cerrados y resueltos
          filteredTickets = filteredTickets.filter(
            (t) => t.status === "closed" || t.status === "resolved"
          );
        } else {
          // Mostrar solo activos (open, in_progress, pending)
          filteredTickets = filteredTickets.filter(
            (t) => t.status !== "closed" && t.status !== "resolved"
          );
        }

        setTickets(filteredTickets);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, can, user, showClosed]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
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

  const getPriorityColor = (priorityLevel) => {
    if (priorityLevel === 4) return "#F44336"; // Crítica
    if (priorityLevel === 3) return "#FF9800"; // Alta
    if (priorityLevel === 2) return "#2196F3"; // Media
    return "#4CAF50"; // Baja
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() =>
        router.push({
          pathname: "/ticket-detail",
          params: { ticketId: item.id },
        })
      }
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketNumber}>{item.ticket_number}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "open"
              ? "Abierto"
              : item.status === "in_progress"
              ? "En Proceso"
              : item.status === "pending"
              ? "Pendiente"
              : item.status === "resolved"
              ? "Resuelto"
              : "Cerrado"}
          </Text>
        </View>
      </View>

      <Text style={styles.ticketTitle}>{item.title}</Text>
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.ticketFooter}>
        <View style={styles.ticketInfo}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority_level) },
            ]}
          >
            <Text style={styles.priorityText}>{item.priority_name}</Text>
          </View>
          <Text style={styles.categoryText}>{item.category_name}</Text>
        </View>
        <Text style={styles.dateText}>
          {format(new Date(item.created_at), "dd MMM yyyy", { locale: es })}
        </Text>
      </View>

      {item.assigned_to_name && (
        <Text style={styles.assignedText}>
          Asignado a: {item.assigned_to_name} {item.assigned_to_lastname}
        </Text>
      )}
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
        <Text style={styles.headerTitle}>
          {isAdmin
            ? "Todos los Tickets"
            : isTechnician && filters.status === null
            ? "Tickets Asignados"
            : "Mis Tickets"}
        </Text>
        {can.createTicket && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/create-ticket")}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Toggle between Active and Closed tickets */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showClosed && styles.toggleButtonActive,
          ]}
          onPress={() => setShowClosed(false)}
        >
          <Text
            style={[styles.toggleText, !showClosed && styles.toggleTextActive]}
          >
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showClosed && styles.toggleButtonActive]}
          onPress={() => setShowClosed(true)}
        >
          <Text
            style={[styles.toggleText, showClosed && styles.toggleTextActive]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showClosed
                ? "No hay tickets en el historial"
                : "No hay tickets activos"}
            </Text>
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
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 5,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#2196F3",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  ticketCard: {
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
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  ticketDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  ticketInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  assignedText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
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

export default TicketListScreen;
