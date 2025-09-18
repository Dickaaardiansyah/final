import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

function Layout() {
  const location = useLocation();

  // Scroll otomatis ke hash jika ada
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="layout">
      <Navbar />
      <Outlet /> {/* Ini tempat render halaman */}
      <Footer />
    </div>
  );
}

export default Layout;
