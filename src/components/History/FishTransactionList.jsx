import React from 'react';
import FishScanItem from './FishScanItem';
import EmptyState from './EmptyState';

function FishTransactionList({ fishScans, onViewScan, onScanAction }) {
  if (fishScans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="fish-scan-list">
      <h3 className="list-title">Riwayat Scan Ikan</h3>
      <div className="scan-items">
        {fishScans.map(scan => (
          <FishScanItem
            key={scan.id}
            fishScan={scan}
            onViewScan={onViewScan}
            onScanAction={onScanAction}
          />
        ))}
      </div>
    </div>
  );
}

export default FishTransactionList;