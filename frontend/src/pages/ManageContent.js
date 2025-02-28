import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";
import ApprovalCard from "../component/ApprovalCard";
import RejectPopup from "../component/RejectPopup"; // Assuming you have a RejectPopup component
import { apiService } from "../services/ApiService"; // Import apiService

const ManageContent = () => {
  const [contents, setContents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [isRejectPopupOpen, setIsRejectPopupOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedContentId, setSelectedContentId] = useState(null);

  useEffect(() => {
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
        console.log("User loaded with permissions:", response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(storedUser);
      }
    };

    fetchUserData();

    const fetchContents = async () => {
      try {
        const response = await apiService.getDrafts();
        const sortedData = response.data.sort((a, b) => b.id - a.id);
        setContents(sortedData);
      } catch (error) {
        console.error("Error fetching contents:", error);
      }
    };

    fetchContents();
  }, []);

  const handleApprove = async (id) => {
    if (!user?.permissions?.includes("approve_content")) {
      alert("You don't have permission to approve content.");
      return;
    }
    setApprovalMessage("Apakah Anda yakin ingin menyetujui konten ini?");
    setPendingAction(() => () => approveContent(id));
    setIsApprovalOpen(true);
  };

  const handleReject = async (id) => {
    if (!user?.permissions?.includes("reject_content")) {
      alert("You don't have permission to reject content.");
      return;
    }
    setSelectedContentId(id);
    setIsRejectPopupOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert("Alasan penolakan tidak boleh kosong.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      // Log the request payload for debugging
      console.log("Sending rejection with reason:", rejectReason);

      const response = await apiService.rejectContent(selectedContentId, rejectReason.trim());

      // Log the response for debugging
      console.log("Server response:", response.data);

      if (response.status === 200) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
          hour12: false,
        });

        const [date, time] = formattedDate.split(", ");
        const [month, day, year] = date.split("/");
        const formattedMySQLDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;

        const historyData = {
          content_id: selectedContentId,
          editor_id: user.id,
          action: "Rejecting",
          edited_at: formattedMySQLDate,
          reason: rejectReason,
        };

        const historyResponse = await apiService.addHistory(historyData);

        if (historyResponse.status !== 200) {
          console.error("Failed to record edit history:", historyResponse.data);
          alert("Something went wrong while saving history. Please try again.");
          return;
        }

        setContents((prevContents) => prevContents.filter((content) => content.id !== selectedContentId));
        setCurrentPage(1);
        setIsRejectPopupOpen(false);
        setRejectReason("");
      } else {
        alert("Failed to reject content");
        console.error("Failed to reject content:", response.statusText);
      }
    } catch (error) {
      console.error("Error rejecting content:", error);
      alert(error.message || "An error occurred while rejecting the content.");
      return;
    }
  };

  const handleRejectCancel = () => {
    setIsRejectPopupOpen(false);
    setRejectReason("");
  };

  const approveContent = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await apiService.approveContent(id);

      if (response.status === 200) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
          hour12: false,
        });

        const [date, time] = formattedDate.split(", ");
        const [month, day, year] = date.split("/");
        const formattedMySQLDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;

        const historyData = {
          content_id: id,
          editor_id: user.id,
          action: "Approving",
          edited_at: formattedMySQLDate,
        };

        const historyResponse = await apiService.addHistory(historyData);

        if (historyResponse.status !== 200) {
          console.error("Failed to record edit history:", historyResponse.data);
          alert("Something went wrong while saving history. Please try again.");
          return;
        }

        setContents((prevContents) => prevContents.filter((content) => content.id !== id));
        setCurrentPage(1);
      } else {
        alert("Failed to approve content");
        console.error("Failed to approve content:", response.statusText);
      }
    } catch (error) {
      console.error("Error approving content:", error);
      alert("An error occurred while approving the content. Please check the console for more details.");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(contents.length / itemsPerPage);
  const currentContents = contents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="main-container">
      <div className="table-container">
        <Breadcrumbs paths={[{ label: "Home", link: "/" }, { label: "Manage Content" }]} />
        <div className="manage-content">
          <h1 className="manage-content-h1">Manage Content</h1>
          <p className="manage-content-p">Manage, optimize, and distribute your content easily to achieve maximum results.</p>
        </div>
        <table className="table-manage">
          <thead className="thead-manage">
            <tr>
              <th style={{ width: "40%" }}>Title</th>
              <th style={{ width: "20%" }}>Author</th>
              <th style={{ width: "40%" }} colSpan={3}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentContents.map((content) => (
              <tr key={content.id}>
                <td>{content.title}</td>
                <td>{content.author_name}</td>
                <td>
                  <Link to={`/content/${content.id}`} className="no-underline">
                    <button className="Detail Button" style={{ display: "flex", alignItems: "center" }}>
                      <FaInfoCircle style={{ marginRight: "5px" }} /> Detail
                    </button>
                  </Link>
                </td>
                {user?.permissions?.includes("approve_content") && (
                  <td>
                    <button className="Detail Approve" onClick={() => handleApprove(content.id)} style={{ display: "flex", alignItems: "center" }}>
                      <FaCheck style={{ marginRight: "5px" }} /> Approve
                    </button>
                  </td>
                )}
                {user?.permissions?.includes("reject_content") && (
                  <td>
                    <button className="Detail Reject" onClick={() => handleReject(content.id)} style={{ display: "flex", alignItems: "center" }}>
                      <FaTimes style={{ marginRight: "5px" }} /> Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
            &lt;&lt;
          </button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button key={index + 1} onClick={() => handlePageChange(index + 1)} className={currentPage === index + 1 ? "active" : ""}>
              {index + 1}
            </button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            &gt;
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
            &gt;&gt;
          </button>
        </div>
      </div>
      <ApprovalCard
        isOpen={isApprovalOpen}
        message={approvalMessage}
        onConfirm={() => {
          if (pendingAction) pendingAction();
          setIsApprovalOpen(false);
        }}
        onCancel={() => setIsApprovalOpen(false)}
      />
      <RejectPopup
        isOpen={isRejectPopupOpen}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectCancel}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
      />
    </div>
  );
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

export default ManageContent;