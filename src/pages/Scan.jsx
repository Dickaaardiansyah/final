// D:\Projek Kominfo\project-kominfo-2\src\pages\Scan.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import ScanHero from '../components/ScanHero';
import ScanUpload from '../components/ScanUpload';
import '../styles/main.css';
import '../styles/scan.css';

function Scan() {
  return (
    <div className="scan">
      <Navbar />
      <ScanHero />
      <ScanUpload />
    </div>
  );
}

export default Scan;