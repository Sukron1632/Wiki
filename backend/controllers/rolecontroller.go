package controllers

import (
	"backend/models"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

var roleModel = models.NewRoleModel()

func GetRoles(w http.ResponseWriter, r *http.Request) {
    // Menambahkan log untuk melihat request yang masuk
    log.Printf("Request to get all roles from %v", r.RemoteAddr)

    // Memanggil model untuk mendapatkan roles
    role, err := roleModel.GetAllRoles()
    if err != nil {
        // Jika ada error, log error tersebut dan beri respons internal server
        log.Printf("Error retrieving roles: %v", err)
        http.Error(w, fmt.Sprintf("Error retrieving roles: %v", err), http.StatusInternalServerError)
        return
    }

    // Mengatur header untuk jenis konten yang akan dikirimkan
    w.Header().Set("Content-Type", "application/json")

    // Mengencode data role menjadi JSON dan mengirimkannya ke klien
    err = json.NewEncoder(w).Encode(role)
    if err != nil {
        // Jika ada error dalam proses encoding, log error tersebut
        log.Printf("Error encoding roles to JSON: %v", err)
        http.Error(w, "Error encoding roles to JSON", http.StatusInternalServerError)
        return
    }

    // Log untuk memastikan data dikirimkan dengan sukses
    log.Printf("Roles successfully retrieved and sent to client")
}
