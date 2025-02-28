import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { apiService } from '../services/ApiService';

const EditRejectContent = () => {
    const { id } = useParams();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tag, setTag] = useState('');
    const [instanceId, setInstanceId] = useState('');
    const [instances, setInstances] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.id) {
            setUser(storedUser);
        } else {
            console.warn('User ID not found in localStorage.');
        }
    }, []);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await apiService.getContentById(id);
                const data = response.data;
                setTitle(data.content.title);
                setDescription(data.content.description.String);
                setTag(data.content.tag);
                setInstanceId(data.content.instance_id);
            } catch (error) {
                console.error('Error fetching content:', error);
            }
        };

        const fetchInstances = async () => {
            try {
                const response = await apiService.getInstances();
                setInstances(response.data);
            } catch (error) {
                console.error('Error fetching instances:', error);
            }
        };

        fetchContent();
        fetchInstances();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const contentData = {
            title,
            description: {
                String: description || '',
                Valid: description !== '',
            },
            tag,
            instance_id: parseInt(instanceId, 10),
        };

        try {
            await apiService.resubmitRejectedContent(id, contentData);
            navigate('/view-status-content');
        } catch (error) {
            console.error('Error resubmitting content:', error);
            alert('There was an error resubmitting the content.');
        }
    };

    return (
        <div className="container-wrapper profile-wrapper">
            <div className="container">
                <div className="text text-gradient">Edit Rejected Content</div>
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
                                onChange={setDescription}
                                theme="snow"
                                style={{ height: '150px' }}
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
                                disabled
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

                    <div className="form-row submit-btn">
                        <div className="input-data">
                            <div className="inner"></div>
                            <input type="submit" value="Submit" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRejectContent;