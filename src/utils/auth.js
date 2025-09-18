// utils/auth.js
// ⭐ Centralized authentication utilities untuk konsistensi

export const AUTH_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken', 
  USER: 'user',
  USER_ID: 'userId'
};

// ⭐ Get authentication token
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_KEYS.TOKEN);
};

// ⭐ Get user data
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(AUTH_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// ⭐ Check if user is logged in
export const isLoggedIn = () => {
  const token = getAuthToken();
  const user = getUserData();
  return !!(token && user);
};

// ⭐ Get user ID
export const getUserId = () => {
  const userData = getUserData();
  return userData?.id || localStorage.getItem(AUTH_KEYS.USER_ID);
};

// ⭐ Clear all auth data (logout)
export const clearAuthData = () => {
  localStorage.removeItem(AUTH_KEYS.TOKEN);
  localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_KEYS.USER);
  localStorage.removeItem(AUTH_KEYS.USER_ID);
  
  // Dispatch logout event
  window.dispatchEvent(new Event('userLoggedOut'));
};

// ⭐ Store auth data (login)
export const setAuthData = (token, refreshToken, userData, userId) => {
  localStorage.setItem(AUTH_KEYS.TOKEN, token);
  
  if (refreshToken) {
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  }
  
  if (userData) {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));
  }
  
  if (userId) {
    localStorage.setItem(AUTH_KEYS.USER_ID, userId.toString());
  }
  
  // Dispatch login event
  window.dispatchEvent(new Event('userLoggedIn'));
};

// ⭐ Make authenticated API request
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, requestOptions);
    
    // Handle token expiry
    if (response.status === 401) {
      console.warn('Token expired or invalid, clearing auth data');
      clearAuthData();
      window.location.href = '/login';
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
};

// ⭐ Get auth headers for API requests
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ⭐ Check user permissions for catalog
export const checkCatalogPermission = async (apiBaseUrl = 'http://localhost:5000') => {
  try {
    const response = await makeAuthenticatedRequest(`${apiBaseUrl}/api/catalog/my-status`);
    
    if (!response || !response.ok) {
      return {
        can_access_catalog: false,
        role: 'guest',
        request_status: 'none',
        is_email_verified: false
      };
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error checking catalog permission:', error);
    return {
      can_access_catalog: false,
      role: 'user',
      request_status: 'none',
      is_email_verified: true
    };
  }
};

// ⭐ Request catalog access
export const requestCatalogAccess = async (reason = "Ingin berkontribusi untuk database katalog ikan Indonesia", apiBaseUrl = 'http://localhost:5000') => {
  try {
    const response = await makeAuthenticatedRequest(`${apiBaseUrl}/api/catalog/request-access`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    
    if (!response) return { success: false, message: 'Authentication required' };
    
    const result = await response.json();
    
    if (response.ok) {
      return { success: true, message: result.msg || 'Request berhasil dikirim' };
    } else {
      return { success: false, message: result.msg || 'Gagal mengirim request' };
    }
  } catch (error) {
    console.error('Error requesting catalog access:', error);
    return { success: false, message: 'Gagal mengirim request: ' + error.message };
  }
};