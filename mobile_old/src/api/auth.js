// mobile/src/api/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { ENDPOINTS } from '../constants/api';

export const authApi = {
  login: async (username, password) => {
    try {
      const result = await apiClient.post(ENDPOINTS.LOGIN, {
        username,
        password,
      });
      
      if (result.access_token) {
        await AsyncStorage.setItem('accessToken', result.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
      }
      
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      
      if (error.status === 401) {
        throw new Error('Invalid username or password');
      }
      
      throw new Error('Login failed. Please try again.');
    }
  },

  register: async (email, username, password) => {
    try {
      const result = await apiClient.post(ENDPOINTS.REGISTER, {
        email,
        username,
        password,
      });
      
      if (result.access_token) {
        await AsyncStorage.setItem('accessToken', result.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
      }
      
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error.status === 409) {
        throw new Error('User with this email or username already exists');
      }
      
      throw new Error('Registration failed. Please try again.');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('userData');
  },

  getProfile: async () => {
    try {
      const result = await apiClient.get(ENDPOINTS.GET_PROFILE);
      return result;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const result = await apiClient.get(ENDPOINTS.VERIFY_TOKEN);
      return result.valid === true;
    } catch (error) {
      return false;
    }
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      return false;
    }
    
    return authApi.verifyToken();
  },
};