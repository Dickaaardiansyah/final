// Login.jsx - UPDATED to save token
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


import { loginUser, getCurrentUser } from '../../../data/userAuth'; // Updated import

import '../../../styles/login.css'; 

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    terms: false,
  });
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const { email, password, terms } = form;
    setIsValid(email.trim() !== '' && password.trim() !== '' && terms);
  }, [form]);

  // Check jika sudah login, redirect ke home
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userResult = await getCurrentUser();
        if (userResult.success) {
          navigate('/');
        }
      } catch (error) {
        console.log('User not logged in');
      }
    };

    checkLoginStatus();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (error) {
      setError('');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');

    console.log('🔐 Attempting login...');

    // Call login API
    const result = await loginUser({
      email: form.email,
      password: form.password
    });

    console.log('📡 Login result:', result);

    if (result.success) {
      // ✅ Login berhasil
      console.log('✅ Login successful!');
      
      // 🔑 CRITICAL: Save token to localStorage
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        console.log('💾 Token saved to localStorage');
        console.log('🔑 Token preview:', result.accessToken.substring(0, 50) + '...');
      }
      
      // Save user data
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userId', result.user.id);
        console.log('👤 User data saved');
      }
      
      // Show success toast
      setUserName(result.user?.name || form.email);
      setShowSuccessToast(true);
      
      // Trigger custom event untuk update navbar
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: { user: result.user } 
      }));
      
      // Redirect ke home setelah 2.5 detik
      setTimeout(() => {
        console.log('🏠 Redirecting to home...');
        navigate('/');
      }, 2500);
      
    } else {
      // ❌ Login gagal
      console.error('❌ Login failed:', result.message);
      setError(result.message);
      setLoading(false);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <div className="container">
      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="toast-notification">
          <div className="toast-icon-wrapper">
            <div className="toast-icon">
              <i className="fas fa-check"></i>
            </div>
          </div>
          
          <div className="toast-content">
            <h4 className="toast-title">Login Berhasil!</h4>
            <p className="toast-message">
              Selamat datang, <strong>{userName}</strong>
            </p>
          </div>
          
          <button 
            className="toast-close"
            onClick={() => setShowSuccessToast(false)}
            aria-label="Close notification"
          >
            <i className="fas fa-times"></i>
          </button>
          
          {/* Progress Bar */}
          <div className="toast-progress"></div>
        </div>
      )}

      <h1 className="title">Login</h1>

      <form className="form-container" onSubmit={handleSubmit}>
        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            name="email"
            placeholder="Masukkan email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input password-input"
              name="password"
              placeholder="Masukkan password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={toggleShowPassword}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <label className="checkbox-container">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              className="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          <span className="checkbox-text">
            Saya menyetujui{' '}
            <a href="#" onClick={() => alert('Syarat dan Ketentuan')}>
              Syarat dan Ketentuan
            </a>{' '}
            dan{' '}
            <a href="#" onClick={() => alert('Kebijakan Privasi')}>
              Kebijakan Privasi
            </a>{' '}
            FishSnap:AI
          </span>
        </label>

        <button 
          className="login-btn" 
          type="submit"
          disabled={!isValid || loading}
          style={{
            opacity: (!isValid || loading) ? 0.6 : 1,
            cursor: (!isValid || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <span style={{ marginRight: '8px' }}>⏳</span>
              LOGGING IN...
            </>
          ) : (
            'LOGIN'
          )}
        </button>
      </form>

      <p className="register-link">
        Belum Punya akun?{' '}
        <a href="/register" onClick={handleRegisterClick}>
          Register Disini
        </a>
      </p>

    </div>
  );
}

export default Login;