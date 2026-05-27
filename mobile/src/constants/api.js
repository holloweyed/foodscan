// mobile/src/constants/api.js
const DEV_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://api.foodscan.app';

const getApiUrl = () => {
  if (__DEV__) {
    return DEV_API_URL;
  }
  return PROD_API_URL;
};

export const API_URL = getApiUrl();

export const ENDPOINTS = {
  ANALYZE_LABEL: '/api/v1/analyze/label',
  GET_ADDITIVE: (eCode) => `/api/v1/additives/${eCode}`,
  SEARCH_ADDITIVES: '/api/v1/additives/search',
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  VERIFY_TOKEN: '/api/v1/auth/verify',
  GET_PROFILE: '/api/v1/auth/me',
  GET_HISTORY: '/api/v1/history',
  GET_SCAN_DETAIL: (scanId) => `/api/v1/history/${scanId}`,
  DELETE_SCAN: (scanId) => `/api/v1/history/${scanId}`,
  GET_SCAN_STATS: '/api/v1/history/stats/summary',
};

export const MAX_IMAGE_SIZE_MB = 10;
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp'];