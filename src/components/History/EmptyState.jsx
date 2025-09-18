import React from 'react';
import { Fish } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function EmptyState() {
  const navigate = useNavigate();

  const handleStartScanning = () => {
    navigate('/scan'); // Arahkan ke halaman scan
  };

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Fish size={64} />
      </div>
      <div className="empty-content">
        <h3 className="empty-title">Belum ada riwayat scan</h3>
        <p className="empty-description">
          Hasil scan ikan kamu akan muncul di sini setelah melakukan scan pertama
        </p>
        <button className="empty-action" onClick={handleStartScanning}>
          Mulai Scan Ikan
        </button>
      </div>
    </div>
  );
}

export default EmptyState;
