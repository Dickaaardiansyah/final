// pages/admin/FishSellers.jsx
import React from 'react';
import styles from "../../styles/admin/Dashboard.module.css";
import Sidebar from '../../components/admin/Sidebar';
import Header from '../../components/admin/Header';

function FishSellers() {
    return (
        <div className="containerAdmin">
            <Sidebar />
            <main className={styles.mainContent}>
                <Header />
                <div className={styles.verificationSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c5.4 0 10 4.6 10 10 0 5.4-4.6 10-10 10S2 17.4 2 12 6.6 2 12 2zm-1 17.93c3.94-.49 7-3.85 7-7.93 0-.62-.08-1.21-.21-1.79L9 10v1c0 1.1-.9 2-2 2s-2-.9-2-2V9c0-1.1.9-2 2-2s2 .9 2 2v.17l8.79-.21C17.21 8.34 16.62 8.26 16 8.26c-4.08 0-7.44 3.06-7.93 7H9c-.55 0-1 .45-1 1s.45 1 1 1h-.93z" />
                            </svg>
                            Penjual Ikan
                        </h2>
                    </div>
                    <p>Halaman untuk mengelola data penjual ikan yang terdaftar.</p>
                </div>
            </main>
        </div>
    );
}

export default FishSellers;