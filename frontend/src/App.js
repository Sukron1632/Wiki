import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Informasi from './pages/Informasi';
import Navbar from './component/Navbar';
import Sidebar from './component/Sidebar';
import Sidebar2 from './component/Sidebar2'; // Import Sidebar 2
import Footer from './component/Footer';

import './styles/index.css'; // Pastikan ini adalah file yang benar
import Edit from './pages/Edit';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AddContent from './pages/AddContent';
import AddSubheading from './pages/AddSubheading';
import SearchContent from './pages/SearchContent';
import ManageUser from './pages/ManageUser';
import DetailUser from './pages/DetailUser';
import ManageContent from './pages/ManageContent'; // Import ManageContent
import ContentDetail from './pages/ContentDetail'; // Import ContentDetail
import ViewStatusContent from './pages/ViewStatusContent'; // Import komponen baru
import ManageRole from './pages/ManageRole';
import EditRejectContent from './pages/EditRejectContent'; // Import EditRejectContent

// App Komponen Utama
const App = () => {
    const [subheadings, setSubheadings] = useState([]);
    const [tags, setTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [contentId, setContentId] = useState(null);
    const [instanceName, setInstanceName] = useState(''); // State untuk instance name
    const [isSidebar2Open, setIsSidebar2Open] = useState(false); // State untuk sidebar kedua
    const hasFetchedData = useRef(false);

    // Komponen SidebarWrapper
    const SidebarWrapper = () => {
        const location = useLocation();
        const isSidebarVisible = location.pathname === '/' || location.pathname.startsWith('/informasi/');
        return isSidebarVisible ? (
            <Sidebar
                subheadings={subheadings}
                tags={tags}
                setSearchTerm={setSearchTerm}
                updatedAt={updatedAt}
                contentId={contentId}
                authorName={authorName}
                instanceName={instanceName} // Pass instanceName to Sidebar
            />
        ) : null;
    };

    // Komponen FooterWrapper
    const FooterWrapper = () => {
        const location = useLocation();
        const isFooterVisible = location.pathname === '/' || location.pathname.startsWith('/informasi/');
        return isFooterVisible ? <Footer /> : null;
    };

    return (
        <Router>
            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} onToggleSidebar={() => setIsSidebar2Open(!isSidebar2Open)} />
            <div className="App">
                <div className="app-container">
                    <SidebarWrapper />
                    <Sidebar2 isOpen={isSidebar2Open} onClose={() => setIsSidebar2Open(false)} />
                    <div className="main-content">
                        <Routes>
                            <Route path="/" element={<Home setSubheadings={setSubheadings} setTags={setTags} />} />
                            <Route path="/informasi/:id" element={
                                <Informasi setSubheadings={setSubheadings} setTags={setTags} setUpdatedAt={setUpdatedAt} setContentId={setContentId} setAuthorName={setAuthorName} setInstanceName={setInstanceName} />
                            } />
                            <Route path="/edit/:id" element={<Edit />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/addcontent" element={<AddContent />} />
                            <Route path="/editrejectcontent/:id" element={<EditRejectContent />} />
                            <Route path="/addsubheading/:id" element={<AddSubheading />} />
                            <Route path="/search/:term" element={<SearchContent setSearchTerm={setSearchTerm} />} />
                            <Route path="/manage" element={<ManageUser />} />
                            <Route path="/detail/:id" element={<DetailUser />} />
                            <Route path="/manage-content" element={<ManageContent />} /> {/* Tambahkan rute ManageContent */}
                            <Route path="/content/:id" element={<ContentDetail />} /> {/* Tambahkan rute ContentDetail */}
                            <Route path="/view-status-content" element={<ViewStatusContent />} /> {/* Tambahkan rute baru */}
                            <Route path="/manage-role" element={<ManageRole />} /> {/* Tambahkan rute baru */}
                        </Routes>
                    </div>
                </div>
                <FooterWrapper />
            </div>
        </Router>
    );
};

export default App;