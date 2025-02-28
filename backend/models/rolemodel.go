package models

import (
	"backend/config"
	"backend/entities"
	"database/sql"
	"fmt"
	"log"
)

type RoleModel struct {
    conn *sql.DB
}

func NewRoleModel() *RoleModel {
    conn, err := config.DBConnection()
    if err != nil {
        panic(err)
    }
    return &RoleModel{conn: conn}
}

func (p *RoleModel) GetAllRoles() ([]entities.Role, error) {
    query := "SELECT id, name FROM role"
    rows, err := p.conn.Query(query)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch role: %v", err)
    }
    defer rows.Close()

    var roles []entities.Role
    for rows.Next() {
        var role entities.Role
        if err := rows.Scan(&role.Id, &role.Name); err != nil {
            return nil, fmt.Errorf("failed to scan role: %v", err)
        }
        roles = append(roles, role)
    }
    return roles, nil
}

func (r *RoleModel) FindRoleById(id int64) (entities.Role, error) {
    var role entities.Role
    query := "SELECT id, name FROM role WHERE id = ?"
    err := r.conn.QueryRow(query, id).Scan(&role.Id, &role.Name)

    if err == sql.ErrNoRows {
        // Jika tidak ada data yang ditemukan
        log.Printf("Role with ID %d not found", id)
        return role, fmt.Errorf("role with ID %d not found", id)
    } else if err != nil {
        // Jika ada error lain
        log.Printf("Error querying role with ID %d: %v", id, err)
        return role, err
    }

    // Jika role ditemukan
    return role, nil
}

