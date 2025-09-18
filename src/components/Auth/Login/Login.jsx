import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../../../data/userLogin'; // Import API function
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
  const [showPassword, setShowPassword] = useState(false); // State untuk show/hide password

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
          navigate('/'); // Redirect ke home jika sudah login
        }
      } catch (error) {
        // User not logged in, stay on login page
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
    
    // Clear error saat user mengetik
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

    // Gunakan API function yang sudah rapi
    const result = await loginUser({
      email: form.email,
      password: form.password
    });

    if (result.success) {
      // Login berhasil
      alert(`Login berhasil! Selamat datang ${result.user?.name || form.email}`);
      
      // Trigger custom event untuk update navbar
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: { user: result.user } 
      }));
      
      // Redirect ke home
      navigate('/');
      
    } else {
      // Login gagal
      setError(result.message);
    }

    setLoading(false);
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <div className="container">
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