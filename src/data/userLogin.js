import CONFIG from '../config/config';

const ENDPOINTS = {
  USER_LOGIN: `${CONFIG.BASE_URL}/login`,
  USER_PROFILE: `${CONFIG.BASE_URL}/users`,
};

// Login User Function - Cookie-based authentication
export async function loginUser({ email, password }) {
  try {
    console.log('Attempting login with:', { email });

    const response = await fetch(ENDPOINTS.USER_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies in request
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log('Login response status:', response.status);

    const data = await response.json();
    console.log('Login response data:', data);

    if (response.ok && data.accessToken) {
      // Login berhasil
      console.log('Login successful!');
      
      // Store access token in memory only (you can use a global state management like Redux/Context)
      // For now, we'll store it temporarily in a module variable or return it to be handled by the component
      
      return {
        success: true,
        accessToken: data.accessToken,
        user: data.user,
        message: data.msg || 'Login berhasil!'
      };

    } else {
      // Login gagal
      return {
        success: false,
        message: data.msg || data.message || 'Login gagal'
      };
    }

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle different types of errors
    let errorMessage;
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorMessage = 'Gagal terhubung ke server. Pastikan server berjalan di localhost:5000';
    } else if (error.message.includes('401') || error.message.includes('Wrong')) {
      errorMessage = 'Email atau password salah';
    } else if (error.message.includes('404') || error.message.includes('User not found')) {
      errorMessage = 'Email tidak terdaftar';
    } else {
      errorMessage = error.message || 'Terjadi kesalahan saat login';
    }

    return {
      success: false,
      message: errorMessage
    };
  }
}

// Function to get current user profile (using cookies for auth)
export async function getCurrentUser() {
  try {
    const response = await fetch(ENDPOINTS.USER_PROFILE, {
      method: 'GET',
      credentials: 'include', // Include cookies
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
    console.error('Get user error:', error);
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
      credentials: 'include', // Include cookies
    });

    return {
      success: response.ok,
      message: response.ok ? 'Logout successful' : 'Logout failed'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'Network error during logout'
    };
  }
}