import React, { useState, useEffect } from 'react';
import StatsOverview from './StatsOverview';
import FishTransactionList from './FishTransactionList';
import FishScanDetailModal from './FishScanDetailModal';

function HistoryContent({ searchQuery }) {
  const [fishScans, setFishScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔐 Ambil data HANYA milik user yang login
  useEffect(() => {
    const fetchMyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔑 Get token from localStorage
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setError('Anda harus login untuk melihat history');
          setLoading(false);
          return;
        }

        console.log('🔐 Fetching user-specific data with authentication...');

        // 🔒 Call AUTHENTICATED endpoint
        const res = await fetch("http://localhost:5000/api/data-ikan/my", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
          } else if (res.status === 403) {
            throw new Error('Akses ditolak');
          }
          throw new Error('Gagal mengambil data');
        }

        const result = await res.json();
        
        if (result.status === "success") {
          console.log(`✅ Successfully loaded ${result.count} personal records`);
          setFishScans(result.data);
          setFilteredScans(result.data);
        } else {
          throw new Error(result.message || 'Gagal mengambil data');
        }

      } catch (err) {
        console.error("❌ Error fetching my data:", err);
        setError(err.message);
        
        // Redirect to login if unauthorized
        if (err.message.includes('login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyData();
  }, []);

  // Filter berdasarkan search query
  useEffect(() => {
    let filtered = fishScans;

    if (searchQuery && searchQuery.trim()) {
      filtered = fishScans.filter(scan =>
        scan.fishData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.fishData.predicted_class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredScans(filtered);
  }, [fishScans, searchQuery]);

  const handleViewScan = (scanId) => {
    const scan = fishScans.find(s => s.id === scanId);
    if (scan) {
      setSelectedScan(scan);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScan(null);
  };

  const handleSaveScan = (scanId) => {
    const updatedScans = fishScans.map(scan =>
      scan.id === scanId ? { ...scan, status: 'saved' } : scan
    );
    setFishScans(updatedScans);
    alert('Scan berhasil disimpan!');
  };

  const handleAddToCatalog = (scan) => {
    alert('Navigasi ke halaman tambah katalog!');
    handleCloseModal();
  };

  const handleScanAction = (scanId, action) => {
    console.log(`${action} scan:`, scanId);
  };

  // 🔄 Handle loading state
  if (loading) {
    return (
      <div className="history-content">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="spinner"></div>
          <p>Memuat data history Anda...</p>
        </div>
      </div>
    );
  }

  // ❌ Handle error state
  if (error) {
    return (
      <div className="history-content">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem',
          color: '#e74c3c'
        }}>
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{error}</p>
          {error.includes('login') && (
            <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
              Mengalihkan ke halaman login...
            </p>
          )}
        </div>
      </div>
    );
  }

  // ℹ️ Handle empty state
  if (fishScans.length === 0) {
    return (
      <div className="history-content">
        <StatsOverview transactions={[]} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '300px',
          flexDirection: 'column',
          gap: '1rem',
          color: '#7f8c8d'
        }}>
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>
            Belum ada data scan
          </p>
          <p style={{ fontSize: '0.95rem' }}>
            Lakukan scan ikan pertama Anda untuk melihat history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-content">
      <StatsOverview transactions={filteredScans} />
      
      <FishTransactionList
        fishScans={filteredScans}
        onViewScan={handleViewScan}
        onScanAction={handleScanAction}
      />

      <FishScanDetailModal
        fishScan={selectedScan}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveScan}
        onAddToCatalog={handleAddToCatalog}
      />
    </div>
  );
}

export default HistoryContent;