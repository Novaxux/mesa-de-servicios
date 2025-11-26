import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { usePermissions } from "../../hooks/usePermissions";
import { userService } from "../../services/api";

const UsersScreen = () => {
  const router = useRouter();
  const { can } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!can.viewAllUsers) {
      Alert.alert("Error", "No tienes permisos para ver esta sección");
      router.back();
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleDeleteUser = async (userId) => {
    if (!can.deleteUser) {
      Alert.alert("Error", "No tienes permisos para eliminar usuarios");
      return;
    }

    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que deseas eliminar este usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await userService.delete(userId);
              if (response.success) {
                Alert.alert("Éxito", "Usuario eliminado correctamente");
                loadUsers();
              } else {
                Alert.alert(
                  "Error",
                  response.message || "No se pudo eliminar el usuario"
                );
              }
            } catch (error) {
              console.error("Error deleting user:", error);
              const errorMsg =
                error.response?.data?.message ||
                error.message ||
                "No se pudo eliminar el usuario";
              Alert.alert("Error", errorMsg);
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "#F44336",
      technician: "#2196F3",
      user: "#4CAF50",
    };
    return colors[role] || "#666";
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrador",
      technician: "Técnico",
      user: "Usuario",
    };
    return labels[role] || role;
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() =>
        router.push({ pathname: "/user-detail", params: { userId: item.id } })
      }
    >
      <View style={styles.userHeader}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBadgeColor(item.role) },
          ]}
        >
          <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
        </View>
      </View>

      <Text style={styles.userEmail}>{item.email}</Text>

      <Text style={styles.userDepartment}>
        📁 {item.department_name || "Sin departamento asignado"}
      </Text>

      <View style={styles.userFooter}>
        <Text
          style={[
            styles.statusText,
            { color: item.is_active ? "#4CAF50" : "#F44336" },
          ]}
        >
          {item.is_active ? "✓ Activo" : "✗ Inactivo"}
        </Text>

        {can.deleteUser && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.id)}
          >
            <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.headerTitle}>Usuarios ({users.length})</Text>
        {can.createUser && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/create-user")}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay usuarios registrados</Text>
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
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  userCard: {
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
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  userDepartment: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default UsersScreen;
