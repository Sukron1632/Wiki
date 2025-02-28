import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/ApiService';

function SearchContent({ setSearchTerm }) {
    const { term } = useParams();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiService.searchContent({ q: term });
                setResults(response.data.data);
            } catch (error) {
                setResults([]);
            }
            setLoading(false);
        };
    
        if (term) fetchData();
    }, [term]);

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

    return (
        <div className="search-content-page">
            <div className="search-content">
                <Breadcrumbs 
                    paths={[
                        { label: "Home", link: "/" },
                        { label: "Pencarian" },
                    ]} 
                />
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div>
                        {results.length > 0 ? (
                            <div className="wiki-pemda-container">
                                {results.map((content) => (
                                    <Link
                                        to={`/informasi/${content.id}`}
                                        key={content.id}
                                        className="wiki-pemda-item-link"
                                        onClick={() => {
                                            setSearchTerm('');
                                        }}
                                    >
                                        <div className="wiki-pemda-item">
                                            <div className="title-container">
                                                <h4 className="search">{content.title}</h4>
                                            </div>
                                            <br />
                                            <hr className="divider" />
                                            <br />
                                            <p className="description"
                                               dangerouslySetInnerHTML={{ __html: content.description.String }}>
                                            </p>
                                            <p className="last-updated">
                                                Last updated {content.updated_at && timeAgo(content.updated_at)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p>No results found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchContent;