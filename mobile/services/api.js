import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";

// Variable global para almacenar el token en memoria
let authToken = null;

// Callback para manejar logout desde el interceptor
let onLogoutCallback = null;

// Función para establecer el token
export const setAuthToken = (token) => {
  authToken = token;
};

// Función para obtener el token
export const getAuthToken = () => {
  return authToken;
};

// Función para registrar callback de logout
export const setLogoutCallback = (callback) => {
  onLogoutCallback = callback;
};

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      authToken = null;

      // Limpiar AsyncStorage
      try {
        await AsyncStorage.multiRemove(["@auth_token", "@auth_user"]);
      } catch (storageError) {
        console.error("Error clearing storage on 401:", storageError);
      }

      // Ejecutar callback de logout si existe
      if (onLogoutCallback) {
        onLogoutCallback();
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de Autenticación
export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },
};

// Servicios de Tickets
export const ticketService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/tickets?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticketData) => {
    const response = await api.post("/tickets", ticketData);
    return response.data;
  },

  update: async (id, ticketData) => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  addComment: async (ticketId, comment, isInternal = false) => {
    const response = await api.post(`/tickets/${ticketId}/comments`, {
      comment,
      is_internal: isInternal,
    });
    return response.data;
  },

  uploadAttachment: async (ticketId, file) => {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.type || "image/jpeg",
      name: file.name || "attachment.jpg",
    });
    formData.append("ticket_id", ticketId.toString());

    const response = await api.post(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getStatistics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/tickets/statistics?${params.toString()}`);
    return response.data;
  },
};

// Servicios de Técnicos
export const technicianService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined) params.append(key, filters[key]);
    });
    const response = await api.get(`/technicians?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/technicians/${id}`);
    return response.data;
  },

  create: async (technicianData) => {
    const response = await api.post("/technicians", technicianData);
    return response.data;
  },

  update: async (id, technicianData) => {
    const response = await api.put(`/technicians/${id}`, technicianData);
    return response.data;
  },

  getWorkload: async (id) => {
    const response = await api.get(`/technicians/${id}/workload`);
    return response.data;
  },

  getPerformance: async (id, dateFrom, dateTo) => {
    const response = await api.get(`/technicians/${id}/performance`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  getMyTickets: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(
      `/technicians/me/tickets?${params.toString()}`
    );
    return response.data;
  },
};

// Servicios de Base de Conocimientos
export const knowledgeBaseService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/knowledge-base?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/knowledge-base/${id}`);
    return response.data;
  },

  create: async (articleData) => {
    const response = await api.post("/knowledge-base", articleData);
    return response.data;
  },

  update: async (id, articleData) => {
    const response = await api.put(`/knowledge-base/${id}`, articleData);
    return response.data;
  },

  markHelpful: async (id) => {
    const response = await api.post(`/knowledge-base/${id}/helpful`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/knowledge-base/${id}`);
    return response.data;
  },
};

// Servicios de Feedback
export const feedbackService = {
  create: async (feedbackData) => {
    const response = await api.post("/feedback", feedbackData);
    return response.data;
  },

  getByTicket: async (ticketId) => {
    const response = await api.get(`/feedback/ticket/${ticketId}`);
    return response.data;
  },

  getByTechnician: async (technicianId, filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(
      `/feedback/technician/${technicianId}?${params.toString()}`
    );
    return response.data;
  },

  getStatistics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/feedback/statistics?${params.toString()}`);
    return response.data;
  },

  getTechnicianFeedback: async (technicianId) => {
    const response = await api.get(`/feedback/technician/${technicianId}`);
    return response.data;
  },
};

// Servicios de Reportes
export const reportService = {
  getTicketReport: async (dateFrom, dateTo) => {
    const response = await api.get("/reports/tickets", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  getSLAReport: async (dateFrom, dateTo) => {
    const response = await api.get("/reports/sla", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  getTechnicianReport: async (dateFrom, dateTo) => {
    const response = await api.get("/reports/technicians", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  getIncidentReport: async (dateFrom, dateTo) => {
    const response = await api.get("/reports/incidents", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  getTechnicianStats: async () => {
    const response = await api.get("/reports/technician-stats");
    return response.data;
  },

  getIncidentReports: async () => {
    const response = await api.get("/reports/incident-reports");
    return response.data;
  },

  getFeedbackReports: async () => {
    const response = await api.get("/reports/feedback-reports");
    return response.data;
  },

  // Exportación CSV
  exportTicketsCSV: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    return `${API_BASE_URL}/reports/export/tickets/csv?${params.toString()}`;
  },

  exportSLACSV: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    return `${API_BASE_URL}/reports/export/sla/csv?${params.toString()}`;
  },

  exportTechniciansCSV: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    return `${API_BASE_URL}/reports/export/technicians/csv?${params.toString()}`;
  },

  exportIncidentsCSV: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    return `${API_BASE_URL}/reports/export/incidents/csv?${params.toString()}`;
  },

  exportFeedbackCSV: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    return `${API_BASE_URL}/reports/export/feedback/csv?${params.toString()}`;
  },
};

// Servicios de SLA
export const slaService = {
  getConfig: async () => {
    const response = await api.get("/sla/config");
    return response.data;
  },

  updateConfig: async (configData) => {
    const response = await api.put("/sla/config", configData);
    return response.data;
  },

  checkSLA: async () => {
    const response = await api.get("/sla/check");
    return response.data;
  },

  getCompliance: async (dateFrom, dateTo) => {
    const response = await api.get("/sla/compliance", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },
};

// Servicios de Notificaciones
export const notificationService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined) params.append(key, filters[key]);
    });
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// Servicios de Categorías
export const categoryService = {
  getAll: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (categoryData) => {
    const response = await api.post("/categories", categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Servicios de Usuarios
export const userService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default api;
