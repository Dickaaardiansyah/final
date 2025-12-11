import React, { useState, useEffect } from 'react';
import { X, Fish, MapPin, Calendar, Target, Shield, AlertCircle, Info, ChefHat, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FishScanDetailModal({ fishScan, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('consumption');
  const [recipes, setRecipes] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState({});

  const API_BASE_URL = 'http://localhost:5000';

  // Helper function to get auth token
  const getAuthToken = () => {
    let token = localStorage.getItem('accessToken');
    if (token) return token;

    token = sessionStorage.getItem('accessToken');
    if (token) return token;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') return value;
    }
    return null;
  };

  // Helper function to create headers with auth
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch recipes when modal opens or fish changes
  useEffect(() => {
    if (isOpen && fishScan) {
      fetchRecipes(fishScan.fishData.name || fishScan.fishData.predicted_class);
    }
  }, [isOpen, fishScan]);

  // Fetch recipes based on fish name
  const fetchRecipes = async (fishName) => {
    setIsLoadingRecipes(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/recipes/fish/${encodeURIComponent(fishName)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setRecipes(result.data);
        } else {
          setRecipes([]);
        }
      } else {
        setRecipes([]);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes([]);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Format recipe instructions to array
  const formatInstructions = (instructions) => {
    if (!instructions) return [];
    const steps = instructions.split(/\d+\.\s+/).filter(step => step.trim());
    return steps;
  };

  // Toggle recipe expansion
  const toggleRecipeExpand = (index) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!isOpen || !fishScan) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const safetyPercentage = fishScan.fishData.safety_percentage || 
    (fishScan.fishData.konsumsi === 'Dapat dikonsumsi' ? 92 : 35);

  const getSafetyLevel = (percentage) => {
    if (percentage >= 81) {
      return {
        level: "Aman untuk Dikonsumsi",
        description: "Ikan ini aman untuk dikonsumsi tanpa batasan khusus",
        color: "#22c55e",
        guidance: "Dapat dikonsumsi dengan berbagai metode masak. Tidak ada batasan khusus untuk kelompok usia tertentu.",
        icon: <Shield size={20} className="safety-icon" />
      };
    } else if (percentage >= 61) {
      return {
        level: "Perlu Perhatian Khusus",
        description: "Konsumsi dengan beberapa tindakan pencegahan",
        color: "#f59e0b",
        guidance: "Hindari konsumsi berlebihan (maks. 2 porsi/minggu). Masak hingga benar-benar matang. Tidak disarankan untuk anak-anak dan ibu hamil.",
        icon: <Info size={20} className="safety-icon" />
      };
    } else if (percentage >= 41) {
      return {
        level: "Dibatasi Konsumsinya",
        description: "Hanya boleh dikonsumsi dalam jumlah terbatas",
        color: "#f97316",
        guidance: "Batasi konsumsi (maks. 1 porsi/minggu). Hindari bagian organ dalam. Masak pada suhu tinggi minimal 10 menit.",
        icon: <AlertCircle size={20} className="safety-icon" />
      };
    } else if (percentage >= 21) {
      return {
        level: "Diragukan Keamanannya",
        description: "Potensi risiko kesehatan yang signifikan",
        color: "#ef4444",
        guidance: "Hindari konsumsi kecuali dalam keadaan darurat. Jika dikonsumsi, buang semua bagian organ dalam dan kulit. Masak minimal 15 menit pada suhu tinggi.",
        icon: <AlertCircle size={20} className="safety-icon" />
      };
    } else {
      return {
        level: "Tidak Aman untuk Dikonsumsi",
        description: "Berpotensi menyebabkan keracunan atau masalah kesehatan serius",
        color: "#991b1b",
        guidance: "TIDAK DISARANKAN untuk dikonsumsi. Berpotensi mengandung racun alami atau kontaminan berbahaya yang tidak dapat dihilangkan dengan proses masak biasa.",
        icon: <AlertCircle size={20} className="safety-icon" />
      };
    }
  };

  const safetyInfo = getSafetyLevel(safetyPercentage);

  // Default budidaya items
  const budidayaItems = [
    {
      name: 'Pastikan kualitas air tetap bersih dengan pH optimal',
      description: '1. Ukur pH air secara rutin (ideal 6.5-8.5). 2. Ganti air secara berkala. 3. Gunakan filter untuk menjaga kebersihan. 4. Hindari overfeeding untuk mencegah pencemaran.'
    },
    {
      name: 'Berikan pakan berkualitas sesuai jadwal',
      description: '1. Beri pakan 2-3 kali sehari. 2. Gunakan pelet dengan protein 20-30%. 3. Sesuaikan jumlah pakan dengan bobot ikan (2-3% berat tubuh). 4. Pantau sisa pakan untuk hindari polusi.'
    },
    {
      name: 'Monitor kesehatan ikan secara rutin',
      description: '1. Periksa tanda penyakit seperti lesu atau bintik putih. 2. Karantina ikan sakit. 3. Gunakan obat jika diperlukan. 4. Jaga kepadatan ikan di kolam.'
    },
    {
      name: 'Jaga suhu air sesuai kebutuhan spesies',
      description: '1. Ideal suhu 25-30°C. 2. Gunakan pemanas jika diperlukan. 3. Hindari perubahan suhu mendadak. 4. Monitor suhu harian.'
    }
  ];

  // Data untuk tab detail
  const detailTabs = [
    {
      id: 'consumption',
      label: 'Konsumsi',
      icon: <ChefHat size={18} />,
      content: (
        <div className="detail-text">
          <div className="consumption-content">
            <h3 className="section-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
              Resep Masakan
            </h3>
            <p className="section-description" style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Berikut adalah resep untuk ikan {fishScan.fishData.name}:
            </p>
            
            {isLoadingRecipes ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ color: '#6b7280' }}>Memuat resep...</p>
              </div>
            ) : recipes.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {recipes.map((recipe, index) => (
                  <div 
                    key={recipe.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div 
                      onClick={() => toggleRecipeExpand(index)}
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        flex: 1
                      }}>
                        {recipe.title}
                      </h4>
                      <div style={{
                        color: '#10b981',
                        fontSize: '0.875rem',
                        transform: expandedRecipes[index] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }}>
                        ▶
                      </div>
                    </div>
                    
                    {expandedRecipes[index] && (
                      <div style={{
                        padding: '0 1.25rem 1.25rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        {recipe.image_url && (
                          <img 
                            src={recipe.image_url} 
                            alt={recipe.title} 
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              marginTop: '1rem',
                              marginBottom: '1rem',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        )}
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ 
                            color: '#2563eb', 
                            display: 'block', 
                            marginBottom: '0.5rem',
                            fontSize: '0.95rem'
                          }}>
                            Bahan-bahan:
                          </strong>
                          <p style={{ 
                            margin: 0, 
                            lineHeight: 1.7, 
                            whiteSpace: 'pre-line',
                            color: '#374151',
                            fontSize: '0.9rem'
                          }}>
                            {recipe.ingredients}
                          </p>
                        </div>
                        
                        <div>
                          <strong style={{ 
                            color: '#2563eb', 
                            display: 'block', 
                            marginBottom: '0.5rem',
                            fontSize: '0.95rem'
                          }}>
                            Cara Membuat:
                          </strong>
                          <div style={{ margin: 0, lineHeight: 1.7 }}>
                            {formatInstructions(recipe.instructions).map((step, idx) => (
                              <div key={idx} style={{
                                position: 'relative',
                                paddingLeft: '2.5rem',
                                marginBottom: '0.75rem',
                                fontSize: '0.9rem',
                                color: '#374151'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  width: '1.5rem',
                                  height: '1.5rem',
                                  background: 'linear-gradient(135deg, #2563eb, #10b981)',
                                  color: 'white',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  fontSize: '0.75rem'
                                }}>
                                  {idx + 1}
                                </div>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 2rem',
                background: 'rgba(249, 250, 251, 0.5)',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <i className="fas fa-utensils" style={{ 
                  fontSize: '3rem', 
                  color: '#d1d5db', 
                  marginBottom: '1rem' 
                }}></i>
                <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                  Belum ada resep tersedia untuk ikan {fishScan.fishData.name}.
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                  Resep akan segera ditambahkan!
                </p>
              </div>
            )}
          </div>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )
    },
    {
      id: 'cultivation',
      label: 'Budidaya',
      icon: <Sprout size={18} />,
      content: (
        <div className="detail-text">
          <div className="cultivation-content">
            <h3 className="section-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
              Panduan Budidaya
            </h3>
            <p className="section-description" style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Tips budidaya untuk ikan {fishScan.fishData.name}:
            </p>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {budidayaItems.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 0.75rem 0', 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ color: '#10b981' }}>•</span>
                    {item.name}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    color: '#374151', 
                    lineHeight: 1.7,
                    fontSize: '0.9rem'
                  }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <motion.div
            className="modal-content bg-gray-900/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="modal-header flex justify-between items-center p-6 border-b border-gray-700">
              <div className="header-content flex flex-col gap-2">
                <h2 id="modal-title" className="modal-title text-2xl font-bold text-white tracking-tight">
                  Detail Hasil Scan
                </h2>
                <div className="scan-id-badge bg-gray-800/50 text-gray-300 text-sm px-3 py-1 rounded-full flex items-center justify-between">
                  <span>ID: {fishScan.id}</span>
                  <button
                    className="close-button ml-2 bg-gray-800/50 text-gray-300 p-1 rounded-full hover:bg-gray-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <button
                className="close-button bg-gray-800/50 text-gray-300 p-2 rounded-full hover:bg-gray-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body p-6">
              <div className="result-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Section */}
                <motion.div
                  className="image-section rounded-xl overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="image-container relative">
                    <img
                      src={fishScan.image || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop"}
                      alt={fishScan.fishData.name}
                      className="result-image w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop";
                      }}
                    />
                    <div className="image-overlay absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="confidence-badge bg-blue-600/80 text-white px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                        <Target size={16} />
                        <span>{fishScan.fishData.confidence}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Info Section */}
                <motion.div
                  className="info-section flex flex-col gap-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="info-header flex justify-between items-start">
                    <h3 className="fish-name text-3xl font-bold text-white tracking-tight">
                      {fishScan.fishData.name}
                    </h3>
                    <div
                      className={`consumption-badge px-4 py-2 rounded-full text-sm font-semibold text-white ${
                        fishScan.fishData.konsumsi === 'Dapat dikonsumsi'
                          ? 'bg-gradient-to-r from-green-500 to-green-700'
                          : 'bg-gradient-to-r from-amber-500 to-amber-700'
                      } flex items-center justify-between`}
                    >
                      <span>
                        {fishScan.fishData.konsumsi === 'Dapat dikonsumsi' ? 'Konsumsi' : 'Hias'}
                      </span>
                    </div>
                  </div>

                  <div className="metadata-section bg-gray-800/30 rounded-xl p-4">
                    <motion.div
                      className="metadata-item flex gap-4 py-3 border-b border-gray-700/50 last:border-b-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      <Calendar size={18} className="metadata-icon text-blue-500" />
                      <div className="metadata-content">
                        <span className="metadata-label text-gray-400 text-sm">Tanggal Scan</span>
                        <span className="metadata-value text-white font-medium">{formatDate(fishScan.date)}</span>
                      </div>
                    </motion.div>
                    <motion.div
                      className="metadata-item flex gap-4 py-3 border-b border-gray-700/50 last:border-b-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <Fish size={18} className="metadata-icon text-blue-500" />
                      <div className="metadata-content">
                        <span className="metadata-label text-gray-400 text-sm">Nama Latin</span>
                        <span className="metadata-value text-white font-medium">{fishScan.fishData.predicted_class}</span>
                      </div>
                    </motion.div>
                    <motion.div
                      className="metadata-item flex gap-4 py-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    >
                      <MapPin size={18} className="metadata-icon text-blue-500" />
                      <div className="metadata-content">
                        <span className="metadata-label text-gray-400 text-sm">Habitat</span>
                        <span className="metadata-value text-white font-medium">{fishScan.fishData.habitat}</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Safety Section */}
                  <motion.div
                    className="safety-section bg-gray-800/30 rounded-xl p-4 border-l-4"
                    style={{ borderColor: safetyInfo.color }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <div className="safety-header flex items-center gap-3 mb-4">
                      <div className="safety-icon-container" style={{ color: safetyInfo.color }}>
                        {safetyInfo.icon}
                      </div>
                      <div>
                        <h4 className="safety-title text-lg font-semibold text-white">
                          Tingkat Keamanan Konsumsi
                        </h4>
                        <p className="safety-description text-gray-400 text-sm">
                          {safetyInfo.description}
                        </p>
                      </div>
                      <div className="safety-percentage-badge ml-auto bg-gray-700/50 px-3 py-1 rounded-full">
                        <span className="text-white font-bold">{safetyPercentage}%</span>
                      </div>
                    </div>
                    
                    <div className="safety-meter">
                      <div className="safety-labels flex justify-between text-sm text-gray-400 mb-2">
                        <span>Tidak Aman</span>
                        <span>Aman</span>
                      </div>
                      <div className="safety-bar h-3 bg-gray-700 rounded-full overflow-hidden relative">
                        <motion.div
                          className="safety-progress h-full rounded-full"
                          style={{ backgroundColor: safetyInfo.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${safetyPercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="safety-guidance mt-4 p-3 bg-gray-700/30 rounded-lg">
                      <div className="guidance-header flex items-center gap-2 mb-2 text-amber-400">
                        <Info size={16} />
                        <span className="font-medium text-sm">Panduan Konsumsi:</span>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">{safetyInfo.guidance}</p>
                    </div>
                  </motion.div>

                  {/* Detail Tabs */}
                  <div className="detail-tabs-container">
                    <div className="detail-tabs" style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      marginBottom: '1rem',
                      background: 'rgba(31, 41, 55, 0.5)',
                      padding: '0.5rem',
                      borderRadius: '12px'
                    }}>
                      {detailTabs.map(tab => (
                        <button
                          key={tab.id}
                          className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: 'none',
                            background: activeTab === tab.id 
                              ? 'linear-gradient(135deg, #2563eb, #10b981)' 
                              : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#9ca3af',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s'
                          }}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="detail-content-area" style={{
                      background: 'rgba(31, 41, 55, 0.3)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      minHeight: '300px',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {detailTabs.find(tab => tab.id === activeTab)?.content}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FishScanDetailModal;