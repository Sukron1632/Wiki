import React from 'react';

const DeleteCard = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Konfirmasi</h2>
                <p>{message}</p>
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

export default DeleteCard;