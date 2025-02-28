import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ModalLogout from '../component/ModalLogout';
import { apiService } from '../services/ApiService';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Status untuk modal logout

    useEffect(() => {
        const fetchUserData = async () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');  // Ambil token dari localStorage
            if (!userData || !token) {
                navigate('/login');
                return;
            }

            try {
                const response = await apiService.getUserById(userData.id);
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                // navigate('/login');
            }
        };

        fetchUserData();
    }, [navigate]);

    // Panggil modal konfirmasi saat pengguna ingin logout
    const handleLogoutConfirmation = () => {
        setIsModalOpen(true);
    };

    const handleLogout = async () => {
        try {
            // Fetch guest token
            const response = await apiService.getGuestToken();
            const guestData = response.data;

            // Set guest token and default user data
            localStorage.setItem("token", guestData.token);
            const defaultUser = {
                role: guestData.role,
                role_id: guestData.role_id,
                permissions: guestData.permissions,
            };
            localStorage.setItem("user", JSON.stringify(defaultUser));

            // Update user state with guest data
            setUser(defaultUser);

            // Dispatch event for other components
            window.dispatchEvent(new Event("storage"));

            // Close modal and navigate
            setIsModalOpen(false);
            navigate("/");

            // Auto refresh
            window.location.reload();
        } catch (error) {
            console.error("Error during logout:", error);
        }
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

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="container-wrapper profile-container-wrapper">
            <div className="container">
                <Breadcrumbs 
                    paths={[
                        { label: "Home", link: "/" },
                        { label: "Profile" }
                    ]} 
                />
                
                <div className="text text-gradient">User Info</div>
                <table className="profile-table">
                    <tbody>
                        <tr>
                            <td><strong>Nama</strong></td>
                            <td>{user.name}</td>
                        </tr>
                        <tr>
                            <td><strong>NIP (Nomor Induk Pegawai)</strong></td>
                            <td>{user.nip}</td>
                        </tr>
                        <tr>
                            <td><strong>Email</strong></td>
                            <td>{user.email}</td>
                        </tr>
                        <tr>
                            <td><strong>Role</strong></td>
                            <td>{user.role_name}</td>
                        </tr>
                        <tr>
                            <td><strong>Instansi</strong></td>
                            <td>{user.instance}</td>
                        </tr>
                    </tbody>
                </table>
                <button onClick={handleLogoutConfirmation} className="btn btn-red">Logout</button>

                {/* Modal Logout */}
                <ModalLogout
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)} // Menutup modal
                    onConfirm={handleLogout} // Logout jika konfirmasi
                />
            </div> 
        </div>
    );
};

export default Profile;
