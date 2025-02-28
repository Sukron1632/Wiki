// src/component/RejectPopup.js
import React from "react";

const RejectPopup = ({ isOpen, onConfirm, onCancel, rejectReason, setRejectReason }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Konfirmasi</h2>
        <p>Apakah Anda yakin ingin menolak konten ini?</p>
        <br />
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Masukkan alasan penolakan..."
          rows="4"
          cols="40"
          
          required
        />
        <div className="modal-actions">
          <button className="btn btn-confirm" onClick={onConfirm}>Reject Content</button>
          <button className="btn btn-cancel" onClick={onCancel}>Cancel</button>
          
        </div>
      </div>
    </div>
  );
};

export default RejectPopup;