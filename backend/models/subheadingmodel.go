package models

import (
	"backend/config"
	"backend/entities"
	"database/sql"
)

type SubheadingModel struct {
	conn *sql.DB
}

func NewSubheadingModel() *SubheadingModel {
	conn, err := config.DBConnection()
	if err != nil {
		panic(err)
	}
	return &SubheadingModel{
		conn: conn,
	}
}

func (p *SubheadingModel) FindByContentID(contentID int64) ([]entities.Subheading, error) {
	query := "SELECT * FROM subheadings WHERE content_id = ?"
	rows, err := p.conn.Query(query, contentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dataSubheading []entities.Subheading
	for rows.Next() {
		var subheading entities.Subheading
		rows.Scan(&subheading.Id,
			&subheading.ContentID,
			&subheading.Subheading,
			&subheading.Subheading_Description,
			&subheading.Author_id,
			&subheading.Created_at,
			&subheading.Updated_at)
		dataSubheading = append(dataSubheading, subheading)
	}
	
	return dataSubheading, nil
}

// func (p *SubheadingModel) UpdateByID(subheading entities.Subheading) error {
//     query := `
//         UPDATE subheadings 
//         SET subheading = ?, subheading_description = ?, author_id = ?, updated_at = ? 
//         WHERE id = ? `
//     _, err := p.conn.Exec(
// 		query, 
// 		// subheading.ContentID,
// 		subheading.Subheading, 
// 		subheading.Subheading_Description, 
// 		subheading.Author_id, 
// 		subheading.Updated_at,
// 		subheading.Id)
//     return err
// }

func (p *SubheadingModel) UpdateByID(subheading entities.Subheading) error {
    query := `
        UPDATE subheadings 
        SET subheading = ?, subheading_description = ?, updated_at = ? 
        WHERE id = ?`
	
	// Exclude Author_id from the update if it's not being updated
    _, err := p.conn.Exec(
		query, 
		subheading.Subheading, 
		subheading.Subheading_Description, 
		subheading.Updated_at,
		subheading.Id)
    return err
}


func (p *SubheadingModel) CreateSubheading(subheading entities.Subheading) (int64, error) {
    query := `
        INSERT INTO subheadings (content_id, subheading, subheading_description, author_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?)
    `
    result, err := p.conn.Exec(query,
        subheading.ContentID,
        subheading.Subheading,
        subheading.Subheading_Description,
        subheading.Author_id,
        subheading.Created_at,
        subheading.Updated_at)

    if err != nil {
        return 0, err
    }

    subheadingID, err := result.LastInsertId()
    if err != nil {
        return 0, err
    }
    return subheadingID, nil
}

func (p *SubheadingModel) DeleteByID(id int64) error {
	query := "DELETE FROM subheadings WHERE id = ?"
	_, err := p.conn.Exec(query, id)
	return err
}