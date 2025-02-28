import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { apiService } from '../services/ApiService';

const DetailUser = () => {
  const [mergedData, setMergedData] = useState([]);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [instances, setInstances] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    nip: "",
    email: "",
    password: "",
    role_id: "",
    instance_id: "",
  });
  const [histories, setHistories] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [contents, setContents] = useState([]);
  const { id } = useParams();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    const fetchUserData = async () => {
      if (!token) {
        console.warn("No token found!");
        setCurrentUser(storedUser);
        return;
      }

      try {
        const response = await apiService.decodeToken(token);
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCurrentUser(storedUser);
      }
    };

    fetchUserData();

    const fetchData = async () => {
      try {
        const [userResponse, rolesResponse, instancesResponse, contentsResponse] = await Promise.all([
          apiService.getUserById(id),
          apiService.getRoles(),
          apiService.getInstances(),
          apiService.getNotRejectedContents(),
        ]);

        setUser(userResponse.data);
        setFormData({
          id: userResponse.data.id,
          name: userResponse.data.name,
          nip: userResponse.data.nip,
          email: userResponse.data.email,
          password: userResponse.data.password,
          role_id: userResponse.data.role_id,
          instance_id: userResponse.data.instance_id,
        });
        setRoles(rolesResponse.data);
        setInstances(instancesResponse.data);
        setContents(contentsResponse.data || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [id, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.permissions?.includes("edit_user")) {
      alert("You don't have permission to save user changes.");
      return;
    }

    const formattedData = {
      ...formData,
      nip: parseInt(formData.nip, 10),
      role_id: parseInt(formData.role_id, 10),
      instance_id: parseInt(formData.instance_id, 10),
    };

    try {
      await apiService.editUser(formData.id, formattedData);
      setIsEditing(false);
      const updatedUserResponse = await apiService.getUserById(id);
      setUser(updatedUserResponse.data);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const loadHistories = async () => {
    try {
      const response = await apiService.getHistoryByUserId(id);
      setHistories(response.data || []);
    } catch (error) {
      console.error("Failed to fetch histories:", error);
    }
  };

  const handleToggleHistory = () => {
    if (!currentUser?.permissions?.includes("view_history_user")) {
      alert("You don't have permission to view user history.");
      return;
    }

    if (!showHistory) {
      loadHistories();
    }
    setShowHistory(!showHistory);
  };

  const handleEditClick = () => {
    if (!currentUser?.permissions?.includes("edit_user")) {
      alert("You don't have permission to edit user details.");
      return;
    }
    setIsEditing(true);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "Invalid Date";

    const parsedDate = new Date(dateTime.replace(" ", "T"));
    if (isNaN(parsedDate)) return "Invalid Date";

    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const formattedTime = new Intl.DateTimeFormat("id-ID", optionsTime).format(parsedDate);

    const optionsDate = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const formattedDate = new Intl.DateTimeFormat("id-ID", optionsDate).format(parsedDate);

    return `${formattedTime} - ${formattedDate}`;
  };

  useEffect(() => {
    if (contents && histories) {
      const contentMap = contents.reduce((map, content) => {
        map[content.id] = content.title;
        return map;
      }, {});

      const newMergedData = histories.map((history) => {
        const title = contentMap[history.content_id];
        return {
          type: "history",
          id: history.id,
          title: title || `Unknown Content (ID: ${history.content_id})`,
          created_at: history.edited_at,
          action: history.action || "Edit",
        };
      });

      newMergedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMergedData(newMergedData);
    }
  }, [contents, histories]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMergedData = mergedData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(mergedData.length / itemsPerPage);

  if (!user || !contents || !histories) {
    return <div>Loading...</div>;
  }

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
    <div className="container-wrapper profile-wrapper">
      <div className="container">
        <Breadcrumbs
          paths={[
            { label: "Home", link: "/" },
            { label: "Manage User", link: `/manage` },
            { label: "Detail User" },
          ]}
        />
        <div className="text text-gradient">Detail User</div>
        {!isEditing ? (
          <>
            <table className="profile-table">
              <tbody>
                <tr>
                  <td><strong>Name</strong></td>
                  <td>{user.name}</td>
                </tr>
                <tr>
                  <td><strong>NIP</strong></td>
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
                  <td><strong>Instance</strong></td>
                  <td>{user.instance}</td>
                </tr>
              </tbody>
            </table>
            {currentUser?.permissions?.includes("edit_user") && (
              <input
                type="button"
                value="Edit"
                className="btn btn-blue"
                onClick={handleEditClick}
              />
            )}
          </>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="form-row">
              <div className="input-data">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <label>NIP:</label>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <label>Password</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    style={{
                      marginLeft: "10px",
                      background: "none",
                      border: "none",
                    }}
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <label>Role:</label>
                <select
                  style={{
                    backgroundColor:
                      formData.id === currentUser.id ? "#e0e0e0" : "white",
                  }}
                  disabled={formData.id === currentUser.id}
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <label>Instance:</label>
                <select
                  name="instance_id"
                  value={formData.instance_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Instance</option>
                  {instances.map((instance) => (
                    <option key={instance.id} value={instance.id}>
                      {instance.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row submit-btn">
              <div className="input-data">
                <div className="inner"></div>
                {currentUser?.permissions?.includes("edit_user") && (
                  <input
                    type="submit"
                    value="Save Changes"
                    className="btn btn-blue"
                  />
                )}
              </div>
            </div>

            <input
              type="button"
              value="Cancel"
              className="btn btn-gray"
              onClick={() => setIsEditing(false)}
            />
          </form>
        )}

        {currentUser?.permissions?.includes("view_history_user") && (
          <input
            type="button"
            value={showHistory ? "Hide History" : "Show History"}
            className="btn btn-gray"
            onClick={handleToggleHistory}
          />
        )}

        {showHistory && (
          <>
            <table className="history-table">
              <thead className="thead">
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentMergedData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.title === "Unknown Content"
                        ? `Content ID ${item.content_id} (Deleted or Inaccessible)`
                        : item.title}
                    </td>
                    <td>{formatDateTime(item.created_at)}</td>
                    <td>{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                ««
              </button>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                «
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
                »
              </button>
              <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
                »»
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DetailUser;