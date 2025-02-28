import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { apiService } from '../services/ApiService';

function Home() {
  const [contents, setContents] = useState([]);
  const [user, setUser] = useState(null);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {

    

    const initializeAuth = async () => {
      try {
        // Check existing token
        let token = localStorage.getItem("token");
        let storedUser = localStorage.getItem("user");

        // If no token or user, get guest token
        if (!token || !storedUser) {
          const { data: guestData } = await apiService.getGuestToken();
          token = guestData.token;
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify({
            role: guestData.role,
            role_id: guestData.role_id,
            permissions: guestData.permissions,
          }));
          storedUser = JSON.stringify(guestData);
        }

        // Decode token
        const { data: userData } = await apiService.decodeToken(token);
        const parsedStoredUser = JSON.parse(storedUser);
        
        const userWithPermissions = {
          ...parsedStoredUser,
          permissions: userData.permissions || [],
        };
        
        setUser(userWithPermissions);

        // Fetch active contents if user has permission
        if (userWithPermissions.permissions?.includes("view_active_content")) {
          const { data: contentData } = await apiService.getActiveContents();
          setContents(contentData);
        }
      } catch (error) {
        console.error("Error in initialization:", error);
        // Error handling is now managed by axios interceptor
      }
    };

    initializeAuth();
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsButtonVisible(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddClick = () => {
    if (!user) {
      alert("Please log in to edit content.");
      navigate("/login");
    } else if (user.permissions?.includes("create_content")) {
      navigate(`/addcontent`);
    } else {
      alert("You are not authorized to create content.");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="main">
      <div className="content">
        <div className="welcome-box">
          <h2>Wiki Pemda DIY</h2>
          <p>Knowledge Management system Pemda DIY untuk berbagi pengetahuan</p>
        </div>
        <div className="welcome-side">
          <h1 id="welcome" className="content-title">
            Selamat datang di Wiki Pemda DIY
            <hr className="gradient-hr" />
          </h1>
          <p className="content-p">
            Selamat datang di wiki Pemda DIY. Disini anda akan menemukan banyak informasi, 
            panduan dan petunjuk terkait SPBE (Sistem Pemerintahan Berbasis Elektronik) 
            di lingkungan Pemerintah Daerah DIY.
          </p>
        </div>
        <h2 id="organisasi" className="content-h2">
          Bidang Pengetahuan
          <hr className="gradient-hr-sub" />
        </h2>
        <p className="content-p">
        Sistem Pemerintahan Berbasis Elektronik (SPBE) adalah konsep dan praktik penerapan teknologi informasi dan komunikasi (TIK) dalam proses pemerintahan untuk meningkatkan efisiensi, efektivitas, transparansi, dan akuntabilitas pelayanan publik. Lingkup SPBE yang kita jalankan saat ini terdiri atas enam (6) bidang/domain yaitu:
          </p>
          <ul className="numbered">
            <li>Domain Proses Bisnis;</li>
            <li>Domain data dan informasi;</li>
            <li>Domain infrastruktur SPBE;</li>
            <li>Domain aplikasi SPBE;</li>
            <li>Domain keamanan SPBE; dan</li>
            <li>Domain layanan SPBE.</li>
          </ul>
          <p className="content-p">
  <Link to="/informasi/90">selengkapnya...</Link>
</p>
        <h2 id="organisasi" className="content-h2">
        Rekomendasi Rencana dan Anggaran SPBE
          <hr className="gradient-hr-sub" />
        </h2>
        <p className="content-p">
        Rekomendasi Rencana dan Anggaran SPBE adalah surat yang dikeluarkan oleh Diskominfo DIY kepada OPD pemohon rekomendasi sebagai tanda bahwa OPD dapat mencantumkan pelaksanaan investasi TIK yang berupa daftar kebutuhan investasi ke dalam Rencana Kerja Anggaran (RKA). Berikut informasi yang harus diketahui terkait rekomendasi rencana dan anggaran SPBE
          </p>
          <ul>
            <li><Link to="/informasi/91">Informasi umum terkait Rekomendasi Rencana dan Anggaran SPBE</Link></li>
            <li><Link to="/informasi/92">Manual Pengajuan Rekomendasi TIK (peladen.jogjaprov.go.id)</Link></li>
            <li><Link to="/informasi/93">SOP Penyusunan Rekomendasi Investasi TIK</Link></li>
            <li><Link to="/informasi/94">Standar Dokumentasi Aplikasi</Link></li>
            <li><Link to="/informasi/95">Standar Teknis Pembangunan dan Pengembangan Aplikasi</Link></li>
            <li><Link to="/informasi/96">Standar Keamanan Aplikasi</Link></li>
            <li><Link to="/informasi/97">Ketentuan Umum Pembangunan dan Pengembangan Aplikasi</Link></li>
            <li><Link to="/informasi/98">Standar Peralatan yang Diusulkan Rekomendasi TIK (hardware)</Link></li>
          </ul>
        <h2 id="organisasi" className="content-h2">
          Organisasi Perangkat Daerah Pemda DIY
          <hr className="gradient-hr-sub" />
        </h2>

        {user?.permissions?.includes("view_active_content") && (
  <ul className="numbered">
    {contents
      .filter((content) => content.id < 90 || content.id > 98)
      .map((content) => (
        <li key={content.id}>
          <Link to={`/informasi/${content.id}`}>{content.title}</Link>
        </li>
      ))}
  </ul>
)}
        {user?.permissions?.includes("create_content") && (
          <button className="button-create-content" onClick={handleAddClick}>
            <span className="text">Create</span>
            <span className="icon">
              <FaPlus />
            </span>
          </button>
        )}
      </div>
      
      <button
        className={`button ${isButtonVisible ? '' : 'disabled'}`}
        onClick={scrollToTop}
        disabled={!isButtonVisible}
      >
        <svg className="svgIcon" viewBox="0 0 384 512">
          <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
        </svg>
      </button>
    </div>
  );
}

export default Home;