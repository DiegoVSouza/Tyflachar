package models

type Service struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	StartingPrice float64 `json:"starting_price"`
}
