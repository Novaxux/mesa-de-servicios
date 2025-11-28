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
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import {
  ticketService,
  technicianService,
  categoryService,
  incidentTypeService,
} from "../../services/api";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [filters, setFilters] = useState({
    status: params?.filter || null,
    status_type: "active",
    priority_level: null,
    assigned_to: null,
    category_id: null,
    incident_type_id: null,
    sla_breached: null,
  });

  const loadTickets = useCallback(async () => {
    try {
      let queryFilters = {};

      // Aplicar filtros avanzados
      if (filters.priority_level)
        queryFilters.priority_id = filters.priority_level;
      if (filters.assigned_to) queryFilters.assigned_to = filters.assigned_to;
      if (filters.category_id) queryFilters.category_id = filters.category_id;
      if (filters.incident_type_id)
        queryFilters.incident_type_id = filters.incident_type_id;
      if (filters.sla_breached !== null)
        queryFilters.sla_breached = filters.sla_breached ? 1 : 0;

      // Si viene desde dashboard del técnico con filtro "assigned"
      if (isTechnician && params?.filter === "assigned") {
        queryFilters.assigned_to = user?.id;
      }

      // Admin puede ver todos los tickets (sin filtros adicionales)
      if (can.viewAllTickets) {
        // No se necesita filtro adicional
      }
      // Técnicos ven tickets de su categoría (el backend filtra por specialty)
      // A menos que tengan filtro assigned_to activo
      else if (isTechnician) {
        // El backend ya maneja el filtro por specialty automáticamente
        // No agregamos filtros adicionales aquí
      }
      // Usuarios normales solo ven sus propios tickets creados
      else if (can.viewOwnTickets) {
        queryFilters.created_by = user?.id;
      }

      const response = await ticketService.getAll(queryFilters);
      if (response.success) {
        let filteredTickets = response.data.tickets || [];

        // Filtrar según la vista (activos o cerrados)
        if (filters.status_type === "closed") {
          // Mostrar solo cerrados y resueltos
          filteredTickets = filteredTickets.filter(
            (t) => t.status === "closed" || t.status === "resolved"
          );
        } else if (filters.status_type === "active") {
          // Mostrar solo activos (open, in_progress, pending)
          filteredTickets = filteredTickets.filter(
            (t) => t.status !== "closed" && t.status !== "resolved"
          );
        }
        // Si es "all", no filtrar por estado

        setTickets(filteredTickets);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, can, user]);

  const loadTechnicians = async () => {
    try {
      const response = await technicianService.getAll();
      if (response.success) {
        setTechnicians(response.data.technicians || []);
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadIncidentTypes = async () => {
    try {
      const response = await incidentTypeService.getAll();
      if (response.success) {
        setIncidentTypes(response.data.incident_types || []);
      }
    } catch (error) {
      console.error("Error loading incident types:", error);
    }
  };

  useEffect(() => {
    loadTickets();
    loadTechnicians();
    loadCategories();
    loadIncidentTypes();
  }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadTickets();
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      status_type: "active",
      priority_level: null,
      assigned_to: null,
      category_id: null,
      incident_type_id: null,
      sla_breached: null,
    });
    setSearchQuery("");
  };

  const getActiveFiltersCount = () => {
    let count = Object.values(filters).filter((v) => v !== null).length;
    // Agregar 1 si viene desde dashboard con filtro "assigned"
    if (isTechnician && params?.filter === "assigned") {
      count += 1;
    }
    return count;
  };

  const filterTicketsBySearch = () => {
    if (!searchQuery) return tickets;

    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.ticket_number?.toLowerCase().includes(query) ||
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.category_name?.toLowerCase().includes(query) ||
        ticket.incident_type_name?.toLowerCase().includes(query) ||
        ticket.assigned_to_name?.toLowerCase().includes(query)
    );
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

  const getPriorityText = (level) => {
    const texts = {
      1: "Baja",
      2: "Media",
      3: "Alta",
      4: "Crítica",
    };
    return texts[level] || "Sin prioridad";
  };

  const getIncidentTypeIcon = (type) => {
    const icons = {
      hardware: "🖥️",
      software: "💻",
      network: "🌐",
      security: "🔒",
      other: "📋",
    };
    return icons[type?.toLowerCase()] || "📋";
  };

  const filteredTickets = filterTicketsBySearch();

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
            : isTechnician && params?.filter === "assigned"
            ? "Tickets Asignados"
            : isTechnician
            ? "Tickets Disponibles"
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

      {/* Buscador y Filtros */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Buscar tickets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>
            {getActiveFiltersCount() > 0
              ? `Filtros (${getActiveFiltersCount()})`
              : "⚙️"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFilters}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {filters.status_type !== "active" && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {filters.status_type === "closed" ? "📁 Historial" : "📋 Todos"}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setFilters({ ...filters, status_type: "active" })
                }
              >
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {filters.priority_level && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {getPriorityText(filters.priority_level)}
              </Text>
              <TouchableOpacity
                onPress={() => setFilters({ ...filters, priority_level: null })}
              >
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {(filters.assigned_to ||
            (isTechnician && params?.filter === "assigned")) && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {isTechnician && params?.filter === "assigned"
                  ? "👤 Mis Asignados"
                  : `Técnico: ${
                      technicians.find((t) => t.user_id === filters.assigned_to)
                        ?.first_name || "..."
                    }`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFilters({ ...filters, assigned_to: null });
                  if (params?.filter === "assigned") {
                    router.replace("/(tabs)/tickets");
                  }
                }}
              >
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {filters.category_id && !isTechnician && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {categories.find((c) => c.id === filters.category_id)?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setFilters({ ...filters, category_id: null })}
              >
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {filters.incident_type_id && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {
                  incidentTypes.find((t) => t.id === filters.incident_type_id)
                    ?.name
                }
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setFilters({ ...filters, incident_type_id: null })
                }
              >
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {filters.sla_breached !== null && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {filters.sla_breached ? "⚠️ SLA Incumplido" : "✅ SLA OK"}
              </Text>
              <TouchableOpacity
                onPress={() => setFilters({ ...filters, sla_breached: null })}
              >
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFiltersText}>Limpiar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <FlatList
        data={filteredTickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || getActiveFiltersCount() > 0
                ? "No se encontraron tickets"
                : filters.status_type === "closed"
                ? "No hay tickets en el historial"
                : "No hay tickets activos"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Modal de Filtros */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Estado (Activos/Historial) */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Estado del Ticket:</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.status_type === "active" &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, status_type: "active" })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.status_type === "active" &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      📂 Activos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.status_type === "closed" &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, status_type: "closed" })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.status_type === "closed" &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      📁 Historial
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.status_type === "all" && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, status_type: "all" })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.status_type === "all" &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      📋 Todos
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Prioridad */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Prioridad:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.priority_level === null &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, priority_level: null })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.priority_level === null &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {[1, 2, 3, 4].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.filterChip,
                        filters.priority_level === priority &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, priority_level: priority })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.priority_level === priority &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {getPriorityText(priority)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Técnico */}
              {(isAdmin || isTechnician) && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Técnico:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        filters.assigned_to === null && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, assigned_to: null })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.assigned_to === null &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {technicians.map((tech) => (
                      <TouchableOpacity
                        key={tech.user_id}
                        style={[
                          styles.filterChip,
                          filters.assigned_to === tech.user_id &&
                            styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, assigned_to: tech.user_id })
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            filters.assigned_to === tech.user_id &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {tech.first_name} {tech.last_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Categoría - Solo para Admin y Usuarios */}
              {!isTechnician && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Categoría:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        filters.category_id === null && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, category_id: null })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.category_id === null &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        Todas
                      </Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.filterChip,
                          filters.category_id === cat.id &&
                            styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, category_id: cat.id })
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            filters.category_id === cat.id &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Tipo de Incidente */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Tipo:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.incident_type_id === null &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, incident_type_id: null })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.incident_type_id === null &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {incidentTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.filterChip,
                        filters.incident_type_id === type.id &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, incident_type_id: type.id })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.incident_type_id === type.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {getIncidentTypeIcon(type.name)} {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* SLA */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Estado SLA:</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.sla_breached === null && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, sla_breached: null })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.sla_breached === null &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.sla_breached === false && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, sla_breached: false })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.sla_breached === false &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      ✅ SLA OK
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      filters.sla_breached === true && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, sla_breached: true })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.sla_breached === true &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      ⚠️ SLA Incumplido
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  activeFilters: {
    backgroundColor: "#fff",
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  activeFiltersContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  activeFilterChip: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    alignItems: "center",
  },
  activeFilterText: {
    fontSize: 12,
    color: "#1976D2",
    marginRight: 6,
  },
  activeFilterRemove: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "bold",
  },
  clearFiltersButton: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalClose: {
    fontSize: 24,
    color: "#666",
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  applyButton: {
    flex: 2,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default TicketListScreen;
