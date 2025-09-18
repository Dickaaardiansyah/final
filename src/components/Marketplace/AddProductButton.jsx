// src/components/Marketplace/AddProductButton.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';

function AddProductButton({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      className="add-product-btn"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Tambah Produk Baru"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        zIndex: 1000
      }}
    >
      <Plus 
        size={24} 
        style={{
          transition: 'transform 0.3s ease',
          transform: isHovered ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
      />
    </button>
  );
}

export default AddProductButton;