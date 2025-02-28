package controllers

import (
	"backend/entities"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"github.com/gorilla/mux"
	// "backend/models"
)

// var subheadingModel = models.NewSubheadingModel()

func CreateSubheading(w http.ResponseWriter, r *http.Request) {
	var subheading entities.Subheading

	// Directly decode the request body without reading it first
	err := json.NewDecoder(r.Body).Decode(&subheading)
	if err != nil {
		fmt.Println("Invalid request body:", err)
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}
	// fmt.Printf("Received Subheading: %+v\n", subheading)

	if subheading.ContentID == 0 || subheading.Subheading == "" || subheading.Author_id == 0 {
		http.Error(w, "Missing or invalid fields", http.StatusBadRequest)
		return
	}

	// Set the current time for created_at and updated_at
	subheading.Created_at = time.Now().Format("2006-01-02 15:04:05")
	subheading.Updated_at = time.Now().Format("2006-01-02 15:04:05")

	// Call the CreateSubheading method from the models package
	subheadingID, err := subheadingModel.CreateSubheading(subheading)
	if err != nil {
		fmt.Println("Error occurred while creating subheading:", err)
		http.Error(w, "Failed to create subheading", http.StatusInternalServerError)
		return
	}

	// Respond with success
	response := map[string]interface{}{
		"message":       "Subheading created successfully",
		"subheading_id": subheadingID,
	}
	json.NewEncoder(w).Encode(response)
}

func DeleteSubheadingByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	fmt.Println("Subheading ID to delete:", id)

	if err != nil {
		http.Error(w, "Invalid Subheading ID", http.StatusBadRequest)
		return
	}

	err = subheadingModel.DeleteByID(id)
	if err != nil {
		fmt.Println("Error deleting subheading:", err)
		http.Error(w, "Failed to delete subheading", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message": "Subheading deleted successfully",
		"id":      id,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}