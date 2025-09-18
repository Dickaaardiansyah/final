import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/main.css';
import axios from 'axios';

function Katalog() {
  // State untuk filter aktif dan data ikan
  const [filter, setFilter] = useState('all');
  const [fishData, setFishData] = useState([]);
  const [allFishData, setAllFishData] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Data placeholder untuk ikan (tetap ada sebagai fallback)
  const initialFishData = [
    {
      id: 1,
      name: 'Ikan Kakap',
      type: 'konsumsi',
      description: 'Ikan laut yang populer untuk konsumsi.',
      size: '30-60 cm',
      habitat: 'Perairan pantai',
      image: null // Placeholder tidak punya gambar
    },
    {
      id: 2,
      name: 'Ikan Guppy',
      type: 'hias',
      description: 'Ikan hias kecil dengan warna cerah.',
      size: '3-6 cm',
      habitat: 'Akuarium',
      image: null
    },
    {
      id: 3,
      name: 'Ikan Tongkol',
      type: 'konsumsi',
      description: 'Ikan pelagis yang sering diolah menjadi makanan.',
      size: '40-100 cm',
      habitat: 'Laut lepas',
      image: null
    },
    {
      id: 4,
      name: 'Ikan Cupang',
      type: 'hias',
      description: 'Ikan hias dengan sirip indah.',
      size: '5-7 cm',
      habitat: 'Akuarium',
      image: null
    },
  ];

  // Fungsi untuk menentukan tipe ikan dari kategori atau consumption_safety
  const determineType = (kategori, consumptionSafety) => {
    // Prioritas dari kategori database dulu
    if (kategori) {
      const cat = kategori.toLowerCase();
      if (cat.includes('konsumsi') || cat.includes('pangan')) return 'konsumsi';
      if (cat.includes('hias') || cat.includes('ornamental')) return 'hias';
    }
    
    // Fallback ke consumption safety
    if (!consumptionSafety) return 'konsumsi';
    
    const safety = consumptionSafety.toLowerCase();
    if (safety.includes('aman') || safety.includes('konsumsi') || safety.includes('dimakan') || safety.includes('dapat dikonsumsi')) {
      return 'konsumsi';
    } else {
      return 'hias';
    }
  };

  // Fungsi untuk memvalidasi dan memformat base64 image
  const formatImageData = (fishImage) => {
    if (!fishImage) {
      console.log('No fish image data');
      return null;
    }
    
    console.log('Raw fish image data:', {
      length: fishImage.length,
      starts_with: fishImage.substring(0, 30),
      has_data_prefix: fishImage.startsWith('data:')
    });
    
    try {
      // Jika sudah dalam format data URL yang lengkap
      if (fishImage.startsWith('data:image/')) {
        console.log('Image already has data: prefix');
        return fishImage;
      }
      
      // Jika hanya base64 string tanpa prefix, tambahkan prefix
      if (fishImage.length > 50) {
        const formatted = `data:image/jpeg;base64,${fishImage}`;
        console.log('Added data: prefix to base64');
        return formatted;
      }
      
      console.log('Image data too short, treating as invalid');
      return null;
    } catch (error) {
      console.error('Error formatting image data:', error);
      return null;
    }
  };

  // ⭐ UPDATED: Fungsi untuk mengambil data dari PUBLIC catalog API
  const fetchFishData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching PUBLIC catalog data from API...');
      
      // ⭐ CHANGED: Gunakan endpoint catalog entries yang public (tanpa auth)
      const response = await axios.get(`${API_BASE_URL}/api/catalog/entries?limit=50`);
      
      console.log('Public Catalog API Response:', response.data);
      
      if (response.data.msg === 'Katalog ikan berhasil diambil' && response.data.data.length > 0) {
        // Transform data dari catalog API ke format yang sama dengan initialFishData
        const catalogData = response.data.data.map(item => {
          console.log('Raw catalog item:', {
            id: item.id,
            namaIkan: item.namaIkan,
            predictedFishName: item.predictedFishName,
            fish_image_exists: !!item.fishImage,
            kategori: item.kategori
          });
          
          const formattedImage = formatImageData(item.fishImage);
          
          const displayName = item.namaIkan || item.predictedFishName || 'Unknown Fish';
          const fishType = determineType(item.kategori, item.consumptionSafety);
          
          console.log(`Catalog item ${item.id} processed:`, {
            name: displayName,
            type: fishType,
            originalImageExists: !!item.fishImage,
            formattedImageExists: !!formattedImage
          });
          
          return {
            id: `catalog_${item.id}`, // Prefix untuk membedakan dengan placeholder
            name: displayName,
            type: fishType,
            description: item.deskripsiTambahan || item.habitat || `Ikan ${displayName} dari database katalog`,
            size: 'Sesuai habitat alami', // Default size
            habitat: item.habitat || item.lokasiPenangkapan || 'Habitat alami',
            image: formattedImage,
            // Tambahan data dari catalog API
            contributor: item.user?.name || 'Kontributor',
            location: item.lokasiPenangkapan,
            dateFound: item.tanggalDitemukan,
            condition: item.kondisiIkan,
            safeConsumption: item.amanDikonsumsi,
            isFromCatalog: true
          };
        });
        
        console.log('Transformed catalog data:', catalogData);
        
        // ⭐ Prioritaskan data catalog, placeholder sebagai fallback
        if (catalogData.length > 0) {
          setAllFishData(catalogData);
          setFishData(catalogData);
          console.log(`✅ Loaded ${catalogData.length} items from public catalog`);
        } else {
          console.log('📝 No catalog data, using placeholder');
          setAllFishData(initialFishData);
          setFishData(initialFishData);
        }
      } else {
        console.log('📝 No catalog data from API, using placeholder data');
        // Jika tidak ada data dari catalog API, gunakan data placeholder
        setAllFishData(initialFishData);
        setFishData(initialFishData);
      }
    } catch (error) {
      console.error('❌ Error fetching catalog data:', error);
      
      // ⭐ Fallback: Coba endpoint lama jika catalog endpoint gagal
      try {
        console.log('🔄 Fallback: Trying old scan endpoint...');
        const fallbackResponse = await axios.get(`${API_BASE_URL}/api/get-scans`);
        
        if (fallbackResponse.data.status === 'success' && fallbackResponse.data.data.length > 0) {
          const scanData = fallbackResponse.data.data.map(item => ({
            id: `scan_${item.id}`,
            name: item.fish_name || item.predicted_class,
            type: determineType(null, item.consumption_safety),
            description: `Hasil scan dengan confidence ${item.confidence}`,
            size: 'Data tidak tersedia',
            habitat: item.habitat || 'Tidak diketahui',
            image: formatImageData(item.fish_image),
            confidence: item.confidence,
            consumption_safety: item.consumption_safety,
            prediction_date: item.prediction_date,
            isFromScan: true
          }));
          
          console.log('✅ Fallback: Loaded scan data', scanData.length);
          const combinedData = [...scanData, ...initialFishData];
          setAllFishData(combinedData);
          setFishData(combinedData);
        } else {
          throw new Error('No fallback data available');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        // Ultimate fallback ke data placeholder
        setAllFishData(initialFishData);
        setFishData(initialFishData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data saat komponen dimuat
  useEffect(() => {
    fetchFishData();
  }, []);

  // Fungsi untuk memfilter ikan berdasarkan tipe
  const filterFish = (type) => {
    setFilter(type);
    if (type === 'all') {
      setFishData(allFishData);
    } else {
      const filtered = allFishData.filter((fish) => fish.type === type);
      setFishData(filtered);
    }
  };

  // Fungsi untuk handle error loading image
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.style.backgroundImage);
    e.target.style.backgroundImage = 'none';
    e.target.style.backgroundColor = '#f0f0f0';
  };

  return (
    <section className="section" id="katalog">
      <h2 className="section-title">Katalog Ikan</h2>
      <p className="section-subtitle">
        Katalog lengkap ikan dari database komunitas kontributor Fishmap AI.
      </p>
      <div className="katalog-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => filterFish('all')}
        >
          Semua ({allFishData.length})
        </button>
        <button
          className={`filter-btn ${filter === 'konsumsi' ? 'active' : ''}`}
          onClick={() => filterFish('konsumsi')}
        >
          Konsumsi ({allFishData.filter(f => f.type === 'konsumsi').length})
        </button>
        <button
          className={`filter-btn ${filter === 'hias' ? 'active' : ''}`}
          onClick={() => filterFish('hias')}
        >
          Hias ({allFishData.filter(f => f.type === 'hias').length})
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <br />
          Memuat katalog dari database...
        </div>
      ) : (
        <div className="fish-grid">
          {fishData.map((fish) => {
            console.log(`Rendering fish ${fish.id}:`, {
              name: fish.name,
              type: fish.type,
              hasImage: !!fish.image,
              source: fish.isFromCatalog ? 'catalog' : (fish.isFromScan ? 'scan' : 'placeholder')
            });
            
            return (
              <div key={fish.id} className="fish-card">
                <div 
                  className="fish-image"
                  style={{
                    backgroundImage: fish.image ? `url("${fish.image}")` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#f0f0f0',
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                  onError={handleImageError}
                >
                  {!fish.image && (
                    <div style={{ 
                      color: '#999', 
                      fontSize: '14px',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-fish" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                      Tidak ada gambar
                    </div>
                  )}
                  
                  {/* Badge untuk menunjukkan sumber data */}
                  {fish.isFromCatalog && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      KATALOG
                    </div>
                  )}
                  
                  {fish.isFromScan && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#4a90e2',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      SCAN
                    </div>
                  )}
                </div>
                <div className="fish-info">
                  <h3>{fish.name}</h3>
                  <p>{fish.description}</p>
                  <div className="fish-stats">
                    <span>Ukuran: {fish.size}</span>
                    <span>Habitat: {fish.habitat}</span>
                  </div>
                  
                  {/* Tampilkan info tambahan untuk data dari catalog */}
                  {fish.isFromCatalog && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#666',
                      borderTop: '1px solid #eee',
                      paddingTop: '8px'
                    }}>
                      <div>👤 Kontributor: {fish.contributor}</div>
                      {fish.location && (
                        <div>📍 Lokasi: {fish.location}</div>
                      )}
                      {fish.dateFound && (
                        <div>📅 Ditemukan: {new Date(fish.dateFound).toLocaleDateString('id-ID')}</div>
                      )}
                      {fish.safeConsumption !== undefined && (
                        <div style={{ color: fish.safeConsumption ? '#10b981' : '#ef4444' }}>
                          {fish.safeConsumption ? '✅ Aman dikonsumsi' : '⚠️ Tidak untuk konsumsi'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tampilkan info tambahan untuk data dari scan */}
                  {fish.isFromScan && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#666',
                      borderTop: '1px solid #eee',
                      paddingTop: '8px'
                    }}>
                      <div>🎯 Confidence: {fish.confidence}</div>
                      {fish.prediction_date && (
                        <div>📅 Scan: {new Date(fish.prediction_date).toLocaleDateString('id-ID')}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {fishData.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐟</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Katalog Masih Kosong
          </h3>
          <p style={{ fontSize: '16px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Belum ada kontributor yang menambahkan ikan ke katalog database.
          </p>
          <NavLink 
            to="/scan" 
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              display: 'inline-block'
            }}
          >
            🔍 Mulai Scan & Kontribusi
          </NavLink>
        </div>
      )}
      
      <div className="load-more">
        <NavLink to="/toko" className="load-more-btn">
          Belanja di Marketplace
        </NavLink>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

export default Katalog;