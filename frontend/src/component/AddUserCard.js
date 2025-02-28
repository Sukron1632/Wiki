import React from 'react';

const AddUserCard = ({ isOpen, onAdd, onCancel, userData }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Konfirmasi Tambahkan Pengguna</h2>
                <p>Apakah Anda yakin ingin menambahkan pengguna berikut?</p>
                <ul className="user-details-list">
                    <li><strong>Name:</strong> {userData.name}</li>
                    <li><strong>NIP:</strong> {userData.nip}</li>
                    <li><strong>Email:</strong> {userData.email}</li>
                    <li><strong>Role:</strong> {userData.role_name}</li>
                    <li><strong>Instance:</strong> {userData.instance_name}</li>
                </ul>
                <div className="modal-actions">
                    <button className="btn btn-confirm" onClick={onAdd}>
                        Add User
                    </button>
                    <button className="btn btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddUserCard;