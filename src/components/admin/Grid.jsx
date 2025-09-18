import React from 'react';
import styles from "../../styles/admin/Dashboard.module.css";

function Grid() {
    return (
        <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.pending}`}>
                <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Menunggu Verifikasi</span>
                    <svg className={styles.statIcon} viewBox="0 0 24 24" fill="#d97706">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                </div>
                <div className={styles.statValue}>12</div>
                <div className={`${styles.statChange} ${styles.positive}`}>
                    <svg className={styles.changeIcon} viewBox="0 0 24 24">
                        <path d="M13 7h-2v4L8.5 9.5l-1.4 1.4L12 15.9l4.9-4.9L15.5 9.5 13 12V7z" />
                    </svg>
                    +3 aplikasi baru hari ini
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.approved}`}>
                <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Disetujui Bulan Ini</span>
                    <svg className={styles.statIcon} viewBox="0 0 24 24" fill="#059669">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                </div>
                <div className={styles.statValue}>45</div>
                <div className={`${styles.statChange} ${styles.positive}`}>
                    <svg className={styles.changeIcon} viewBox="0 0 24 24">
                        <path d="M7 14l5-5 5 5H7z" />
                    </svg>
                    +12.5% dari bulan lalu
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.rejected}`}>
                <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Ditolak Bulan Ini</span>
                    <svg className={styles.statIcon} viewBox="0 0 24 24" fill="#dc2626">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </div>
                <div className={styles.statValue}>8</div>
                <div className={`${styles.statChange} ${styles.negative}`}>
                    <svg className={styles.changeIcon} viewBox="0 0 24 24">
                        <path d="M17 10l-5 5-5-5h10z" />
                    </svg>
                    -2.1% dari bulan lalu
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.total}`}>
                <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Penjual Ikan Aktif</span>
                    <svg className={styles.statIcon} viewBox="0 0 24 24" fill="#0891b2">
                        <path d="M12 2c5.4 0 10 4.6 10 10 0 5.4-4.6 10-10 10S2 17.4 2 12 6.6 2 12 2zm-1 17.93c3.94-.49 7-3.85 7-7.93 0-.62-.08-1.21-.21-1.79L9 10v1c0 1.1-.9 2-2 2s-2-.9-2-2V9c0-1.1.9-2 2-2s2 .9 2 2v.17l8.79-.21C17.21 8.34 16.62 8.26 16 8.26c-4.08 0-7.44 3.06-7.93 7H9c-.55 0-1 .45-1 1s.45 1 1 1h-.93z" />
                    </svg>
                </div>
                <div className={styles.statValue}>247</div>
                <div className={`${styles.statChange} ${styles.positive}`}>
                    <svg className={styles.changeIcon} viewBox="0 0 24 24">
                        <path d="M7 14l5-5 5 5H7z" />
                    </svg>
                    +8.2% dari bulan lalu
                </div>
            </div>
        </div>
    );
}

export default Grid;
