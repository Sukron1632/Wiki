import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from '../services/ApiService'; // Import ApiService

const ContentDetail = () => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isButtonVisible, setIsButtonVisible] = useState(false); // State for scroll-to-top button visibility

  useEffect(() => {
    const fetchContent = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await apiService.getContentById(id);
        setContent(response.data);
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to fetch content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsButtonVisible(true);
      } else {
        setIsButtonVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const Breadcrumbs = ({ paths }) => {
    return (
      <nav>
        <ul className="breadcrumbs">
          {paths.map((path, index) => (
            <li key={index}>
              {path.link ? (
                <Link to={path.link}>{path.label}</Link>
              ) : (
                <span>{path.label}</span>
              )}
              {index < paths.length - 1 && " / "} {/* Menambahkan separator */}
            </li>
          ))}
        </ul>
      </nav>
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-details">
      <div className="content">
        <Breadcrumbs 
          paths={[
            { label: "Home", link: "/" },
            { label: "Manage Content", link: "/manage-content" }, 
            { label: "Content Detail" }, // Halaman saat ini tidak memiliki link
          ]} 
        />
        <div className="manage-content">
          <h1 className="manage-content-h1">Content Detail</h1>
          <p className='manage-content-p'>pay attention to the content created</p>
        </div>
        <h1 className="content-title">{content.content.title}<hr className="gradient-hr"></hr></h1>
        <div
          dangerouslySetInnerHTML={{
            __html: content.content.description.String,
          }}
        />

        <div style={{ marginTop: "2rem" }} className="no-number">
          {content?.subheadings?.length > 0 &&
            content.subheadings.map((subheading) => (
              <div key={subheading.id} id={subheading.subheading}>
                <h2 style={{ marginBottom: "1rem" }} id="subheading">
                  {subheading.subheading}<hr className="gradient-hr-sub"></hr>
                </h2>
                {/* Menampilkan deskripsi subheading sebagai HTML */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: subheading.subheading_description || "",
                  }}
                />
              </div>
            ))}
        </div>

        
      </div>
      <button
        className={`button ${isButtonVisible ? '' : 'disabled'}`}
        onClick={scrollToTop}
        disabled={!isButtonVisible}
      >
        <svg className="svgIcon" viewBox="0 0 384 512">
          <path
            d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
          ></path>
        </svg>
      </button>
    </div>
  );
};

export default ContentDetail;