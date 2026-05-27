// mobile/src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (__DEV__) {
          console.log(`Request: ${config.method.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      async (error) => {
        if (error.response) {
          const { status, data } = error.response;
          
          if (status === 401) {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('userData');
          }
          
          const message = data?.detail || data?.message || 'Network error occurred';
          return Promise.reject({ status, message, data });
        }
        
        if (error.code === 'ECONNABORTED') {
          return Promise.reject({
            status: 408,
            message: 'Request timeout. Please check your connection.',
          });
        }
        
        return Promise.reject({
          status: 0,
          message: 'Network error. Please check your internet connection.',
        });
      }
    );
  }

  async get(url, params = {}) {
    return this.client.get(url, { params });
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  async uploadFile(url, fileUri, fileName = 'image.jpg') {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: fileName,
    });

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percent}%`);
        }
      },
    });
  }
}

export default new ApiClient();