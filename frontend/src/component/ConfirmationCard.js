import React from 'react';

const ConfirmationCard = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Konfirmasi</h2>
                <p>Konten Anda akan dikirim untuk ditinjau. Apakah Anda yakin ingin melanjutkan?</p>
                <div className="modal-actions">
                    <button className="btn btn-confirm" onClick={onConfirm}>
                        Ya
                    </button>
                    <button className="btn btn-cancel" onClick={onCancel}>
                        Tidak
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationCard;