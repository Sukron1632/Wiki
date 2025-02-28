// Breadcrumbs.js
import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({ paths }) => {
    return (
        <nav className="breadcrumbs">
            {paths.map((path, index) => (
                <span key={index}>
                    {path.link ? (
                        <Link to={path.link}>{path.label}</Link>
                    ) : (
                        <span>{path.label}</span>
                    )}
                    {index < paths.length - 1 && <span> &gt; </span>}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumbs;