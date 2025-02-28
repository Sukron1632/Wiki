package helpers

import (

	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

var JwtKey = []byte("wiki") 
var EncryptionKey = []byte("myverystrongpasswordo32bitlength") // Harus 32 byte

// Fungsi untuk mendekripsi token
func decrypt(encryptedText string, key []byte) (string, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// Fungsi untuk mendecode JWT Token
func decodeJWTToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Pastikan hanya menerima signing method yang valid
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return JwtKey, nil
	})

	if err != nil {
		return nil, err
	}

	// Validasi token dan klaim
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

// Endpoint untuk mendapatkan isi JWT setelah dekripsi
func GetDecodedJWT(response http.ResponseWriter, request *http.Request) {
	// Ambil token terenkripsi dari request (misal di body atau header)
	var requestData struct {
		EncryptedToken string `json:"encrypted_token"`
	}

	err := json.NewDecoder(request.Body).Decode(&requestData)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Invalid request format",
		})
		return
	}

	// Dekripsi token
	decryptedToken, err := decrypt(requestData.EncryptedToken, EncryptionKey)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Could not decrypt token",
		})
		return
	}

	// Decode JWT Token
	claims, err := decodeJWTToken(decryptedToken)
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(response).Encode(map[string]string{
			"error": "Invalid JWT token",
		})
		return
	}

	// Kirimkan response berupa isi dari klaim JWT token
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(map[string]interface{}{
		"id":          claims["id"],
		"role":        claims["role"],
		"role_id":     claims["role_id"],
		"permissions": claims["permissions"],
		"instance_id": claims["instance_id"],
	})
}
