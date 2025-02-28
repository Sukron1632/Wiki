package controllers

import (
	"backend/entities"
	"backend/models"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
)

var userModel = models.NewUserModel()
var jwtKey = []byte("wiki") 
var encryptionKey = []byte("myverystrongpasswordo32bitlength") // Harus 32 byte

func encrypt(text string, key []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(text), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}


func GetGuestPermissions(w http.ResponseWriter, r *http.Request) {
    permissions, err := userModel.GetGuestPermissions()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    response := map[string]interface{}{
        "role_id":     4,
        "permissions": permissions,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}



func Login(response http.ResponseWriter, request *http.Request) {
	var user entities.User

	err := json.NewDecoder(request.Body).Decode(&user)
	if err != nil || user.Email == "" || user.Password == "" {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Invalid request format or missing fields",
		})
		return
	}

	userModel := models.NewUserModel()
	authenticatedUser, err := userModel.Authenticate(user.Email, user.Password)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Invalid email or password",
		})
		return
	}

	roleModel := models.NewRoleModel()
	role, err := roleModel.FindRoleById(authenticatedUser.Role_Id)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusNotFound)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Role not found",
		})
		return
	}

	permissionModel := models.NewPermissionModel()
	permissions, err := permissionModel.GetPermissionsByRole(role.Id)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusNotFound)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Permissions not found for this role",
		})
		return
	}

	expirationTime := time.Now().Add(300 * time.Hour)
	permissionsList := []string{}
	for _, permission := range permissions {
		permissionsList = append(permissionsList, permission.Name)
	}

	claims := jwt.MapClaims{
		"id":          authenticatedUser.Id,
		"role":        role.Name,
		"role_id":     authenticatedUser.Role_Id,
		"permissions": permissionsList,
		"instance_id": authenticatedUser.Instance_Id,
		"exp":         expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Could not generate token",
		})
		return
	}

	// Enkripsi token sebelum dikirim ke client
	encryptedToken, err := encrypt(tokenString, encryptionKey)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Could not encrypt token",
		})
		return
	}

	instanceModel := models.NewInstanceModel()
	instance, err := instanceModel.FindInstanceById(authenticatedUser.Instance_Id)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusNotFound)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Instance not found",
		})
		return
	}

	jsonResponse := map[string]interface{}{
		"id":          authenticatedUser.Id,
		"name":        authenticatedUser.Name,
		"email":       authenticatedUser.Email,
		"instance":    instance.Name,
		"instance_id": authenticatedUser.Instance_Id,
		"role":        role.Name,
		"role_id":     authenticatedUser.Role_Id,
		"nip":         authenticatedUser.NIP,
		"permissions": permissionsList,
		"token":       encryptedToken, // Token yang sudah dienkripsi
	}

	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(jsonResponse)
}


func DefaultTokenHandler(response http.ResponseWriter, request *http.Request) {
    // Ambil role dengan role_id = 4 dari database
    roleModel := models.NewRoleModel()
    role, err := roleModel.FindRoleById(4)
    if err != nil {
        response.Header().Set("Content-Type", "application/json")
        response.WriteHeader(http.StatusNotFound)
        json.NewEncoder(response).Encode(map[string]string{
            "error": "Role not found",
        })
        return
    }

    // Ambil permissions berdasarkan role_id = 4 dari database
    permissionModel := models.NewPermissionModel()
    permissions, err := permissionModel.GetPermissionsByRole(role.Id)
    if err != nil {
        response.Header().Set("Content-Type", "application/json")
        response.WriteHeader(http.StatusNotFound)
        json.NewEncoder(response).Encode(map[string]string{
            "error": "Permissions not found for this role",
        })
        return
    }

    expirationTime := time.Now().Add(1 * time.Hour)
    permissionsList := []string{}
    for _, permission := range permissions {
        permissionsList = append(permissionsList, permission.Name)
    }

    // Buat claims untuk token
    claims := jwt.MapClaims{
        "role":        role.Name,
        "role_id":     role.Id,
        "permissions": permissionsList,
        "exp":         expirationTime.Unix(),
    }

    // Buat token JWT
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(jwtKey)
    if err != nil {
        response.Header().Set("Content-Type", "application/json")
        response.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(response).Encode(map[string]string{
            "error": "Could not generate token",
        })
        return
    }

    // Enkripsi token sebelum dikirim ke client
    encryptedToken, err := encrypt(tokenString, encryptionKey)
    if err != nil {
        response.Header().Set("Content-Type", "application/json")
        response.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(response).Encode(map[string]string{
            "error": "Could not encrypt token",
        })
        return
    }

    // Siapkan response
    jsonResponse := map[string]interface{}{
        "role":        role.Name,
        "role_id":     role.Id,
        "permissions": permissionsList,
        "token":       encryptedToken, // Token yang sudah dienkripsi
    }

    response.Header().Set("Content-Type", "application/json")
    response.WriteHeader(http.StatusOK)
    json.NewEncoder(response).Encode(jsonResponse)
}






func GetUserByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr := vars["id"]
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	userModel := models.NewUserModel()
	instanceModel := models.NewInstanceModel()
	roleModel := models.NewRoleModel()

	user, err := userModel.FindUserByID(userID)
	if err != nil {
		http.Error(w, "Failed to fetch user", http.StatusInternalServerError)
		return
	}

	instance, err := instanceModel.FindInstanceById(user.Instance_Id)
	if err != nil {
		http.Error(w, "Failed to fetch instance", http.StatusInternalServerError)
		return
	}

	role, err := roleModel.FindRoleById(user.Role_Id)
	if err != nil {
		http.Error(w, "Failed to fetch role", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"id":          user.Id,
		"name":        user.Name,
		"nip":         user.NIP,
		"email":       user.Email,
		"password":    user.Password,
		"role_id":     user.Role_Id,
		"role_name":   role.Name,
		"instance_id": user.Instance_Id,
		"instance":    instance.Name,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := userModel.FindAllUsers()
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch users"}`, http.StatusInternalServerError)
		return
	}

	var response []map[string]interface{}
	for _, user := range users {
		instanceModel := models.NewInstanceModel()
		roleModel := models.NewRoleModel()

		instance, err := instanceModel.FindInstanceById(user.Instance_Id)
		if err != nil {
			http.Error(w, `{"error": "Failed to fetch instance"}`, http.StatusInternalServerError)
			return
		}

		role, err := roleModel.FindRoleById(user.Role_Id)
		if err != nil {
			http.Error(w, `{"error": "Failed to fetch role"}`, http.StatusInternalServerError)
			return
		}

		response = append(response, map[string]interface{}{
			"id":        user.Id,
			"name":      user.Name,
			"nip":       user.NIP,
			"email":     user.Email,
			"password":  user.Password,
			"role_name": role.Name,
			"instance":  instance.Name,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user entities.User

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		fmt.Println("Invalid request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if user.Name == "" || user.NIP == 0 || user.Email == "" || user.Password == "" || user.Role_Id == 0 || user.Instance_Id == 0 {
		http.Error(w, "Missing or invalid fields", http.StatusBadRequest)
		return
	}

	newUser, err := userModel.AddUser(user)
	if err != nil {
		fmt.Println("Error occurred while creating user:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newUser)
}

func EditUserById(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr := vars["id"]

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var user entities.User
	err = json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user.Id = userID
	updatedUser, err := userModel.UpdateUserById(userID, user)
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedUser)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id, err := strconv.Atoi(vars["id"])
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }

    // Update deleted_at pada user yang dimaksud
    err = userModel.SoftDeleteUserById(id)
    if err != nil {
        http.Error(w, "Error deleting user: "+err.Error(), http.StatusInternalServerError)
        return
    }

    response := map[string]string{"message": "User deleted successfully"}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

