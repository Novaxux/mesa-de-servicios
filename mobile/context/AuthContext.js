import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { setAuthToken } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        
        setAuthToken(newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, data: response.data };
      }
      
      return { success: false, message: response.message || 'Error en el login' };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar usuario';
      return { success: false, message };
    }
  };

  const logout = async () => {
    // Limpiar token en memoria
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Limpiar cualquier token que pueda estar en AsyncStorage (por si acaso)
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  const updateUser = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        return { success: true, data: updatedUser };
      }
      return { success: false, message: response.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      return { success: false, message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

