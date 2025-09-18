import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Demo credentials untuk testing
  const DEMO_CREDENTIALS = {
    email: 'superadmin@fishmap.com',
    password: 'password123'
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show loading if auth is being checked
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #0891b2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{
            color: '#64748b',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Memeriksa status login...
          </span>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // API call ke backend dengan fetch langsung
      const response = await fetch('http://localhost:5000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important: Include cookies for refresh token
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Login berhasil
        setSuccessMessage('Login berhasil! Mengalihkan ke dashboard...');
        
        // Use AuthContext login method - hanya kirim access token dan admin data
        // Refresh token sudah disimpan sebagai httpOnly cookie oleh server
        await login(result.accessToken, result.admin);
        
        console.log('Admin logged in:', result.admin.name);

        // Redirect ke dashboard setelah delay singkat
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/admin/dashboard';
          navigate(from, { replace: true });
        }, 1000);

      } else {
        // Login gagal
        setErrorMessage(result.msg || 'Login gagal. Silakan periksa kembali kredensial Anda.');
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Fitur lupa password akan segera tersedia. Hubungi administrator untuk reset password.');
  };

  const fillDemoCredentials = () => {
    setFormData(DEMO_CREDENTIALS);
  };

  const inputStyles = {
    base: {
      width: '100%',
      padding: '16px 50px 16px 20px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '16px',
      background: '#ffffff',
      transition: 'all 0.2s ease',
      outline: 'none',
      boxSizing: 'border-box'
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative'
    }}>
      {/* Background shapes */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '80px',
        height: '80px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '70%',
        right: '10%',
        width: '120px',
        height: '120px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        animation: 'float 6s ease-in-out infinite 2s'
      }} />

      <div className="login-container" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '440px',
        padding: '48px 40px',
        position: 'relative',
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease'
      }}>
        {/* Demo credentials hint */}
        <div style={{
          position: 'absolute',
          top: '-70px',
          right: '0',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '200px',
          zIndex: 10,
          cursor: 'pointer'
        }} onClick={fillDemoCredentials}>
          <strong>Demo Login:</strong><br />
          Email: superadmin@fishmap.com<br />
          Password: password123
          <br />
          <small style={{color: '#94a3b8'}}>Click untuk auto-fill</small>
        </div>

        <div className="logo-section" style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div className="logo" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{
                width: '48px',
                height: '48px',
                color: '#0891b2',
                marginRight: '12px',
                filter: 'drop-shadow(0 4px 6px rgba(8, 145, 178, 0.2))'
              }}
            >
              <path d="M12 2c5.4 0 10 4.6 10 10 0 5.4-4.6 10-10 10S2 17.4 2 12 6.6 2 12 2zm-1 17.93c3.94-.49 7-3.85 7-7.93 0-.62-.08-1.21-.21-1.79L9 10v1c0 1.1-.9 2-2 2s-2-.9-2-2V9c0-1.1.9-2 2-2s2 .9 2 2v.17l8.79-.21C17.21 8.34 16.62 8.26 16 8.26c-4.08 0-7.44 3.06-7.93 7H9c-.55 0-1 .45-1 1s.45 1 1 1h-.93z"/>
            </svg>
          </div>
          <div className="welcome-text">
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 8px 0'
            }}>FishMap Admin</h1>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              fontWeight: '500',
              margin: '0 0 8px 0'
            }}>Sistem Verifikasi Penjual Ikan</p>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              margin: 0
            }}>Masuk ke panel admin untuk mengelola verifikasi penjual ikan</p>
          </div>
        </div>

        {errorMessage && (
          <div className="error-message" style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            <strong>Login Gagal!</strong> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="success-message" style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            <strong>Login Berhasil!</strong> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '8px',
                fontSize: '14px'
              }}
            >
              Email Admin
            </label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="superadmin@fishmap.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={submitting}
                required
                style={{
                  ...inputStyles.base,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  if (!submitting) {
                    e.target.style.borderColor = '#0891b2';
                    e.target.style.boxShadow = '0 0 0 4px rgba(8, 145, 178, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              />
              <svg 
                className="input-icon" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  width: '20px',
                  height: '20px'
                }}
              >
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '8px',
                fontSize: '14px'
              }}
            >
              Password
            </label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"}
                id="password" 
                name="password" 
                placeholder="Masukkan password admin"
                value={formData.password}
                onChange={handleInputChange}
                disabled={submitting}
                required
                style={{
                  ...inputStyles.base,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  if (!submitting) {
                    e.target.style.borderColor = '#0891b2';
                    e.target.style.boxShadow = '0 0 0 4px rgba(8, 145, 178, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={submitting}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  transition: 'color 0.2s ease',
                  opacity: submitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => !submitting && (e.target.style.color = '#0891b2')}
                onMouseLeave={(e) => !submitting && (e.target.style.color = '#94a3b8')}
              >
                <svg 
                  className="input-icon password-toggle" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ width: '20px', height: '20px' }}
                >
                  {showPassword ? (
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  ) : (
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z"/>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="forgot-password" style={{
            textAlign: 'right',
            marginBottom: '32px'
          }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                color: submitting ? '#94a3b8' : '#0891b2',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease',
                opacity: submitting ? 0.6 : 1
              }}
              onMouseEnter={(e) => !submitting && (e.target.style.color = '#0e7490')}
              onMouseLeave={(e) => !submitting && (e.target.style.color = '#0891b2')}
            >
              Lupa password?
            </button>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="login-btn"
            style={{
              width: '100%',
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #0891b2, #0e7490)',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 25px -5px rgba(8, 145, 178, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {submitting && (
              <span 
                className="spinner"
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            )}
            <span>{submitting ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
          </button>
        </form>

        <div className="divider" style={{
          margin: '32px 0',
          textAlign: 'center',
          position: 'relative'
        }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '0 16px',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Sesi Otomatis Berakhir Saat Tab Ditutup
          </span>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            background: '#e2e8f0',
            zIndex: -1
          }} />
        </div>

        <div className="security-info" style={{
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          <span className="icon" style={{ fontSize: '16px', marginRight: '8px' }}>🐟</span>
          <strong>FishMap Admin Portal</strong> - Platform terpercaya untuk verifikasi penjual ikan dengan keamanan SSL 256-bit
        </div>
      </div>

      <div className="fishmap-branding" style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        FishMap © 2025 - Menghubungkan Penjual & Pembeli Ikan
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminLogin;