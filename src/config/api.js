// config/api.js
// Alternative solution jika process.env tidak bekerja

const getApiUrl = () => {
  // Try to get from environment variable first
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to window object (jika di-set dari HTML)
  if (typeof window !== 'undefined' && window.REACT_APP_API_URL) {
    return window.REACT_APP_API_URL;
  }
  
  // Development fallback
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Production fallback (sesuaikan dengan domain production)
  return 'https://your-api-domain.com';
};

export const API_BASE_URL = getApiUrl();

// API endpoints
export const API_ENDPOINTS = {
  ADMIN_LOGIN: `${API_BASE_URL}/admin/login`,
  ADMIN_LOGOUT: `${API_BASE_URL}/admin/logout`,
  ADMIN_REFRESH: `${API_BASE_URL}/admin/token`,
  ADMIN_PROFILE: `${API_BASE_URL}/admin/profile`,
};

// Helper function untuk API calls
export const apiCall = async (endpoint, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('adminAccessToken');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  });

  return response;
};