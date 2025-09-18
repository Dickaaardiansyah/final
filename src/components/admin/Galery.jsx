import React, { useState, useMemo, useEffect } from 'react';
import styles from "../../styles/admin/Dashboard.module.css";
import Sidebar from '../admin/Sidebar';
import Header from '../admin/Header';
import axios from 'axios';
import Swal from 'sweetalert2';

function Galery() {
  const [galeriData, setGaleriData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    gambar: '',
    deskripsi: ''
  });
  const [previewImage, setPreviewImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // Get admin token - coba localStorage dulu, jika tidak ada gunakan refresh token
  const getAdminToken = async () => {
    // Coba ambil dari localStorage dulu
    let token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

    if (token) {
      return token;
    }

    // Jika tidak ada, coba refresh token dari cookies
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/admin/token`, {
        withCredentials: true // Include cookies
      });

      if (response.data && response.data.accessToken) {
        const newToken = response.data.accessToken;
        // Simpan token baru ke localStorage
        localStorage.setItem('adminToken', newToken);
        return newToken;
      }
    } catch (error) {
      console.error('Error refreshing admin token:', error);
    }

    return null;
  };

  // API Headers with token - async version
  const getAuthHeaders = async () => {
    const token = await getAdminToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch galeri data from API
  const fetchGaleriData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/galery?page=1&limit=100`);

      if (response.data && response.data.data) {
        setGaleriData(response.data.data);
      } else {
        setGaleriData([]);
      }
    } catch (error) {
      console.error('Error fetching galeri data:', error);
      setGaleriData([]);
      
      // SweetAlert untuk error
      await Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: 'Tidak dapat memuat data galeri: ' + (error.response?.data?.msg || error.message),
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchGaleriData();
  }, []);

  // Filter data berdasarkan search
  const filteredData = useMemo(() => {
    if (!searchTerm) return galeriData;

    return galeriData.filter(item =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [galeriData, searchTerm]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fungsi untuk compress image base64
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
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

        // Draw and compress
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
        // Show loading indicator
        setPreviewImage('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TWVtcHJvc2VzLi4uPC90ZXh0Pgo8L3N2Zz4=');

        // Compress image
        const compressedBase64 = await compressImage(file);

        // Check compressed size (base64 is ~33% larger than original)
        const sizeInMB = (compressedBase64.length * 3 / 4) / (1024 * 1024);

        if (sizeInMB > 10) { // Limit compressed image to 10MB
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
        setFormData(prev => ({
          ...prev,
          gambar: compressedBase64
        }));

        // Toast sukses
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

  // Open modal untuk create
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ nama: '', gambar: '', deskripsi: '' });
    setPreviewImage('');
    setIsModalOpen(true);
  };

  // Open modal untuk edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      gambar: item.gambar,
      deskripsi: item.deskripsi
    });
    setPreviewImage(item.gambar);
    setIsModalOpen(true);
  };

  // Handle delete dengan SweetAlert confirmation
  const handleDelete = async (id, nama) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      html: `Apakah Anda yakin ingin menghapus gambar <strong>"${nama}"</strong>?<br><small>Tindakan ini tidak dapat dibatalkan.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: 'Menghapus...',
          text: 'Mohon tunggu sebentar',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const headers = await getAuthHeaders();
        await axios.delete(`${API_BASE_URL}/galery/${id}`, { headers });

        // Refresh data setelah delete
        await fetchGaleriData();
        
        // Success notification
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus!',
          text: `Gambar "${nama}" telah berhasil dihapus.`,
          confirmButtonColor: '#059669',
          timer: 2000,
          timerProgressBar: true
        });

      } catch (error) {
        console.error('Error deleting galeri:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: 'Gagal menghapus galeri: ' + (error.response?.data?.msg || error.message),
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  // Handle form submit dengan SweetAlert
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi yang lebih ketat
    if (!formData.nama || formData.nama.trim().length < 3) {
      await Swal.fire({
        icon: 'warning',
        title: 'Nama Tidak Valid',
        text: 'Nama harus diisi minimal 3 karakter!',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!formData.gambar) {
      await Swal.fire({
        icon: 'warning',
        title: 'Gambar Belum Dipilih',
        text: 'Gambar harus dipilih!',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!formData.deskripsi || formData.deskripsi.trim().length < 10) {
      await Swal.fire({
        icon: 'warning',
        title: 'Deskripsi Tidak Valid',
        text: 'Deskripsi harus diisi minimal 10 karakter!',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // Check base64 size
    const imageSizeInMB = (formData.gambar.length * 3 / 4) / (1024 * 1024);
    if (imageSizeInMB > 15) { // Limit to 15MB
      await Swal.fire({
        icon: 'error',
        title: 'Gambar Terlalu Besar',
        text: 'Ukuran gambar terlalu besar untuk disimpan. Coba kompres gambar atau gunakan gambar yang lebih kecil.',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    setSubmitting(true);

    // Show loading
    Swal.fire({
      title: editingItem ? 'Memperbarui Galeri...' : 'Menyimpan Galeri...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const headers = await getAuthHeaders();

      // Trim data sebelum dikirim
      const dataToSend = {
        nama: formData.nama.trim(),
        gambar: formData.gambar,
        deskripsi: formData.deskripsi.trim()
      };

      console.log('Sending data, image size:', imageSizeInMB.toFixed(2), 'MB');

      if (editingItem) {
        await axios.put(`${API_BASE_URL}/galery/${editingItem.id}`, dataToSend, {
          headers,
          timeout: 30000 // 30 seconds timeout
        });
        
        // Success untuk edit
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui!',
          text: `Galeri "${formData.nama}" telah berhasil diperbarui.`,
          confirmButtonColor: '#059669',
          timer: 2000,
          timerProgressBar: true
        });

      } else {
        await axios.post(`${API_BASE_URL}/galery`, dataToSend, {
          headers,
          timeout: 30000 // 30 seconds timeout
        });
        
        // Success untuk create
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Ditambahkan!',
          text: `Galeri "${formData.nama}" telah berhasil ditambahkan.`,
          confirmButtonColor: '#059669',
          timer: 2000,
          timerProgressBar: true
        });
      }

      await fetchGaleriData();
      setIsModalOpen(false);
      setFormData({ nama: '', gambar: '', deskripsi: '' });
      setPreviewImage('');
      setEditingItem(null);

    } catch (error) {
      console.error('Error saving galeri:', error);

      let errorTitle = 'Gagal Menyimpan';
      let errorMessage = '';

      if (error.code === 'ECONNABORTED') {
        errorTitle = 'Timeout';
        errorMessage = 'Gambar terlalu besar atau koneksi lambat. Coba gunakan gambar yang lebih kecil.';
      } else if (error.response?.status === 401) {
        errorTitle = 'Sesi Berakhir';
        errorMessage = 'Sesi admin expired. Silakan refresh halaman dan login ulang.';
      } else if (error.response?.status === 413) {
        errorTitle = 'Gambar Terlalu Besar';
        errorMessage = 'Gambar terlalu besar untuk server. Coba gunakan gambar yang lebih kecil.';
      } else if (error.response?.data?.errors) {
        // Handle validation errors dari backend
        const errorMessages = error.response.data.errors.map(err => {
          if (err.field === 'gambar' && err.message.includes('too long')) {
            return 'Ukuran gambar terlalu besar untuk database';
          }
          return `${err.field}: ${err.message}`;
        }).join('<br>');
        
        errorTitle = 'Validasi Gagal';
        errorMessage = errorMessages;
      } else if (error.response?.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'Server error. Kemungkinan gambar terlalu besar atau ada masalah server. Coba gunakan gambar yang lebih kecil.';
      } else {
        errorMessage = error.response?.data?.msg || error.message;
      }

      await Swal.fire({
        icon: 'error',
        title: errorTitle,
        html: errorMessage,
        confirmButtonColor: '#dc2626'
      });
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
          {/* Header Section */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11.5-9L8 10.5l1.5 1.5L8 15h2.5l1.5-3 1.5 3H16l-1.5-3 1.5-3h-2.5L12 12 10.5 9h-2.5z" />
                <path d="M2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
              </svg>
              Galeri ({loading ? '...' : filteredData.length})
            </h2>
          </div>

          {/* Search and Create Section */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className={styles.btn + ' ' + styles.btnSuccess}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <svg style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              Tambah Gambar
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#64748b',
              fontSize: '1.1rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #0891b2',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
              </div>
              <div>Memuat data galeri...</div>
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div style={{
              overflowX: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b', width: '150px' }}>
                      Gambar
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                      Nama
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                      Deskripsi
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b', width: '120px' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <img
                            src={item.gambar}
                            alt={item.nama}
                            style={{
                              width: '100px',
                              height: '70px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #e2e8f0'
                            }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiB2aWV3Qm94PSIwIDAgMTAwIDcwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAzNUw0NSAzMEw1NSA0MEw2MCAzNUw3MCA0NUg3MFY1NUgzMFY0NUw0MCAzNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                            }}
                          />
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>
                            {item.nama}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {new Date(item.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569', maxWidth: '400px' }}>
                          <div style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.deskripsi}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(item)}
                              disabled={submitting}
                              style={{
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: submitting ? '#94a3b8' : '#059669',
                                color: '#ffffff',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}
                              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#047857')}
                              onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#059669')}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.nama)}
                              disabled={submitting}
                              style={{
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: submitting ? '#94a3b8' : '#dc2626',
                                color: '#ffffff',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}
                              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#b91c1c')}
                              onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#dc2626')}
                              title="Hapus"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '1.1rem'
                      }}>
                        <div>
                          <svg style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: '0.5' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2z" />
                            <path d="M2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
                          </svg>
                          <div>Tidak ada data galeri ditemukan</div>
                          {searchTerm && (
                            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                              Coba ubah kata kunci pencarian
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {!loading && filteredData.length > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#64748b'
            }}>
              Menampilkan {filteredData.length} dari {galeriData.length} item galeri
              {searchTerm && ` untuk "${searchTerm}"`}
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0
                }}>
                  {editingItem ? 'Edit Gambar' : 'Tambah Gambar Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    color: '#64748b',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit}>
                {/* Form Input Nama dengan Real-time Validation */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>
                    Nama *
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    disabled={submitting}
                    placeholder="Masukkan nama gambar (minimal 3 karakter)"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${formData.nama.length > 0 && formData.nama.length < 3
                        ? '#dc2626'
                        : '#e2e8f0'
                        }`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.3s ease',
                      opacity: submitting ? 0.6 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                    onBlur={(e) => e.target.style.borderColor = formData.nama.length > 0 && formData.nama.length < 3 ? '#dc2626' : '#e2e8f0'}
                    required
                  />
                  {formData.nama.length > 0 && formData.nama.length < 3 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#dc2626',
                      marginTop: '0.5rem'
                    }}>
                      Nama minimal 3 karakter (saat ini: {formData.nama.length} karakter)
                    </div>
                  )}
                  {formData.nama.length >= 3 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#059669',
                      marginTop: '0.5rem'
                    }}>
                      ✓ Nama valid ({formData.nama.length}/100 karakter)
                    </div>
                  )}
                </div>

                {/* Form Input Gambar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>
                    Gambar *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#f8fafc',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'border-color 0.3s ease',
                      opacity: submitting ? 0.6 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    marginTop: '0.5rem'
                  }}>
                    Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
                  </div>
                  {previewImage && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#1e293b',
                        marginBottom: '0.5rem'
                      }}>
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
                            setFormData(prev => ({ ...prev, gambar: '' }));
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

                {/* Form Input Deskripsi dengan Real-time Validation - HANYA SATU INI */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>
                    Deskripsi *
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    disabled={submitting}
                    placeholder="Masukkan deskripsi gambar (minimal 10 karakter)"
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${formData.deskripsi.length > 0 && formData.deskripsi.length < 10
                        ? '#dc2626'
                        : '#e2e8f0'
                        }`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.3s ease',
                      opacity: submitting ? 0.6 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                    onBlur={(e) => e.target.style.borderColor = formData.deskripsi.length > 0 && formData.deskripsi.length < 10 ? '#dc2626' : '#e2e8f0'}
                    required
                  />
                  {formData.deskripsi.length > 0 && formData.deskripsi.length < 10 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#dc2626',
                      marginTop: '0.5rem'
                    }}>
                      Deskripsi minimal 10 karakter (saat ini: {formData.deskripsi.length} karakter)
                    </div>
                  )}
                  {formData.deskripsi.length >= 10 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#059669',
                      marginTop: '0.5rem'
                    }}>
                      ✓ Deskripsi valid ({formData.deskripsi.length}/1000 karakter)
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '2px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#64748b',
                      borderRadius: '8px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      backgroundColor: submitting ? '#94a3b8' : '#0891b2',
                      color: '#ffffff',
                      borderRadius: '8px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {submitting ? 'Menyimpan...' : (editingItem ? 'Perbarui' : 'Simpan')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Loading Spinner CSS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );


}

export default Galery;