package controllers

import (
	"backend/entities"
	middleware "backend/middlewares"
	"backend/models"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

var contentModel = models.NewContentModel()
var subheadingModel = models.NewSubheadingModel()

func GetIdTitleAllContents(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	contents, err := contentModel.FindAll()
	if err != nil {
		http.Error(response, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(response).Encode(contents)
}

func GetIdTitleAllContentsNotRejected(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	contents, err := contentModel.FindNotRejected()
	if err != nil {
		http.Error(response, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(response).Encode(contents)
}


func GetIdTitleAllContentsNotDeleted(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	// Ambil instance_id dan role_id dari context
	claims, ok := request.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok {
		http.Error(response, "Unauthorized", http.StatusUnauthorized)
		return
	}

	instanceID := claims.InstanceID // instanceID bertipe int
	roleID := claims.RoleID         // roleID bertipe int64

	// Panggil model dengan parameter instanceID dan roleID
	contents, err := contentModel.FindNotDelete(instanceID, roleID)
	if err != nil {
		http.Error(response, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(response).Encode(contents)
}


func GetIdTitleAllDrafts(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	contents, err := contentModel.FindDrafts()
	if err != nil {
		http.Error(response, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(response).Encode(contents)
}

func SearchContent(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	searchTerm := request.URL.Query().Get("q")
	if searchTerm == "" {
		http.Error(response, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	contents, err := contentModel.Search(searchTerm)
	if err != nil {
		http.Error(response, fmt.Sprintf("Error during search: %v", err), http.StatusInternalServerError)
		return
	}

	// Filter konten yang berstatus "approved"
	approvedContents := []entities.Content{}
	for _, content := range contents {
		if content.Status == "approved" {
			approvedContents = append(approvedContents, content)
		}
	}

	if len(approvedContents) == 0 {
		response.WriteHeader(http.StatusOK)
		json.NewEncoder(response).Encode(map[string]interface{}{
			"message": "No approved content found",
			"data":    []string{}, // Kirim array kosong
		})
		return
	}

	json.NewEncoder(response).Encode(map[string]interface{}{
		"message": "Data ditemukan",
		"data":    approvedContents,
	})
}

func GetContentByID(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	// Ambil parameters dari URL
	vars := mux.Vars(request)
	idStr := vars["id"]

	// Parsing ID untuk memastikan validitas
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(response, "Invalid content ID", http.StatusBadRequest)
		return
	}

	// Ambil konten, nama penulis, dan nama instansi
	content, authorName, instanceName, err := contentModel.FindByIDWithAuthorName(id)
	if err != nil {
		http.Error(response, "Failed to fetch content", http.StatusInternalServerError)
		return
	}

	// Pastikan konten tidak kosong
	if content == nil {
		http.Error(response, "Content not found", http.StatusNotFound)
		return
	}

	// Ambil subheadings terkait dengan konten
	subheadings, err := subheadingModel.FindByContentID(content.Id)
	if err != nil {
		http.Error(response, "Failed to fetch subheadings", http.StatusInternalServerError)
		return
	}

	// Menyusun data untuk dikirim sebagai respons
	data := map[string]interface{}{
		"content":       content,
		"author_name":   authorName,
		"instance_name": instanceName, // Menambahkan instance_name
		"subheadings":   subheadings,
	}

	// Mengencode data menjadi JSON dan mengirimkannya
	if err := json.NewEncoder(response).Encode(data); err != nil {
		http.Error(response, "Failed to encode response", http.StatusInternalServerError)
	}
}

func EditContentByID(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	// Extract content ID from URL path
	pathParts := strings.Split(request.URL.Path, "/")
	idStr := pathParts[len(pathParts)-1]
	contentID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(response, "Invalid content ID", http.StatusBadRequest)
		return
	}
	log.Printf("Editing content with ID: %d", contentID)

	var requestData struct {
		Title        string                `json:"title"`
		Description  string                `json:"description"`
		AuthorID     int64                 `json:"author_id"`
		InstanceID   int64                 `json:"instance_id"`
		Tag          string                `json:"tag"`
		Subheadings  []entities.Subheading `json:"subheadings"`
		Accessibility string               `json:"accessibility"`
	}

	err = json.NewDecoder(request.Body).Decode(&requestData)
	if err != nil {
		log.Println("Error parsing request body:", err)
		http.Error(response, "Error parsing request body", http.StatusBadRequest)
		return
	}

	if requestData.InstanceID == 0 {
		log.Println("InstanceID is missing or invalid")
		http.Error(response, "Instance ID is missing", http.StatusBadRequest)
		return
	}

	updatedContent := entities.Content{
		Id:           contentID,
		Title:        requestData.Title,
		Description:  sql.NullString{String: requestData.Description, Valid: requestData.Description != ""},
		Author_id:    0, // Don't update the Author_id
		Updated_at:   time.Now().Format("2006-01-02 15:04:05"),
		Instance_id:  requestData.InstanceID,
		Tag:          requestData.Tag,
		Accessibility: requestData.Accessibility, // Add this line
	}

	err = contentModel.UpdateByID(updatedContent)
	if err != nil {
		log.Println("Error updating content:", err)
		http.Error(response, "Failed to update content in database", http.StatusInternalServerError)
		return
	}

	// Update each subheading related to the content (same logic here)
	for _, subheading := range requestData.Subheadings {
		subheading.Author_id = 0 // Don't update the Author_id for subheadings either
		subheading.Updated_at = time.Now().Format("2006-01-02 15:04:05")

		err = subheadingModel.UpdateByID(subheading)
		if err != nil {
			log.Println("Error updating subheading:", err)
			http.Error(response, "Failed to update subheading in database", http.StatusInternalServerError)
			return
		}
	}

	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(map[string]string{
		"message": "Content and subheadings updated successfully",
	})
}

func CreateContent(w http.ResponseWriter, r *http.Request) {
	log.Printf("Request received: %s %s", r.Method, r.URL.Path)

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var content entities.Content

	err := json.NewDecoder(r.Body).Decode(&content)
	body, _ := io.ReadAll(r.Body)

	fmt.Printf("Request Body: %s\n", string(body))

	if err != nil {
		fmt.Printf("Error decoding JSON: %v\n", err)
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	fmt.Printf("Decoded content: %+v\n", content)

	if content.Title == "" || content.Tag == "" || content.Author_id == 0 || content.Instance_id == 0 {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Tentukan status berdasarkan role pengguna
	if content.Status == "" {
		if content.Author_role_id == 3 {
			content.Status = "pending"
		} else {
			content.Status = "approved"
		}
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	content.Created_at = now
	content.Updated_at = now

	contentID, err := contentModel.CreateContent(content)
	if err != nil {
		fmt.Printf("Error creating content: %v\n", err)
		http.Error(w, "Failed to create content", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message":    "Content created successfully",
		"content_id": contentID,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DeleteContent(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	// Parse content ID from URL
	vars := mux.Vars(request)
	idStr := vars["id"]

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(response, "Invalid content ID", http.StatusBadRequest)
		return
	}

	// Log content ID for debugging
	fmt.Printf("Attempting to delete content with ID: %d\n", id)

	// Soft delete content by ID
	err = contentModel.DeleteByID(id)
	if err != nil {
		// Log the error and send an error response
		fmt.Printf("Error deleting content with ID %d: %v\n", id, err)
		http.Error(response, fmt.Sprintf("Failed to delete content: %v", err), http.StatusInternalServerError)
		return
	}

	// Log success and send a success response
	fmt.Printf("Content with ID %d soft deleted successfully\n", id)
	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(map[string]string{
		"message": "Content soft deleted successfully",
	})
}

func GetUserContents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)

	if err != nil {
		// Return an error if the userId cannot be parsed
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Log the authorId for debugging purposes
	log.Printf("Fetching contents for authorId: %d", id)

	// Fetch contents for the given userId
	contents, err := contentModel.GetContentsByAuthorId(id)
	if err != nil {
		// Return an error if fetching contents fails
		http.Error(w, "Error fetching contents", http.StatusInternalServerError)
		return
	}

	// If no contents are found, return a 404
	if len(contents) == 0 {
		http.Error(w, "No contents found for the user", http.StatusNotFound)
		return
	}

	// Set the response content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Return the fetched contents as JSON
	json.NewEncoder(w).Encode(contents)
}

func ApproveContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentIDStr := vars["id"]
	contentID, err := strconv.Atoi(contentIDStr) // Menggunakan strconv.Atoi untuk konversi ke int
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid content ID: %v", err), http.StatusBadRequest)
		return
	}

	// Update konten dengan status "approved"
	err = contentModel.UpdateStatus(contentID, "approved")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to approve content: %v", err), http.StatusInternalServerError)
		return
	}

	// Kirim response sukses
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Content approved successfully"))
}

// RejectContent mengubah status konten menjadi rejected
func RejectContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentIDStr := vars["id"]
	contentID, err := strconv.Atoi(contentIDStr)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid content ID: %v", err), http.StatusBadRequest)
		return
	}

	// Add logging for debugging
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	// Log the raw request body
	log.Printf("Raw request body: %s", string(body))

	// Create new reader from the body bytes for json.Decoder
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	var requestData struct {
		Reason string `json:"reason"`
	}
	err = json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid request payload: %v", err), http.StatusBadRequest)
		return
	}

	// Log the parsed reason
	log.Printf("Parsed rejection reason: %s", requestData.Reason)

	if requestData.Reason == "" {
		http.Error(w, "Rejection reason is required", http.StatusBadRequest)
		return
	}

	err = contentModel.RejectContent(contentID, requestData.Reason)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to reject content: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"message": "Content rejected successfully",
		"reason":  requestData.Reason,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetContentViewCount(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentIDStr := vars["id"]
	contentID, err := strconv.Atoi(contentIDStr)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid content ID: %v", err), http.StatusBadRequest)
		return
	}

	viewCount, err := contentModel.GetViewCountByContentID(contentID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get view count: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"viewCount": viewCount})
}

func ResubmitRejectedContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	contentIDStr := vars["id"]
	contentID, err := strconv.Atoi(contentIDStr)
	if err != nil {
		http.Error(w, "Invalid content ID", http.StatusBadRequest)
		return
	}

	var content entities.Content
	err = json.NewDecoder(r.Body).Decode(&content)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Log data yang diterima
	log.Printf("Received content data: %+v", content)

	// Update konten dengan data baru (hanya jika statusnya 'rejected')
	content.Id = int64(contentID)
	err = contentModel.UpdateRejectByID(content)
	if err != nil {
		http.Error(w, "Failed to update content: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Content resubmitted successfully",
	})
}

func IncrementViewCount(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("Content-Type", "application/json")

	// Ambil parameters dari URL
	vars := mux.Vars(request)
	idStr := vars["id"]

	// Parsing ID untuk memastikan validitas
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(response, "Invalid content ID", http.StatusBadRequest)
		return
	}

	// Increment view count
	err = contentModel.IncrementViewCount(int(id))
	if err != nil {
		http.Error(response, "Failed to increment view count", http.StatusInternalServerError)
		return
	}

	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(map[string]string{
		"message": "View count incremented successfully",
	})
}
