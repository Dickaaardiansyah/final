import React from 'react';

function FilterTabs({ currentFilter, onFilterChange, transactionCounts }) {
  const filters = [
    { 
      id: 'all', 
      label: 'Semua',
      count: transactionCounts.all 
    },
    { 
      id: 'consumable', 
      label: 'Konsumsi',
      count: transactionCounts.consumable 
    },
    { 
      id: 'ornamental', 
      label: 'Hias',
      count: transactionCounts.ornamental 
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
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;