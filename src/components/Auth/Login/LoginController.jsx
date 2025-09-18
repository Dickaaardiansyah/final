// LoginController.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModel from './LoginModel';
import LoginView from './LoginView';

export default function LoginController() {
  const navigate = useNavigate();
  const model = new LoginModel();

  const [form, setForm] = useState({ email: '', password: '', terms: false });
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { email, password, terms } = form;
    setIsValid(email.trim() !== '' && password.trim() !== '' && terms);
  }, [form]);

  useEffect(() => {
    if (model.isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');
    try {
      const data = await model.login(form.email, form.password);
      model.saveAuthData(data);
      alert(`Login berhasil! Selamat datang ${data.user?.name || form.email}`);
      window.dispatchEvent(new Event('userLoggedIn'));
      navigate('/');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Gagal terhubung ke server. Pastikan server berjalan di localhost:5000');
      } else if (err.message.includes('401') || err.message.includes('Wrong')) {
        setError('Email atau password salah');
      } else if (err.message.includes('404') || err.message.includes('User not found')) {
        setError('Email tidak terdaftar');
      } else {
        setError(err.message || 'Terjadi kesalahan saat login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <LoginView
      form={form}
      isValid={isValid}
      loading={loading}
      error={error}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onRegisterClick={handleRegisterClick}
    />
  );
}
