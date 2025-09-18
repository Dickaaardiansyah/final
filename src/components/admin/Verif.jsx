import React from 'react';
import styles from "../../styles/admin/Dashboard.module.css";

function Verif() {
    return (    
  
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Aplikasi Menunggu Verifikasi
                </h2>
                <div className={styles.filters}>
                    <button className={`${styles.filterBtn} ${styles.active}`} data-filter="all">Semua</button>
                    <button className={styles.filterBtn} data-filter="pending">Menunggu Verifikasi</button>
                    <button className={styles.filterBtn} data-filter="priority">Diterima</button>   
                    <button className={styles.filterBtn} data-filter="complete">Ditolak</button>
                </div>
            </div>
    );
}

export default Verif;
