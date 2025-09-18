import React from 'react';
import { Clock, Calendar, ChevronRight } from 'lucide-react';

function FishScanItem({ fishScan, onViewScan, onScanAction }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="fish-scan-item"
      onClick={() => onViewScan(fishScan.id)}
      style={{ cursor: 'pointer' }}
    >
      <div className="consumption-badge">
        <span className={`badge ${fishScan.fishData.konsumsi === 'Dapat dikonsumsi' ? 'consumable' : 'ornamental'}`}>
          {fishScan.fishData.konsumsi === 'Dapat dikonsumsi' ? 'Konsumsi' : 'Hias'}
        </span>
      </div>

      <h3 className="fish-title">{fishScan.fishData.name}</h3>
      
      <div className="fish-meta">
        <div className="scan-time">
          <Clock size={16} />
          <span>{formatTime(fishScan.date)}</span>
        </div>
      </div>

      <div className="scan-date">
        <Calendar size={16} />
        <span>{formatDate(fishScan.date)}</span>
      </div>

      <ChevronRight size={20} className="chevron-icon" />
    </div>
  );
}

export default FishScanItem;