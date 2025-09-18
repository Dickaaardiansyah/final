import React from 'react';
import '../styles/main.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>Tentang Kami</h3>
            <p>
              Fishmap AI adalah platform untuk menjelajahi keajaiban laut dengan teknologi AI terkini.
            </p>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Tautan Cepat</h3>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#katalog">Katalog</a></li>
              <li><a href="#galeri">Galeri</a></li>
              <li><a href="#cuaca">Cuaca</a></li>
              <li><a href="#kontak">Kontak</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Layanan Publik</h3>
            <ul>
              <li><a href="#">Panduan Memancing</a></li>
              <li><a href="#">Identifikasi Ikan</a></li>
              <li><a href="#">Prakiraan Cuaca</a></li>
              <li><a href="#">Edukasi Ekosistem</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Kontak Kami</h3>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>Jl. Lautan No. 123, Jakarta, Indonesia</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <span>+62 123 456 7890</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <span>info@fishmap.ai</span>
            </div>
          </div>
        </div>
        <div className="footer-divider">
          <p>&copy; 2025 Fishmap AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;