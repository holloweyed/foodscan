import client from './client';
import { ENDPOINTS } from '../constants/api';

export const analysisApi = {
  analyzeImage: async (imageUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'label.jpg',
    });
    const response = await client.post(ENDPOINTS.ANALYZE_LABEL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};