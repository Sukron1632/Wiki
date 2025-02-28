package entities

type History struct {
	Id         int64  `json:"id"`
	Content_Id int64  `json:"content_id"`
	Editor_Id  int64  `json:"editor_id"`
	Edited_at  string `json:"edited_at"`
	Action  string `json:"action"`
}