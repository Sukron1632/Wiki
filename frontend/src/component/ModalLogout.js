import React from 'react';

const ModalLogout = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null; // Tidak menampilkan modal jika tidak terbuka

    const handleConfirmLogout = () => {
        onConfirm(); // Panggil fungsi onConfirm saat logout dikonfirmasi
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Konfirmasi Logout</h2>
                <p>Apakah Anda yakin ingin keluar dari akun?</p>
                <div className="modal-actions">
                    <button className="btn btn-confirm" onClick={handleConfirmLogout}>
                        Logout
                    </button>
                    <button className="btn btn-cancel" onClick={onClose}>
                        Batal
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ModalLogout;