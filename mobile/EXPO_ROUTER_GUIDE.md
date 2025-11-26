# Guía de Migración a Expo Router

## ✅ Completado

1. **Instalación de Expo Router**

   - `expo-router` instalado
   - Dependencias necesarias agregadas

2. **Estructura de carpetas `app/`**

   - `/app/_layout.js` - Layout raíz con AuthProvider
   - `/app/(auth)/` - Rutas de autenticación (login, register, forgot-password)
   - `/app/(tabs)/` - Rutas con tabs (index, tickets, knowledge, reports, profile)
   - Rutas individuales para modales y pantallas adicionales

3. **Configuración**
   - `package.json`: `main` cambiado a `"expo-router/entry"`
   - `App.js`: Simplificado para exportar entry point de expo-router

## 🔄 Cambios de Navegación

### Antes (React Navigation)

```javascript
import { useNavigation } from "@react-navigation/native";

const Component = ({ navigation }) => {
  // O usando hook
  const navigation = useNavigation();

  navigation.navigate("ScreenName", { param: value });
  navigation.goBack();
};
```

### Ahora (Expo Router)

```javascript
import { useRouter, useLocalSearchParams } from "expo-router";

const Component = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Para obtener parámetros

  router.push("/screen-name"); // o router.push({ pathname: '/screen-name', params: { param: value } })
  router.back();
};
```

## 📋 Mapeo de Rutas

| Antigua Ruta (React Navigation)                       | Nueva Ruta (Expo Router)                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `navigation.navigate('Login')`                        | `router.replace('/(auth)/login')`                                     |
| `navigation.navigate('Register')`                     | `router.push('/(auth)/register')`                                     |
| `navigation.navigate('ForgotPassword')`               | `router.push('/(auth)/forgot-password')`                              |
| `navigation.navigate('Dashboard')`                    | `router.push('/(tabs)')`                                              |
| `navigation.navigate('TicketList')`                   | `router.push('/(tabs)/tickets')`                                      |
| `navigation.navigate('CreateTicket')`                 | `router.push('/create-ticket')`                                       |
| `navigation.navigate('TicketDetail', { ticketId })`   | `router.push({ pathname: '/ticket-detail', params: { ticketId } })`   |
| `navigation.navigate('CreateFeedback', { params })`   | `router.push({ pathname: '/create-feedback', params })`               |
| `navigation.navigate('KnowledgeBase')`                | `router.push('/(tabs)/knowledge')`                                    |
| `navigation.navigate('ArticleDetail', { articleId })` | `router.push({ pathname: '/article-detail', params: { articleId } })` |
| `navigation.navigate('CreateArticle')`                | `router.push('/create-article')`                                      |
| `navigation.navigate('Profile')`                      | `router.push('/(tabs)/profile')`                                      |
| `navigation.navigate('EditProfile')`                  | `router.push('/edit-profile')`                                        |
| `navigation.navigate('ChangePassword')`               | `router.push('/change-password')`                                     |
| `navigation.navigate('Notifications')`                | `router.push('/notifications')`                                       |
| `navigation.navigate('Users')`                        | `router.push('/users')`                                               |
| `navigation.navigate('UserDetail', { userId })`       | `router.push({ pathname: '/user-detail', params: { userId } })`       |
| `navigation.navigate('CreateUser')`                   | `router.push('/create-user')`                                         |
| `navigation.navigate('Categories')`                   | `router.push('/categories')`                                          |
| `navigation.navigate('Departments')`                  | `router.push('/departments')`                                         |
| `navigation.navigate('Technicians')`                  | `router.push('/technicians')`                                         |
| `navigation.navigate('TechnicianDetail', { id })`     | `router.push({ pathname: '/technician-detail', params: { id } })`     |
| `navigation.navigate('SLAConfig')`                    | `router.push('/sla-config')`                                          |
| `navigation.navigate('TechnicianReports')`            | `router.push('/technician-reports')`                                  |
| `navigation.navigate('IncidentReports')`              | `router.push('/incident-reports')`                                    |
| `navigation.navigate('FeedbackReports')`              | `router.push('/feedback-reports')`                                    |
| `navigation.navigate('MyFeedback')`                   | `router.push('/my-feedback')`                                         |
| `navigation.goBack()`                                 | `router.back()`                                                       |

## 🚀 Pasos para completar la migración

### Actualizar cada pantalla:

1. **Eliminar props de navigation**:

   ```javascript
   // Antes
   const ScreenName = ({ navigation, route }) => {

   // Después
   const ScreenName = () => {
   ```

2. **Importar hooks de Expo Router**:

   ```javascript
   import { useRouter, useLocalSearchParams } from "expo-router";
   ```

3. **Reemplazar llamadas de navegación**:

   - `navigation.navigate()` → `router.push()`
   - `navigation.goBack()` → `router.back()`
   - `navigation.replace()` → `router.replace()`
   - `route.params` → `useLocalSearchParams()`

4. **Actualizar listeners**:

   ```javascript
   // Antes
   navigation.addListener('focus', () => { ... })

   // Después (usar useFocusEffect de expo-router)
   import { useFocusEffect } from 'expo-router';

   useFocusEffect(
     React.useCallback(() => {
       // código
     }, [])
   );
   ```

## 🎯 Próximos pasos

1. Actualizar todas las pantallas para usar hooks de Expo Router
2. Probar navegación en cada pantalla
3. Verificar paso de parámetros entre rutas
4. Eliminar dependencias de React Navigation si ya no se usan
