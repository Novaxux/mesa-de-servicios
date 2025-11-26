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
  Modal,
} from "react-native";
import { usePermissions } from "../../hooks/usePermissions";
import { userService, departmentService } from "../../services/api";

const UserDetailScreen = ({ navigation, route }) => {
  const { can } = usePermissions();
  const userId = route.params?.userId;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  useEffect(() => {
    const initScreen = async () => {
      if (!userId) {
        Alert.alert("Error", "ID de usuario no válido", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        return;
      }
      await loadData();
    };
    initScreen();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userResponse, deptResponse] = await Promise.all([
        userService.getById(userId),
        departmentService.getAll(),
      ]);

      if (userResponse?.success && userResponse.data?.user) {
        setUser(userResponse.data.user);
      } else {
        Alert.alert("Error", "No se pudo cargar el usuario", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        return;
      }

      if (deptResponse?.success && deptResponse.data?.departments) {
        setDepartments(deptResponse.data.departments);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "No se pudo cargar la información", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
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

  const handleChangeDepartment = async (departmentId) => {
    if (!can.updateUser) {
      Alert.alert("Error", "No tienes permisos para actualizar usuarios");
      return;
    }

    try {
      const response = await userService.update(userId, {
        department_id: departmentId,
      });

      if (response.success) {
        Alert.alert("Éxito", "Departamento actualizado correctamente");
        setShowDepartmentModal(false);
        loadData(); // Reload to get updated department name
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo actualizar el departamento"
      );
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

        <View style={styles.departmentRow}>
          <View style={styles.departmentInfo}>
            <Text style={styles.infoLabel}>Departamento:</Text>
            <Text style={styles.infoValue}>
              {user.department_name || "Sin asignar"}
            </Text>
          </View>
          {can.updateUser && (
            <TouchableOpacity
              style={styles.changeDepartmentButton}
              onPress={() => setShowDepartmentModal(true)}
            >
              <Text style={styles.changeDepartmentText}>Cambiar</Text>
            </TouchableOpacity>
          )}
        </View>
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

      {/* Modal de Selección de Departamento */}
      <Modal
        visible={showDepartmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepartmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Departamento</Text>

            <ScrollView style={styles.departmentList}>
              {Array.isArray(departments) && departments.length > 0 ? (
                departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.departmentOption,
                      user.department_id === dept.id &&
                        styles.selectedDepartment,
                    ]}
                    onPress={() => handleChangeDepartment(dept.id)}
                  >
                    <Text
                      style={[
                        styles.departmentOptionText,
                        user.department_id === dept.id &&
                          styles.selectedDepartmentText,
                      ]}
                    >
                      {dept.name}
                    </Text>
                    {dept.description && (
                      <Text style={styles.departmentOptionDescription}>
                        {dept.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay departamentos disponibles
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDepartmentModal(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  departmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  departmentInfo: {
    flex: 1,
  },
  changeDepartmentButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  changeDepartmentText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  departmentList: {
    maxHeight: 400,
  },
  departmentOption: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedDepartment: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  departmentOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 5,
  },
  selectedDepartmentText: {
    color: "#2196F3",
  },
  departmentOptionDescription: {
    fontSize: 13,
    color: "#666",
  },
  modalCloseButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  modalCloseText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
    padding: 20,
  },
});

export default UserDetailScreen;
