import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DeleteSubheadingCard from '../component/DeleteSubheadingCard';
import { apiService } from '../services/ApiService';

const Edit = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [updatedContentTitle, setUpdatedContentTitle] = useState("");
  const [updatedContentDescription, setUpdatedContentDescription] = useState("");
  const [updatedInstanceID, setUpdatedInstanceID] = useState("");
  const [updatedContentTag, setUpdatedContentTag] = useState("");
  const [subheadings, setSubheadings] = useState([]);
  const [updatedSubheadings, setUpdatedSubheadings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subheadingToDelete, setSubheadingToDelete] = useState(null);
  const [lastHistoryUpdate, setLastHistoryUpdate] = useState(null);
  const hasFetchedData = useRef(false);
  const [accessibility, setAccessibility] = useState("public");

  useEffect(() => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    const fetchUserData = async () => {
      if (!token) {
        console.warn("No token found!");
        setUser(storedUser);
        return;
      }

      try {
        const response = await apiService.decodeToken(token);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(storedUser);
      }
    };

    fetchUserData();
    fetchContent(id);
    fetchInstances();
  }, [id]);

  useEffect(() => {
    if (!originalContent) return;

    const hasContentChanges = 
      originalContent.title !== updatedContentTitle ||
      originalContent.description !== updatedContentDescription ||
      originalContent.instance_id !== updatedInstanceID ||
      originalContent.tag !== updatedContentTag ||
      originalContent.accessibility !== accessibility;

    const hasSubheadingChanges = subheadings.some(sub => {
      const updatedSub = updatedSubheadings[sub.id];
      return updatedSub && (
        updatedSub.subheading !== sub.subheading ||
        updatedSub.subheading_description !== sub.subheading_description
      );
    });

    setHasChanges(hasContentChanges || hasSubheadingChanges);

    const shouldRecordHistory = hasChanges && 
      (!lastHistoryUpdate || Date.now() - lastHistoryUpdate > 30000);

    if (shouldRecordHistory) {
      recordEditHistory();
    }
  }, [updatedContentTitle, updatedContentDescription, updatedInstanceID, 
      updatedContentTag, updatedSubheadings, accessibility]);

  const recordEditHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
        hour12: false,
      });

      const [date, time] = formattedDate.split(", ");
      const [month, day, year] = date.split("/");
      const formattedMySQLDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;

      const historyData = {
        content_id: parseInt(id, 10),
        editor_id: user.id,
        action: "Editing",
        edited_at: formattedMySQLDate,
      };

      const historyResponse = await apiService.addHistory(historyData);
      if (historyResponse.status === 200) {
        setLastHistoryUpdate(Date.now());
      } else {
        console.error("Failed to record edit history");
      }
    } catch (error) {
      console.error("Error recording edit history:", error);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await apiService.getInstances();
      setInstances(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchContent = async (id) => {
    try {
      const response = await apiService.getContentById(id);
      const data = response.data;

      setOriginalContent({
        title: data.content?.title || "",
        description: data.content.description?.String || "",
        instance_id: data.content.instance_id || "",
        tag: data.content.tag || "",
        accessibility: data.content.accessibility || "public",
      });

      setUpdatedContentTitle(data.content?.title || "");
      setUpdatedContentDescription(data.content.description?.String || "");
      setUpdatedInstanceID(data.content.instance_id || "");
      setUpdatedContentTag(data.content.tag || "");
      setAccessibility(data.content.accessibility || "public");

      const initialSubheadings = {};
      if (data.subheadings && Array.isArray(data.subheadings)) {
        data.subheadings.forEach((sub) => {
          initialSubheadings[sub.id] = {
            subheading: sub.subheading,
            subheading_description: sub.subheading_description,
          };
        });
      }

      setUpdatedSubheadings(initialSubheadings);
      setSubheadings(data.subheadings || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubheadingChange = (subheadingId, field, value) => {
    setUpdatedSubheadings((prev) => ({
      ...prev,
      [subheadingId]: {
        ...prev[subheadingId],
        [field]: value,
      },
    }));
  };

  const deleteSubheading = async (subheadingId) => {
    if (!user?.permissions?.includes("delete_subheading")) {
      alert("Anda tidak memiliki izin untuk menghapus subheading.");
      return;
    }

    try {
      const response = await apiService.deleteSubheading(subheadingId);
      if (response.status === 200) {
        setSubheadings((prev) => prev.filter((sub) => sub.id !== subheadingId));
      } else {
        alert("Gagal menghapus subheading");
      }
    } catch (error) {
      console.error("Error deleting subheading:", error);
      alert("Terjadi kesalahan saat menghapus subheading");
    }
  };

  const handleDeleteSubheading = (subheadingId) => {
    setSubheadingToDelete(subheadingId);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubheadingClick = async () => {
    if (!user?.permissions?.includes("create_subheading")) {
      alert("Anda tidak memiliki izin untuk menambah subjudul.");
      return;
    }
    navigate(`/addsubheading/${id}`);
  };

  const handleSave = async () => {
    if (!user?.permissions?.includes("edit_content")) {
      alert("Anda tidak memiliki izin untuk mengedit konten.");
      return;
    }
    
    const updatedSubheadingsArray = subheadings.map((subheading) => ({
      id: subheading.id,
      subheading:
        updatedSubheadings[subheading.id]?.subheading || subheading.subheading,
      subheading_description:
        updatedSubheadings[subheading.id]?.subheading_description ||
        subheading.subheading_description,
    }));
    
    const requestBody = {
      title: updatedContentTitle,
      description: updatedContentDescription,
      instance_id: parseInt(updatedInstanceID, 10),
      tag: updatedContentTag,
      subheadings: updatedSubheadingsArray,
      editor_id: user.id,
      accessibility: accessibility, // Add this line
    };
    
    try {
      const response = await apiService.editContent(id, requestBody);
      if (response.status === 200) {
        navigate(`/informasi/${id}`);
      } else {
        alert("Gagal mengupdate konten.");
      }
    } catch (error) {
      console.error("An error occurred while saving updates:", error);
      alert("Terjadi kesalahan saat menyimpan pembaruan.");
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
              {index < paths.length - 1 && " / "}
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
            { label: "Edit Content" }
          ]} 
        />
        
        <div className="text">Edit Content</div>
        <form>
          <div className="form-row">
            <div className="input-data">
              <label>Judul</label>
              <input
                type="text"
                value={updatedContentTitle}
                onChange={(e) => setUpdatedContentTitle(e.target.value)}
                required
              />
            </div>
            <div className="input-data textarea">
              <label>Deskripsi</label>
              <ReactQuill
                value={updatedContentDescription}
                onChange={setUpdatedContentDescription}
                theme="snow"
                style={{ height: '150px' }}
              />
            </div>
            <div className="input-data">
              <label>Instansi</label>
              <select
                value={updatedInstanceID}
                onChange={(e) => setUpdatedInstanceID(e.target.value)}
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
            </div>

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

            <div className="input-data">
              <label>Tag (Berikan tanda koma sebagai pemisah antar tag)</label>
              <input
                type="text"
                value={updatedContentTag}
                onChange={(e) => setUpdatedContentTag(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            {subheadings.map((subheading) => (
              <div className="form-row" key={subheading.id}>
                <div className="input-data">
                  <label>Sub Judul</label>
                  <input
                    type="text"
                    value={
                      updatedSubheadings[subheading.id]?.subheading ||
                      subheading.subheading
                    }
                    onChange={(e) =>
                      handleSubheadingChange(subheading.id, "subheading", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="input-data textarea">
                  <label>Deskripsi</label>
                  <ReactQuill
                    value={
                      updatedSubheadings[subheading.id]?.subheading_description ||
                      subheading.subheading_description
                    }
                    onChange={(value) =>
                      handleSubheadingChange(subheading.id, "subheading_description", value)
                    }
                    theme="snow"
                    style={{ height: '100px' }}
                  />
                </div>
                <br></br>
                <br></br>
                {user?.permissions?.includes("delete_subheading") && (
                  <div className="submit-btn">
                    <input
                      type="button"
                      value={`Hapus Sub Judul ${subheading.subheading}`}
                      className="btn btn-red"
                      onClick={() => handleDeleteSubheading(subheading.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="submit-btn">
            {user?.permissions?.includes("create_subheading") && (
              <input
                type="button"
                value="Tambah Sub Judul"
                className="btn btn-blue"
                onClick={handleAddSubheadingClick}
              />
            )}
            {user?.permissions?.includes("edit_content") && (
              <input
                type="button"
                value="Simpan"
                className="btn btn-green"
                onClick={handleSave}
              />
            )}
          </div>
        </form>

        {/* Modal Konfirmasi Penghapusan Sub Judul */}
        <DeleteSubheadingCard
          isOpen={isDeleteModalOpen}
          onDelete={async () => {
            await deleteSubheading(subheadingToDelete);
            setIsDeleteModalOpen(false);
          }}
          onCancel={() => setIsDeleteModalOpen(false)}
          subheadingName={updatedSubheadings[subheadingToDelete]?.subheading || ''}
        />
      </div>
    </div>
  );
};

export default Edit;