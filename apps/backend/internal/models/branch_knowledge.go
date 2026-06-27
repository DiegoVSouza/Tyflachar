package models

type BranchKnowledge struct {
	ID       int    `json:"id"`
	BranchID int    `json:"branch_id"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	Category string `json:"category"` // services, hours, policies, faq
}
