// src/components/Marketplace/RegistrationPrompt.jsx
import React from 'react';

function RegistrationPrompt({ onRegister }) {
  return (
    <div 
      className="registration-prompt"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: '#ffffff',
        padding: '20px',
        backgroundColor: '#1a1a1a'
      }}
    >
      <h2 
        style={{
          fontSize: '24px',
          marginBottom: '10px',
        }}
      >
        Anda belum daftar!
      </h2>
      <p 
        style={{
          fontSize: '16px',
          color: '#a0a0a0',
          marginBottom: '20px',
          maxWidth: '400px'
        }}
      >
        Daftarkan Biodatamu terlebih dahulu untuk membuka usaha anda
      </p>
      <button 
        onClick={onRegister}
        style={{
          backgroundColor: '#007bff',
          color: '#ffffff',
          border: 'none',
          borderRadius: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Daftar
      </button>
    </div>
  );
}

export default RegistrationPrompt;