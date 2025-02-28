package controllers

import (
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
)

var instanceModel = models.NewInstanceModel()

func GetInstances(w http.ResponseWriter, r *http.Request) {
    instances, err := instanceModel.GetAllInstances()
    if err != nil {
        http.Error(w, fmt.Sprintf("Error retrieving instances: %v", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(instances)
}