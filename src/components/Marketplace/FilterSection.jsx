// src/components/Marketplace/FilterSection.jsx
import React from 'react';

function FilterSection({ currentFilter, onFilterChange, productCounts }) {
  const filters = [
    { 
      id: 'all', 
      label: 'Semua',
      count: productCounts.all 
    },
    { 
      id: 'terpopuler', 
      label: 'Terpopuler',
      count: productCounts.terpopuler 
    },
    { 
      id: 'harga_rendah', 
      label: 'Harga Rendah',
      count: productCounts.harga_rendah 
    },
    { 
      id: 'terbaru', 
      label: 'Terbaru',
      count: productCounts.terbaru 
    },
    { 
      id: 'rating_tinggi', 
      label: 'Rating Tinggi',
      count: productCounts.rating_tinggi 
    },
    { 
      id: 'promo', 
      label: 'Promo',
      count: productCounts.promo 
    }
  ];

  return (
    <div className="filter-tabs">
      {filters.map(filter => (
        <button
          key={filter.id}
          className={`tab-button ${currentFilter === filter.id ? 'active' : ''}`}
          data-filter={filter.id}
          onClick={() => onFilterChange(filter.id)}
        >
          <span className="tab-label">{filter.label}</span>
          {filter.count > 0 && (
            <span className="tab-count">({filter.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default FilterSection;