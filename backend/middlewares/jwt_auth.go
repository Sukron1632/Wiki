package middleware

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("wiki")
var encryptionKey = []byte("myverystrongpasswordo32bitlength")

type Claims struct {
	ID          int      `json:"id"`
	Role        string   `json:"role"`
	RoleID      int64    `json:"role_id"`
	Permissions []string `json:"permissions"`
	InstanceID  int      `json:"instance_id"`
	jwt.RegisteredClaims
}

type ContextKey string

const UserContextKey ContextKey = "user"

// Response structure for unauthorized errors
type UnauthorizedResponse struct {
	Message string `json:"message"`
	Code    int    `json:"code"`
}

func decryptToken(encryptedToken string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(encryptedToken)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 token: %v", err)
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", fmt.Errorf("failed to create AES cipher: %v", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM mode: %v", err)
	}

	nonceSize := aesGCM.NonceSize()
	if len(decoded) < nonceSize {
		return "", fmt.Errorf("invalid encrypted token format")
	}

	nonce := decoded[:nonceSize]
	ciphertext := decoded[nonceSize:]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt token: %v", err)
	}

	return string(plaintext), nil
}

// Helper function to send unauthorized response
func sendUnauthorizedResponse(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	
	response := UnauthorizedResponse{
		Message: message,
		Code:    http.StatusUnauthorized,
	}
	
	json.NewEncoder(w).Encode(response)
}

func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip token check for login and guest endpoints
		if r.URL.Path == "/login" || r.URL.Path == "/guest" {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			sendUnauthorizedResponse(w, "Authorization header is missing")
			return
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			sendUnauthorizedResponse(w, "Authorization header must be in the form of 'Bearer {token}'")
			return
		}

		encryptedToken := strings.TrimPrefix(authHeader, "Bearer ")
		tokenString, err := decryptToken(encryptedToken)
		if err != nil {
			sendUnauthorizedResponse(w, "Failed to decrypt token")
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			// Check if token is expired
			if errors.Is(err, jwt.ErrTokenExpired) {
				sendUnauthorizedResponse(w, "Token has expired")
				return
			}						
			sendUnauthorizedResponse(w, "Invalid token")
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}