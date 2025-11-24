import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StatusBar } from 'expo-status-bar';

// Auth Screens
import LoginScreen from './screens/Auth/LoginScreen';
import RegisterScreen from './screens/Auth/RegisterScreen';
import ForgotPasswordScreen from './screens/Auth/ForgotPasswordScreen';

// Dashboard
import DashboardScreen from './screens/Dashboard/DashboardScreen';

// Ticket Screens
import TicketListScreen from './screens/Tickets/TicketListScreen';
import CreateTicketScreen from './screens/Tickets/CreateTicketScreen';
import TicketDetailScreen from './screens/Tickets/TicketDetailScreen';

// Knowledge Base
import KnowledgeBaseScreen from './screens/KnowledgeBase/KnowledgeBaseScreen';
import ArticleDetailScreen from './screens/KnowledgeBase/ArticleDetailScreen';

// Profile
import ProfileScreen from './screens/Profile/ProfileScreen';
import EditProfileScreen from './screens/Profile/EditProfileScreen';
import ChangePasswordScreen from './screens/Profile/ChangePasswordScreen';
import NotificationsScreen from './screens/Profile/NotificationsScreen';

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

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="TicketList"
        component={TicketListScreen}
        options={{
          tabBarLabel: 'Tickets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎫</Text>,
        }}
      />
      <Tab.Screen
        name="KnowledgeBase"
        component={KnowledgeBaseScreen}
        options={{
          tabBarLabel: 'Base de Conocimientos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
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
      options={{ title: 'Crear Ticket' }}
    />
    <Stack.Screen
      name="TicketDetail"
      component={TicketDetailScreen}
      options={{ title: 'Detalle del Ticket' }}
    />
    <Stack.Screen
      name="ArticleDetail"
      component={ArticleDetailScreen}
      options={{ title: 'Artículo' }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ title: 'Editar Perfil' }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{ title: 'Cambiar Contraseña' }}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Notificaciones' }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // O un componente de carga
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
