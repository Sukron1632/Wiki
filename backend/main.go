package main

import (
	"backend/config"
	"backend/controllers"
	"backend/helpers"
	"backend/models"

	contentcontroller "backend/controllers"
	historycontroller "backend/controllers"
	instancecontroller "backend/controllers"
	permissioncontroller "backend/controllers"
	rolecontroller "backend/controllers"
	subheadingcontroller "backend/controllers"
	usercontroller "backend/controllers"
	middleware "backend/middlewares"
	"log"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {

	    // Buat instance dari RolePermissionController
		rolePermissionModel := models.NewRolePermissionModel()
		contentModel := models.NewContentModel()
		rolePermissionController := controllers.NewRolePermissionController(rolePermissionModel, contentModel)

	// Inisialisasi koneksi database
	db, err := config.DBConnection()
	if err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}

	// Set DB global untuk middleware
	middleware.DB = db

	// Inisialisasi router
	r := mux.NewRouter()

	

	// Konfigurasi CORS
	cors := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3001"}), // Frontend URL
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization", "X-Requested-With", "Accept"}),
		handlers.AllowCredentials(), // Izinkan penggunaan credentials (cookies, dll.)
	)

	
	r.Handle("/api", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_contents", http.HandlerFunc(contentcontroller.GetIdTitleAllContents)))).Methods("GET")
	r.Handle("/api/notReject", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_contents_notReject", http.HandlerFunc(contentcontroller.GetIdTitleAllContentsNotRejected)))).Methods("GET")
	r.Handle("/api/active", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_active_content", http.HandlerFunc(contentcontroller.GetIdTitleAllContentsNotDeleted)))).Methods("GET")
	r.Handle("/api/draft", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_drafts", http.HandlerFunc(contentcontroller.GetIdTitleAllDrafts)))).Methods("GET")
	r.Handle("/api/content", middleware.JWTAuth(middleware.RoleAuthMiddleware("search_contents", http.HandlerFunc(contentcontroller.SearchContent)))).Methods("GET")
	r.Handle("/api/content/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_content", http.HandlerFunc(contentcontroller.GetContentByID)))).Methods("GET")
	r.Handle("/api/content/edit/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("edit_content", http.HandlerFunc(contentcontroller.EditContentByID)))).Methods("PUT")
	r.Handle("/api/content/add", middleware.JWTAuth(middleware.RoleAuthMiddleware("create_content", http.HandlerFunc(contentcontroller.CreateContent)))).Methods("POST")
	r.Handle("/api/subheading/add/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("create_subheading", http.HandlerFunc(subheadingcontroller.CreateSubheading)))).Methods("POST")
	r.Handle("/api/subheading/delete/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("delete_subheading", http.HandlerFunc(subheadingcontroller.DeleteSubheadingByID)))).Methods("DELETE")
	r.Handle("/api/content/delete/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("delete_content", http.HandlerFunc(contentcontroller.DeleteContent)))).Methods("PUT")
	r.Handle("/api/contents/user/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_user_contents", http.HandlerFunc(contentcontroller.GetUserContents)))).Methods("GET")
	r.Handle("/api/instances", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_instances", http.HandlerFunc(instancecontroller.GetInstances)))).Methods("GET")
	r.Handle("/api/user/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_user", http.HandlerFunc(usercontroller.GetUserByID)))).Methods("GET")
	r.Handle("/api/users", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_all_users", http.HandlerFunc(usercontroller.GetAllUsers)))).Methods("GET")
	r.Handle("/api/roles", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_roles", http.HandlerFunc(rolecontroller.GetRoles)))).Methods("GET")
	r.Handle("/api/createuser", middleware.JWTAuth(middleware.RoleAuthMiddleware("create_user", http.HandlerFunc(usercontroller.CreateUser)))).Methods("POST")
	r.Handle("/api/user/edit/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("edit_user", http.HandlerFunc(usercontroller.EditUserById)))).Methods("PUT")
	r.Handle("/api/user/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("delete_user", http.HandlerFunc(usercontroller.DeleteUser)))).Methods("PUT")
	r.Handle("/api/history/add", middleware.JWTAuth(middleware.RoleAuthMiddleware("add_history", http.HandlerFunc(historycontroller.AddHistory)))).Methods("POST")
	r.Handle("/api/history/user/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_history_user", http.HandlerFunc(historycontroller.GetByIdUser)))).Methods("GET")
	r.Handle("/api/latest-editor-name/{contentId}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_latest_editor", http.HandlerFunc(historycontroller.GetLatestEditorNameByContentId)))).Methods("GET")
	r.Handle("/api/content/approve/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("approve_content", http.HandlerFunc(contentcontroller.ApproveContent)))).Methods("PUT")
	r.Handle("/api/content/reject/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("reject_content", http.HandlerFunc(contentcontroller.RejectContent)))).Methods("PUT")
	r.Handle("/api/permissions", middleware.JWTAuth(middleware.RoleAuthMiddleware("manage_role", http.HandlerFunc(permissioncontroller.GetPermissionList)))).Methods("GET")
	r.Handle("/api/role_permissions", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_permission", http.HandlerFunc(permissioncontroller.GetPermissionsByRole)))).Methods("GET")
	r.Handle("/api/roles/{role_id}/permissions",middleware.JWTAuth(middleware.RoleAuthMiddleware("view_role_permission",http.HandlerFunc(rolePermissionController.GetPermissionsByRole)))).Methods("GET")
	r.Handle("/api/roles/{role_id}/permissions/add/{permission_id}",middleware.JWTAuth(middleware.RoleAuthMiddleware("add_permission",http.HandlerFunc(rolePermissionController.AddPermissionToRole)))).Methods("POST") // 
	r.Handle("/api/roles/{role_id}/permissions/delete/{permission_id}",middleware.JWTAuth(middleware.RoleAuthMiddleware("remove_permission",http.HandlerFunc(rolePermissionController.RemovePermissionFromRole)))).Methods("DELETE") //
	r.Handle("/api/content/viewcount/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_content", http.HandlerFunc(contentcontroller.GetContentViewCount)))).Methods("GET")
	r.Handle("/api/content/resubmit/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("resubmit_content", http.HandlerFunc(contentcontroller.ResubmitRejectedContent)))).Methods("PUT")
	r.Handle("/api/content/increment-viewcount/{id}", middleware.JWTAuth(middleware.RoleAuthMiddleware("view_content", http.HandlerFunc(contentcontroller.IncrementViewCount)))).Methods("PUT")

	r.HandleFunc("/api/guest", usercontroller.DefaultTokenHandler).Methods("GET")

	// Endpoint Untuk decyrypt
	r.HandleFunc("/api/decode", helpers.GetDecodedJWT).Methods("POST")

	// Endpoint tanpa middleware untuk login
	r.HandleFunc("/api/login", usercontroller.Login).Methods("POST")

	// Jalankan server dengan middleware CORS
	log.Println("Server is running on port 3000")
	if err := http.ListenAndServe(":3000", cors(r)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
