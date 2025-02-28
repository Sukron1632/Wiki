package entities

type Subheading struct {
	Id                     int64  `json:"id"`
	ContentID              int64  `json:"content_id"`
	Subheading             string `json:"subheading"`
	Subheading_Description string `json:"subheading_description"`
	Author_id              int64  `json:"author_id"`
	Created_at             string `json:"created_at"`
	Updated_at             string `json:"updated_at"`
}