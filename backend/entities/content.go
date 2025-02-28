package entities

import (
	"database/sql"
)

type Content struct {
	Id          int64          `json:"id"`
	Title       string         `json:"title"`
	Description sql.NullString `json:"description"`
	Author_id   int64          `json:"author_id"`
	Author_role_id int  `json:"author_role_id"`
	Instance_id int64          `json:"instance_id"`
	Created_at  string         `json:"created_at"`
	Updated_at  string         `json:"updated_at"`
	Tag         string         `json:"tag"`
	Author_name string         `json:"author_name"`
	Status      string         `json:"status"`
	Deleted_at  sql.NullTime   `json:"deleted_at"`
	ViewCount   int            `json:"view_count"` // New field
	Rejection_reason      sql.NullString         `json:"rejection_reason"`
	Accessibility    string         `json:"accessibility"`
}