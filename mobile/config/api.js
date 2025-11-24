// Configuración de la API
export const API_BASE_URL = __DEV__
  ? 'https://pk0vqk3x-3000.usw3.devtunnels.ms' // Desarrollo local
  : 'https://your-api-domain.com/api'; // Producción

// Para Android emulador usar: http://10.0.2.2:3000/api
// Para iOS simulador usar: http://localhost:3000/api
// Para dispositivo físico usar la IP de tu máquina: http://192.168.x.x:3000/api

export default {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
};

