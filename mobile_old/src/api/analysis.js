// mobile/src/api/analysis.js
import apiClient from './client';
import { ENDPOINTS } from '../constants/api';

export const analysisApi = {
  analyzeImage: async (imageUri) => {
    try {
      const result = await apiClient.uploadFile(
        ENDPOINTS.ANALYZE_LABEL,
        imageUri,
        `label_${Date.now()}.jpg`
      );
      
      return result;
    } catch (error) {
      console.error('Analysis failed:', error);
      
      if (error.status === 413) {
        throw new Error('Image is too large. Please choose a smaller image.');
      }
      
      if (error.status === 415) {
        throw new Error('Unsupported image format. Please use JPEG or PNG.');
      }
      
      if (error.status === 422) {
        throw new Error('Could not recognize text. Please take a clearer photo.');
      }
      
      throw new Error('Failed to analyze image. Please try again.');
    }
  },

  getAdditiveInfo: async (eCode) => {
    try {
      const result = await apiClient.get(ENDPOINTS.GET_ADDITIVE(eCode));
      return result;
    } catch (error) {
      console.error('Failed to get additive info:', error);
      throw error;
    }
  },

  searchAdditives: async (query, limit = 10) => {
    try {
      const result = await apiClient.get(ENDPOINTS.SEARCH_ADDITIVES, {
        q: query,
        limit,
      });
      return result;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },
};