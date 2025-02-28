package controllers

import (
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"backend/middlewares" // pastikan package middleware diimpor dengan benar
)

var permissionModel = models.NewPermissionModel()

// Controller untuk mengambil daftar permission
func GetPermissionList(w http.ResponseWriter, r *http.Request) {
	permission, err := permissionModel.GetAllPermissionList()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error retrieving permission: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(permission)
}

// Controller untuk mengambil permissions berdasarkan role_id dari JWT
func GetPermissionsByRole(w http.ResponseWriter, r *http.Request) {
	// Ambil klaim dari context yang disimpan oleh middleware
	userClaims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok {
		http.Error(w, "Errors extracting claims from token", http.StatusUnauthorized)
		return
	}

	// Ambil role_id dari klaim
	roleId := userClaims.RoleID  // Ambil role_id dari Claims

	// Ambil permissions berdasarkan role_id
	permissions, err := permissionModel.GetPermissionsByRole(roleId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error retrieving permissions: %v", err), http.StatusInternalServerError)
		return
	}

	// Kirim hasil dalam format JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(permissions)
}
