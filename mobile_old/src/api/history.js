// mobile/src/api/history.js
import apiClient from './client';
import { ENDPOINTS } from '../constants/api';

export const historyApi = {
  getHistory: async (page = 1, pageSize = 20) => {
    try {
      const result = await apiClient.get(ENDPOINTS.GET_HISTORY, {
        page,
        page_size: pageSize,
      });
      return result;
    } catch (error) {
      console.error('Failed to get history:', error);
      return { total: 0, items: [], page: 1, page_size: pageSize };
    }
  },

  getScanDetail: async (scanId) => {
    try {
      const result = await apiClient.get(ENDPOINTS.GET_SCAN_DETAIL(scanId));
      return result;
    } catch (error) {
      console.error('Failed to get scan detail:', error);
      throw error;
    }
  },

  deleteScan: async (scanId) => {
    try {
      const result = await apiClient.delete(ENDPOINTS.DELETE_SCAN(scanId));
      return result;
    } catch (error) {
      console.error('Failed to delete scan:', error);
      throw error;
    }
  },

  getScanStats: async () => {
    try {
      const result = await apiClient.get(ENDPOINTS.GET_SCAN_STATS);
      return result;
    } catch (error) {
      console.error('Failed to get scan stats:', error);
      return {
        total_scans: 0,
        average_scan_time_ms: 0,
        popular_additives: [],
      };
    }
  },
};