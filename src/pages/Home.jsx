import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Home/Hero';
import Gallery from '../components/Home/Galeri';
import Weather from '../components/Home/Cuaca';
import '../styles/main.css';

function Home() {
  return (
    <div className="home">
      <Navbar />
      <Hero />
      <Gallery />
      <Weather />
      {/* <Contact /> */}
    </div>
  );
}

export default Home;