import React from 'react';
import { Fish, CheckCircle, Star } from 'lucide-react';

function StatsOverview({ transactions }) {
  const totalScans = 7; // Sesuai dengan gambar
  const consumableFish = 0; // Sesuai dengan gambar
  const ornamentalFish = 0; // Sesuai dengan gambar

  const stats = [
    {
      id: 'total',
      icon: <Fish size={24} />,
      value: totalScans,
      label: 'Total Scan',
      color: 'blue'
    },
    {
      id: 'consumable',
      icon: <CheckCircle size={24} />,
      value: consumableFish,
      label: 'Ikan Konsumsi',
      color: 'green'
    },
    {
      id: 'ornamental',
      icon: <Star size={24} />,
      value: ornamentalFish,
      label: 'Ikan Hias',
      color: 'green'
    }
  ];

  return (
    <div className="stats-overview">
      {stats.map(stat => (
        <div key={stat.id} className={`stat-card ${stat.color}`}>
          <div className="stat-icon">
            {stat.icon}
          </div>
          <div className="stat-content">
            <div className="stat-number">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsOverview;