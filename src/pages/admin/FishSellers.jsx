// FishSellers.jsx - Professional Card Design dengan Gambar Ikan
import React, { useState, useEffect } from "react";
import styles from "../../styles/admin/Dashboard.module.css"; 
import Sidebar from "../../components/admin/Sidebar";
import Header from "../../components/admin/Header";
import axios from 'axios';
import Swal from 'sweetalert2';

function FishSellers() {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFish, setSelectedFish] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fishes = [
    { 
      id: 1, 
      nama: "Ikan Bandeng", 
      image: "https://images.unsplash.com/photo-1623260858519-f910440955e5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    // { 
    //   id: 2, 
    //   nama: "Ikan Cupang", 
    //   image: "https://images.unsplash.com/photo-1520990692939-e6f1d4b6471a?w=300&h=200&fit=crop"
    // },
    { 
      id: 3, 
      nama: "Ikan Gabus", 
      image: "/icons/gabus.jpg"
    },
    { 
      id: 4, 
      nama: "Ikan Gurami", 
      image: "/icons/gurami.jpg"
    },
    { 
      id: 5, 
      nama: "Ikan Kakap", 
      image: "/icons/kakap.jpg"
    },
    { 
      id: 6, 
      nama: "Ikan Kerapu", 
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop"
    },
    { 
      id: 7, 
      nama: "Ikan Mujair", 
      image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=300&h=200&fit=crop"
    },
    { 
      id: 8, 
      nama: "Ikan Nila", 
      image: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=300&h=200&fit=crop"
    },
    { 
      id: 9, 
      nama: "Ikan Tenggiri", 
      image: "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=300&h=200&fit=crop"
    },
    { 
      id: 10, 
      nama: "Ikan Tongkol", 
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop"
    },
  ];

  const API_BASE_URL = 'http://localhost:5000/api';

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

  const getAdminToken = async () => {
    let token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (token) return token;
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/admin/token`, {
        withCredentials: true
      });
      if (response.data?.accessToken) {
        const newToken = response.data.accessToken;
        localStorage.setItem('adminToken', newToken);
        return newToken;
      }
    } catch (error) {
      console.error('Error refreshing admin token:', error);
    }
    return null;
  };

  const getAuthHeaders = async () => {
    const token = await getAdminToken();
    if (!token) throw new Error('Token admin tidak ditemukan. Silakan login kembali.');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchRecipes = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/recipes?page=${page}&limit=100`);
      if (response.data?.data) {
        setRecipes(response.data.data);
        setFilteredRecipes(response.data.data);
        setTotalPages(response.data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      Toast.fire({
        icon: 'error',
        title: 'Gagal memuat resep'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(currentPage);
  }, [currentPage]);

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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        await Swal.fire({
          icon: 'warning',
          title: 'File Tidak Valid',
          text: 'File harus berupa gambar!',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
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
            text: 'Gambar terlalu besar setelah dikompresi.',
            confirmButtonColor: '#dc2626'
          });
          setPreviewImage('');
          return;
        }
        setPreviewImage(compressedBase64);
        setRecipeData(prev => ({ ...prev, gambar: compressedBase64 }));
        Toast.fire({ icon: 'success', title: 'Gambar berhasil diunggah' });
      } catch (error) {
        console.error('Error processing image:', error);
        setPreviewImage('');
      }
    }
  };

  const handleOpenModal = (fish) => {
    setSelectedFish(fish);
    setEditingRecipe(null);
    setShowModal(true);
    setError(null);
    setSuccess(null);
    setPreviewImage('');
    setRecipeData({ judul: "", gambar: "", bahan: "", cara: "" });
  };

  const handleOpenViewModal = (fish) => {
    setSelectedFish(fish);
    const filtered = recipes.filter(r => r.fish_name.toLowerCase().includes(fish.nama.toLowerCase()));
    setFilteredRecipes(filtered);
    setShowViewModal(true);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setSelectedFish(fishes.find(f => f.nama === recipe.fish_name) || { nama: recipe.fish_name, image: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=300&h=200&fit=crop" });
    setRecipeData({
      judul: recipe.title,
      gambar: recipe.image_url || "",
      bahan: recipe.ingredients,
      cara: recipe.instructions
    });
    setPreviewImage(recipe.image_url || "");
    setShowViewModal(false);
    setShowModal(true);
  };

  const handleDeleteRecipe = async (recipeId) => {
    const result = await Swal.fire({
      title: 'Hapus Resep?',
      text: "Resep yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_BASE_URL}/recipes/${recipeId}`, { headers });
        Toast.fire({ icon: 'success', title: 'Resep berhasil dihapus' });
        fetchRecipes(currentPage);
        const filtered = recipes.filter(r => r.id !== recipeId);
        setFilteredRecipes(filtered);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: error.response?.data?.msg || 'Terjadi kesalahan',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRecipe(null);
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
    if (!recipeData.gambar && !editingRecipe) {
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

      if (editingRecipe) {
        await axios.put(`${API_BASE_URL}/recipes/${editingRecipe.id}`, payload, { headers });
        Toast.fire({ icon: 'success', title: 'Resep berhasil diperbarui' });
      } else {
        await axios.post(`${API_BASE_URL}/recipes`, payload, { headers });
        Toast.fire({ icon: 'success', title: 'Resep berhasil ditambahkan' });
      }

      handleCloseModal();
      fetchRecipes(currentPage);
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError(err.response?.data?.msg || err.message || 'Gagal menyimpan resep.');
      await Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.msg || err.message,
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter fishes by search
  const filteredFishes = fishes.filter(fish =>
    fish.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          {/* Search Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              placeholder="🔍 Cari jenis ikan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.875rem 1.25rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0891b2';
                e.target.style.boxShadow = '0 0 0 3px rgba(8, 145, 178, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
          </div>

          {/* Fish Cards Grid */}
          <div style={cardGridStyles.container}>
            {filteredFishes.map((fish) => (
              <div key={fish.id} style={cardGridStyles.card}>
                <div style={cardGridStyles.imageWrapper}>
                  <img 
                    src={fish.image} 
                    alt={fish.nama}
                    style={cardGridStyles.image}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=300&h=200&fit=crop';
                    }}
                  />
                  <div style={cardGridStyles.overlay}></div>
                </div>
                <div style={cardGridStyles.content}>
                  <h3 style={cardGridStyles.title}>{fish.nama}</h3>
                  <div style={cardGridStyles.stats}>
                    <div style={cardGridStyles.statItem}>
                      <svg style={cardGridStyles.statIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{recipes.filter(r => r.fish_name.toLowerCase().includes(fish.nama.toLowerCase())).length} Resep</span>
                    </div>
                  </div>
                  <div style={cardGridStyles.actions}>
                    <button
                      onClick={() => handleOpenModal(fish)}
                      style={cardGridStyles.btnAdd}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(8, 145, 178, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)';
                      }}
                    >
                      <svg style={cardGridStyles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah
                    </button>
                    <button
                      onClick={() => handleOpenViewModal(fish)}
                      style={cardGridStyles.btnView}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                      }}
                    >
                      <svg style={cardGridStyles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Lihat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFishes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <svg style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>Tidak ada ikan yang sesuai dengan pencarian "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Modal View All Recipes */}
        {showViewModal && (
          <div style={modalStyles.overlay}>
            <div style={{ ...modalStyles.container, maxWidth: '70rem' }}>
              <div style={modalStyles.header}>
                <div style={modalStyles.headerContent}>
                  <div style={modalStyles.fishIconWrapper}>
                    <img src={selectedFish.image} alt={selectedFish.nama} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                  <div>
                    <h3 style={modalStyles.title}>Semua Resep {selectedFish.nama}</h3>
                    <p style={modalStyles.subtitle}>Total: {filteredRecipes.length} resep</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
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

              <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ display: 'inline-block', width: '3rem', height: '3rem', border: '4px solid #e5e7eb', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>Memuat resep...</p>
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <svg style={{ width: '5rem', height: '5rem', color: '#d1d5db', margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '1.125rem' }}>Belum ada resep untuk {selectedFish.nama}</p>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleOpenModal(selectedFish);
                      }}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Tambah Resep Pertama
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredRecipes.map((recipe) => (
                      <div key={recipe.id} style={recipeCardStyles.card}>
                        <div style={recipeCardStyles.imageWrapper}>
                          {recipe.image_url ? (
                            <img src={recipe.image_url} alt={recipe.title} style={recipeCardStyles.image} />
                          ) : (
                            <div style={recipeCardStyles.noImage}>
                              <svg style={{ width: '3rem', height: '3rem', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div style={recipeCardStyles.content}>
                          <h4 style={recipeCardStyles.title}>{recipe.title}</h4>
                          <div style={recipeCardStyles.info}>
                            <span style={recipeCardStyles.fishTag}>{recipe.fish_name}</span>
                          </div>
                          <div style={recipeCardStyles.actions}>
                            <button
                              onClick={() => handleEditRecipe(recipe)}
                              style={recipeCardStyles.editBtn}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRecipe(recipe.id)}
                              style={recipeCardStyles.deleteBtn}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Add/Edit Recipe */}
        {showModal && (
          <div style={modalStyles.overlay}>
            <div style={modalStyles.container}>
              <div style={modalStyles.header}>
                <div style={modalStyles.headerContent}>
                  <div style={modalStyles.fishIconWrapper}>
                    <img src={selectedFish.image} alt={selectedFish.nama} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                  <div>
                    <h3 style={modalStyles.title}>{editingRecipe ? 'Edit Resep' : 'Tambah Resep Baru'}</h3>
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

                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>
                    <svg style={modalStyles.labelIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gambar {editingRecipe ? '(opsional)' : '*'}
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
                    {submitting ? 'Menyimpan...' : editingRecipe ? 'Update Resep' : 'Simpan Resep'}
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

// Card Grid Styles
const cardGridStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginTop: '1.5rem'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    border: '1px solid #e5e7eb',
    cursor: 'pointer'
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '180px',
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
    pointerEvents: 'none'
  },
  content: {
    padding: '1.25rem'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '0.75rem',
    lineHeight: 1.3
  },
  stats: {
    marginBottom: '1rem'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500
  },
  statIcon: {
    width: '1.125rem',
    height: '1.125rem',
    color: '#0891b2'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  },
  btnAdd: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
  },
  btnView: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
  },
  btnIcon: {
    width: '1.125rem',
    height: '1.125rem'
  }
};

// Recipe Card Styles
const recipeCardStyles = {
  card: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    border: '1px solid #e5e7eb'
  },
  imageWrapper: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    background: '#f3f4f6'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
  },
  content: {
    padding: '1.25rem'
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '0.75rem',
    lineHeight: 1.3
  },
  info: {
    marginBottom: '1rem'
  },
  fishTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.375rem 0.875rem',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    color: '#0e7490',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  },
  editBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  deleteBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
    width: '4rem',
    height: '4rem',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
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