import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactQuill from "react-quill"; // Import ReactQuill
import "react-quill/dist/quill.snow.css"; // Import stylesheet
import ConfirmationCard from "../component/ConfirmationCard"; // Import ConfirmationCard
import { apiService } from '../services/ApiService'; // Import ApiService

const AddContent = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState(""); // State untuk deskripsi
    const [tag, setTag] = useState("");
    const [instanceId, setInstanceId] = useState("");
    const [instances, setInstances] = useState([]);
    const [user, setUser] = useState(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(null);
    const navigate = useNavigate();
    const [accessibility, setAccessibility] = useState("public");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.id) {
            setUser(storedUser);
            console.log("User Instance ID:", storedUser.user_instance_id);
            if ((storedUser.role_id === 3 || storedUser.role_id === 1 || storedUser.role_id === 2) && storedUser.user_instance_id) {
                const selectedInstance = instances.find(
                    (instance) => instance.id === parseInt(storedUser.user_instance_id, 10)
                );
                if (selectedInstance) {
                    setInstanceId(selectedInstance.id);
                }
            }
        } else {
            console.warn("User ID not found in localStorage.");
        }
    }, [instances]);

    useEffect(() => {
        const fetchInstances = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("Authorization token is missing");
                    return;
                }

                const response = await apiService.getInstances();
                setInstances(response.data);
                console.log("Fetched Instances:", response.data);
            } catch (error) {
                console.error("Error fetching instances:", error);
            }
        };

        fetchInstances();
    }, []); // Fetch instances only once when the component is mounted

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!user) {
            alert("Please log in to create content.");
            navigate("/login");
            return;
        }
    
        // Jika user role 3, tampilkan konfirmasi
        if (user.role_id === 3) {
            setPendingSubmit(() => () => submitContent());
            setIsConfirmationOpen(true);
            return;
        }
    
        submitContent();
    };

    const submitContent = async () => {
        const contentData = {
            title,
            description: {
                String: description || "",
                Valid: description !== "",
            },
            tag,
            author_id: user?.id,
            instance_id: parseInt(instanceId, 10),
            status: user.role_id === 3 ? "pending" : "approved",
            accessibility: accessibility, // Add this line
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    
        console.log("Content Data to Send:", JSON.stringify(contentData, null, 2));
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Authorization token is missing");
                navigate("/login");
                return;
            }
    
            // Buat konten baru
            const response = await apiService.createContent(contentData);
    
            if (response.status === 200) {
                const result = response.data;
                const contentId = result.content_id;
    
                // Mendapatkan waktu lokal di zona waktu Asia/Jakarta
                const currentDate = new Date();
                const formattedDate = currentDate.toLocaleString("en-US", {
                    timeZone: "Asia/Jakarta",
                    hour12: false,
                });
    
                // Format waktu untuk MySQL (YYYY-MM-DD HH:MM:SS)
                const [date, time] = formattedDate.split(", ");
                const [month, day, year] = date.split("/");
                const formattedMySQLDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;
    
                // Data untuk riwayat
                const historyData = {
                    content_id: contentId,
                    editor_id: user.id,
                    action: "Creating",
                    edited_at: formattedMySQLDate,
                };
    
                // Kirim data riwayat
                const historyResponse = await apiService.addHistory(historyData);
    
                if (historyResponse.status !== 200) {
                    console.error("Failed to record history.");
                    const errorMessage = historyResponse.data;
                    console.error("History error response:", errorMessage);
                }
    
                // Jika user role 3, arahkan ke halaman home
                if (user.role_id === 3) {
                    navigate("/");
                } else {
                    // Arahkan pengguna ke halaman detail konten
                    navigate(`/informasi/${contentId}`);
                }
            } else {
                const errorText = response.data;
                alert("Can't access the backend: " + errorText);
                console.error("Error creating content:", errorText);
            }
        } catch (error) {
            console.error("Error creating content:", error);
            alert("There was an error creating the content.");
        }
    };

    const handleConfirm = () => {
        setIsConfirmationOpen(false);
        if (pendingSubmit) {
            pendingSubmit();
        }
    };

    const handleCancel = () => {
        setIsConfirmationOpen(false);
        setPendingSubmit(null);
    };

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
        <div className="container-wrapper profile-wrapper">
            <div className="container">
                <Breadcrumbs
                    paths={[
                        { label: "Home", link: "/" },
                        { label: "Add Content" },
                    ]}
                />
                <div className="text text-gradient">Tambah Konten</div>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="input-data">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <div className="underline"></div>
                            <label>Judul</label>
                            
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-data textarea">
                            <label>Deskripsi (Opsional)</label>
                            <ReactQuill
                                value={description}
                                onChange={setDescription} // Update state on change
                                theme="snow" // Theme untuk ReactQuill
                                style={{ height: '150px' }} // Mengatur tinggi editor
                            />
                        </div>
                    </div>
                    <br></br>
                    <div className="form-row">
                        <div className="input-data">
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                required
                            />
                            <div className="underline"></div>
                            <label>Tag (Berikan tanda koma sebagai pemisah antar tag, apabila tag lebih dari satu)</label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-data">
                            <select
                                value={instanceId}
                                onChange={(e) => setInstanceId(e.target.value)}
                                required
                                disabled={user?.role_id === 3 || user?.role_id === 1 || user?.role_id === 2}
                            >
                                <option value="">Pilih Instansi</option>
                                {instances.map((instance) => (
                                    <option key={instance.id} value={instance.id}>
                                        {instance.name}
                                    </option>
                                ))}
                            </select>
                            <div className="underline"></div>
                            <label>Instansi</label>
                        </div>
                    </div>

                    <div className="form-row">
    <div className="input-data">
        <select
            value={accessibility}
            onChange={(e) => setAccessibility(e.target.value)}
            required
        >
            <option value="public">Public (Accessible to All)</option>
            <option value="private_instance">Private Instance Only</option>
            <option value="all_instance">All Instances (No Public Access)</option>
        </select>
        <div className="underline"></div>
        <label>Content Accessibility</label>
    </div>
</div>

                    <div className="form-row submit-btn">
                        <div className="input-data">
                            <div className="inner"></div>
                            <input type="submit" value="Submit" />
                        </div>
                    </div>
                </form>
                <ConfirmationCard
                    isOpen={isConfirmationOpen}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
};

export default AddContent;