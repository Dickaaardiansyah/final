import React, { useState, useEffect } from 'react';
import ProfileItem from './ProfileItem';
import { User, Lock, Mail } from 'lucide-react';

function AccountInfo() {
  const [accountData, setAccountData] = useState({
    username: '',
    password: '***********',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const API_BASE_URL = 'http://localhost:5000';

  // Validasi input
  const validateField = (field, value) => {
    switch (field) {
      case 'username':
        if (value.length < 2) return 'Nama pengguna minimal 2 karakter';
        return '';
      case 'email':
        if (!value.includes('@')) return 'Format email tidak valid';
        return '';
      case 'password':
        if (value !== '***********' && value.length < 6) return 'Password minimal 6 karakter';
        return '';
      default:
        return '';
    }
  };

  // Ambil data pengguna menggunakan HTTP-only cookies
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'GET',
          credentials: 'include', // Include HTTP-only cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Sesi telah berakhir. Silakan login kembali.');
            // Redirect to login if needed
            // window.location.href = '/login';
            return;
          }
          throw new Error(data.msg || 'Gagal memuat data akun');
        }

        setAccountData({
          username: data.name || 'Unknown',
          password: '***********',
          email: data.email || ''
        });
        setError('');
        setInfoMessage('Data akun berhasil dimuat');
        
      } catch (err) {
        setError(err.message || 'Gagal terhubung ke server');
        setInfoMessage('Pastikan server berjalan di localhost:5000');
        console.error('Kesalahan saat mengambil data pengguna:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Tangani pengeditan field menggunakan HTTP-only cookies
  const handleEdit = async (field, newValue) => {
    const validationError = validateField(field, newValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Map field names to match server expectations
      let serverField = field;
      if (field === 'username') {
        serverField = 'name';
      }
      
      const updateData = { [serverField]: newValue };
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`${API_BASE_URL}/users/update`, {
        method: 'PUT',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      console.log('Server response:', data);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Sesi telah berakhir. Silakan login kembali.');
          return;
        }
        throw new Error(data.msg || data.message || `Server error: ${response.status}`);
      }

      setError('');
      setInfoMessage('Data berhasil diperbarui!');
      setAccountData(prev => ({
        ...prev,
        [field]: newValue
      }));
      
    } catch (err) {
      setError(err.message || 'Gagal terhubung ke server');
      setInfoMessage('Pastikan server berjalan di localhost:5000');
      console.error('Kesalahan saat memperbarui data:', err);
    } finally {
      setLoading(false);
    }
  };

  const accountItems = [
    {
      id: 'username',
      icon: <User size={20} />,
      label: 'Nama Pengguna:',
      value: accountData.username,
      editable: true,
      onEdit: (value) => handleEdit('name', value) // Map to 'name' field in API
    },
    {
      id: 'password',
      icon: <Lock size={20} />,
      label: 'Kata Sandi:',
      value: accountData.password,
      editable: true,
      onEdit: (value) => handleEdit('password', value)
    },
    {
      id: 'email',
      icon: <Mail size={20} />,
      label: 'Alamat Email:',
      value: accountData.email,
      editable: true,
      onEdit: (value) => handleEdit('email', value)
    }
  ];

  return (
    <div className="profile-section">
      <h2 className="section-title">Informasi Akun</h2>
      {loading && (
        <div className="loading" style={{ padding: '20px', textAlign: 'center' }}>
          <span className="loading-spinner" style={{
            width: '16px',
            height: '16px',
            border: '2px solid transparent',
            borderTop: '2px solid #007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            display: 'inline-block',
            marginRight: '8px'
          }}></span>
          Memuat data...
        </div>
      )}
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          {error}
        </div>
      )}
      {infoMessage && (
        <div className="info-message" style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>ℹ️</span>
          {infoMessage}
        </div>
      )}
      {!loading && !error && accountItems.map((item) => (
        <ProfileItem
          key={item.id}
          {...item}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}

export default AccountInfo;