package repository

import (
	"context"
	"encoding/json"

	"crm-whatsapp-api/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Ctx() context.Context {
	return context.Background()
}

// ─── Branch ──────────────────────────────────────────────────────────────────

func (r *Repository) GetBranchByID(branchID int) (*models.Branch, error) {
	var b models.Branch
	err := r.db.QueryRow(r.Ctx(),
		`SELECT id, name, wa_phone, bot_mode FROM branches WHERE id = $1`,
		branchID,
	).Scan(&b.ID, &b.Name, &b.WAPhone, &b.BotMode)
	return &b, err
}

// GetBranchBotMode returns "fixed" if the branch is not found or has no mode set.
func (r *Repository) GetBranchBotMode(branchID int) string {
	var mode string
	err := r.db.QueryRow(r.Ctx(), `SELECT bot_mode FROM branches WHERE id = $1`, branchID).Scan(&mode)
	if err != nil || mode == "" {
		return "fixed"
	}
	return mode
}

// ─── Clients ─────────────────────────────────────────────────────────────────

func (r *Repository) FindOrCreateClient(branchID int, phone string) (*models.Client, error) {
	ctx := r.Ctx()
	var client models.Client
	err := r.db.QueryRow(ctx,
		`SELECT id, branch_id, name, phone FROM clients WHERE phone = $1 AND branch_id = $2`,
		phone, branchID,
	).Scan(&client.ID, &client.BranchID, &client.Name, &client.Phone)

	if err == nil {
		return &client, nil
	}

	err = r.db.QueryRow(ctx,
		`INSERT INTO clients (branch_id, phone) VALUES ($1, $2) RETURNING id, branch_id, phone`,
		branchID, phone,
	).Scan(&client.ID, &client.BranchID, &client.Phone)
	return &client, err
}

func (r *Repository) ListClientsByBranch(branchID int) ([]models.Client, error) {
	ctx := r.Ctx()
	rows, err := r.db.Query(ctx,
		`SELECT id, name, phone, created_at FROM clients WHERE branch_id = $1 ORDER BY created_at DESC`,
		branchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var cl models.Client
		if err := rows.Scan(&cl.ID, &cl.Name, &cl.Phone, &cl.CreatedAt); err != nil {
			return nil, err
		}
		clients = append(clients, cl)
	}
	return clients, nil
}

// ─── Conversations ────────────────────────────────────────────────────────────

func (r *Repository) FindOrCreateConversation(clientID int) (*models.Conversation, error) {
	ctx := r.Ctx()
	var conv models.Conversation
	var contextRaw []byte

	err := r.db.QueryRow(ctx,
		`SELECT id, client_id, status, bot_state, context FROM conversations
		 WHERE client_id = $1 AND status = 'open' ORDER BY id DESC LIMIT 1`,
		clientID,
	).Scan(&conv.ID, &conv.ClientID, &conv.Status, &conv.BotState, &contextRaw)

	if err == nil {
		_ = json.Unmarshal(contextRaw, &conv.Context)
		return &conv, nil
	}

	err = r.db.QueryRow(ctx,
		`INSERT INTO conversations (client_id, status, bot_state, context)
		 VALUES ($1, 'open', 'start', '{}') RETURNING id, client_id, status, bot_state`,
		clientID,
	).Scan(&conv.ID, &conv.ClientID, &conv.Status, &conv.BotState)

	conv.Context = map[string]interface{}{}
	return &conv, err
}

func (r *Repository) UpdateState(conv *models.Conversation) error {
	ctx := r.Ctx()
	contextJSON, err := json.Marshal(conv.Context)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(ctx,
		`UPDATE conversations SET bot_state = $1, context = $2, last_msg_at = now(), status = $3 WHERE id = $4`,
		conv.BotState, contextJSON, conv.Status, conv.ID,
	)
	return err
}

// ─── Messages ─────────────────────────────────────────────────────────────────

func (r *Repository) SaveMessage(conversationID int, direction, content, msgType, waMessageID string) error {
	_, err := r.db.Exec(r.Ctx(),
		`INSERT INTO messages (conversation_id, direction, content, type, wa_message_id) VALUES ($1, $2, $3, $4, $5)`,
		conversationID, direction, content, msgType, waMessageID,
	)
	return err
}

// GetRecentMessages returns the last `limit` messages in chronological order.
func (r *Repository) GetRecentMessages(conversationID, limit int) ([]models.Message, error) {
	rows, err := r.db.Query(r.Ctx(),
		`SELECT id, direction, content, type FROM messages
		 WHERE conversation_id = $1 ORDER BY id DESC LIMIT $2`,
		conversationID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []models.Message
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.Direction, &m.Content, &m.Type); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	// Reverse to chronological order (oldest first)
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, nil
}

// ─── Services ─────────────────────────────────────────────────────────────────

func (r *Repository) ListActiveServices(branchID int) ([]models.Service, error) {
	rows, err := r.db.Query(r.Ctx(),
		`SELECT id, name, starting_price FROM services WHERE branch_id = $1 AND active = true ORDER BY name`,
		branchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(&s.ID, &s.Name, &s.StartingPrice); err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, nil
}

// ─── Available Slots ──────────────────────────────────────────────────────────

func (r *Repository) ListAvailableSlots(branchID int, period string) ([]models.AvailableSlot, error) {
	rows, err := r.db.Query(r.Ctx(),
		`SELECT id, scheduled_at FROM available_slots
		 WHERE branch_id = $1 AND period = $2 AND booked = false
		 ORDER BY scheduled_at LIMIT 5`,
		branchID, period,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slots []models.AvailableSlot
	for rows.Next() {
		var s models.AvailableSlot
		if err := rows.Scan(&s.ID, &s.ScheduledAt); err != nil {
			return nil, err
		}
		slots = append(slots, s)
	}
	return slots, nil
}

// ─── Appointments (chatbot) ───────────────────────────────────────────────────

func (r *Repository) CreateAppointment(clientID int, service string, slotID int, scheduledAt string) (int, error) {
	ctx := r.Ctx()
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var appointmentID int
	err = tx.QueryRow(ctx,
		`INSERT INTO appointments (client_id, service, scheduled_at, status) VALUES ($1, $2, $3, 'confirmed') RETURNING id`,
		clientID, service, scheduledAt,
	).Scan(&appointmentID)
	if err != nil {
		return 0, err
	}

	_, err = tx.Exec(ctx, `UPDATE available_slots SET booked = true WHERE id = $1`, slotID)
	if err != nil {
		return 0, err
	}
	return appointmentID, tx.Commit(ctx)
}

// ─── Users ────────────────────────────────────────────────────────────────────

func (r *Repository) FindUserByEmail(email string) (*models.User, error) {
	var u models.User
	err := r.db.QueryRow(r.Ctx(),
		`SELECT id, branch_id, name, email, password_hash FROM dashboard_users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.BranchID, &u.Name, &u.Email, &u.PasswordHash)
	return &u, err
}

// ─── RAG / Knowledge Base ─────────────────────────────────────────────────────

func (r *Repository) GetBranchKnowledge(branchID int) ([]models.BranchKnowledge, error) {
	rows, err := r.db.Query(r.Ctx(),
		`SELECT id, title, content, category FROM branch_knowledge
		 WHERE branch_id = $1 ORDER BY category, title`,
		branchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var knowledge []models.BranchKnowledge
	for rows.Next() {
		var k models.BranchKnowledge
		if err := rows.Scan(&k.ID, &k.Title, &k.Content, &k.Category); err != nil {
			return nil, err
		}
		knowledge = append(knowledge, k)
	}
	return knowledge, nil
}
