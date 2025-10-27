import React, { useState, useEffect } from 'react';
import StatsOverview from './StatsOverview';
import FishTransactionList from './FishTransactionList';
import FishScanDetailModal from './FishScanDetailModal';

function HistoryContent({ searchQuery }) {
  const [fishScans, setFishScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔥 Ambil data dari API /api/data-ikan
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/data-ikan");
        const result = await res.json();
        if (result.status === "success") {
          setFishScans(result.data);
          setFilteredScans(result.data); // Tampilkan semua data tanpa filter
        }
      } catch (err) {
        console.error("Error fetching data_ikan:", err);
      }
    };
    fetchData();
  }, []);

  // Filter hanya berdasarkan search query
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