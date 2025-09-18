import React from 'react'
import styles from "../../styles/admin/Dashboard.module.css";

function Modal() {
  return (
        <div class="modal" id="rejectModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Tolak Aplikasi Penjual</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form onsubmit="submitRejection(event)">
                <div class="form-group">
                    <label class="form-label">Alasan Penolakan:</label>
                    <textarea class="form-textarea" id="rejectionReason" placeholder="Masukkan alasan penolakan aplikasi penjual ikan..." required></textarea>
                </div>
                <div class="application-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-danger">Tolak Aplikasi</button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Modal
