package repository

import (
	"fmt"
	"strings"

	"crm-whatsapp-api/internal/models"
)

// ── Clients ─────────────────────────────────────────────────────────────────

func (r *Repository) ListClients(branchID int, q string, page, limit int) ([]models.Client, int, error) {
	ctx := r.Ctx()
	if limit <= 0 {
		limit = 30
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	args := []any{branchID}
	where := "branch_id = $1"

	if q != "" {
		args = append(args, "%"+strings.ToLower(q)+"%")
		idx := len(args)
		where += fmt.Sprintf(" AND (LOWER(name) LIKE $%d OR phone LIKE $%d)", idx, idx)
	}

	var total int
	if err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM clients WHERE `+where, args...,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, limit, offset)
	limitIdx := len(args) - 1
	offsetIdx := len(args)

	rows, err := r.db.Query(ctx,
		fmt.Sprintf(`SELECT id, branch_id, name, phone, tags, created_at
		             FROM clients WHERE %s
		             ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
			where, limitIdx, offsetIdx),
		args...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var cl models.Client
		if err := rows.Scan(&cl.ID, &cl.BranchID, &cl.Name, &cl.Phone, &cl.Tags, &cl.CreatedAt); err != nil {
			return nil, 0, err
		}
		clients = append(clients, cl)
	}
	return clients, total, nil
}

