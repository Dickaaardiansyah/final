// pages/admin/Reports.jsx
import React from 'react';
import styles from "../../styles/admin/Dashboard.module.css";
import Sidebar from '../../components/admin/Sidebar';
import Header from '../../components/admin/Header';

function Reports() {
    return (
        <div className="containerAdmin">
            <Sidebar />
            <main className={styles.mainContent}>
                <Header />
                <div className={styles.verificationSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                            Laporan
                        </h2>
                    </div>
                    <p>Halaman untuk melihat berbagai laporan dan statistik.</p>
                </div>
            </main>
        </div>
    );
}

export default Reports;