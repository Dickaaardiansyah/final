import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

function HistoryHeader({ title, onSearchChange, searchQuery }) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="header">
      <div className="header-left">
        <button className="back-button" onClick={handleBackClick}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search fish..."
          className="search-input"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        <Search size={20} className="search-icon" />
      </div>
    </div>
  );
}

export default HistoryHeader;