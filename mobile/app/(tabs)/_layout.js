import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          tabBarLabel: 'Tickets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎫</Text>,
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          tabBarLabel: 'Conocimientos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📚</Text>,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="reports"
          options={{
            tabBarLabel: 'Reportes',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
