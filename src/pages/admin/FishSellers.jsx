// FishSellers.jsx
import React, { useState } from "react";
import styles from "../../styles/admin/Dashboard.module.css";
import Sidebar from "../../components/admin/Sidebar";
import Header from "../../components/admin/Header";
import axios from 'axios';
import Swal from 'sweetalert2';

function FishSellers() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFish, setSelectedFish] = useState(null);
  const [recipeData, setRecipeData] = useState({
    judul: "",
    gambar: "",
    bahan: "",
    cara: "",
  });
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Hardcoded fish list as per user request
  const fishes = [
    { id: 1, nama: "Ikan Bandeng", icon: "🐟" },
    { id: 2, nama: "Ikan Cupang", icon: "🐠" },
    { id: 3, nama: "Ikan Gabus", icon: "🐡" },
    { id: 4, nama: "Ikan Gurami", icon: "🐟" },
    { id: 5, nama: "Ikan Kakap", icon: "🐠" },
    { id: 6, nama: "Ikan Kerapu", icon: "🐡" },
    { id: 7, nama: "Ikan Mujair", icon: "🐟" },
    { id: 8, nama: "Ikan Nila", icon: "🐠" },
    { id: 9, nama: "Ikan Tenggiri", icon: "🐡" },
    { id: 10, nama: "Ikan Tongkol", icon: "🐟" },
  ];

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // SweetAlert Toast Configuration
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  // Get admin token
  const getAdminToken = async () => {
    let token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (token) {
      return token;
    }
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/admin/token`, {
        withCredentials: true
      });
      if (response.data && response.data.accessToken) {
        const newToken = response.data.accessToken;
        localStorage.setItem('adminToken', newToken);
        return newToken;
      }
    } catch (error) {
      console.error('Error refreshing admin token:', error);
    }
    return null;
  };

  // API Headers with token
  const getAuthHeaders = async () => {
    const token = await getAdminToken();
    if (!token) {
      throw new Error('Token admin tidak ditemukan. Silakan login kembali.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Compress image to base64
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi file type
      if (!file.type.startsWith('image/')) {
        await Swal.fire({
          icon: 'warning',
          title: 'File Tidak Valid',
          text: 'File harus berupa gambar!',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }

      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        await Swal.fire({
          icon: 'warning',
          title: 'File Terlalu Besar',
          text: 'Ukuran file maksimal 5MB!',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }

      try {
        setPreviewImage('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TWVtcHJvc2VzLi4uPC90ZXh0Pgo8L3N2Zz4=');
        const compressedBase64 = await compressImage(file);
        const sizeInMB = (compressedBase64.length * 3 / 4) / (1024 * 1024);
        if (sizeInMB > 10) {
          await Swal.fire({
            icon: 'error',
            title: 'Gambar Terlalu Besar',
            text: 'Gambar terlalu besar setelah dikompresi. Coba gunakan gambar yang lebih kecil.',
            confirmButtonColor: '#dc2626'
          });
          setPreviewImage('');
          return;
        }
        setPreviewImage(compressedBase64);
        setRecipeData(prev => ({ ...prev, gambar: compressedBase64 }));
        Toast.fire({
          icon: 'success',
          title: 'Gambar berhasil diunggah'
        });
      } catch (error) {
        console.error('Error processing image:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Gagal Memproses Gambar',
          text: 'Gagal memproses gambar. Coba gunakan gambar lain.',
          confirmButtonColor: '#dc2626'
        });
        setPreviewImage('');
      }
    }
  };

  const handleOpenModal = (fish) => {
    setSelectedFish(fish);
    setShowModal(true);
    setError(null);
    setSuccess(null);
    setPreviewImage('');
    setRecipeData({ judul: "", gambar: "", bahan: "", cara: "" });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setRecipeData({ judul: "", gambar: "", bahan: "", cara: "" });
    setPreviewImage('');
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validasi input
    if (!recipeData.judul || recipeData.judul.trim().length < 3) {
      setError('Judul resep harus minimal 3 karakter.');
      setSubmitting(false);
      await Swal.fire({
        icon: 'warning',
        title: 'Judul Tidak Valid',
        text: 'Judul resep harus minimal 3 karakter.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    if (!recipeData.bahan || recipeData.bahan.trim().length < 10) {
      setError('Bahan-bahan harus minimal 10 karakter.');
      setSubmitting(false);
      await Swal.fire({
        icon: 'warning',
        title: 'Bahan Tidak Valid',
        text: 'Bahan-bahan harus minimal 10 karakter.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    if (!recipeData.cara || recipeData.cara.trim().length < 10) {
      setError('Cara memasak harus minimal 10 karakter.');
      setSubmitting(false);
      await Swal.fire({
        icon: 'warning',
        title: 'Cara Memasak Tidak Valid',
        text: 'Cara memasak harus minimal 10 karakter.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    if (!recipeData.gambar) {
      setError('Gambar harus diunggah.');
      setSubmitting(false);
      await Swal.fire({
        icon: 'warning',
        title: 'Gambar Belum Dipilih',
        text: 'Gambar harus diunggah!',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      const payload = {
        fish_name: selectedFish.nama,
        title: recipeData.judul,
        image_url: recipeData.gambar,
        ingredients: recipeData.bahan,
        instructions: recipeData.cara,
      };
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_BASE_URL}/recipes`, payload, { headers });

      setSuccess('Resep berhasil ditambahkan!');
      Toast.fire({
        icon: 'success',
        title: 'Resep berhasil ditambahkan'
      });
      handleCloseModal();
    } catch (err) {
      console.error('Error saat menambahkan resep:', err);
      setError(err.response?.data?.msg || err.message || 'Gagal menambahkan resep.');
      if (err.message.includes('Token')) {
        await Swal.fire({
          icon: 'error',
          title: 'Autentikasi Gagal',
          text: 'Token admin tidak ditemukan. Silakan login kembali.',
          confirmButtonColor: '#dc2626'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan',
          text: 'Gagal menambahkan resep: ' + (err.response?.data?.msg || err.message),
          confirmButtonColor: '#dc2626'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="containerAdmin">
      <Sidebar />
      <main className={styles.mainContent}>
        <Header />
        <div className={styles.verificationSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c5.4 0 10 4.6 10 10 0 5.4-4.6 10-10 10S2 17.4 2 12 6.6 2 12 2zm-1 17.93c3.94-.49 7-3.85 7-7.93 0-.62-.08-1.21-.21-1.79L9 10v1c0 1.1-.9 2-2 2s-2-.9-2-2V9c0-1.1.9-2 2-2s2 .9 2 2v.17l8.79-.21C17.21 8.34 16.62 8.26 16 8.26c-4.08 0-7.44 3.06-7.93 7H9c-.55 0-1 .45-1 1s.45 1 1 1h-.93z" />
              </svg>
              Resep Ikan
            </h2>
          </div>

          <div style={tableStyles.wrapper}>
            <table style={tableStyles.table}>
              <thead style={tableStyles.thead}>
                <tr>
                  <th style={tableStyles.th}>
                    <div style={tableStyles.thContent}>
                      <svg style={tableStyles.thIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      No
                    </div>
                  </th>
                  <th style={tableStyles.th}>
                    <div style={tableStyles.thContent}>
                      <svg style={tableStyles.thIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Nama Ikan
                    </div>
                  </th>
                  <th style={{ ...tableStyles.th, textAlign: 'center' }}>
                    <div style={{ ...tableStyles.thContent, justifyContent: 'center' }}>
                      <svg style={tableStyles.thIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Aksi
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody style={tableStyles.tbody}>
                {fishes.map((fish, index) => (
                  <tr key={fish.id} style={tableStyles.tr}>
                    <td style={tableStyles.td}>
                      <div style={tableStyles.numberBadge}>{index + 1}</div>
                    </td>
                    <td style={tableStyles.td}>
                      <div style={tableStyles.fishNameWrapper}>
                        <div style={tableStyles.fishIconBadge}>
                          <span style={tableStyles.fishIconEmoji}>{fish.icon}</span>
                        </div>
                        <span style={tableStyles.fishName}>{fish.nama}</span>
                      </div>
                    </td>
                    <td style={{ ...tableStyles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenModal(fish)}
                        style={tableStyles.addBtn}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 145, 178, 0.35)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.25)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)';
                        }}
                      >
                        <svg style={tableStyles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Resep
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tambah Resep */}
        {showModal && (
          <div style={modalStyles.overlay}>
            <div style={modalStyles.container}>
              <div style={modalStyles.header}>
                <div style={modalStyles.headerContent}>
                  <div style={modalStyles.fishIconWrapper}>
                    <span style={modalStyles.fishIcon}>{selectedFish.icon}</span>
                  </div>
                  <div>
                    <h3 style={modalStyles.title}>Tambah Resep Baru</h3>
                    <p style={modalStyles.subtitle}>{selectedFish.nama}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  style={modalStyles.closeButton}
                  type="button"
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <svg style={modalStyles.closeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={modalStyles.form}>
                {/* Judul Resep */}
                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>
                    <svg style={modalStyles.labelIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Judul Resep *
                  </label>
                  <input
                    type="text"
                    name="judul"
                    placeholder="Contoh: Bandeng Presto"
                    value={recipeData.judul}
                    onChange={handleChange}
                    style={{
                      ...modalStyles.input,
                      border: `2px solid ${recipeData.judul.length > 0 && recipeData.judul.length < 3 ? '#dc2626' : '#e5e7eb'}`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0891b2';
                      e.target.style.boxShadow = '0 0 0 3px rgba(8, 145, 178, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = recipeData.judul.length > 0 && recipeData.judul.length < 3 ? '#dc2626' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                    disabled={submitting}
                  />
                  {recipeData.judul.length > 0 && recipeData.judul.length < 3 && (
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem' }}>
                      Judul minimal 3 karakter (saat ini: {recipeData.judul.length} karakter)
                    </div>
                  )}
                  {recipeData.judul.length >= 3 && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.5rem' }}>
                      ✓ Judul valid ({recipeData.judul.length}/100 karakter)
                    </div>
                  )}
                </div>

                {/* Gambar */}
                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>
                    <svg style={modalStyles.labelIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gambar *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={submitting}
                    style={{
                      ...modalStyles.input,
                      backgroundColor: '#f8fafc',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0891b2';
                      e.target.style.boxShadow = '0 0 0 3px rgba(8, 145, 178, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
                  </div>
                  {previewImage && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1e293b', marginBottom: '0.5rem' }}>
                        Preview:
                      </div>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={previewImage}
                          alt="Preview"
                          style={{
                            width: '200px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage('');
                            setRecipeData(prev => ({ ...prev, gambar: '' }));
                          }}
                          disabled={submitting}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'rgba(220, 38, 38, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            color: 'white',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: submitting ? 0.6 : 1
                          }}
                          title="Hapus gambar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bahan-bahan */}
                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>
                    <svg style={modalStyles.labelIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m-6 4h6" />
                    </svg>
                    Bahan-bahan *
                  </label>
                  <textarea
                    name="bahan"
                    placeholder="Masukkan bahan-bahan yang diperlukan&#10;Contoh:&#10;- 500 gr ikan bandeng&#10;- 2 sdm tepung bumbu&#10;- 1 sdt garam&#10;- dst..."
                    value={recipeData.bahan}
                    onChange={handleChange}
                    style={{
                      ...modalStyles.input,
                      ...modalStyles.textarea,
                      border: `2px solid ${recipeData.bahan.length > 0 && recipeData.bahan.length < 10 ? '#dc2626' : '#e5e7eb'}`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0891b2';
                      e.target.style.boxShadow = '0 0 0 3px rgba(8, 145, 178, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = recipeData.bahan.length > 0 && recipeData.bahan.length < 10 ? '#dc2626' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                    disabled={submitting}
                  />
                  {recipeData.bahan.length > 0 && recipeData.bahan.length < 10 && (
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem' }}>
                      Bahan minimal 10 karakter (saat ini: {recipeData.bahan.length} karakter)
                    </div>
                  )}
                  {recipeData.bahan.length >= 10 && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.5rem' }}>
                      ✓ Bahan valid ({recipeData.bahan.length}/1000 karakter)
                    </div>
                  )}
                </div>

                {/* Cara Memasak */}
                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>
                    <svg style={modalStyles.labelIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Cara Memasak *
                  </label>
                  <textarea
                    name="cara"
                    placeholder="Masukkan langkah-langkah memasak&#10;Contoh:&#10;1. Bersihkan ikan dan lumuri dengan garam&#10;2. Diamkan selama 15 menit&#10;3. Baluri ikan dengan tepung bumbu&#10;4. Goreng hingga kecoklatan&#10;5. dst..."
                    value={recipeData.cara}
                    onChange={handleChange}
                    style={{
                      ...modalStyles.input,
                      ...modalStyles.textareaLarge,
                      border: `2px solid ${recipeData.cara.length > 0 && recipeData.cara.length < 10 ? '#dc2626' : '#e5e7eb'}`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0891b2';
                      e.target.style.boxShadow = '0 0 0 3px rgba(8, 145, 178, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = recipeData.cara.length > 0 && recipeData.cara.length < 10 ? '#dc2626' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                    disabled={submitting}
                  />
                  {recipeData.cara.length > 0 && recipeData.cara.length < 10 && (
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem' }}>
                      Cara memasak minimal 10 karakter (saat ini: {recipeData.cara.length} karakter)
                    </div>
                  )}
                  {recipeData.cara.length >= 10 && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.5rem' }}>
                      ✓ Cara memasak valid ({recipeData.cara.length}/1000 karakter)
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#b91c1c' }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: '8px', marginBottom: '1rem', color: '#065f46' }}>
                    {success}
                  </div>
                )}

                <div style={modalStyles.actions}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={modalStyles.btnCancel}
                    disabled={submitting}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg style={modalStyles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={modalStyles.btnSubmit}
                    disabled={submitting}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg style={modalStyles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {submitting ? 'Menyimpan...' : 'Simpan Resep'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Table Styles
const tableStyles = {
  wrapper: {
    marginTop: '1.5rem',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white'
  },
  thead: {
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)'
  },
  th: {
    padding: '1.25rem 1.5rem',
    textAlign: 'left',
    border: 'none'
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9375rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  thIcon: {
    width: '1.25rem',
    height: '1.25rem',
    opacity: 0.9
  },
  tbody: {
    background: 'white'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'all 0.2s ease'
  },
  td: {
    padding: '1.25rem 1.5rem',
    border: 'none'
  },
  numberBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    color: 'white',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    boxShadow: '0 2px 8px rgba(8, 145, 178, 0.2)'
  },
  fishNameWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  fishIconBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '3.5rem',
    height: '3.5rem',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    borderRadius: '16px',
    border: '2px solid #bae6fd',
    boxShadow: '0 2px 8px rgba(8, 145, 178, 0.1)'
  },
  fishIconEmoji: {
    fontSize: '2rem',
    lineHeight: 1
  },
  fishName: {
    color: '#1e293b',
    fontWeight: 600,
    fontSize: '1.0625rem'
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25)'
  },
  btnIcon: {
    width: '1.125rem',
    height: '1.125rem'
  }
};

// Modal Styles
const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    padding: '1rem'
  },
  container: {
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '42rem',
    position: 'relative',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease-out'
  },
  header: {
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    padding: '1.5rem',
    color: 'white',
    position: 'relative'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  fishIconWrapper: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '50%',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fishIcon: {
    fontSize: '2rem',
    lineHeight: 1
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.875rem',
    margin: '0.25rem 0 0 0'
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    borderRadius: '50%',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'white'
  },
  closeIcon: {
    width: '1.5rem',
    height: '1.5rem'
  },
  form: {
    padding: '1.5rem',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  formGroup: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  },
  labelIcon: {
    width: '1.25rem',
    height: '1.25rem',
    color: '#0891b2'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontSize: '0.9375rem',
    fontFamily: 'inherit'
  },
  textarea: {
    minHeight: '8rem',
    resize: 'vertical'
  },
  textareaLarge: {
    minHeight: '10rem',
    resize: 'vertical'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '1.5rem',
    borderTop: '2px solid #f3f4f6',
    marginTop: '1rem'
  },
  btnCancel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f3f4f6',
    color: '#374151'
  },
  btnSubmit: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
  },
  btnIcon: {
    width: '1.25rem',
    height: '1.25rem'
  }
};

export default FishSellers;