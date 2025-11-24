# Guía de Instalación - Aplicación Móvil

## Requisitos Previos

1. **Node.js** (versión 18 o superior)
2. **npm** o **yarn**
3. **Expo CLI** (se instala automáticamente con npm install)
4. **Backend corriendo** en `http://localhost:3000` o la IP de tu máquina

## Instalación Paso a Paso

### 1. Instalar Dependencias

```bash
cd mobile
npm install
```

### 2. Configurar URL de la API

Edita el archivo `config/api.js` y configura la URL base de tu API:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://TU_IP:3000/api'  // Cambia TU_IP por tu IP local
  : 'https://tu-api-produccion.com/api';
```

**Importante:**

- **Android Emulador**: Usa `http://10.0.2.2:3000/api`
- **iOS Simulador**: Usa `http://localhost:3000/api`
- **Dispositivo Físico**: Usa la IP de tu máquina (ej: `http://192.168.1.100:3000/api`)

Para encontrar tu IP:

- Windows: `ipconfig` en CMD
- Mac/Linux: `ifconfig` o `ip addr`

### 3. Iniciar la Aplicación

```bash
npm start
```

Esto abrirá Expo DevTools en tu navegador. Luego:

- Presiona `a` para abrir en Android Emulador
- Presiona `i` para abrir en iOS Simulador
- Escanea el código QR con la app Expo Go en tu dispositivo físico

## Desarrollo

### Hot Reload

La aplicación tiene hot reload activado por defecto. Los cambios se reflejan automáticamente.

### Estructura de Carpetas

``` bash
mobile/
├── screens/          # Pantallas de la app
│   ├── Auth/         # Login, Registro, Recuperar contraseña
│   ├── Dashboard/    # Panel principal
│   ├── Tickets/      # Gestión de tickets
│   ├── KnowledgeBase/# Base de conocimientos
│   └── Profile/      # Perfil de usuario
├── services/         # Servicios API
├── context/          # Context API (Autenticación)
├── config/           # Configuración
└── components/       # Componentes reutilizables
```

## Solución de Problemas

### Error: "Network request failed"

**Causa**: La app no puede conectarse al backend.

**Solución**:

1. Verifica que el backend esté corriendo
2. Verifica la URL en `config/api.js`
3. Para dispositivo físico, asegúrate de usar la IP correcta
4. Verifica que el dispositivo y la computadora estén en la misma red

### Error: "Module not found"

**Solución**:
```bash
rm -rf node_modules
npm install
```

### Error al iniciar Expo

**Solución**:
```bash
npm install -g expo-cli
expo start --clear
```

### La app no se conecta al backend en Android Emulador

**Solución**: Usa `http://10.0.2.2:3000/api` en lugar de `localhost`

## Build para Producción

### Android APK

```bash
expo build:android
```

### iOS

```bash
expo build:ios
```

## Credenciales de Prueba

Después de inicializar el backend con `npm run init-admin`:

- **Email**: `admin@mesaservicios.com`
- **Password**: `Admin123!`

## Próximos Pasos

1. Configura la URL de la API
2. Asegúrate de que el backend esté corriendo
3. Inicia la aplicación con `npm start`
4. Prueba el login con las credenciales de administrador
