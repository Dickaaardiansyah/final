// components/NotFound.jsx
import React from 'react';
import '../styles/NotFound.css'; 

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon">
          🐟
        </div>
        <h1 className="not-found-title">
          404
        </h1>
        <p className="not-found-message">
          Halaman tidak ditemukan di FishMap
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="not-found-button-primary"
        >
          Kembali ke Beranda
        </button>
        <button
          onClick={() => window.history.back()}
          className="not-found-button-secondary"
        >
          Kembali
        </button>
      </div>
    </div>
  );
};

export default NotFound;