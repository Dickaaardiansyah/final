// src/components/Marketplace/UploadIDPage.jsx - FIXED functionality with ORIGINAL styling
import React, { useState } from 'react';
import { ArrowLeft, Upload, Check } from 'lucide-react';

function UploadIDPage({ onBack, onContinue }) {
  const [selectedIDType, setSelectedIDType] = useState('ktp');
  const [isUploaded, setIsUploaded] = useState(false);

  // FIXED: Use cookies instead of localStorage token
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('ktp', file);
      
      try {
        // FIXED: Use cookies authentication instead of Authorization header
        const response = await fetch('http://localhost:5000/api/catalog/upload-ktp', {
          method: 'POST',
          credentials: 'include', // Use HTTP cookies for authentication
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          setIsUploaded(true);
          console.log('KTP uploaded:', result.ktpUrl);
        } else {
          alert('Gagal mengunggah KTP');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Gagal mengunggah KTP');
      }
    }
  };

  return (
    <div className="upload-id-page">
      <div className="upload-id-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="upload-id-title">Unggah Foto ID</h2>
      </div>

      <div className="upload-id-content">
        <p className="upload-id-description">
          Kami Memerlukan foto KTP untuk memverifikasi identitas Anda
        </p>

        <div className="id-type-selection">
          <h3 className="id-type-title">Pilih Salah 1 Untuk Menggunakan ID Lain</h3>
          <div className="id-type-options">
            <button
              className={`id-type-btn ${selectedIDType === 'sim' ? 'selected' : ''}`}
              onClick={() => setSelectedIDType('sim')}
            >
              SIM
            </button>
            <button
              className={`id-type-btn ${selectedIDType === 'ktp' ? 'selected' : ''}`}
              onClick={() => setSelectedIDType('ktp')}
            >
              KTP
            </button>
          </div>
        </div>

        <div className="upload-section">
          <div className="upload-area">
            <input
              type="file"
              id="id-upload"
              accept="image/*"
              onChange={handleFileUpload}
              className="upload-input"
            />
            <label htmlFor="id-upload" className="upload-label">
              {isUploaded ? (
                <>
                  <Check size={48} color="#28a745" />
                  <span>Foto Berhasil Diunggah</span>
                </>
              ) : (
                <>
                  <Upload size={48} />
                  <span>Klik untuk mengunggah foto {selectedIDType.toUpperCase()}</span>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          className="continue-btn"
          onClick={onContinue}
          disabled={!isUploaded}
          style={{
            backgroundColor: isUploaded ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: isUploaded ? 'pointer' : 'not-allowed',
            marginTop: '20px',
            width: '100%'
          }}
        >
          Lanjutkan
        </button>
      </div>
    </div>
  );
}

export default UploadIDPage;