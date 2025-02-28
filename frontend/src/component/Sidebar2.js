import React from 'react';
import logo from '../assets/logojogja.png';
import 'font-awesome/css/font-awesome.min.css';

const Sidebar2 = ({ isOpen, onClose }) => {
    return (
        <div className={`sidebar2 ${isOpen ? 'open' : ''}`}>
            <div className="header-sidebar2">
                <div className="header">
                    <button className="close-btn" onClick={onClose}>×</button>
                    <div className="navbar-left">
                        <div className="nav-link logo-container">
                            <img src={logo} alt="Logo Pemda DIY" className="logo" />
                            <h2>Wiki Pemda DIY</h2>
                        </div>
                    </div>
                </div>
            </div>
            <ul>
                <li>
                    <a href="/"><i className="fa fa-home"></i> Home</a>
                </li>
                <li>
                    <a href="https://api.whatsapp.com/send/?phone=6282133576291&text=Hello&type=phone_number&app_absent=0">
                        <i className="fa fa-question-circle"></i> FAQ
                    </a>
                </li>
                <li>
                    <a href="https://api.whatsapp.com/send/?phone=6282133576291&text=Hello&type=phone_number&app_absent=0">
                        <i className="fa fa-phone"></i> Helpdesk
                    </a>
                </li>
                {/* Tambahkan menu sidebar lainnya di sini */}
            </ul>
        </div>
    );
};

export default Sidebar2;