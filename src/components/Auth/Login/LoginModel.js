// LoginModel.js - FIXED VERSION
export default class LoginModel {
  constructor() {
    this.API_BASE_URL = 'http://localhost:5000';
  }

  async login(email, password) {
    const response = await fetch(`${this.API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Include cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || data.message || 'Login gagal');
    }
    return data;
  }

  saveAuthData(data) {
    // ✅ CRITICAL FIX: Use 'accessToken' as key (not 'token')
    localStorage.setItem('accessToken', data.accessToken); // ← Changed from 'token'
    
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user.id);
    }

    console.log('✅ Token saved to localStorage as "accessToken"');
    console.log('🔑 Token preview:', data.accessToken.substring(0, 50) + '...');
  }

  isLoggedIn() {
    // ✅ Check for 'accessToken' (not 'token')
    const token = localStorage.getItem('accessToken');
    const hasToken = !!token;
    
    console.log('🔐 Login status check:', hasToken ? 'Logged in' : 'Not logged in');
    
    return hasToken;
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    console.log('🚪 Logged out - all tokens cleared');
  }
}