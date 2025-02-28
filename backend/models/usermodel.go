package models

import (
	"backend/config"
	"backend/entities"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"
)

type UserModel struct {
	conn *sql.DB
}

func NewUserModel() *UserModel {
	conn, err := config.DBConnection()

	if err != nil {
		panic(err)
	}

	return &UserModel{
		conn: conn,
	}
}


func (p *UserModel) Authenticate(email, password string) (*entities.User, error) {
	user := &entities.User{}
	// query := "SELECT id, name, email, password, role_id, instance_id FROM user WHERE email = ? AND password = ?"
	query := "SELECT * FROM user WHERE email = ? AND password = ? AND deleted_at IS NULL"


	log.Printf("Querying with email: %s and password: %s", email, password)

	err := p.conn.QueryRow(query, email, password).Scan(
		&user.Id, 
		&user.Name, 
		&user.NIP,
		&user.Email, 
		&user.Password, 
		&user.Role_Id, 
		&user.Instance_Id,
		&user.Deleted_at,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("invalid email or password")
	} else if err != nil {
		log.Println("Database error:", err)
		return nil, err
	}

	log.Println("User authenticated successfully:", user.Email)
	return user, nil
}

func (p *UserModel) FindUserByID(id int64) (*entities.User, error) {
    var user entities.User
    query := `SELECT id, name, nip, email, password, role_id, instance_id 
              FROM user WHERE id = ? AND deleted_at IS NULL`
    err := p.conn.QueryRow(query, id).Scan(
        &user.Id,
        &user.Name,
        &user.NIP,
        &user.Email,
        &user.Password,
        &user.Role_Id,
        &user.Instance_Id,
    )
    if err != nil {
        return nil, err
    }
    return &user, nil
}


func (p *UserModel) FindAllUsers() ([]entities.User, error) {
    query := `SELECT id, name, nip, email, password, role_id, instance_id 
              FROM user WHERE deleted_at IS NULL`
    rows, err := p.conn.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []entities.User
    for rows.Next() {
        var user entities.User
        err := rows.Scan(
            &user.Id,
            &user.Name,
            &user.NIP,
            &user.Email,
            &user.Password,
            &user.Role_Id,
            &user.Instance_Id,
        )
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    return users, nil
}


func (u *UserModel) AddUser(user entities.User) (entities.User, error) {
    query := `
        INSERT INTO user (name, nip, email, password, role_id, instance_id)
        VALUES (?, ?, ?, ?, ?, ?)`
    result, err := u.conn.Exec(
		query, 
		user.Name, 
		user.NIP, 
		user.Email, 
		user.Password, 
		user.Role_Id, 
		user.Instance_Id)
		
    if err != nil {
        return entities.User{}, err
    }

    lastInsertID, err := result.LastInsertId()
    if err != nil {
        return entities.User{}, err
    }

    user.Id = lastInsertID
    return user, nil
}

func (u *UserModel) UpdateUserById(id int64, user entities.User) (entities.User, error) {
	query := `
        UPDATE user
        SET name = ?, nip = ?, email = ?, password = ?, role_id = ?, instance_id = ?
        WHERE id = ?`

	_, err := u.conn.Exec(query, user.Name, user.NIP, user.Email, user.Password, user.Role_Id, user.Instance_Id, id)
	if err != nil {
		return entities.User{}, err
	}

	user.Id = id
	return user, nil
}

func (u *UserModel) DeleteUserById(id int) error {
	query := "DELETE FROM user WHERE id = ?"
	_, err := u.conn.Exec(query, id)
	if err != nil {
		log.Printf("Error executing DELETE query: %v", err)
	}
	return err
}

func (m *UserModel) SoftDeleteUserById(id int) error {
    // Load lokasi waktu Asia/Jakarta
    loc, err := time.LoadLocation("Asia/Jakarta")
    if err != nil {
        return fmt.Errorf("error loading Asia/Jakarta timezone: %w", err)
    }

    // Ambil waktu sekarang dalam zona waktu Asia/Jakarta
    nowWIB := time.Now().In(loc).Format("2006-01-02 15:04:05")

    // Jalankan query untuk soft delete dengan waktu yang sudah dikonversi
    query := "UPDATE user SET deleted_at = ? WHERE id = ?"
    _, err = m.conn.Exec(query, nowWIB, id)
    return err
}

func (m *UserModel) GetGuestPermissions() ([]string, error) {
	query := `
		SELECT p.name 
		FROM permissions p 
		JOIN role_permissions rp ON p.id = rp.permission_id 
		WHERE rp.role_id = 4`

	rows, err := m.conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []string
	for rows.Next() {
		var permission string
		if err := rows.Scan(&permission); err != nil {
			return nil, err
		}
		permissions = append(permissions, permission)
	}
	return permissions, nil
}





