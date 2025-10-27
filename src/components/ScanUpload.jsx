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
  const [expandedItems, setExpandedItems] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  
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
      // Fetch recipes when analysis result is available
      fetchRecipes(analysisResult.name || analysisResult.predicted_class);
    }
  }, [analysisResult, selectedImage]);

  // Fetch recipes based on fish name
  const fetchRecipes = async (fishName) => {
    setIsLoadingRecipes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/fish/${encodeURIComponent(fishName)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setRecipes(result.data);
        } else {
          // Use default recipes if none found
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
        successMessage.style.cssText = `
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1001;
          font-weight: 500;
        `;
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
    setExpandedItems({});
    setRecipes([]);
    stopCamera();
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

  const toggleDetail = () => {
    setShowDetail(!showDetail);
    setExpandedItems({});
  };

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [index]: !prev[activeTab]?.[index]
      }
    }));
  };

  // Default budidaya items (always shown)
  const budidayaItems = [
    {
      name: 'Pastikan kualitas air tetap bersih dengan pH optimal',
      resep: '1. Ukur pH air secara rutin (ideal 6.5-8.5). 2. Ganti air secara berkala. 3. Gunakan filter untuk menjaga kebersihan. 4. Hindari overfeeding untuk mencegah pencemaran.',
      image: 'https://mmc.tirto.id/image/2022/06/14/istock-519915660_ratio-16x9.jpg'
    },
    {
      name: 'Berikan pakan berkualitas sesuai jadwal',
      resep: '1. Beri pakan 2-3 kali sehari. 2. Gunakan pelet dengan protein 20-30%. 3. Sesuaikan jumlah pakan dengan bobot ikan (2-3% berat tubuh). 4. Pantau sisa pakan untuk hindari polusi.',
      image: 'https://kuripan.lombokbaratkab.go.id/media/crop/2022/09/08/32-20220908-150322-785183.jpeg'
    },
    {
      name: 'Monitor kesehatan ikan secara rutin',
      resep: '1. Periksa tanda penyakit seperti lesu atau bintik putih. 2. Karantina ikan sakit. 3. Gunakan obat jika diperlukan. 4. Jaga kepadatan ikan di kolam.',
      image: 'https://gdm.id/wp-content/uploads/2022/03/ternak-ikan-mujair.jpg'
    },
    {
      name: 'Jaga suhu air sesuai kebutuhan spesies',
      resep: '1. Ideal suhu 25-30°C. 2. Gunakan pemanas jika diperlukan. 3. Hindari perubahan suhu mendadak. 4. Monitor suhu harian.',
      image: 'https://i1.wp.com/risetcdn.jatimtimes.com/images/2024/04/19/Ikan-Mujair-di-kolam-air-tawar.-Foto-Xjellypastaa-P6f3c3d128f525baf.jpg?quality=50&resize=1200,675'
    }
  ];

  // Format recipe instructions to array
  const formatInstructions = (instructions) => {
    if (!instructions) return [];
    // Split by numbers followed by dot (1. 2. 3. etc)
    const steps = instructions.split(/\d+\.\s+/).filter(step => step.trim());
    return steps;
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '40px auto',
      borderRadius: '20px',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #2563eb, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
          letterSpacing: '-0.025em'
        }}>Fishmap Ai</h1>
      </div>
      
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          margin: '1rem 0',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.125rem' }}></i>
          <span>{error}</span>
        </div>
      )}
      
      {!selectedImage && !isCamera && (
        <div 
          style={{
            background: '#ffffff',
            border: '2px dashed #d1d5db',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '4rem', color: '#2563eb', marginBottom: '1.5rem' }}>
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              Upload Gambar Ikan
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '0.5rem', fontSize: '1rem' }}>
              Drag & drop gambar atau klik untuk memilih file
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
              Mendukung: JPG, PNG, WEBP (Max 10MB)
            </p>
            
            <input 
              type="file" 
              id="file-upload" 
              accept="image/*" 
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="file-upload" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                minWidth: '140px'
              }}>
                <i className="fas fa-folder-open"></i>
                Pilih File
              </label>
              <button onClick={startCamera} style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                minWidth: '140px'
              }}>
                <i className="fas fa-camera"></i>
                Buka Kamera
              </button>
            </div>
          </div>
        </div>
      )}

      {isCamera && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          margin: '2rem 0'
        }}>
          <div style={{ position: 'relative', background: '#111827' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{ width: '100%', height: 'auto', display: 'block', minHeight: '300px', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          
          <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.8)', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: videoStatus === 'ready' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white'
            }}>
              {videoStatus === 'ready' && <i className="fas fa-check-circle"></i>}
              {(videoStatus === 'requesting' || videoStatus === 'metadata-loaded') && <i className="fas fa-spinner fa-spin"></i>}
              <span>{getVideoStatusDisplay()}</span>
            </div>
          </div>
          
          <div style={{ padding: '1.5rem', background: '#f9fafb', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={capturePhoto} 
              disabled={videoStatus !== 'ready' || videoRef.current?.readyState < 2}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: videoStatus === 'ready' ? 'pointer' : 'not-allowed',
                background: videoStatus === 'ready' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#9ca3af',
                color: 'white',
                minWidth: '180px'
              }}>
              <i className="fas fa-camera"></i>
              {videoStatus === 'ready' ? 'Ambil Foto' : 'Menunggu...'}
            </button>
            <button onClick={stopCamera} style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white'
            }}>
              <i className="fas fa-times"></i>
              Batal
            </button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div style={{ position: 'relative', margin: '2rem 0' }}>
          {isAnalyzing && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                background: 'white',
                padding: '3rem 2rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '400px',
                margin: '0 1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1.5rem'
                }}></div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  Menganalisis Gambar
                </h3>
                <p style={{ color: '#4b5563', margin: 0 }}>AI sedang mengidentifikasi ikan Anda...</p>
              </div>
            </div>
          )}

          {isSaving && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                background: 'white',
                padding: '3rem 2rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '400px',
                margin: '0 1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1.5rem'
                }}></div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  Menyimpan Data
                </h3>
                <p style={{ color: '#4b5563', margin: 0 }}>Menyimpan hasil ke database...</p>
              </div>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              margin: '2rem auto',
              maxWidth: '600px',
              position: 'relative',
              border: '1px solid #e5e7eb'
            }}>
              <button onClick={resetScan} style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backdropFilter: 'blur(4px)'
              }}>
                <i className="fas fa-times"></i>
              </button>
              
              <div style={{ position: 'relative', width: '100%', height: '250px', overflow: 'hidden' }}>
                <img src={selectedImage} alt={analysisResult.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', margin: 0, lineHeight: 1.2 }}>
                    {analysisResult.name}
                  </h2>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  }}>
                    <i className="fas fa-bullseye"></i>
                    {analysisResult.confidence} akurat
                  </div>
                </div>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      <i className="fas fa-water" style={{ color: '#2563eb', width: '16px' }}></i>
                      Habitat
                    </div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{analysisResult.habitat}</div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      <i className="fas fa-utensils" style={{ color: '#2563eb', width: '16px' }}></i>
                      Status Konsumsi
                    </div>
                    <div style={{ 
                      fontWeight: '600', 
                      color: analysisResult.konsumsi === 'Dapat dikonsumsi' ? '#10b981' : '#f59e0b'
                    }}>
                      {analysisResult.konsumsi}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      <i className="fas fa-sticky-note" style={{ color: '#2563eb', width: '16px' }}></i>
                      Note
                    </div>
                    <button 
                      onClick={toggleDetail}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      Lihat Selengkapnya
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem 2rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <button 
                  onClick={saveToDatabase} 
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.75rem',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    background: isSaving ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    minWidth: '200px'
                  }}
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
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button onClick={resetScan} style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #4b5563, #374151)',
                color: 'white'
              }}>
                <i className="fas fa-redo"></i>
                Scan Ulang
              </button>
            </div>
          )}
        </div>
      )}

      {showDetail && (
        <div 
          onClick={toggleDetail}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(16, 185, 129, 0.1))',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2rem 2.5rem',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(16, 185, 129, 0.05))',
              borderBottom: '1px solid rgba(37, 99, 235, 0.1)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backdropFilter: 'blur(20px)'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #2563eb, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🐟 Fishsnap: AI
              </h2>
              <button onClick={toggleDetail} style={{
                width: '44px',
                height: '44px',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <i className="fas fa-times" style={{ position: 'relative', zIndex: 1 }}></i>
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              padding: '0.5rem',
              gap: '0.5rem',
              background: 'rgba(243, 244, 246, 0.5)',
              margin: '1rem 1.5rem',
              borderRadius: '16px',
              position: 'relative'
            }}>
              <button 
                onClick={() => setActiveTab('makanan')}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'makanan' ? 'linear-gradient(135deg, #2563eb, #10b981)' : 'transparent',
                  color: activeTab === 'makanan' ? 'white' : '#4b5563',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  position: 'relative',
                  zIndex: 1,
                  overflow: 'hidden',
                  transition: 'all 0.3s'
                }}
              >
                Makanan
              </button>
              <button 
                onClick={() => setActiveTab('budidaya')}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'budidaya' ? 'linear-gradient(135deg, #2563eb, #10b981)' : 'transparent',
                  color: activeTab === 'budidaya' ? 'white' : '#4b5563',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  position: 'relative',
                  zIndex: 1,
                  overflow: 'hidden',
                  transition: 'all 0.3s'
                }}
              >
                Budidaya
              </button>
            </div>
            
            <div style={{
              padding: '1.5rem 2.5rem 2.5rem',
              maxHeight: '50vh',
              overflowY: 'auto'
            }}>
              {activeTab === 'makanan' && (
                <div style={{ color: '#374151', lineHeight: 1.8 }}>
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
                    <>
                      <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: '500', color: '#4b5563' }}>
                        Berikut adalah {recipes.length} resep untuk ikan {analysisResult?.name}:
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'grid', gap: '1rem' }}>
                        {recipes.map((recipe, index) => (
                          <li 
                            key={recipe.id}
                            onClick={() => toggleExpand(index)} 
                            style={{
                              padding: '1.25rem',
                              paddingLeft: '3rem',
                              position: 'relative',
                              fontSize: '0.95rem',
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))',
                              borderRadius: '16px',
                              border: '1px solid rgba(37, 99, 235, 0.1)',
                              cursor: 'pointer',
                              fontWeight: '500',
                              color: '#1f2937',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                              overflow: 'hidden',
                              transition: 'all 0.3s'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              left: '1rem',
                              top: '1.25rem',
                              color: '#10b981',
                              fontSize: '0.875rem'
                            }}>▶</div>
                            {recipe.title}
                            {expandedItems[activeTab]?.[index] && (
                              <div style={{
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '2px solid rgba(37, 99, 235, 0.1)'
                              }}>
                                {recipe.image_url && (
                                  <img 
                                    src={recipe.image_url} 
                                    alt={recipe.title} 
                                    style={{
                                      width: '100%',
                                      borderRadius: '12px',
                                      marginBottom: '1rem',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                    }}
                                  />
                                )}
                                <div style={{ marginBottom: '1rem' }}>
                                  <strong style={{ color: '#2563eb', display: 'block', marginBottom: '0.5rem' }}>
                                    Bahan-bahan:
                                  </strong>
                                  <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                    {recipe.ingredients}
                                  </p>
                                </div>
                                <div>
                                  <strong style={{ color: '#2563eb', display: 'block', marginBottom: '0.5rem' }}>
                                    Cara Membuat:
                                  </strong>
                                  <div style={{ margin: 0, lineHeight: 1.7 }}>
                                    {formatInstructions(recipe.instructions).map((step, idx) => (
                                      <div key={idx} style={{
                                        position: 'relative',
                                        paddingLeft: '2.5rem',
                                        marginBottom: '0.75rem'
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
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <i className="fas fa-utensils" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }}></i>
                      <p style={{ color: '#6b7280', margin: 0 }}>
                        Belum ada resep tersedia untuk ikan {analysisResult?.name}.
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Resep akan segera ditambahkan!
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'budidaya' && (
                <div style={{ color: '#374151', lineHeight: 1.8 }}>
                  <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: '500', color: '#4b5563' }}>
                    Tips budidaya ikan {analysisResult?.name || 'ini'}:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'grid', gap: '1rem' }}>
                    {budidayaItems.map((item, index) => (
                      <li 
                        key={index}
                        onClick={() => toggleExpand(index)} 
                        style={{
                          padding: '1.25rem',
                          paddingLeft: '3rem',
                          position: 'relative',
                          fontSize: '0.95rem',
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))',
                          borderRadius: '16px',
                          border: '1px solid rgba(37, 99, 235, 0.1)',
                          cursor: 'pointer',
                          fontWeight: '500',
                          color: '#1f2937',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          overflow: 'hidden',
                          transition: 'all 0.3s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '1.25rem',
                          color: '#10b981',
                          fontSize: '0.875rem'
                        }}>▶</div>
                        {item.name}
                        {expandedItems[activeTab]?.[index] && (
                          <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '2px solid rgba(37, 99, 235, 0.1)'
                          }}>
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              style={{
                                width: '100%',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <p style={{ color: '#374151', lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }}>
                              {item.resep}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ScanUpload;