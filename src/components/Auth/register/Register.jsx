// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OTPVerification from '../../OTPVerification'; // Fixed import path
import '../../../styles/register.css';

function Register() {
  const navigate = useNavigate();
  
  // States
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Verification
  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error saat user mengetik
    if (error) {
      setError('');
    }
  };

  // Form validation
  const isFormValid = () => {
    const { nama, email, password, confirmPassword, phone, gender } = form;
    
    return (
      nama.trim().length >= 2 &&
      email.trim() && 
      email.includes('@') &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      phone.trim().length >= 8 &&
      (gender === 'male' || gender === 'female')
    );
  };

  // Validate specific field
  const getFieldError = (fieldName) => {
    const { nama, email, password, confirmPassword, phone } = form;
    
    switch (fieldName) {
      case 'nama':
        if (nama.length > 0 && nama.length < 2) return 'Nama minimal 2 karakter';
        break;
      case 'email':
        if (email.length > 0 && !email.includes('@')) return 'Format email tidak valid';
        break;
      case 'password':
        if (password.length > 0 && password.length < 6) return 'Password minimal 6 karakter';
        break;
      case 'confirmPassword':
        if (confirmPassword.length > 0 && password !== confirmPassword) return 'Password tidak cocok';
        break;
      case 'phone':
        if (phone.length > 0 && phone.length < 8) return 'Nomor HP minimal 8 digit';
        if (phone.length > 0 && !/^\d+$/.test(phone)) return 'Nomor HP hanya boleh angka';
        break;
      default:
        return '';
    }
    return '';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Harap isi semua field dengan benar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Registering user...');

      // Transform data untuk API (nama → name)
      const apiData = {
        name: form.nama.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone.trim(),
        gender: form.gender
      };

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();
      console.log('Register response:', data);

      if (response.ok) {
        // Step 1 berhasil - pindah ke OTP verification
        console.log('Registration successful, moving to OTP step');
        setStep(2);
        
      } else {
        // Handle specific error messages
        if (response.status === 400) {
          setError(data.msg || 'Data yang Anda masukkan tidak valid');
        } else if (response.status === 409) {
          setError('Email atau nomor HP sudah terdaftar');
        } else {
          setError(data.msg || 'Registrasi gagal');
        }
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Gagal terhubung ke server. Pastikan server berjalan di localhost:5000');
      } else {
        setError('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 1) {
      navigate(-1); // Kembali ke halaman sebelumnya
    } else {
      setStep(1); // Kembali ke form register
      setError(''); // Clear error
    }
  };

  // Handle OTP success
  const handleOTPSuccess = (userData, accessToken) => {
    console.log('OTP verification successful:', userData);
    
    // Simpan data login
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userId', userData.id);
    
    // Trigger event untuk update navbar
    window.dispatchEvent(new Event('userLoggedIn'));
    
    // Show success message
    alert(`Selamat datang ${userData.name}! Akun Anda berhasil diverifikasi.`);
    
    // Redirect ke home
    navigate('/');
  };

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <OTPVerification
        email={form.email}
        userName={form.nama}
        onSuccess={handleOTPSuccess}
        onBack={handleBack}
      />
    );
  }

  // Step 1: Register Form
  return (
    <div className="register-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <button className="back-btn" onClick={handleBack} type="button">
            ←
          </button>
          <h1 className="title">Selamat Datang</h1>
        </div>

        <p className="subtitle">
          Daftar sekarang untuk menggunakan semua fitur Fishmap AI
        </p>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#dc2626',
            border: '1px solid #fca5a5',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '30px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit}>
          {/* Nama */}
          <div className="form-group">
            <label className="form-label">Masukkan Namamu Disini</label>
            <input
              type="text"
              className="form-input"
              name="nama"
              placeholder="Nama lengkap"
              value={form.nama}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="name"
            />
            {getFieldError('nama') && (
              <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {getFieldError('nama')}
              </small>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              name="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="email"
            />
            {getFieldError('email') && (
              <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {getFieldError('email')}
              </small>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              name="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {getFieldError('password') && (
              <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {getFieldError('password')}
              </small>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <input
              type="password"
              className="form-input"
              name="confirmPassword"
              placeholder="Ulangi password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="new-password"
            />
            {getFieldError('confirmPassword') && (
              <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {getFieldError('confirmPassword')}
              </small>
            )}
          </div>

          {/* Nomor HP */}
          <div className="form-group">
            <label className="form-label">Nomor HP</label>
            <div className="phone-group">
              <input
                type="tel"
                className="form-input phone-input"
                name="phone"
                placeholder="812345678"
                value={form.phone}
                onChange={handleChange}
                disabled={loading}
                required
                pattern="[0-9]*"
                autoComplete="tel"
              />
            </div>
            {getFieldError('phone') && (
              <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {getFieldError('phone')}
              </small>
            )}
          </div>

          {/* Jenis Kelamin */}
          <div className="form-group">
            <label className="form-label">Jenis Kelamin</label>
            <select
              className="form-input"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button type="button" className="btn btn-back" onClick={handleBack}>
              ←
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!isFormValid() || loading}
              style={{
                opacity: (!isFormValid() || loading) ? 0.6 : 1,
                cursor: (!isFormValid() || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Mendaftar...
                </>
              ) : (
                'Berikutnya'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          padding: '20px',
          borderTop: '1px solid #333',
        }}>
          <p style={{ 
            color: '#888',
            fontSize: '14px',
            marginBottom: '8px'
          }}>
            Sudah punya akun?
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#007AFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Login di sini
          </button>
        </div>

        {/* Loading Spinner Animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default Register;