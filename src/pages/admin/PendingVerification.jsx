// pages/admin/PendingVerification.jsx
import React from 'react';
import styles from "../../styles/admin/Dashboard.module.css";
import Sidebar from '../../components/admin/Sidebar';
import Header from '../../components/admin/Header';
import Verif from '../../components/admin/Verif';
import Verifcard from '../../components/admin/Verifcard';   

function PendingVerification() {
    return (
        <div className="containerAdmin">
            <Sidebar />
            <main className={styles.mainContent}>
                <Header />
                <div className={styles.verificationSection}>
                    <Verif />
                    <Verifcard />
                </div>  
            </main>
        </div>
    );
}

export default PendingVerification;