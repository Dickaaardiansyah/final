// data/userLogin.js - FIXED VERSION
import CONFIG from '../config/config';

const ENDPOINTS = {
  USER_LOGIN: `${CONFIG.BASE_URL}/login`,
  USER_PROFILE: `${CONFIG.BASE_URL}/users`,
};

// Login User Function - FIXED
export async function loginUser({ email, password }) {
  try {
    console.log('🔐 Attempting login with:', { email });

    const response = await fetch(ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log('📡 Login response status:', response.status);

    const data = await response.json();
    console.log('📦 Login response data:', data);

    if (response.ok && data.accessToken) {
      // ✅ Login berhasil - SAVE TOKEN
      console.log('✅ Login successful!');
      
      // 🔑 Save access token
      localStorage.setItem('accessToken', data.accessToken);
      console.log('💾 Token saved to localStorage');
      
      // Save user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        console.log('👤 User data saved:', data.user.name);
      }
      
      return {
        success: true,
        accessToken: data.accessToken,
        user: data.user,
        message: data.msg || 'Login berhasil!'
      };

    } else {
      // ❌ Login gagal
      console.error('❌ Login failed:', data.msg);
      return {
        success: false,
        message: data.msg || data.message || 'Login gagal'
      };
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    
    let errorMessage;
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorMessage = 'Gagal terhubung ke server. Pastikan server berjalan di localhost:5000';
    } else {
      errorMessage = error.message || 'Terjadi kesalahan saat login';
    }

    return {
      success: false,
      message: errorMessage
    };
  }
}

// Function to get current user profile
export async function getCurrentUser() {
  try {
    const token = localStorage.getItem('accessToken');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Request with token');
    }

    const response = await fetch(ENDPOINTS.USER_PROFILE, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    if (response.ok) {
      const userData = await response.json();
      return {
        success: true,
        user: userData
      };
    } else {
      return {
        success: false,
        message: 'Failed to get user profile'
      };
    }
  } catch (error) {
    console.error('❌ Get user error:', error);
    return {
      success: false,
      message: 'Network error'
    };
  }
}

// Function to logout user
export async function logoutUser() {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/logout`, {
      method: 'DELETE',
      credentials: 'include',
    });

    // 🗑️ Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    
    console.log('🚪 Logged out - tokens cleared');

    return {
      success: response.ok,
      message: response.ok ? 'Logout successful' : 'Logout failed'
    };
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Clear tokens anyway
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    
    return {
      success: false,
      message: 'Network error during logout'
    };
  }
}

// Helper function to check if logged in
export function isLoggedIn() {
  const token = localStorage.getItem('accessToken');
  return !!token;
}

// Helper function to get token
export function getToken() {
  return localStorage.getItem('accessToken');
}