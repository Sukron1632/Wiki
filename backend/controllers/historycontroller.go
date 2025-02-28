package controllers

import (
	"backend/entities"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

var historyModel = models.NewHistoryModel()

func AddHistory(w http.ResponseWriter, r *http.Request) {
    var historyData entities.History 

    err := json.NewDecoder(r.Body).Decode(&historyData)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

    fmt.Printf("Decoded history data: %+v\n", historyData)

    if historyData.Content_Id == 0 || historyData.Editor_Id == 0 {
		http.Error(w, "Invalid or missing fields in history data", http.StatusBadRequest)
		fmt.Println("Invalid history data received:", historyData)
		return
	}

    err = historyModel.AddHistoryRecord(historyData)
    if err != nil {
        http.Error(w, "Failed to save history to database", http.StatusInternalServerError)
        fmt.Println("Error saving to database:", err)
        return
    }

    w.WriteHeader(http.StatusOK)
    fmt.Fprintln(w, "History saved successfully")
}

func GetByIdUser(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userId := vars["id"]

    histories, err := historyModel.GetHistoriesByUserId(userId)
    if err != nil {
        fmt.Println("Error getting histories:", err)  // Cetak error untuk debugging
        http.Error(w, "Failed to get histories", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(histories)
}


func GetLatestEditorNameByContentId(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    contentId := vars["contentId"]

    editorName, err := historyModel.GetLatestEditorName(contentId)
    if err != nil || editorName == "" {
        // Jika tidak ada editor name, kirimkan null sebagai hasilnya
        json.NewEncoder(w).Encode(map[string]interface{}{"editorName": nil})
        return
    }

    // Jika ada editor name, kembalikan nama editor
    json.NewEncoder(w).Encode(map[string]string{"editorName": editorName})
}
