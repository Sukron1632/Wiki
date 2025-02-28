package models

import (
	"backend/config"
	"backend/entities"
	"database/sql"
	"fmt"
)

type PermissionModel struct {
	conn *sql.DB
}

func NewPermissionModel() *PermissionModel {
	conn, err := config.DBConnection()
	if err != nil {
		panic(err)
	}
	return &PermissionModel{conn: conn}
}

func (p *PermissionModel) GetAllPermissionList() ([]entities.Permission, error) {
	query := "SELECT id, name, description FROM permissions"
	rows, err := p.conn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch permissions: %v", err)
	}
	defer rows.Close()

	var permissions []entities.Permission
	for rows.Next() {
		var permission entities.Permission
		if err := rows.Scan(&permission.Id, &permission.Name, &permission.Description); err != nil {
			return nil, fmt.Errorf("failed to scan permissions: %v", err)
		}
		permissions = append(permissions, permission)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over permissions: %v", err)
	}

	return permissions, nil
}


func (p *PermissionModel) GetPermissionsByRole(roleId int64) ([]entities.Permission, error) {
	// Query untuk mengambil permission berdasarkan role_id
	query := `
		SELECT p.id, p.name 
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = ?
	`

	// Eksekusi query
	rows, err := p.conn.Query(query, roleId)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch permissions by role: %v", err)
	}
	defer rows.Close()

	// Parsing hasil query
	var permissions []entities.Permission
	for rows.Next() {
		var permission entities.Permission
		if err := rows.Scan(&permission.Id, &permission.Name); err != nil {
			return nil, fmt.Errorf("failed to scan permission: %v", err)
		}
		permissions = append(permissions, permission)
	}

	// Mengembalikan hasil
	return permissions, nil
}
