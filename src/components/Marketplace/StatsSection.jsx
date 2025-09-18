// src/components/Marketplace/StatsSection.jsx
import React from 'react';
import { ShoppingBag, Package, Users, Star } from 'lucide-react';

function StatsSection({ products = [] }) {
  // Calculate dynamic stats from products data
  const totalProducts = products.length;
  const categories = [...new Set(products.map(p => p.category))].length;
  const averageRating = products.length > 0 
    ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
    : '0.0';
  const totalReviews = products.reduce((sum, p) => sum + (p.reviews || 0), 0);

  const stats = [
    {
      id: 'products',
      icon: <Package size={24} />,
      value: totalProducts,
      label: 'Total Produk',
      color: 'blue'
    },
    {
      id: 'categories',
      icon: <ShoppingBag size={24} />,
      value: categories,
      label: 'Kategori',
      color: 'green'
    },
    {
      id: 'reviews',
      icon: <Users size={24} />,
      value: totalReviews > 1000 ? `${(totalReviews/1000).toFixed(1)}k` : totalReviews,
      label: 'Total Review',
      color: 'blue'
    },
    {
      id: 'rating',
      icon: <Star size={24} />,
      value: averageRating,
      label: 'Rating Rata-rata',
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

export default StatsSection;