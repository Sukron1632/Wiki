// backend/config/database.go
package config

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

// DBConnection untuk membuat koneksi ke database
func DBConnection() (*sql.DB, error) {
	dbDriver := "mysql"
	dbUser := "root"
	dbPass := ""
	dbName := "wiki"

	// Membuat koneksi ke database
	db, err := sql.Open(dbDriver, dbUser+":"+dbPass+"@/"+dbName)
	if err != nil {
		return nil, fmt.Errorf("failed to open connection: %w", err)
	}

	// Set konfigurasi koneksi (opsional)
	db.SetMaxOpenConns(0)
	db.SetMaxIdleConns(0)
	db.SetConnMaxLifetime(0)

	// Verifikasi koneksi dengan Ping
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connected successfully")
	return db, nil
}
