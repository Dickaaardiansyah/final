// D:\Projek Kominfo\project-kominfo-2\src\components\Hero.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/main.css';

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <h1>Keajaiban Laut Bersama Fishmap AI</h1>
        <p>
          Temukan dunia bawah laut dengan teknologi AI terkini. Identifikasi ikan, pelajari ekosistem laut, dan nikmati pengalaman interaktif yang mendidik dan menyenangkan.
        </p>
        <button 
          onClick={() => navigate('/scan')} 
          className="cta-button"
        >
          Scan disini
        </button>
      </div>
      <div className="hero-image">
        <div className="fish-visual">
          <div className="betta-body"></div>
          <div className="dorsal-fin"></div>
          <div className="anal-fin"></div>
          <div className="pectoral-fin-left"></div>
          <div className="pectoral-fin-right"></div>
          <div className="caudal-fin"></div>
          <div className="tail-extension-1"></div>
          <div className="tail-extension-2"></div>
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
        </div>
      </div>
    </section>
  );
}

export default Hero;