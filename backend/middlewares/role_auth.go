package middleware

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
)

// DB adalah objek koneksi ke database
var DB *sql.DB

// RoleAuthMiddleware adalah middleware untuk memeriksa apakah user memiliki permission yang diperlukan
func RoleAuthMiddleware(requiredPermission string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Ambil klaim pengguna dari context
		userClaims, ok := r.Context().Value(UserContextKey).(*Claims)
		if !ok {
			http.Error(w, "User claims not found", http.StatusUnauthorized)
			return
		}

		// Log untuk memeriksa role_id
		log.Printf("Fetching permissions for role_id: %d", userClaims.RoleID)

		// Ambil permissions berdasarkan role_id dari database
		permissions, err := getPermissionsForRole(int(userClaims.RoleID))
		if err != nil {
			log.Printf("Failed to get permissions: %v", err)
			http.Error(w, "Failed to get permissions", http.StatusInternalServerError)
			return
		}

		// Periksa apakah user memiliki permission yang dibutuhkan
		hasPermission := false
		for _, permission := range permissions {
			if permission == requiredPermission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			http.Error(w, "You do not have the required permission to access this resource", http.StatusForbidden)
			return
		}

		// Set permissions ke dalam context agar frontend bisa mengaksesnya
		userClaims.Permissions = permissions

		// Jika user memiliki permission yang diperlukan, lanjutkan ke handler berikutnya
		next.ServeHTTP(w, r)
	})
}

// getPermissionsForRole mengambil permissions berdasarkan role_id dari database
func getPermissionsForRole(roleID int) ([]string, error) {
	if DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	log.Printf("Executing query for role ID %d", roleID)

	// Query untuk mengambil permissions berdasarkan role_id
	query := `
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = ?
    `
	rows, err := DB.Query(query, roleID)
	if err != nil {
		return nil, fmt.Errorf("failed to query permissions: %w", err)
	}
	defer rows.Close()

	var permissions []string
	for rows.Next() {
		var permission string
		if err := rows.Scan(&permission); err != nil {
			log.Println("Error scanning permission:", err)
			continue
		}
		permissions = append(permissions, permission)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	// Pastikan ada permissions yang ditemukan
	if len(permissions) == 0 {
		return nil, fmt.Errorf("no permissions found for role ID: %d", roleID)
	}

	return permissions, nil
}
