package models

import (
	"backend/config"
	"database/sql"
	"fmt"
	"log"
)

type Permission struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

// RolePermission mewakili relasi antara role dan permission
type RolePermission struct {
	RoleID      int `json:"role_id"`
	PermissionID int `json:"permission_id"`
}

// RolePermissionModel adalah struct untuk model RolePermission
type RolePermissionModel struct {
	DB *sql.DB
}

// NewRolePermissionModel untuk membuat model baru dengan membuat koneksi database baru
func NewRolePermissionModel() *RolePermissionModel {
	conn, err := config.DBConnection() // Fungsi ini harus mengembalikan koneksi database
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	return &RolePermissionModel{DB: conn}
}

// GetPermissionsByRole untuk mendapatkan daftar permissions berdasarkan role
func (m *RolePermissionModel) GetPermissionsByRole(roleID int) ([]RolePermission, error) {
	rows, err := m.DB.Query("SELECT role_id, permission_id FROM role_permissions WHERE role_id = ?", roleID)
	if err != nil {
		return nil, fmt.Errorf("error getting permissions by role: %v", err)
	}
	defer rows.Close()

	var permissions []RolePermission
	for rows.Next() {
		var permission RolePermission
		if err := rows.Scan(&permission.RoleID, &permission.PermissionID); err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		permissions = append(permissions, permission)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error with rows: %v", err)
	}

	return permissions, nil
}

// AddPermissionToRole untuk menambahkan permission ke role
func (m *RolePermissionModel) AddPermissionToRole(roleID int, permissionID int) error {
	_, err := m.DB.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", roleID, permissionID)
	if err != nil {
		return fmt.Errorf("error adding permission to role: %v", err)
	}
	return nil
}

// RemovePermissionFromRole untuk menghapus permission dari role
func (m *RolePermissionModel) RemovePermissionFromRole(roleID int, permissionID int) error {
	_, err := m.DB.Exec("DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?", roleID, permissionID)
	if err != nil {
		return fmt.Errorf("error removing permission from role: %v", err)
	}
	return nil
}
