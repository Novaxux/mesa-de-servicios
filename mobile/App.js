import React from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatusBar } from "expo-status-bar";

// Auth Screens
import LoginScreen from "./screens/Auth/LoginScreen";
import RegisterScreen from "./screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "./screens/Auth/ForgotPasswordScreen";

// Dashboard
import DashboardScreen from "./screens/Dashboard/DashboardScreen";

// Ticket Screens
import TicketListScreen from "./screens/Tickets/TicketListScreen";
import CreateTicketScreen from "./screens/Tickets/CreateTicketScreen";
import TicketDetailScreen from "./screens/Tickets/TicketDetailScreen";

// Knowledge Base
import KnowledgeBaseScreen from "./screens/KnowledgeBase/KnowledgeBaseScreen";
import ArticleDetailScreen from "./screens/KnowledgeBase/ArticleDetailScreen";

// Profile
import ProfileScreen from "./screens/Profile/ProfileScreen";
import EditProfileScreen from "./screens/Profile/EditProfileScreen";
import ChangePasswordScreen from "./screens/Profile/ChangePasswordScreen";
import NotificationsScreen from "./screens/Profile/NotificationsScreen";

// Admin Screens
import UsersScreen from "./screens/Admin/UsersScreen";
import UserDetailScreen from "./screens/Admin/UserDetailScreen";
import CreateUserScreen from "./screens/Admin/CreateUserScreen";
import ReportsScreen from "./screens/Admin/ReportsScreen";
import CategoriesScreen from "./screens/Admin/CategoriesScreen";
import TechniciansScreen from "./screens/Admin/TechniciansScreen";
import TechnicianDetailScreen from "./screens/Admin/TechnicianDetailScreen";
import SLAConfigScreen from "./screens/Admin/SLAConfigScreen";
import TechnicianReportsScreen from "./screens/Admin/TechnicianReportsScreen";
import IncidentReportsScreen from "./screens/Admin/IncidentReportsScreen";
import FeedbackReportsScreen from "./screens/Admin/FeedbackReportsScreen";

// Knowledge Base
import CreateArticleScreen from "./screens/KnowledgeBase/CreateArticleScreen";

// Technician Screens
import TechnicianDashboardScreen from "./screens/Technician/TechnicianDashboardScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isTechnician = user?.role === "technician";

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#666",
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={isTechnician ? TechnicianDashboardScreen : DashboardScreen}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="TicketList"
        component={TicketListScreen}
        options={{
          tabBarLabel: "Tickets",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎫</Text>,
        }}
      />
      <Tab.Screen
        name="KnowledgeBase"
        component={KnowledgeBaseScreen}
        options={{
          tabBarLabel: "Conocimientos",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📚</Text>,
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: "Reportes",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MainTabs"
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CreateTicket"
      component={CreateTicketScreen}
      options={{ title: "Crear Ticket" }}
    />
    <Stack.Screen
      name="TicketDetail"
      component={TicketDetailScreen}
      options={{ title: "Detalle del Ticket" }}
    />
    <Stack.Screen
      name="ArticleDetail"
      component={ArticleDetailScreen}
      options={{ title: "Artículo" }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ title: "Editar Perfil" }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{ title: "Cambiar Contraseña" }}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: "Notificaciones" }}
    />
    <Stack.Screen
      name="Users"
      component={UsersScreen}
      options={{ title: "Gestión de Usuarios" }}
    />
    <Stack.Screen
      name="UserDetail"
      component={UserDetailScreen}
      options={{ title: "Detalle del Usuario" }}
    />
    <Stack.Screen
      name="CreateUser"
      component={CreateUserScreen}
      options={{ title: "Crear Usuario" }}
    />
    <Stack.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{ title: "Gestión de Categorías" }}
    />
    <Stack.Screen
      name="Technicians"
      component={TechniciansScreen}
      options={{ title: "Gestión de Técnicos" }}
    />
    <Stack.Screen
      name="TechnicianDetail"
      component={TechnicianDetailScreen}
      options={{ title: "Detalle del Técnico" }}
    />
    <Stack.Screen
      name="SLAConfig"
      component={SLAConfigScreen}
      options={{ title: "Configuración SLA" }}
    />
    <Stack.Screen
      name="CreateArticle"
      component={CreateArticleScreen}
      options={{ title: "Crear Artículo" }}
    />
    <Stack.Screen
      name="TechnicianReports"
      component={TechnicianReportsScreen}
      options={{ title: "Reportes de Técnicos" }}
    />
    <Stack.Screen
      name="IncidentReports"
      component={IncidentReportsScreen}
      options={{ title: "Reportes de Incidentes" }}
    />
    <Stack.Screen
      name="FeedbackReports"
      component={FeedbackReportsScreen}
      options={{ title: "Reportes de Feedback" }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading, initializing } = useAuth();

  // Mostrar splash screen mientras carga la sesión guardada
  if (loading || initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#2196F3",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 20,
          }}
        >
          Mesa de Servicios
        </Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
