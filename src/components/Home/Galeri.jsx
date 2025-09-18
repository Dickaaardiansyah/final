import React, { useState, useEffect } from 'react';
import '../../styles/main.css';

function Galeri() {
  // State untuk menyimpan data galeri, status loading, dan error
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk mengambil data galeri dari API
  const fetchGalleryData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/galery'); // Ganti dengan URL backend Anda
      const result = await response.json();

      if (response.ok) {
        setGalleryItems(result.data); // Simpan data galeri ke state
        setLoading(false);
      } else {
        throw new Error(result.msg || 'Gagal mengambil data galeri');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Panggil fetchGalleryData saat komponen dimount
  useEffect(() => {
    fetchGalleryData();
  }, []);

  // Tampilkan loading, error, atau data
  if (loading) {
    return <div className="section" id="galeri">Memuat data...</div>;
  }

  if (error) {
    return <div className="section" id="galeri">Error: {error}</div>;
  }

  return (
    <section className="section" id="galeri">
      <h2 className="section-title">Galeri Keajaiban Laut</h2>
      <p className="section-subtitle">
        Jelajahi keindahan bawah laut melalui koleksi gambar yang menakjubkan.
      </p>
      <div className="gallery-container">
        {galleryItems.map((item) => (
          <div key={item.id} className="gallery-item">
            <img
              src={
                item.gambar.startsWith('data:image')
                  ? item.gambar // Jika base64
                  : `/uploads/${item.gambar}` // Jika URL path
              }
              alt={item.nama}
              className="gallery-image"
            />
            <div className="gallery-info">
              <h3>{item.nama}</h3>
              <p>{item.deskripsi}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Galeri;