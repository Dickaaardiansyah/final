import React, { useState, useEffect } from 'react';
import '../../styles/main.css';

function Cuaca() {
  const [mapType, setMapType] = useState('wind');
  const [weatherTips, setWeatherTips] = useState([]);

  const weatherData = [
    {
      id: 1,
      icon: '☀️',
      temperature: '28°C',
      condition: 'Cerah',
      details: 'Kelembapan: 65% | Angin: 10 km/j',
    },
    {
      id: 2,
      icon: '🌧️',
      temperature: '24°C',
      condition: 'Hujan Ringan',
      details: 'Kelembapan: 80% | Angin: 15 km/j',
    },
    {
      id: 3,
      icon: '☁️',
      temperature: '26°C',
      condition: 'Berawan',
      details: 'Kelembapan: 70% | Angin: 12 km/j',
    },
  ];

  const tipsData = {
    wind: [
      'Panah menunjukkan arah dan kecepatan angin; panah rapat = angin kencang.',
      'Warna hijau → sedang, kuning/merah → angin sangat kencang (30+ km/j).',
      'Angin timur laut umumnya membawa udara dingin dan kering.',
      'Waspadai area turbulen di laut terbuka yang berwarna merah tua.',
    ],
    temperature: [
      'Warna biru = suhu rendah (<20°C), merah = tinggi (>30°C).',
      'Perubahan gradasi tajam = pertemuan massa udara berbeda (front).',
      'Suhu laut >28°C dapat memicu pembentukan siklon tropis.',
      'Suhu permukaan yang stabil membantu prediksi gelombang laut.',
    ],
    precipitation: [
      'Biru muda = hujan ringan (<2 mm/jam), biru tua = sedang (2–5 mm/jam).',
      'Kuning–merah = hujan deras (>10 mm/jam), merah tua = badai petir.',
      'Warna ungu = intensitas ekstrem atau curah hujan sangat tinggi.',
      'Lihat area gelap menyebar luas untuk prediksi banjir lokal.',
    ],
    storm: [
      'Lingkaran berputar dengan tekanan rendah di tengah = indikasi siklon.',
      'Gradasi merah pekat = badai sangat kuat (angin >100 km/j).',
      'Jalur spiral dan rotasi = sistem badai tropis aktif.',
      'Pantau pusat badai dan arah geraknya untuk mitigasi risiko.',
    ],
    wave: [
      'Warna biru = gelombang rendah (<1 m), hijau = sedang (1–2 m).',
      'Kuning–merah = gelombang tinggi (>2 m), berisiko untuk pelayaran.',
      'Lihat vektor panah untuk arah dan periode gelombang.',
      'Area merah pekat berarti gelombang besar (hingga 4–6 m) perlu dihindari.',
    ],
  };

  const mapUrls = {
    wind: 'https://www.ventusky.com/?p=-6.2;106.8;5&l=wind-10m',
    temperature: 'https://www.ventusky.com/?p=-6.2;106.8;5&l=temperature-2m',
    precipitation: 'https://www.ventusky.com/?p=-6.2;106.8;5&l=rain',
    storm: 'https://www.ventusky.com/?p=-6.2;106.8;5&l=pressure',
    wave: 'https://www.ventusky.com/?p=-6.2;106.8;5&l=waves',
  };

  const getTipsTitle = (type) => {
    const titles = {
      wind: 'Tips Membaca Peta Angin',
      temperature: 'Tips Membaca Peta Suhu',
      precipitation: 'Tips Membaca Peta Curah Hujan',
      storm: 'Tips Membaca Peta Badai',
      wave: 'Tips Membaca Peta Ombak',
    };
    return titles[type] || 'Tips Membaca Peta Cuaca';
  };

  useEffect(() => {
    setWeatherTips(tipsData[mapType]);
  }, [mapType]);

  return (
    <section className="section" id="cuaca">
      <h2 className="section-title">Informasi Cuaca</h2>
      <p className="section-subtitle">
        Pantau kondisi cuaca terkini untuk perjalanan laut yang aman dan nyaman.
      </p>

      <div className="weather-container">
        {weatherData.map((weather) => (
          <div key={weather.id} className="weather-card">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-temp">{weather.temperature}</div>
            <div className="weather-condition">{weather.condition}</div>
            <div className="weather-details">{weather.details}</div>
          </div>
        ))}
      </div>

      <div className="map-controls">
        <button className={`map-control-btn ${mapType === 'wind' ? 'active' : ''}`} onClick={() => setMapType('wind')}>Angin</button>
        <button className={`map-control-btn ${mapType === 'temperature' ? 'active' : ''}`} onClick={() => setMapType('temperature')}>Suhu</button>
        <button className={`map-control-btn ${mapType === 'precipitation' ? 'active' : ''}`} onClick={() => setMapType('precipitation')}>Curah Hujan</button>
        <button className={`map-control-btn ${mapType === 'storm' ? 'active' : ''}`} onClick={() => setMapType('storm')}>Badai</button>
        <button className={`map-control-btn ${mapType === 'wave' ? 'active' : ''}`} onClick={() => setMapType('wave')}>Ombak</button>
      </div>

      <div className="map-container">
        <div className="map-label">Peta Cuaca: {mapType.charAt(0).toUpperCase() + mapType.slice(1)}</div>
        <iframe src={mapUrls[mapType]} className="satellite-map" title="Peta Cuaca Ventusky"></iframe>
      </div>

      <div className="weather-tips">
        <h3>{getTipsTitle(mapType)}</h3>
        <ul>
          {weatherTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Cuaca;
