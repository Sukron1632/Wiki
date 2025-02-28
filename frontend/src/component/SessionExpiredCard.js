import React from 'react';

const SessionExpiredCard = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Session Expired</h2>
                <p>Sesi Anda telah berakhir karena token habis. Silakan masuk kembali.</p>
                <div className="modal-actions">
                    <button className="btn btn-confirm" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionExpiredCard;