
import React from 'react';

const DeleteSubheadingCard = ({ isOpen, onDelete, onCancel, subheadingName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Konfirmasi Penghapusan</h2>
                <p>Apakah Anda yakin ingin menghapus subjudul "{subheadingName}"?</p>
                <div className="modal-actions">
                    <button className="btn btn-confirm" onClick={onDelete}>
                        Hapus
                    </button>
                    <button className="btn btn-cancel" onClick={onCancel}>
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteSubheadingCard;