import React, { useState } from "react";
import "../../styles/main.css";

function Kontak() {
  // State untuk input formulir dan pesan konfirmasi
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitMessage, setSubmitMessage] = useState("");

  // Handler untuk perubahan input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler untuk submit formulir
  const handleSubmit = () => {
    // Simulasi pengiriman formulir (ganti dengan logika API jika diperlukan)
    setSubmitMessage("Terima kasih! Pesan Anda telah dikirim.");
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSubmitMessage(""), 3000); // Hapus pesan setelah 3 detik
  };

  return (
    <section id="kontak" className="contact-section">
      <div className="contact-container">
        <h2 className="contact-title">Hubungi Kami</h2>
        <div className="contact-divider"></div>
        <p className="contact-subtitle">
          Kami siap membantu Anda dengan pertanyaan atau informasi yang
          dibutuhkan. Kirim pesan atau kunjungi kami!
        </p>
        <div className="contact-grid">
          <div className="contact-form-container">
            <div className="contact-card">
              <h3>Kirim Pesan</h3>
              <div className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Nama</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama Anda"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Masukkan email Anda"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subjek</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Masukkan subjek"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Pesan</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tulis pesan Anda"
                    rows="5"
                  ></textarea>
                </div>
                <button onClick={handleSubmit}>Kirim Pesan</button>
              </div>
              {submitMessage && (
                <p className="submit-message">{submitMessage}</p>
              )}
            </div>
          </div>
          <div className="contact-info-container">
            <div className="contact-card">
              <h3>Informasi Kontak</h3>
              <div className="contact-info-item">
                <i className="fas fa-map-marker-alt contact-info-icon"></i>
                <div>
                  <h4>Alamat</h4>
                  <p>Jl. Lautan No. 123, Jakarta, Indonesia</p>
                </div>
              </div>
              <div className="contact-info-item">
                <i className="fas fa-phone contact-info-icon"></i>
                <div>
                  <h4>Telepon</h4>
                  <p>+62 123 456 7890</p>
                </div>
              </div>
              <div className="contact-info-item">
                <i className="fas fa-envelope contact-info-icon"></i>
                <div>
                  <h4>Email</h4>
                  <p>info@fishmap.ai</p>
                </div>
              </div>
              <div className="contact-info-item">
                <i className="fas fa-clock contact-info-icon"></i>
                <div>
                  <h4>Jam Kerja</h4>
                  <p>Senin - Jumat, 09:00 - 17:00 WIB</p>
                </div>
              </div>
              <div className="social-links">
                <h4>Ikuti Kami</h4>
                <div className="social-icons">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="office-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3948.7931749926124!2d114.35397517505679!3d-8.223543091809065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd15ab572a9dd93%3A0x9852707256a22fd3!2sDinas%20Komunikasi%2C%20Informatika%20dan%20Persandian%20Kabupaten%20Banyuwangi!5e0!3m2!1sid!2sid!4v1753845253606!5m2!1sid!2sid"
                title="Peta Kantor Fishmap AI"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Kontak;
