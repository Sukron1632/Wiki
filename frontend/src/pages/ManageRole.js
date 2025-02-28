import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import 'font-awesome/css/font-awesome.min.css';
import SavePermissionsCard from '../component/SavePermissionsCard'; // Import the new component
import { apiService } from '../services/ApiService';

const ManageRole = () => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentPermissions, setCurrentPermissions] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [openedRoleId, setOpenedRoleId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // State for modal visibility
  const [isButtonVisible, setIsButtonVisible] = useState(false); // State for scroll-to-top button visibility

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await apiService.getPermissions();
      setPermissions(response.data);
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
    }
  }, []);

  const fetchRolePermissions = useCallback(async (roleId) => {
    try {
      const response = await apiService.getRolePermissions(roleId);
      setCurrentPermissions((prev) => ({
        ...prev,
        [roleId]: new Set(response.data.map((p) => p.permission_id)),
      }));
    } catch (err) {
      console.error("Failed to fetch role permissions:", err);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiService.getRoles();
      setRoles(response.data);
      response.data.forEach((role) => fetchRolePermissions(role.id));
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  }, [fetchRolePermissions]);

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, [fetchPermissions, fetchRoles]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsButtonVisible(true);
      } else {
        setIsButtonVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleCheckboxChange = (roleId, permissionId, checked) => {
    setPendingChanges((prev) => {
      const roleChanges = prev[roleId] || { add: new Set(), remove: new Set() };
      const currentHasPermission = currentPermissions[roleId]?.has(permissionId);

      if (checked !== currentHasPermission) {
        if (checked) {
          roleChanges.add.add(permissionId);
          roleChanges.remove.delete(permissionId);
        } else {
          roleChanges.remove.add(permissionId);
          roleChanges.add.delete(permissionId);
        }
      } else {
        roleChanges.add.delete(permissionId);
        roleChanges.remove.delete(permissionId);
      }

      return { ...prev, [roleId]: roleChanges };
    });
  };

  const isPermissionChecked = (roleId, permissionId) => {
    const currentHasPermission = currentPermissions[roleId]?.has(permissionId) || false;
    const pending = pendingChanges[roleId];

    if (!pending) return currentHasPermission;

    if (pending.add.has(permissionId)) return true;
    if (pending.remove.has(permissionId)) return false;

    return currentHasPermission;
  };

  const savePermissions = async () => {
    const savePromises = [];

    console.log("Pending changes: ", pendingChanges); // Debug log untuk memeriksa data

    Object.entries(pendingChanges).forEach(([roleId, changes]) => {
      // Handle additions
      changes.add.forEach((permissionId) => {
        const promise = apiService.addPermissionToRole(roleId, permissionId)
          .then((data) => {
            if (!data.success) {
              throw new Error("Failed to add permission");
            }
          })
          .catch((err) => {
            console.error("Error adding permission:", err);
          });
        savePromises.push(promise);
      });

      // Handle removals
      changes.remove.forEach((permissionId) => {
        const promise = apiService.removePermissionFromRole(roleId, permissionId)
          .then((data) => {
            if (!data.success) {
              throw new Error("Failed to remove permission");
            }
          })
          .catch((err) => {
            console.error("Error removing permission:", err);
          });
        savePromises.push(promise);
      });
    });

    try {
      // Wait for all save promises to complete
      await Promise.all(savePromises);

      // Refresh permissions after save
      roles.forEach((role) => fetchRolePermissions(role.id));

      // Clear pending changes and show success message
      setPendingChanges({});
      //alert("Permissions saved successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Error saving permissions. Please try again.");
    }
  };

  const categorizePermissions = (permissions) => {
    const categories = {
      'View Management': [],
      'Content Management': [],
      'Search Management': [],
      'Role Management': [],
      'History Management': [],
      'Approval Management': [],
    };

    permissions.forEach((perm) => {
      if (perm.name.startsWith("view_")) {
        categories['View Management'].push(perm);
      } else if (perm.name.startsWith("create_") || perm.name.startsWith("edit_") || perm.name.startsWith("delete_")|| perm.name.startsWith("resubmit_")) {
        categories['Content Management'].push(perm);
      } else if (perm.name.startsWith("search_") || perm.name.startsWith("view_user_contents")) {
        categories['Search Management'].push(perm);
      } else if (perm.name.startsWith("view_roles") || perm.name.startsWith("manage_role")) {
        categories['Role Management'].push(perm);
      } else if (perm.name.startsWith("add_history") || perm.name.startsWith("view_history_user") || perm.name.startsWith("view_latest_editor")) {
        categories['History Management'].push(perm);
      } else if (perm.name.startsWith("approve_") || perm.name.startsWith("reject_")) {
        categories['Approval Management'].push(perm);
      }
    });

    return categories;
  };

  const categorizedPermissions = categorizePermissions(permissions);

  const hasUnsavedChanges = Object.values(pendingChanges).some(
    (changes) => changes.add.size > 0 || changes.remove.size > 0
  );

  const toggleDropdown = (roleId) => {
    setOpenedRoleId((prevId) => (prevId === roleId ? null : roleId));
  };

  const toggleCategoryDropdown = (category) => {
    setDropdownOpen((prevState) => ({ ...prevState, [category]: !prevState[category] }));
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

  const openSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  const confirmSavePermissions = async () => {
    closeSaveModal();
    await savePermissions();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="main-container">
      <div className="table-container">
        <Breadcrumbs
          paths={[
            { label: "Home", link: "/" },
            { label: "Manage Role" },
          ]}
        />
        <div className="manage-content">
          <h1 className="manage-content-h1">Manage Role</h1>
          <p className="manage-content-p">
            Manage, optimize, and distribute your content easily to achieve maximum results.
          </p>
        </div>
        
        {Array.isArray(roles) && (
          <div className="card">
            <div className="rolem">
              <h3>Select role</h3>
              <span>Please select a role:</span>
              <div className="btn-container">
              <div className="btn-apply-container">
          <button
            className={`btn-apply ${hasUnsavedChanges ? '' : 'disabled'}`}
            disabled={!hasUnsavedChanges}
            onClick={openSaveModal} // Open modal on click
          >
            Save Permissions
          </button>
        </div>
        </div>
        <hr className="hrrole" /> 
            </div>
            <table className="managerole">
              <tbody>
                {roles.map((role) => (
                  <React.Fragment key={role.id}>
                    <tr>
                      <td>
                        <div
                          className="role-header"
                          onClick={() => toggleDropdown(role.id)}
                          style={{
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{role.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <i
                              className={`fa ${openedRoleId === role.id ? 'fa-chevron-up' : 'fa-chevron-down'} icon-animate`}
                              style={{ marginLeft: '10px' }}
                            />
                          </span>
                        </div>
                      </td>
                    </tr>
                    {openedRoleId === role.id && (
                      <tr>
                        <td>
                          <table
                            className="managerole"
                            style={{ width: '100%', marginTop: '10px' }}
                          >
                            <tbody>
                              {Object.keys(categorizedPermissions).map((category) => (
                                <React.Fragment key={category}>
                                  <tr>
                                    <td>
                                      <span
                                        onClick={() => toggleCategoryDropdown(category)}
                                        style={{
                                          cursor: 'pointer',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <span>{category}</span>
                                        <i
                                          className={`fa ${dropdownOpen[category] ? 'fa-chevron-up' : 'fa-chevron-down'} icon-animate`}
                                          style={{ marginLeft: '10px' }}
                                        />
                                      </span>
                                    </td>
                                  </tr>
                                  {dropdownOpen[category] && (
                                    <tr>
                                      <td>
                                        <table
                                          className="manageuser"
                                          style={{ width: '100%', marginTop: '5px' }}
                                        >
                                          <thead>
                                            <tr>
                                              <th>Permission Name</th>
                                              <th>Deskripsi</th>
                                              <th>Action</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {categorizedPermissions[category].map((perm) => (
                                              <tr key={perm.id}>
                                                <td>{perm.name}</td>
                                                <td>{perm.description}</td> {/* Tampilkan deskripsi */}
                                                <td>
                                                  <label className="custom-checkbox">
                                                    <input
                                                      type="checkbox"
                                                      checked={isPermissionChecked(role.id, perm.id)}
                                                      onChange={(e) =>
                                                        handleCheckboxChange(role.id, perm.id, e.target.checked)
                                                      }
                                                    />
                                                  </label>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
         <button
          className={`button ${isButtonVisible ? '' : 'disabled'}`}
          onClick={scrollToTop}
          disabled={!isButtonVisible}
        >
          <svg className="svgIcon" viewBox="0 0 384 512">
            <path
              d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
            ></path>
          </svg>
        </button>
      </div>
      <SavePermissionsCard
        isOpen={isSaveModalOpen}
        onConfirm={confirmSavePermissions}
        onCancel={closeSaveModal}
      />
    </div>
  );
};

export default ManageRole;