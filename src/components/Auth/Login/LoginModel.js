// LoginModel.js
export default class LoginModel {
  constructor() {
    this.API_BASE_URL = 'http://localhost:5000';
  }

  async login(email, password) {
    const response = await fetch(`${this.API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || data.message || 'Login gagal');
    }
    return data;
  }

  saveAuthData(data) {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user.id);
    }
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }
}
