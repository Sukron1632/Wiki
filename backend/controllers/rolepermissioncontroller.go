package controllers

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strconv"
    "backend/models"
    "github.com/gorilla/mux"
)

// RolePermissionController struktur untuk controller
type RolePermissionController struct {
    rolePermissionModel *models.RolePermissionModel
    contentModel        *models.ContentModel  // Tambahkan ContentModel di sini
}

// NewRolePermissionController membuat instance controller baru
func NewRolePermissionController(rolePermissionModel *models.RolePermissionModel, contentModel *models.ContentModel) *RolePermissionController {
    return &RolePermissionController{
        rolePermissionModel: rolePermissionModel,
        contentModel:        contentModel,  // Inisialisasi ContentModel di sini
    }
}

// GetPermissionsByRole mengembalikan daftar permissions untuk role tertentu
func (c *RolePermissionController) GetPermissionsByRole(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    roleID := vars["role_id"]

    roleIDInt, err := strconv.Atoi(roleID)
    if err != nil {
        http.Error(w, fmt.Sprintf("Invalid role ID: %v", err), http.StatusBadRequest)
        return
    }

    permissions, err := c.rolePermissionModel.GetPermissionsByRole(roleIDInt)
    if err != nil {
        http.Error(w, fmt.Sprintf("Error retrieving permissions: %v", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(permissions)
}

// AddPermissionToRole menambahkan permission ke role
func (c *RolePermissionController) AddPermissionToRole(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    roleID := vars["role_id"]
    permissionID := vars["permission_id"]

    roleIDInt, err := strconv.Atoi(roleID)
    if err != nil {
        http.Error(w, fmt.Sprintf("Invalid role ID: %v", err), http.StatusBadRequest)
        return
    }

    permissionIDInt, err := strconv.Atoi(permissionID)
    if err != nil {
        http.Error(w, fmt.Sprintf("Invalid permission ID: %v", err), http.StatusBadRequest)
        return
    }

    err = c.rolePermissionModel.AddPermissionToRole(roleIDInt, permissionIDInt)
    if err != nil {
        http.Error(w, fmt.Sprintf("Error adding permission to role: %v", err), http.StatusInternalServerError)
        return
    }

    response := map[string]string{"message": "Permission added successfully"}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

// RemovePermissionFromRole menghapus permission dari role
func (c *RolePermissionController) RemovePermissionFromRole(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    roleID := vars["role_id"]
    permissionID := vars["permission_id"]

    roleIDInt, err := strconv.Atoi(roleID)
    if err != nil {
        http.Error(w, fmt.Sprintf("Invalid role ID: %v", err), http.StatusBadRequest)
        return
    }

    permissionIDInt, err := strconv.Atoi(permissionID)
    if err != nil {
        http.Error(w, fmt.Sprintf("Invalid permission ID: %v", err), http.StatusBadRequest)
        return
    }

    err = c.rolePermissionModel.RemovePermissionFromRole(roleIDInt, permissionIDInt)
    if err != nil {
        http.Error(w, fmt.Sprintf("Error removing permission from role: %v", err), http.StatusInternalServerError)
        return
    }

    response := map[string]string{"message": "Permission removed successfully"}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}
