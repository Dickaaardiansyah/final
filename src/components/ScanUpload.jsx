import React, { useState, useRef, useEffect, useCallback } from 'react';

function ScanUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [videoStatus, setVideoStatus] = useState('initializing');
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('makanan');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000';

  // In-memory storage
  const [savedData, setSavedData] = useState({});

  useEffect(() => {
    if (savedData.analysisResult) {
      setAnalysisResult(savedData.analysisResult);
      if (savedData.selectedImage) {
        setSelectedImage(savedData.selectedImage);
      }
    }
  }, []);

  useEffect(() => {
    if (analysisResult) {
      setSavedData({
        analysisResult: analysisResult,
        selectedImage: selectedImage
      });
    }
  }, [analysisResult, selectedImage]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Silakan pilih file gambar yang valid');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 10MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setError(null);
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target.result);
          setError(null);
          analyzeImage(file);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Silakan pilih file gambar yang valid');
      }
    }
  };

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      setVideoStatus('requesting');
      setError(null);

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCamera(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }

        const handleLoadedMetadata = () => setVideoStatus('metadata-loaded');
        const handleLoadedData = () => setVideoStatus('ready');
        const handleCanPlay = () => { if (videoStatus !== 'ready') setVideoStatus('ready'); };
        const handleError = (e) => {
          setVideoStatus('error');
          setError('Error memuat video: ' + e.message);
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.addEventListener('loadeddata', handleLoadedData);
        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('error', handleError);

        videoRef.current._cameraCleanup = () => {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('loadeddata', handleLoadedData);
          videoRef.current.removeEventListener('canplay', handleCanPlay);
          videoRef.current.removeEventListener('error', handleError);
        };

        const fallbackTimeout = setTimeout(() => {
          if (videoStatus !== 'ready') setVideoStatus('ready');
        }, 3000);

        videoRef.current._fallbackTimeout = fallbackTimeout;
      }

    } catch (error) {
      setVideoStatus('error');
      
      if (error.name === 'OverconstrainedError') {
        try {
          const fallbackConstraints = { video: true };
          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          
          setStream(fallbackStream);
          setIsCamera(true);
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) await playPromise;
          }
          setVideoStatus('ready');
        } catch (fallbackError) {
          setError(`Gagal mengakses kamera: ${fallbackError.message}`);
        }
      } else {
        setError(`Gagal mengakses kamera: ${error.message}`);
      }
    }
  }, [stream, videoStatus]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError('Video belum siap. Tunggu beberapa detik dan coba lagi.');
      return;
    }

    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context not available');

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      if (width === 0 || height === 0) {
        throw new Error('Video dimensions not available yet');
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const filename = `fish-snapshot-${Date.now()}.jpg`;
      const file = dataURLtoFile(imageDataUrl, filename);
      
      setSelectedImage(imageDataUrl);
      setImageFile(file);
      stopCamera();
      setError(null);
      analyzeImage(file);
      
    } catch (error) {
      setError('Gagal mengambil foto: ' + error.message);
    }
  }, [videoStatus]);

  const dataURLtoFile = (dataURL, filename) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      if (videoRef.current._cameraCleanup) {
        videoRef.current._cameraCleanup();
      }
      if (videoRef.current._fallbackTimeout) {
        clearTimeout(videoRef.current._fallbackTimeout);
      }
      
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.load();
    }
    
    setIsCamera(false);
    setVideoStatus('stopped');
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stopCamera();
    };
  }, [stopCamera, stream]);

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/predict-image`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const formattedResult = {
          name: result.info.nama_indonesia || result.predicted_class,
          predicted_class: result.predicted_class,
          confidence: (result.confidence * 100).toFixed(1) + '%',
          habitat: result.info.habitat || 'Tidak diketahui',
          konsumsi: result.info.konsumsi || 'Tidak diketahui'
        };
        
        setAnalysisResult(formattedResult);
      } else {
        throw new Error(result.message || 'Gagal menganalisis gambar');
      }
    } catch (error) {
      setError('Gagal menganalisis gambar: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToDatabase = async () => {
    if (!analysisResult || !selectedImage) {
      alert('Tidak ada data untuk disimpan');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }

      formData.append('fish_name', analysisResult.name || analysisResult.predicted_class);
      formData.append('predicted_class', analysisResult.predicted_class);
      formData.append('confidence', parseFloat(analysisResult.confidence.replace('%', '')));
      formData.append('habitat', analysisResult.habitat);
      formData.append('konsumsi', analysisResult.konsumsi);
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch(`${API_BASE_URL}/api/save-to-dataikan`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.status === 'success' || result.success) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-toast';
        successMessage.textContent = 'Data berhasil disimpan ke database!';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

    } catch (error) {
      setError('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetScan = () => {
    setSelectedImage(null);
    setImageFile(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setError(null);
    setIsSaving(false);
    setVideoStatus('initializing');
    setShowDetail(false);
    setActiveTab('makanan');
    stopCamera();
    setSavedData({});
  };

  const toggleDetail = () => {
    setShowDetail(!showDetail);
  };

  const getVideoStatusDisplay = () => {
    const statusMap = {
      'initializing': 'Memulai kamera...',
      'requesting': 'Meminta akses kamera...',
      'metadata-loaded': 'Memuat metadata...',
      'ready': 'Siap mengambil foto',
      'error': 'Error kamera',
      'stopped': 'Kamera berhenti'
    };
    return statusMap[videoStatus] || videoStatus;
  };

  return (
    <div className="scan-container">
      <div className="scan-header">
        <h1 className="scan-title">Fishmap Ai</h1>
      </div>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}
      
      {!selectedImage && !isCamera && (
        <div 
          className="upload-zone"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <h3 className="upload-title">Upload Gambar Ikan</h3>
            <p className="upload-description">
              Drag & drop gambar atau klik untuk memilih file
            </p>
            <p className="upload-formats">Mendukung: JPG, PNG, WEBP (Max 10MB)</p>
            
            <input 
              type="file" 
              id="file-upload" 
              accept="image/*" 
              className="file-input" 
              onChange={handleFileUpload}
            />
            
            <div className="upload-actions">
              <label htmlFor="file-upload" className="btn btn-primary">
                <i className="fas fa-folder-open"></i>
                Pilih File
              </label>
              <button onClick={startCamera} className="btn btn-secondary">
                <i className="fas fa-camera"></i>
                Buka Kamera
              </button>
            </div>
          </div>
        </div>
      )}

      {isCamera && (
        <div className="camera-container">
          <div className="camera-wrapper">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="camera-video"
            />
            <canvas ref={canvasRef} className="camera-canvas" />
          </div>
          
          <div className="camera-status">
            <div className={`status-indicator status-${videoStatus}`}>
              <div className="status-icon">
                {videoStatus === 'ready' && <i className="fas fa-check-circle"></i>}
                {(videoStatus === 'requesting' || videoStatus === 'metadata-loaded') && <i className="fas fa-spinner fa-spin"></i>}
                {videoStatus === 'error' && <i className="fas fa-exclamation-triangle"></i>}
                {videoStatus === 'initializing' && <i className="fas fa-circle-notch fa-spin"></i>}
              </div>
              <span className="status-text">{getVideoStatusDisplay()}</span>
            </div>
          </div>
          
          <div className="camera-controls">
            <button 
              onClick={capturePhoto} 
              className="btn btn-capture"
              disabled={videoStatus !== 'ready' || videoRef.current?.readyState < 2}
            >
              <i className="fas fa-camera"></i>
              {videoStatus === 'ready' ? 'Ambil Foto' : 'Menunggu...'}
            </button>
            <button onClick={stopCamera} className="btn btn-cancel">
              <i className="fas fa-times"></i>
              Batal
            </button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="result-container">
          {isAnalyzing && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <h3>Menganalisis Gambar</h3>
                <p>AI sedang mengidentifikasi ikan Anda...</p>
              </div>
            </div>
          )}

          {isSaving && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <h3>Menyimpan Data</h3>
                <p>Menyimpan hasil ke database...</p>
              </div>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div className="analysis-card">
              <button onClick={resetScan} className="card-close">
                <i className="fas fa-times"></i>
              </button>
              
              <div className="card-image">
                <img src={selectedImage} alt={analysisResult.name} />
              </div>
              
              <div className="card-content">
                <div className="fish-header">
                  <h2 className="fish-name">{analysisResult.name}</h2>
                  <div className="confidence-badge">
                    <i className="fas fa-bullseye"></i>
                    {analysisResult.confidence} akurat
                  </div>
                </div>
                
                <div className="fish-details">
                  <div className="detail-item">
                    <div className="detail-label">
                      <i className="fas fa-water"></i>
                      Habitat
                    </div>
                    <div className="detail-value">{analysisResult.habitat}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">
                      <i className="fas fa-utensils"></i>
                      Status Konsumsi
                    </div>
                    <div className={`detail-value ${analysisResult.konsumsi === 'Dapat dikonsumsi' ? 'consumable' : 'non-consumable'}`}>
                      {analysisResult.konsumsi}
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">
                      <i className="fas fa-sticky-note"></i>
                      Note
                    </div>
                    <button 
                      onClick={toggleDetail}
                      className="btn-link"
                    >
                      Lihat Selengkapnya
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  onClick={saveToDatabase} 
                  className="btn btn-save"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {!analysisResult && !isAnalyzing && (
            <div className="retry-container">
              <button onClick={resetScan} className="btn btn-retry">
                <i className="fas fa-redo"></i>
                Scan Ulang
              </button>
            </div>
          )}
        </div>
      )}

      {showDetail && (
        <div className="detail-modal" onClick={toggleDetail}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>Fishsnap: AI</h2>
              <button onClick={toggleDetail} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="detail-tabs">
              <button 
                className={`detail-tab ${activeTab === 'makanan' ? 'active' : ''}`}
                onClick={() => setActiveTab('makanan')}
              >
                Makanan
              </button>
              <button 
                className={`detail-tab ${activeTab === 'budidaya' ? 'active' : ''}`}
                onClick={() => setActiveTab('budidaya')}
              >
                Budidaya
              </button>
            </div>
            
            <div className="detail-content-area">
              {activeTab === 'makanan' && (
                <div className="detail-text">
                  <p>Ikan ini biasanya diolah menjadi masakan tumis goreng berikut ini aneka aneka olahan yang dapat kamu coba:</p>
                  <ul>
                    <li>Mujair Goreng</li>
                    <li>Mujari Bumbu Merah</li>
                    <li>Dika Rendang</li>
                    <li>Maulana Bumbu Kecap</li>
                  </ul>
                </div>
              )}
              
              {activeTab === 'budidaya' && (
                <div className="detail-text">
                  <p>Tips budidaya ikan {analysisResult?.name || 'ini'}:</p>
                  <ul>
                    <li>Pastikan kualitas air tetap bersih dengan pH optimal</li>
                    <li>Berikan pakan berkualitas sesuai jadwal</li>
                    <li>Monitor kesehatan ikan secara rutin</li>
                    <li>Jaga suhu air sesuai kebutuhan spesies</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanUpload;