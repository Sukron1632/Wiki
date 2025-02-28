import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPencilAlt } from "react-icons/fa";
import { apiService } from '../services/ApiService';

const ViewStatusContent = () => {
    const [contents, setContents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const fetchContents = async () => {
            try {
                const response = await apiService.getUserContents(user.id);
                const sortedData = response.data.sort((a, b) => b.id - a.id);
                setContents(sortedData);
            } catch (error) {
                console.error('Error fetching contents:', error);
            }
        };

        if (user?.id) {
            fetchContents();
        }
    }, [user, navigate]);

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
                            {index < paths.length - 1 && " / "}
                        </li>
                    ))}
                </ul>
            </nav>
        );
    };

    // Calculate the current contents to display based on the current page
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentContents = contents.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Calculate total pages
    const totalPages = Math.ceil(contents.length / itemsPerPage);

    return (
        <div className="main-container">
            <div className="table-container">
                <Breadcrumbs
                    paths={[
                        { label: "Home", link: "/" },
                        { label: "View Status Content" },
                    ]}
                />
                <div className="view-status-header">
                    <h1 className="view-status-content-h1">View Status Content</h1>
                    <p className="view-status-content-p">Tracking Progress with View Status Content</p>
                </div>
                <table className="view-status">
                    <thead className="thead-status">
                        <tr>
                            <th>Title</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th>Status</th>
                            <th>Alasan Penolakan</th>
                            <th>Action</th> {/* Kolom baru untuk aksi */}
                        </tr>
                    </thead>
                    <tbody>
                        {currentContents.map(content => (
                            <tr key={content.id}>
                                <td>{content.title}</td>
                                <td>{content.created_at}</td>
                                <td>{content.updated_at}</td>
                                <td>{content.status}</td>
                                <td>
                                    {content.status === "rejected" && content.rejection_reason.Valid ? content.rejection_reason.String : "-"}
                                </td>
                                <td>
                                    {content.status === "rejected" && (
                                        <button className="Detail Approve" onClick={() => navigate(`/editrejectcontent/${content.id}`)}><FaPencilAlt style={{ marginRight: "5px" }} size={12} />Edit</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                        &lt;&lt;
                    </button>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                        &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={currentPage === index + 1 ? "active" : ""}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                        &gt;
                    </button>
                    <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
                        &gt;&gt;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewStatusContent;