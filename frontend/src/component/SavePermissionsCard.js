import React from 'react';

const SavePermissionsCard = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Confirmation</h2>
                <p>Are you sure you want to save the changes to the permissions?</p>
                <div className="modal-actions">
                    <button className="btn btn-confirm" onClick={onConfirm}>
                        Yes
                    </button>
                    <button className="btn btn-cancel" onClick={onCancel}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SavePermissionsCard;