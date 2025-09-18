import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, apiCall } from '../../../config/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminInfo, setAdminInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null); // Store in memory only

  // Token refresh timer
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Setup automatic token refresh
  const setupTokenRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    // Refresh token every 14 minutes (access token expires in 15 minutes)
    const timer = setInterval(async () => {
      try {
        console.log('🔄 Auto-refreshing token...');
        await refreshAccessToken();
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
        // If refresh fails, logout user
        logout();
      }
    }, 14 * 60 * 1000); // 14 minutes

    setRefreshTimer(timer);
  }, [refreshTimer]);

  // Refresh access token using httpOnly refresh token cookie
  const refreshAccessToken = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/token', {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update access token in memory only
        setAccessToken(result.accessToken);
        
        // If admin info is not available, fetch it
        if (!adminInfo && result.admin) {
          setAdminInfo(result.admin);
        }
        
        setIsAuthenticated(true);
        console.log('✅ Token refreshed successfully');
        return result.accessToken;
      } else {
        const errorData = await response.json();
        if (errorData.needLogin) {
          throw new Error('Need to login again');
        }
        throw new Error(errorData.msg || 'Refresh token invalid');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  };

  // Get current access token (with auto-refresh if needed)
  const getValidAccessToken = async () => {
    if (!accessToken) {
      // Try to get new token using refresh token
      try {
        return await refreshAccessToken();
      } catch (error) {
        throw new Error('No valid access token available');
      }
    }
    return accessToken;
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Cleanup timer on unmount
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

  // Handle page visibility change (auto-refresh when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Page became visible, refresh token to ensure it's still valid
        refreshAccessToken().catch(() => {
          console.log('🔄 Token refresh on focus failed, logging out');
          logout();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Handle beforeunload (clear any sensitive data when page unloads)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear access token from memory when page unloads
      setAccessToken(null);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // Don't check localStorage, only try refresh token
      const response = await apiCall(API_ENDPOINTS.ADMIN_REFRESH, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        
        // Set access token in memory
        setAccessToken(result.accessToken);
        
        // Set admin info
        if (result.admin) {
          setAdminInfo(result.admin);
        }
        
        setIsAuthenticated(true);
        
        // Setup automatic token refresh
        setupTokenRefresh();
        
        console.log('✅ Authentication verified');
      } else {
        // No valid refresh token, user needs to login
        setIsAuthenticated(false);
        setAdminInfo(null);
        setAccessToken(null);
        console.log('❌ No valid refresh token found');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setAdminInfo(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token, adminData) => {
    // Store access token in memory only
    setAccessToken(token);
    setAdminInfo(adminData);
    setIsAuthenticated(true);
    
    // Setup automatic token refresh
    setupTokenRefresh();
    
    // Don't store anything in localStorage
    console.log('✅ Admin logged in:', adminData.name);
  };

  const logout = async () => {
    try {
      // Clear refresh timer
      if (refreshTimer) {
        clearInterval(refreshTimer);
        setRefreshTimer(null);
      }

      // Call logout API to clear httpOnly refresh token cookie
      await apiCall(API_ENDPOINTS.ADMIN_LOGOUT, { 
        method: 'DELETE',
        credentials: 'include'
      });
      
      console.log('✅ Logout API called successfully');
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      // Always clear local state
      setAccessToken(null);
      setAdminInfo(null);
      setIsAuthenticated(false);
      
      // Clear any localStorage items that might exist (cleanup)
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminInfo');
      localStorage.removeItem('adminToken');
      
      console.log('✅ Admin logged out and state cleared');
    }
  };

  // Provide access token for API calls
  const getAuthHeader = async () => {
    try {
      const token = await getValidAccessToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('❌ Failed to get auth header:', error);
      // Token invalid, logout user
      logout();
      throw error;
    }
  };

  const value = {
    adminInfo,
    isAuthenticated,
    isLoading,
    accessToken,
    login,
    logout,
    checkAuthStatus,
    refreshAccessToken,
    getValidAccessToken,
    getAuthHeader
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};