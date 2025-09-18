import React, { useState, useEffect } from 'react';
import FilterTabs from './FilterTabs';
import StatsOverview from './StatsOverview';
import FishTransactionList from './FishTransactionList';
import FishScanDetailModal from './FishScanDetailModal';

function HistoryContent({ searchQuery }) {
  const [fishScans, setFishScans] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('consumable');
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
          setFilteredScans(result.data.filter(scan => scan.fishData.konsumsi === 'Dapat dikonsumsi'));
        }
      } catch (err) {
        console.error("Error fetching data_ikan:", err);
      }
    };
    fetchData();
  }, []);

  // Filter scans berdasarkan kategori + search
  useEffect(() => {
    let filtered = fishScans;

    if (currentFilter === 'consumable') {
      filtered = fishScans.filter(scan => scan.fishData.konsumsi === 'Dapat dikonsumsi');
    } else if (currentFilter === 'ornamental') {
      filtered = fishScans.filter(scan => scan.fishData.konsumsi === 'Tidak untuk konsumsi');
    } else if (currentFilter === 'saved') {
      filtered = fishScans.filter(scan => scan.status === 'saved');
    }

    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(scan =>
        scan.fishData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.fishData.predicted_class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredScans(filtered);
  }, [fishScans, currentFilter, searchQuery]);

  const handleFilterChange = (filter) => setCurrentFilter(filter);

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
      <FilterTabs
        currentFilter={currentFilter}
        onFilterChange={handleFilterChange}
        transactionCounts={{
          all: fishScans.length,
          consumable: fishScans.filter(s => s.fishData.konsumsi === 'Dapat dikonsumsi').length,
          ornamental: fishScans.filter(s => s.fishData.konsumsi === 'Tidak untuk konsumsi').length,
          saved: fishScans.filter(s => s.status === 'saved').length
        }}
      />
      
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
