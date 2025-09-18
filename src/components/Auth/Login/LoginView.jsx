// LoginView.jsx
import React from 'react';
import '../../../styles/login.css';

export default function LoginView({
  form = { email: '', password: '', terms: false },
  isValid,
  loading,
  error,
  onChange,
  onSubmit,
  onRegisterClick,
}) {
  return (
    <div className="container">
      <h1 className="title">Login</h1>

      <form className="form-container" onSubmit={onSubmit}>
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
            onChange={onChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            name="password"
            placeholder="Masukkan password"
            value={form.password}
            onChange={onChange}
            disabled={loading}
            required
          />
        </div>

        <label className="checkbox-container">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              className="checkbox"
              name="terms"
              checked={form.terms}
              onChange={onChange}
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
        <a href="/register" onClick={onRegisterClick}>
          Register Disini
        </a>
      </p>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Demo Account:</strong><br />
        Email: maulana@example.com<br />
        Password: password123
      </div>
    </div>
  );
}