func (r *Repository) GetClientByID(branchID, clientID int) (*models.Client, error) {
	var cl models.Client
	err := r.db.QueryRow(r.Ctx(),
		`SELECT id, branch_id, name, phone, tags, created_at
		 FROM clients WHERE id = $1 AND branch_id = $2`,
		clientID, branchID,
	).Scan(&cl.ID, &cl.BranchID, &cl.Name, &cl.Phone, &cl.Tags, &cl.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &cl, nil
}

func (r *Repository) UpdateClientTags(branchID, clientID int, tags []string) (*models.Client, error) {
	var cl models.Client
	err := r.db.QueryRow(r.Ctx(),
		`UPDATE clients SET tags = $1
		 WHERE id = $2 AND branch_id = $3
		 RETURNING id, branch_id, name, phone, tags, created_at`,
		tags, clientID, branchID,
	).Scan(&cl.ID, &cl.BranchID, &cl.Name, &cl.Phone, &cl.Tags, &cl.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &cl, nil
}

func (r *Repository) GetClientAppointments(branchID, clientID int) ([]models.AppointmentWithClient, error) {
	rows, err := r.db.Query(r.Ctx(),
		`SELECT a.id, c.name, a.service, a.scheduled_at, a.status
		 FROM appointments a
		 JOIN clients c ON c.id = a.client_id
		 WHERE a.client_id = $1 AND c.branch_id = $2
		 ORDER BY a.scheduled_at DESC LIMIT 20`,
		clientID, branchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.AppointmentWithClient
	for rows.Next() {
		var a models.AppointmentWithClient
		if err := rows.Scan(&a.ID, &a.ClientName, &a.Service, &a.ScheduledAt, &a.Status); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, nil
}

// ── Conversations ────────────────────────────────────────────────────────────

func (r *Repository) ListConversations(branchID int, status string) ([]models.ConversationWithClient, error) {
	args := []any{branchID}
	where := "c.branch_id = $1"
	if status != "" {
		args = append(args, status)
		where += fmt.Sprintf(" AND conv.status = $%d", len(args))
	}

	rows, err := r.db.Query(r.Ctx(),
		fmt.Sprintf(`SELECT conv.id, conv.client_id, c.name, c.phone,
		             conv.status, conv.last_msg_at,
		             (SELECT content FROM messages WHERE conversation_id = conv.id ORDER BY id DESC LIMIT 1) AS last_message,
		             (SELECT COUNT(*) FROM messages WHERE conversation_id = conv.id AND direction = 'in' AND read = false) AS unread
		             FROM conversations conv
		             JOIN clients c ON c.id = conv.client_id
		             WHERE %s
		             ORDER BY conv.last_msg_at DESC NULLS LAST`, where),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.ConversationWithClient
	for rows.Next() {
		var cv models.ConversationWithClient
		if err := rows.Scan(
			&cv.ID, &cv.ClientID, &cv.ClientName, &cv.ClientPhone,
			&cv.Status, &cv.LastMessageAt, &cv.LastMessage, &cv.Unread,
		); err != nil {
			return nil, err
		}
		out = append(out, cv)
	}
	return out, nil
}

func (r *Repository) ListMessages(branchID, conversationID, page, limit int) ([]models.Message, int, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	var total int
	if err := r.db.QueryRow(r.Ctx(),
		`SELECT COUNT(*) FROM messages m
		 JOIN conversations conv ON conv.id = m.conversation_id
		 JOIN clients c ON c.id = conv.client_id
		 WHERE m.conversation_id = $1 AND c.branch_id = $2`,
		conversationID, branchID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(r.Ctx(),
		`SELECT m.id, m.conversation_id, m.direction, m.content, m.type, m.wa_message_id, m.status, m.timestamp
		 FROM messages m
		 JOIN conversations conv ON conv.id = m.conversation_id
		 JOIN clients c ON c.id = conv.client_id
		 WHERE m.conversation_id = $1 AND c.branch_id = $2
		 ORDER BY m.id DESC LIMIT $3 OFFSET $4`,
		conversationID, branchID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var msgs []models.Message
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.Direction, &m.Content, &m.Type, &m.WaMessageID, &m.Status, &m.Timestamp); err != nil {
			return nil, 0, err
		}
		msgs = append(msgs, m)
	}
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, total, nil
}

func (r *Repository) CreateOutboundMessage(conversationID int, content string) (*models.Message, error) {
	var m models.Message
	err := r.db.QueryRow(r.Ctx(),
		`INSERT INTO messages (conversation_id, direction, content, type, status)
		 VALUES ($1, 'out', $2, 'text', 'sent')
		 RETURNING id, conversation_id, direction, content, type, wa_message_id, status, timestamp`,
		conversationID, content,
	).Scan(&m.ID, &m.ConversationID, &m.Direction, &m.Content, &m.Type, &m.WaMessageID, &m.Status, &m.Timestamp)
	if err != nil {
		return nil, err
	}

	_, _ = r.db.Exec(r.Ctx(),
		`UPDATE conversations SET last_msg_at = now() WHERE id = $1`, conversationID,
	)
	return &m, nil
}

// ── Appointments ─────────────────────────────────────────────────────────────

func (r *Repository) ListAppointments(branchID int, status, period string) ([]models.AppointmentWithClient, error) {
	args := []any{branchID}
	where := "c.branch_id = $1"

	if status != "" {
		args = append(args, status)
		where += fmt.Sprintf(" AND a.status = $%d", len(args))
	}
	switch period {
	case "hoje":
		where += " AND DATE(a.scheduled_at) = CURRENT_DATE"
	case "semana":
		where += " AND DATE(a.scheduled_at) BETWEEN CURRENT_DATE AND CURRENT_DATE + 7"
	case "mes":
		where += " AND DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', CURRENT_DATE)"
	}

	rows, err := r.db.Query(r.Ctx(),
		fmt.Sprintf(`SELECT a.id, c.name, a.service, a.scheduled_at, a.status
		             FROM appointments a
		             JOIN clients c ON c.id = a.client_id
		             WHERE %s
		             ORDER BY a.scheduled_at DESC`, where),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.AppointmentWithClient
	for rows.Next() {
		var a models.AppointmentWithClient
		if err := rows.Scan(&a.ID, &a.ClientName, &a.Service, &a.ScheduledAt, &a.Status); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, nil
}

func (r *Repository) CreateAppointmentForClient(branchID, clientID int, service, scheduledAt string) (*models.AppointmentWithClient, error) {
	var a models.AppointmentWithClient
	err := r.db.QueryRow(r.Ctx(),
		`INSERT INTO appointments (client_id, service, scheduled_at, status)
		 SELECT $1, $2, $3::timestamptz, 'pendente'
		 WHERE EXISTS (SELECT 1 FROM clients WHERE id = $1 AND branch_id = $4)
		 RETURNING id, (SELECT name FROM clients WHERE id = $1), service, scheduled_at, status`,
		clientID, service, scheduledAt, branchID,
	).Scan(&a.ID, &a.ClientName, &a.Service, &a.ScheduledAt, &a.Status)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) UpdateAppointment(branchID, appointmentID int, status string) (*models.AppointmentWithClient, error) {
	var a models.AppointmentWithClient
	err := r.db.QueryRow(r.Ctx(),
		`UPDATE appointments a SET status = $1
		 FROM clients c
		 WHERE a.client_id = c.id AND a.id = $2 AND c.branch_id = $3
		 RETURNING a.id, c.name, a.service, a.scheduled_at, a.status`,
		status, appointmentID, branchID,
	).Scan(&a.ID, &a.ClientName, &a.Service, &a.ScheduledAt, &a.Status)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ── Users ────────────────────────────────────────────────────────────────────

func (r *Repository) FindUserByID(userID int) (*models.User, error) {
	var u models.User
	err := r.db.QueryRow(r.Ctx(),
		`SELECT id, branch_id, name, email, role, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&u.ID, &u.BranchID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
