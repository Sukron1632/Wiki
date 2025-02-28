package models

import (
	"backend/config"
	"backend/entities"
	"database/sql"
	"fmt"
)

type InstanceModel struct {
	conn *sql.DB
}

func NewInstanceModel() *InstanceModel {
	conn, err := config.DBConnection()
	if err != nil {
		panic(err)
	}
	return &InstanceModel{conn: conn}
}

func (p *InstanceModel) GetAllInstances() ([]entities.Instance, error) {
	query := "SELECT id, name FROM instance"
	rows, err := p.conn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch instances: %v", err)
	}
	defer rows.Close()

	var instances []entities.Instance
	for rows.Next() {
		var instance entities.Instance
		if err := rows.Scan(&instance.Id, &instance.Name); err != nil {
			return nil, fmt.Errorf("failed to scan instance: %v", err)
		}
		instances = append(instances, instance)
	}
	return instances, nil
}

func (p *InstanceModel) FindInstanceById(id int64) (entities.Instance, error) {
	var instance entities.Instance
	query := "SELECT id, name FROM instance WHERE id = ?"
	err := p.conn.QueryRow(query, id).Scan(&instance.Id, &instance.Name)
	return instance, err
}
