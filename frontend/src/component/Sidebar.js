import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "font-awesome/css/font-awesome.min.css";
import { apiService } from '../services/ApiService';

const Sidebar = ({ subheadings, tags, updatedAt, contentId, authorName, instanceName }) => {
    const location = useLocation();
    const [editorName, setEditorName] = useState("Loading...");
    const isHomePage = location.pathname === "/";
    const [currentUser, setCurrentUser] = useState(null);
    const [viewCount, setViewCount] = useState(0); // State for view count
    const [author, setAuthor] = useState("Loading..."); // State for author name

    const defaultHomeContents = [
        { id: "welcome", title: "Selamat datang di Wiki Pemda" },
        { id: "organisasi", title: "Organisasi Perangkat" },
    ];

    useEffect(() => {
        // Get user and token from localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        const fetchUserData = async () => {
            if (!token) {
                console.warn("No token found!");
                setCurrentUser(storedUser);
                return;
            }

            try {
                const response = await apiService.decodeToken(token);
                setCurrentUser(response.data);
                console.log("User loaded with permissions:", response.data);
            } catch (error) {
                console.error("Error fetching user data:", error);
                setCurrentUser(storedUser);
            }
        };

        fetchUserData();
    }, []); // Run once on component mount

    useEffect(() => {
        if (contentId && currentUser?.permissions?.includes("view_latest_editor")) {
            // Only fetch editor name if user has permission
            apiService.getLatestEditorNameByContentId(contentId)
                .then((response) => {
                    setEditorName(response.data.editorName || "Unknown Editor");
                })
                .catch(() => setEditorName("Unknown Editor"));
        }
    }, [contentId, currentUser]); // Dependencies include currentUser now

    useEffect(() => {
        if (contentId) {
            apiService.getContentViewCount(contentId)
                .then((response) => {
                    setViewCount(response.data.viewCount);
                })
                .catch((err) => console.error("Error fetching view count:", err));
        }
    }, [contentId]);

    useEffect(() => {
        if (contentId) {
            setAuthor(authorName);
        }
    }, [contentId, authorName]);

    return (
        <main className="main">
            <aside className="sidebar">
                <div className="sidebar-box">
                    <ul>
                    {(isHomePage || subheadings.length > 0) && (
                        <div className="small-box">
                            <h5 className="tags-title">PAGE CONTENTS</h5>
                            <ul className="link-list">
                                {isHomePage
                                    ? defaultHomeContents.map((content) => (
                                        <li key={content.id}>
                                            <i className="fa fa-angle-right"></i>
                                            <a href={`#${content.id}`}>{content.title}</a>
                                        </li>
                                    ))
                                    : subheadings.map((subheading) => (
                                        <li key={subheading.id}>
                                            <i className="fa fa-angle-right"></i> 
                                            <a href={`#${subheading.subheading}`}>
                                                {subheading.subheading}
                                            </a>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}
                                            
                        <div className="small-box">
                            <h5 className="tags-title">TAGS</h5>
                            <ul className="link-list">
                                {location.pathname === "/" && (
                                    <li>
                                        <Link to="/" className="tag-link">
                                            <img
                                                src={require(`../assets/tag.png`)}
                                                alt="tag"
                                                className="tag"
                                            />
                                            Home
                                        </Link>
                                    </li>
                                )}
                                {tags &&
                                    tags.length > 0 &&
                                    tags.map((tag, index) => (
                                        <li key={index}>
                                            <Link
                                                to={`/search/${tag.trim()}`}
                                                className="tag-link"
                                            >
                                                <img
                                                    src={require(`../assets/tag.png`)}
                                                    alt="tag"
                                                    className="tag"
                                                />
                                                {tag.trim()}
                                            </Link>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                        {!isHomePage && (
                            <div className="small-box">
                                <h5 className="tags-title">CREATED CONTENT BY</h5>
                                <ul className="link-list">
                                    <li className="author">{author}</li>
                                    <li className="instance">{instanceName}</li>
                                </ul>
                            </div>
                        )}
                        {!isHomePage && currentUser?.permissions?.includes("view_latest_editor") && (
                            <div className="small-box">
                                <h5 className="tags-title">LAST EDITED BY</h5>
                                <ul className="link-list">
                                    <li className="editorname">{editorName === "Unknown Editor" ? authorName : editorName}</li>
                                    {updatedAt && <li className="updateat">at {updatedAt}</li>}
                                </ul>
                            </div>
                        )}

                        {!isHomePage && (
                            <div className="small-box">
                                <h5 className="tags-title">VIEW COUNT</h5>
                                <ul className="link-list">
                                    <li className="vcount">{viewCount} <i className="fa fa-eye" style={{ marginRight: "5px", marginLeft: "10px" }}></i>views</li>
                                </ul>
                            </div>
                        )}

                        
                    </ul>
                </div>
            </aside>
        </main>
    );
};

export default Sidebar;