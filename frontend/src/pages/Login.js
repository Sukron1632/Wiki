import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from '../assets/logojogja.png'; // Pastikan path sesuai

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Login untuk mendapatkan token
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.message || 'Invalid login credentials'}`);
                return; // Jika login gagal, hentikan proses lebih lanjut
            }

            const data = await response.json();
            console.log(data); // Debug log

            if (data.token) {
                // Simpan token ke localStorage
                localStorage.setItem('token', data.token);

                // Mendapatkan roles menggunakan token
                const getRoles = await fetch('http://localhost:3000/api/roles', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                    },
                });

                if (!getRoles.ok) {
                    alert('Failed to fetch roles');
                    return; // Jika gagal mengambil roles, hentikan proses
                }

                const roles = await getRoles.json();
                console.log(roles); // Debug log roles

                // Ambil role yang sesuai berdasarkan role_id
                const role = roles.find(role => role.id === data.role_id);
                if (!role) {
                    alert("Invalid role assignment");
                    return; // Jika role tidak ditemukan, hentikan proses
                }

                // Mendapatkan permissions berdasarkan role_id
                const permissionsResponse = await fetch(`http://localhost:3000/api/role_permissions`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                    },
                });

                if (!permissionsResponse.ok) {
                    const errorData = await permissionsResponse.json();
                    alert(`Failed to fetch permissions: ${errorData.message || 'Unknown error'}`);
                    return; // Jika gagal mengambil permissions, hentikan proses
                }

                const permissions = await permissionsResponse.json();
                console.log(permissions); // Debug log permissions

                const user = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    user_instance_id: data.instance_id,
                    role_id: data.role_id,
                    role: role.name,
                    permissions: permissions, // Menyimpan permissions di dalam data user
                };

                // Simpan user data termasuk permissions ke localStorage
                localStorage.setItem('user', JSON.stringify(user));
                window.dispatchEvent(new Event('storage'));

                // Redirect ke halaman utama setelah login sukses
                navigate('/');
            } else {
                alert('Invalid login credentials');
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert('Failed to connect to server');
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                {/* Menambahkan logo di sini */}
                <img src={logo} alt="Logo Pemda DIY" className="logo" />
                <h2>Login Account</h2>
                <p>Silahkan Login Untuk Mengakses Web</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="password-container">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>
                    <div className="form-row">
                        <button type="submit" className="btn btn-blue">Login</button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn btn-gray"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="help-links">
                        <a href="https://api.whatsapp.com/send/?phone=6282133576291&text=Hello&type=phone_number&app_absent=0">FAQ</a>
                        <a href="https://api.whatsapp.com/send/?phone=6282133576291&text=Hello&type=phone_number&app_absent=0">Helpdesk</a>
                    </div>
                </form>
            </div>
            <div className="login-right">
                <br></br>
                <h2>Selamat datang di Wiki Pemda DIY</h2>
                <hr className="divider" />
                <p>Knowledge Management system Pemda DIY untuk berbagi pengetahuan</p>
                <p>Hal yang harus Anda perhatikan:</p>
                <ul>
                    <li>Jaga kerahasiaan akun Anda dan tidak membagikan password kepada orang lain</li>
                    <li>Selalu mengingat password Anda secara berkala</li>
                    <li>Pastikan menggunakan kata sandi yang unik dan mudah diingat untuk memudahkan Anda saat login. Hindari password yang mudah ditebak, gunakan kombinasi karakter huruf besar maupun kecil, angka dan panjang minimal 12 karakter</li>
                </ul>
                <div className="help-links">
                    <a href="https://api.whatsapp.com/send/?phone=6282133576291&text=Hello&type=phone_number&app_absent=0">FAQ</a>
                    <a href="https://api.whatsapp.com/send/?phone=6282133576291&text=Hello&type=phone_number&app_absent=0">Helpdesk</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
