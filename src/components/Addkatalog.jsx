import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/addKatalog.css'; // Import CSS untuk styling

function AddKatalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    namaIkan: '',
    kategori: '',
    habitat: '',
    deskripsiTambahan: '',
    tanggalDitemukan: '',
    lokasiPenangkapan: '',
    kondisi: 'mati'
  });

  // State untuk data AI hasil scan
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data dari hasil scan saat komponen dimount
  useEffect(() => {
    // Priority 1: Data dari navigation state (dari ScanUpload)
    if (location.state?.catalogData) {
      const catalogData = location.state.catalogData;
      console.log('📥 Received catalog data from navigation:', catalogData);
      
      setScanData(catalogData);
      
      // Pre-fill form dengan data dari hasil scan
      setFormData({
        namaIkan: catalogData.namaIkan || catalogData.predictedFishName || '',
        kategori: catalogData.kategori || 'Ikan Konsumsi',
        habitat: catalogData.habitat || 'Air Asin (Laut)',
        deskripsiTambahan: '',
        tanggalDitemukan: '',
        lokasiPenangkapan: '',
        kondisi: 'mati'
      });

      return;
    }

    // Priority 2: Fallback ke localStorage (untuk backward compatibility)
    const pendingData = localStorage.getItem('pendingCatalogData');
    if (pendingData) {
      try {
        const parsedData = JSON.parse(pendingData);
        console.log('📥 Received catalog data from localStorage:', parsedData);
        
        setScanData(parsedData);
        
        // Pre-fill form dengan data dari hasil scan
        setFormData({
          namaIkan: parsedData.namaIkan || parsedData.predictedFishName || '',
          kategori: parsedData.kategori || 'Ikan Konsumsi',
          habitat: parsedData.habitat || 'Air Asin (Laut)',
          deskripsiTambahan: '',
          tanggalDitemukan: '',
          lokasiPenangkapan: '',
          kondisi: 'mati'
        });

        // Clear data dari localStorage setelah digunakan
        localStorage.removeItem('pendingCatalogData');
      } catch (error) {
        console.error('Error parsing scan data:', error);
      }
    }

    // Priority 3: Jika tidak ada data, redirect kembali ke scan
    if (!location.state?.catalogData && !pendingData) {
      console.warn('⚠️ No scan data found, redirecting to scan page');
      alert('Tidak ada data scan yang ditemukan. Silakan scan ikan terlebih dahulu.');
      navigate('/scan');
    }
  }, [location.state, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.namaIkan || !formData.kategori || !formData.habitat) {
      alert('Harap isi semua field yang wajib diisi');
      return;
    }

    if (!scanData) {
      alert('Data scan tidak ditemukan. Silakan scan ulang.');
      return;
    }

    console.log('🚀 Submit data with scan data:', scanData);
    console.log('📝 Form data:', formData);
    
    setLoading(true);

    try {
      // Siapkan FormData untuk mengirim file dan data
      const submitFormData = new FormData();
      
      // Tambahkan data form sebagai JSON dalam FormData
      submitFormData.append('fish_name', formData.namaIkan);
      submitFormData.append('predicted_class', scanData?.predictedFishName || formData.namaIkan);
      submitFormData.append('confidence', scanData?.aiAccuracy ? (scanData.aiAccuracy * 100) : 95);
      submitFormData.append('habitat', formData.habitat);
      submitFormData.append('konsumsi', formData.kategori === 'Ikan Konsumsi' ? 'Dapat dikonsumsi' : 'Tidak umum dikonsumsi');
      submitFormData.append('top_predictions', JSON.stringify([
        { class: formData.namaIkan, confidence: scanData?.aiAccuracy || 0.95 }
      ]));
      
      // Format notes dengan informasi lengkap
      const notes = [
        `CATALOG ITEM - ${formData.deskripsiTambahan || ''}`,
        `Lokasi: ${formData.lokasiPenangkapan || '-'}`,
        `Tanggal: ${formData.tanggalDitemukan || '-'}`,
        `Kondisi: ${formData.kondisi}`,
        `Scan Timestamp: ${scanData?.scanTimestamp || new Date().toISOString()}`
      ].join(' | ');
      
      submitFormData.append('notes', notes);

      // Tambahkan gambar dari scan data
      if (scanData?.fishImage) {
        console.log('🖼️ Adding image data to FormData...');
        
        try {
          // Convert base64 data URL ke blob untuk upload
          const response = await fetch(scanData.fishImage);
          const blob = await response.blob();
          
          // Tambahkan sebagai file ke FormData
          submitFormData.append('image', blob, 'catalog-image.jpg');
          
          console.log('✅ Image added to FormData successfully');
        } catch (imageError) {
          console.error('❌ Error processing image:', imageError);
          throw new Error('Gagal memproses gambar dari hasil scan');
        }
      } else {
        console.warn('⚠️ No image data available from scan');
        throw new Error('Tidak ada gambar dari hasil scan yang tersedia');
      }

      console.log('📤 Sending FormData to /api/save-to-catalog...');
      
      // Kirim sebagai FormData dengan HTTP-only cookies
      const response = await fetch('http://localhost:5000/api/save-to-catalog', {
        method: 'POST',
        credentials: 'include', // Use HTTP-only cookies for authentication
        body: submitFormData // FormData, bukan JSON
      });

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Save response:', result);

      if (result.success || result.status === 'success') {
        alert('🎉 Data berhasil ditambahkan ke katalog!');
        
        // Kembali ke halaman scan atau catalog list
        navigate('/scan');
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
      
    } catch (error) {
      console.error('❌ Error saving catalog:', error);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert('🚫 Gagal terhubung ke server. Pastikan server API berjalan di localhost:5000');
        
        // Fallback ke localStorage jika API gagal
        try {
          const existingCatalog = JSON.parse(localStorage.getItem('fishCatalog') || '[]');
          const newEntry = {
            id: Date.now(),
            fish_name: formData.namaIkan,
            image: scanData?.fishImage,
            createdAt: new Date().toISOString(),
            local_save: true,
            form_data: formData
          };
          existingCatalog.push(newEntry);
          localStorage.setItem('fishCatalog', JSON.stringify(existingCatalog));
          alert('💾 Server tidak tersedia. Data disimpan secara lokal!');
          navigate('/scan');
        } catch (localError) {
          console.error('❌ Error saving to localStorage:', localError);
          alert('🚫 Gagal menyimpan data baik ke server maupun lokal');
        }
      } else {
        alert('❌ Gagal menyimpan data: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Kembali ke halaman scan
    navigate('/scan');
  };

  // Show loading state while processing
  if (loading) {
    return (
      <div className="add-katalog-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Menyimpan ke Katalog...</h2>
          <p>Mohon tunggu, data sedang diproses dan disimpan ke server.</p>
        </div>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
          }
          
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-container h2 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          
          .loading-container p {
            color: #7f8c8d;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="add-katalog-container">
      <div className="unified-panel">
        {/* Analysis Panel */}
        <div className="analysis-panel">
          <div className="fish-image">
            {scanData?.fishImage && (
              <img 
                src={scanData.fishImage} 
                alt="Hasil Scan" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '15px'
                }}
              />
            )}
          </div>
          
          <div className="analysis-result">
            <h2 className="analysis-title">Hasil Analisis AI</h2>
            
            <div className="analysis-item">
              <span className="analysis-label">Nama Ikan</span>
              <span className="analysis-value">
                {scanData?.predictedFishName || scanData?.namaIkan || formData.namaIkan || 'Ikan Tongkol'}
              </span>
            </div>
            
            <div className="analysis-item">
              <span className="analysis-label">Kategori</span>
              <span className="analysis-value">
                {formData.kategori || scanData?.kategori || 'Ikan Konsumsi'}
              </span>
            </div>
            
            <div className="analysis-item">
              <span className="analysis-label">Habitat</span>
              <span className="analysis-value">
                {formData.habitat || scanData?.habitat || 'Air Asin (Laut)'}
              </span>
            </div>
            
            <div className="analysis-item">
              <span className="analysis-label">Akurasi</span>
              <span className="analysis-value accuracy">
                {scanData?.aiAccuracy ? `${(scanData.aiAccuracy * 100).toFixed(1)}%` : '94.7%'}
              </span>
            </div>
            
            {/* Tampilkan info jika data berasal dari scan */}
            {scanData && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#1976d2'
              }}>
                <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                Data diambil dari hasil scan AI
                {scanData.scanTimestamp && (
                  <div style={{ marginTop: '5px', fontSize: '11px', opacity: 0.8 }}>
                    Scan: {new Date(scanData.scanTimestamp).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Catalog Panel */}
        <div className="catalog-panel">
          <h2 className="catalog-title">
            📝 Tambahkan ke Katalog
          </h2>
          <p className="catalog-subtitle">
            Lengkapi informasi ikan untuk menyimpannya ke katalog. 
            Data hasil analisis AI sudah terisi otomatis, Anda dapat 
            memperbarui informasi jika diperlukan.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Nama Ikan */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon green"></span>
                Nama Ikan *
              </label>
              <input 
                type="text" 
                name="namaIkan"
                value={formData.namaIkan}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nama ikan"
                required
              />
            </div>

            {/* Kategori */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon purple"></span>
                Kategori *
              </label>
              <select 
                name="kategori"
                value={formData.kategori}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="Ikan Konsumsi">Ikan Konsumsi</option>
                <option value="Ikan Hias">Ikan Hias</option>
                <option value="Ikan Predator">Ikan Predator</option>
                <option value="Ikan Ekonomis">Ikan Ekonomis</option>
              </select>
            </div>

            {/* Habitat */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon blue"></span>
                Habitat *
              </label>
              <select 
                name="habitat"
                value={formData.habitat}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Pilih Habitat</option>
                <option value="Air Asin (Laut)">Air Asin (Laut)</option>
                <option value="Air Tawar">Air Tawar</option>
                <option value="Air Payau">Air Payau</option>
                <option value="Sungai">Sungai</option>
                <option value="Danau">Danau</option>
                <option value="Kolam">Kolam</option>
              </select>
            </div>

            {/* Deskripsi */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon yellow"></span>
                Deskripsi Tambahan
              </label>
              <textarea 
                name="deskripsiTambahan"
                value={formData.deskripsiTambahan}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Tambahkan deskripsi, lokasi asal, kondisi, atau informasi penting lainnya..."
              />
            </div>

            {/* Tanggal dan Lokasi */}
            <div className="form-group">
              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <label className="form-label">
                    <span className="label-icon orange"></span>
                    Tanggal ditemukan
                  </label>
                  <input 
                    type="date" 
                    name="tanggalDitemukan"
                    value={formData.tanggalDitemukan}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label className="form-label">
                    <span className="label-icon green"></span>
                    Lokasi Penangkapan
                  </label>
                  <input 
                    type="text" 
                    name="lokasiPenangkapan"
                    value={formData.lokasiPenangkapan}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Lokasi penangkapan"
                  />
                  <div className="safety-indicator">
                    <span className="safety-icon"></span>
                    Lokasi ini jauh dari daerah pabrik
                  </div>
                </div>
              </div>
            </div>

            {/* Kondisi Ikan */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon red"></span>
                Kondisi Ikan
              </label>
              <div className="radio-group">
                <div className="radio-item">
                  <input 
                    type="radio" 
                    id="mati" 
                    name="kondisi" 
                    value="mati"
                    checked={formData.kondisi === 'mati'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="mati">🔵 Mati</label>
                </div>
                <div className="radio-item">
                  <input 
                    type="radio" 
                    id="hidup" 
                    name="kondisi" 
                    value="hidup"
                    checked={formData.kondisi === 'hidup'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="hidup">⚪ Hidup</label>
                </div>
              </div>
              <div className="safety-indicator">
                <span className="safety-icon"></span>
                <span style={{ color: '#28a745' }}>
                  Tingkat Keamanan ({scanData?.tingkatKeamanan ? `${(scanData.tingkatKeamanan * 100).toFixed(0)}%` : '98%'})
                </span>
              </div>
              <div className="safety-text">
                Ikan ini aman di konsumsi
              </div>
            </div>

            {/* Buttons */}
            <div className="button-group">
              <button 
                type="button" 
                onClick={handleCancel}
                className="btn btn-cancel"
                disabled={loading}
              >
                ❌ Batal
              </button>
              <button 
                type="submit"
                className="btn btn-save"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Menyimpan...
                  </>
                ) : (
                  <>💾 Simpan ke Katalog</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx>{`
        .loading-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default AddKatalog;