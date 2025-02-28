package entities

import "database/sql"

type User struct {
	Id          int64        `json:"id"`
	Name        string       `json:"name"`
	NIP         int64        `json:"nip"`
	Email       string       `json:"email"`
	Password    string       `json:"password"`
	Role_Id     int64        `json:"role_id"`
	Instance_Id int64        `json:"instance_id"`
	Deleted_at  sql.NullTime `json:"deleted_at"`
}