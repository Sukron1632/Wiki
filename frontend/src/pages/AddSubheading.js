import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactQuill from 'react-quill'; // Tambahkan ReactQuill
import 'react-quill/dist/quill.snow.css'; // Tambahkan style untuk ReactQuill
import { apiService } from '../services/ApiService'; // Import ApiService

const AddSubheading = () => {
    const [subheading, setSubheading] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedUser.id) {
            setUser(storedUser);
        } else {
            console.warn('User ID not found in localStorage.');
        }

        if (storedToken) {
            setToken(storedToken);
        } else {
            console.warn('Token not found in localStorage.');
        }
    }, []);

    const handleAddSubheading = async (e) => {
        e.preventDefault();
    
        // Data subheading yang akan dikirim ke backend
        const subheadingData = {
            content_id: parseInt(id, 10),
            subheading,
            subheading_description: description, // Menggunakan konten rich text
            author_id: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            editor_id: user?.id,
        };
    
        try {
            // Mengirim data subheading ke API
            const response = await apiService.createSubheading(id, subheadingData);
    
            if (response.status !== 200) throw new Error("Failed to add subheading");
    
            const responseData = response.data;
            console.log("Subheading added:", responseData);
    
            // Mengambil waktu lokal di zona waktu Asia/Jakarta
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString("en-US", {
                timeZone: "Asia/Jakarta",
                hour12: false,
            });
    
            // Format waktu untuk MySQL (YYYY-MM-DD HH:MM:SS)
            const [date, time] = formattedDate.split(", ");
            const [month, day, year] = date.split("/");
            const formattedMySQLDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;
    
            // Data untuk riwayat dengan action "Editing"
            const historyData = {
                content_id: parseInt(id, 10),
                editor_id: user.id,
                action: "Editing", // Action type
                edited_at: formattedMySQLDate, // Waktu dalam format MySQL
            };
    
            // Mengirim data riwayat ke API
            const historyResponse = await apiService.addHistory(historyData);
    
            if (historyResponse.status !== 200) {
                console.error("Failed to record history for Editing action");
            } else {
                console.log("History recorded successfully");
            }
    
            // Reset form fields setelah pengiriman berhasil
            setSubheading("");
            setDescription("");
    
            // Arahkan pengguna ke halaman detail konten
            navigate(`/informasi/${id}`);
        } catch (error) {
            console.error("Error adding subheading:", error);
            alert("Error adding subheading");
        }
    };
    

    // Breadcrumbs component
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

    return (
        <div className="container-wrapper">
            <div className="container">
                <Breadcrumbs 
                    paths={[
                        { label: "Home", link: "/" },
                        { label: "Informasi", link: `/informasi/${id}` },
                        { label: "Edit Content", link: `/edit/${id}` },
                        { label: "Tambah Sub Judul" }
                    ]} 
                />
                <div className="text text-gradient">Tambah Sub Judul</div>
                <form onSubmit={handleAddSubheading}>
                    <div className="form-row">
                        <div className="input-data">
                            <input
                                type="text"
                                value={subheading}
                                onChange={(e) => setSubheading(e.target.value)}
                                required
                            />
                            <div className="underline"></div>
                            <label>Sub Judul</label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-data textarea">
                            <ReactQuill
                                theme="snow" // Tema untuk react-quill
                                value={description}
                                onChange={setDescription} // Mengupdate deskripsi menggunakan state
                            />
                            <div className="underline"></div>
                            <label>Deskripsi</label>
                        </div>
                    </div>

                    <div className="form-row submit-btn">
                        <div className="input-data">
                            <div className="inner"></div>
                            <input type="submit" value="Add Subheading" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSubheading;