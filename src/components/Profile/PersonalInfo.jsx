import React, { useState, useEffect } from 'react';
import ProfileItem from './ProfileItem';
import { Calendar, User, Cake, Info } from 'lucide-react';

function PersonalInfo() {
  const [personalData, setPersonalData] = useState({
    name: '',
    phone: '',
    birthday: '',
    gender: '',
    age: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showMissingDataForm, setShowMissingDataForm] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempGender, setTempGender] = useState('');
  const API_BASE_URL = 'http://localhost:5000';

  // Hitung usia dari tanggal lahir
  const calculateAge = (birthday) => {
    if (!birthday) {
      return '18+';
    }
    const birthDate = new Date(birthday);
    if (isNaN(birthDate)) {
      return '18+';
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Validasi input
  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value) return 'Nama wajib diisi';
        if (value.length < 2) return 'Nama minimal 2 karakter';
        return '';
      case 'phone':
        if (!value) return 'Nomor HP wajib diisi';
        if (value.length < 8) return 'Nomor HP minimal 8 digit';
        if (!/^\d+$/.test(value)) return 'Nomor HP hanya boleh angka';
        return '';
      case 'birthday':
        const date = new Date(value);
        if (isNaN(date) || date > new Date()) return 'Tanggal lahir tidak valid';
        return '';
      case 'gender':
        if (!value) return 'Jenis kelamin wajib diisi';
        if (value !== 'male' && value !== 'female') return 'Jenis kelamin harus Laki-laki atau Perempuan';
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
        console.log('Respon API:', data);

        if (!response.ok) {
          if (response.status === 401) {
            setError('Sesi telah berakhir. Silakan login kembali.');
            return;
          }
          throw new Error(data.msg || 'Gagal memuat data pengguna');
        }

        const newPersonalData = {
          name: data.name || 'Unknown',
          phone: data.phone || '',
          birthday: data.birthday || '',
          gender: data.gender || '',
          age: calculateAge(data.birthday)
        };

        setPersonalData(newPersonalData);

        // Perbarui nilai sementara untuk form
        setTempPhone(data.phone || '');
        setTempGender(data.gender || '');

        // Tampilkan form hanya jika data phone/gender benar-benar tidak ada
        if (!data.phone || !data.gender) {
          setShowMissingDataForm(true);
          setInfoMessage('Nomor HP atau Jenis Kelamin tidak tersedia. Silakan lengkapi data Anda.');
        } else {
          setInfoMessage('Data profil berhasil dimuat dari database.');
          setShowMissingDataForm(false);
        }
        
        setError('');
        
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

  // Tangani pengeditan field dan perbarui langsung ke database
  const handleEdit = async (field, newValue) => {
    const validationError = validateField(field, newValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const updateData = { [field]: newValue };
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
      setInfoMessage('Data berhasil diperbarui di database!');
      setPersonalData(prev => ({
        ...prev,
        [field]: newValue,
        age: field === 'birthday' ? calculateAge(newValue) : prev.age
      }));
      
    } catch (err) {
      setError(err.message || 'Gagal terhubung ke server');
      setInfoMessage('Pastikan server berjalan di localhost:5000');
      console.error('Kesalahan saat memperbarui data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tangani pengiriman form data yang hilang
  const handleMissingDataSubmit = async (e) => {
    e.preventDefault();
    const phoneError = validateField('phone', tempPhone);
    const genderError = validateField('gender', tempGender);

    if (phoneError || genderError) {
      setError(phoneError || genderError);
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/users/update`, {
        method: 'PUT',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: tempPhone, gender: tempGender })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Sesi telah berakhir. Silakan login kembali.');
          return;
        }
        throw new Error(data.msg || 'Gagal memperbarui data profil');
      }

      setPersonalData(prev => ({
        ...prev,
        phone: tempPhone,
        gender: tempGender
      }));
      
      setShowMissingDataForm(false);
      setInfoMessage('Data profil berhasil diperbarui!');
      setError('');
      
    } catch (err) {
      setError(err.message || 'Gagal terhubung ke server');
      setInfoMessage('Pastikan server berjalan di localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  // Tangani pembatalan form data yang hilang
  const handleMissingDataCancel = () => {
    setShowMissingDataForm(false);
    setInfoMessage('');
  };

  const personalItems = [
    {
      id: 'name',
      icon: <User size={20} />,
      label: 'Nama:',
      value: personalData.name,
      editable: true,
      onEdit: (value) => handleEdit('name', value)
    },
    {
      id: 'phone',
      icon: <User size={20} />,
      label: 'Nomor HP:',
      value: personalData.phone || '(tidak tersedia)',
      editable: true,
      onEdit: (value) => handleEdit('phone', value)
    },
    {
      id: 'birthday',
      icon: <Calendar size={20} />,
      label: 'Tanggal Lahir:',
      value: personalData.birthday || '(tidak tersedia)',
      editable: true,
      onEdit: (value) => handleEdit('birthday', value),
      tooltip: 'Format: YYYY-MM-DD'
    },
    {
      id: 'gender',
      icon: <User size={20} />,
      label: 'Jenis Kelamin:',
      value: personalData.gender === 'male' ? 'Laki-laki' : 
             personalData.gender === 'female' ? 'Perempuan' : 
             '(tidak tersedia)',
      editable: true,
      onEdit: (value) => handleEdit('gender', value)
    },
    {
      id: 'age',
      icon: <Cake size={20} />,
      label: 'Usia:',
      value: personalData.age,
      editable: false,
      tooltip: 'Usia dihitung otomatis dari tanggal lahir'
    }
  ];

  return (
    <div className="profile-section">
      <h2 className="section-title">Informasi Pribadi</h2>
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
      {showMissingDataForm && (
        <div className="missing-data-form" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            Lengkapi Profil Anda
          </h3>
          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
            Beberapa informasi profil Anda belum lengkap. Silakan isi di bawah untuk melengkapi profil Anda.
          </p>
          <form onSubmit={handleMissingDataSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Nomor HP
              </label>
              <input
                type="tel"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                placeholder="Masukkan nomor HP (min. 8 digit)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Jenis Kelamin
              </label>
              <select
                value={tempGender}
                onChange={(e) => setTempGender(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#2563eb';
                }}
              >
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
              <button
                type="button"
                onClick={handleMissingDataCancel}
                disabled={loading}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#4b5563';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#6b7280';
                }}
              >
                Lewati
              </button>
            </div>
          </form>
        </div>
      )}
      {!loading && !error && (
        <div className="profile-items" style={{ marginBottom: '20px' }}>
          {personalItems.map((item) => (
            <div key={item.id} className="profile-item-wrapper" style={{ position: 'relative' }}>
              <ProfileItem {...item} />
              {item.tooltip && (
                <span
                  className="tooltip"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    cursor: 'help',
                    padding: '2px'
                  }}
                  title={item.tooltip}
                >
                  <Info size={14} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .tooltip:hover::after {
          content: attr(title);
          position: absolute;
          top: -35px;
          right: 0;
          background: #1f2937;
          color: white;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .tooltip:hover::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 10px;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #1f2937;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}

export default PersonalInfo;