import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { usePermissions } from "../../hooks/usePermissions";
import { userService } from "../../services/api";

const UserDetailScreen = ({ navigation, route }) => {
  const { can } = usePermissions();
  const userId = route.params?.userId;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) {
      Alert.alert("Error", "ID de usuario no válido");
      navigation.goBack();
      return;
    }
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await userService.getById(userId);
      if (response.success && response.data.user) {
        setUser(response.data.user);
      } else {
        Alert.alert("Error", "No se pudo cargar el usuario");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading user:", error);
      Alert.alert("Error", "No se pudo cargar el usuario");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!can.updateUser) {
      Alert.alert("Error", "No tienes permisos para actualizar usuarios");
      return;
    }

    try {
      const newStatus = !user.is_active;
      const response = await userService.update(userId, {
        is_active: newStatus,
      });

      if (response.success) {
        setUser({ ...user, is_active: newStatus });
        Alert.alert(
          "Éxito",
          `Usuario ${newStatus ? "activado" : "desactivado"}`
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const handleDeleteUser = async () => {
    if (!can.deleteUser) {
      Alert.alert("Error", "No tienes permisos para eliminar usuarios");
      return;
    }

    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de eliminar a ${user.first_name} ${user.last_name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await userService.delete(userId);
              if (response.success) {
                Alert.alert("Éxito", "Usuario eliminado correctamente", [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]);
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Usuario no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.first_name?.charAt(0)}
            {user.last_name?.charAt(0)}
          </Text>
        </View>

        <Text style={styles.name}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.email}>{user.email}</Text>

        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBadgeColor(user.role) },
          ]}
        >
          <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
        </View>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔐 Estado de la Cuenta</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Cuenta Activa:</Text>
          <Switch
            value={user.is_active}
            onValueChange={handleToggleActive}
            disabled={!can.updateUser}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={user.is_active ? "#4CAF50" : "#f4f3f4"}
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text
            style={[
              styles.statusBadge,
              { color: user.is_active ? "#4CAF50" : "#F44336" },
            ]}
          >
            {user.is_active ? "✓ Activo" : "✗ Inactivo"}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Información Personal</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre:</Text>
          <Text style={styles.infoValue}>{user.first_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Apellido:</Text>
          <Text style={styles.infoValue}>{user.last_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        {user.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}

        {user.department && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departamento:</Text>
            <Text style={styles.infoValue}>{user.department}</Text>
          </View>
        )}
      </View>

      {/* Account Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🕐 Información de Cuenta</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de registro:</Text>
          <Text style={styles.infoValue}>
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString("es-ES")
              : "N/A"}
          </Text>
        </View>

        {user.last_login && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Último acceso:</Text>
            <Text style={styles.infoValue}>
              {new Date(user.last_login).toLocaleDateString("es-ES")}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {can.deleteUser && (
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteUser}
          >
            <Text style={styles.deleteButtonText}>🗑️ Eliminar Usuario</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />
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
  headerCard: {
    backgroundColor: "#2196F3",
    padding: 30,
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2196F3",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: "#E3F2FD",
    marginBottom: 15,
  },
  roleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    marginTop: 0,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actionsCard: {
    margin: 15,
    marginTop: 0,
    marginBottom: 0,
    marginTop: 15,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
  },
});

export default UserDetailScreen;
