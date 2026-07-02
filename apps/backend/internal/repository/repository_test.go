package repository

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"crm-whatsapp-api/internal/database"
	"crm-whatsapp-api/internal/models"
)

// defaultTestDatabaseURL matches the Postgres service in the monorepo's root
// docker-compose.yml (docker compose up -d), used when DATABASE_URL isn't set.
const defaultTestDatabaseURL = "postgres://admin:adminpassword@localhost:5432/crm_db?sslmode=disable"

var (
	testPool        *pgxpool.Pool
	testDBAvailable bool
)

// TestMain connects once for the whole package and applies migrations. If Postgres
// isn't reachable, tests skip via setupTestDB instead of failing, so `go test ./...`
// stays green without Docker/Postgres running.
func TestMain(m *testing.M) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = defaultTestDatabaseURL
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	pool, err := pgxpool.New(ctx, databaseURL)
	cancel()
	if err == nil {
		pingCtx, pingCancel := context.WithTimeout(context.Background(), 3*time.Second)
		err = pool.Ping(pingCtx)
		pingCancel()
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "ℹ️  Postgres local não disponível (%v) — testes de internal/repository serão pulados. Rode docker-compose up -d na raiz do monorepo para habilitá-los.\n", err)
		testDBAvailable = false
		os.Exit(m.Run())
	}

	if err := applyMigrations(databaseURL); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Falha ao aplicar migrations no banco de teste: %v — testes de internal/repository serão pulados.\n", err)
		pool.Close()
		testDBAvailable = false
		os.Exit(m.Run())
	}

	testDBAvailable = true
	testPool = pool

	code := m.Run()
	pool.Close()
	os.Exit(code)
}

// applyMigrations reuses database.RunMigrations, which hardcodes "file://migrations"
// relative to apps/backend. Since `go test` runs from the package dir, we chdir there
// temporarily and restore the original working directory afterward.
func applyMigrations(databaseURL string) (err error) {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		return errors.New("failed to resolve path of repository_test.go")
	}
	backendRoot := filepath.Join(filepath.Dir(thisFile), "..", "..")

	origWD, err := os.Getwd()
	if err != nil {
		return err
	}
	if err := os.Chdir(backendRoot); err != nil {
		return err
	}
	defer func() {
		if chErr := os.Chdir(origWD); chErr != nil && err == nil {
			err = chErr
		}
	}()

	database.RunMigrations(databaseURL)
	return nil
}

// setupTestDB returns a Repository backed by the shared test pool, or skips the
// calling test if no local Postgres was available at TestMain time.
func setupTestDB(t *testing.T) *Repository {
	t.Helper()
	if !testDBAvailable {
		t.Skip("Postgres local não disponível — rode docker-compose up -d antes de rodar estes testes")
	}
	return New(testPool)
}

// testBranch holds a throwaway branch created for a single test, plus the cleanup
// registration to remove everything created under it.
type testBranch struct {
	ID int
}

// createTestBranch inserts a uniquely-named branch and registers cleanup (via
// t.Cleanup) to delete it and everything referencing it, regardless of pass/fail.
func createTestBranch(t *testing.T, repo *Repository) testBranch {
	t.Helper()
	ctx := context.Background()
	suffix := rand.Intn(1_000_000_000)
	name := fmt.Sprintf("Test Branch %d", suffix)
	phone := fmt.Sprintf("55119%08d", suffix%100000000)

	var branchID int
	err := repo.db.QueryRow(ctx,
		`INSERT INTO branches (name, wa_phone, plan, bot_mode) VALUES ($1, $2, 'basic', 'fixed') RETURNING id`,
		name, phone,
	).Scan(&branchID)
	if err != nil {
		t.Fatalf("failed to create test branch: %v", err)
	}

	t.Cleanup(func() {
		cleanupCtx := context.Background()
		// Delete children before the branch, in FK-dependency order.
		_, _ = repo.db.Exec(cleanupCtx,
			`DELETE FROM appointments WHERE client_id IN (SELECT id FROM clients WHERE branch_id = $1)`, branchID)
		_, _ = repo.db.Exec(cleanupCtx,
			`DELETE FROM messages WHERE conversation_id IN (
				SELECT conv.id FROM conversations conv JOIN clients c ON c.id = conv.client_id WHERE c.branch_id = $1
			)`, branchID)
		_, _ = repo.db.Exec(cleanupCtx,
			`DELETE FROM conversations WHERE client_id IN (SELECT id FROM clients WHERE branch_id = $1)`, branchID)
		_, _ = repo.db.Exec(cleanupCtx, `DELETE FROM clients WHERE branch_id = $1`, branchID)
		_, _ = repo.db.Exec(cleanupCtx, `DELETE FROM branches WHERE id = $1`, branchID)
	})

	return testBranch{ID: branchID}
}

// createTestClient inserts a client with a name set directly — FindOrCreateClient
// only takes a phone number (it's built for the webhook flow, which has no name yet).
func createTestClient(t *testing.T, repo *Repository, branchID int, phone, name string) models.Client {
	t.Helper()
	var cl models.Client
	err := repo.db.QueryRow(context.Background(),
		`INSERT INTO clients (branch_id, name, phone) VALUES ($1, $2, $3) RETURNING id, branch_id, name, phone`,
		branchID, name, phone,
	).Scan(&cl.ID, &cl.BranchID, &cl.Name, &cl.Phone)
	if err != nil {
		t.Fatalf("failed to create test client: %v", err)
	}
	return cl
}

// ─── Clients ─────────────────────────────────────────────────────────────────

func TestListClients_DoesNotLeakAcrossBranches(t *testing.T) {
	repo := setupTestDB(t)
	branchA := createTestBranch(t, repo)
	branchB := createTestBranch(t, repo)

	clientA := createTestClient(t, repo, branchA.ID, "5511900000001", "Client A")
	clientB := createTestClient(t, repo, branchB.ID, "5511900000002", "Client B")

	clientsA, totalA, err := repo.ListClients(branchA.ID, "", 1, 50)
	if err != nil {
		t.Fatalf("ListClients(branchA) failed: %v", err)
	}
	if totalA != len(clientsA) {
		t.Errorf("branch A: total=%d but got %d rows", totalA, len(clientsA))
	}
	if !containsClientID(clientsA, clientA.ID) {
		t.Errorf("branch A: expected to find its own client %d", clientA.ID)
	}
	if containsClientID(clientsA, clientB.ID) {
		t.Errorf("branch A: leaked client %d from branch B", clientB.ID)
	}

	clientsB, totalB, err := repo.ListClients(branchB.ID, "", 1, 50)
	if err != nil {
		t.Fatalf("ListClients(branchB) failed: %v", err)
	}
	if totalB != len(clientsB) {
		t.Errorf("branch B: total=%d but got %d rows", totalB, len(clientsB))
	}
	if !containsClientID(clientsB, clientB.ID) {
		t.Errorf("branch B: expected to find its own client %d", clientB.ID)
	}
	if containsClientID(clientsB, clientA.ID) {
		t.Errorf("branch B: leaked client %d from branch A", clientA.ID)
	}
}

func TestGetClientByID_DoesNotLeakAcrossBranches(t *testing.T) {
	repo := setupTestDB(t)
	branchA := createTestBranch(t, repo)
	branchB := createTestBranch(t, repo)

	clientB := createTestClient(t, repo, branchB.ID, "5511900000003", "Client B")

	// Fetching branch B's client while scoped to branch A must behave as "not found".
	_, err := repo.GetClientByID(branchA.ID, clientB.ID)
	if err == nil {
		t.Fatal("expected GetClientByID to fail when client belongs to a different branch")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		t.Errorf("expected pgx.ErrNoRows, got: %v", err)
	}

	// Sanity check: it IS found when scoped to the correct branch.
	found, err := repo.GetClientByID(branchB.ID, clientB.ID)
	if err != nil {
		t.Fatalf("expected GetClientByID to succeed for the owning branch: %v", err)
	}
	if found.ID != clientB.ID {
		t.Errorf("expected client id %d, got %d", clientB.ID, found.ID)
	}
}

func containsClientID(clients []models.Client, id int) bool {
	for _, c := range clients {
		if c.ID == id {
			return true
		}
	}
	return false
}

// TestFindOrCreateClient_NoNameDoesNotBreakScans covers the webhook flow: a client
// created from just a phone number (no name) must not break subsequent reads that
// join/select clients.name.
func TestFindOrCreateClient_NoNameDoesNotBreakScans(t *testing.T) {
	repo := setupTestDB(t)
	branch := createTestBranch(t, repo)

	client, err := repo.FindOrCreateClient(branch.ID, "5511900000099")
	if err != nil {
		t.Fatalf("FindOrCreateClient failed: %v", err)
	}
	if client.Name != "" {
		t.Errorf("expected empty name for a client created without one, got %q", client.Name)
	}

	clients, _, err := repo.ListClients(branch.ID, "", 1, 50)
	if err != nil {
		t.Fatalf("ListClients failed: %v", err)
	}
	if !containsClientID(clients, client.ID) {
		t.Errorf("expected ListClients to include client %d", client.ID)
	}

	found, err := repo.GetClientByID(branch.ID, client.ID)
	if err != nil {
		t.Fatalf("GetClientByID failed: %v", err)
	}
	if found.Name != "" {
		t.Errorf("expected empty name, got %q", found.Name)
	}

	conv, err := repo.FindOrCreateConversation(client.ID)
	if err != nil {
		t.Fatalf("FindOrCreateConversation failed: %v", err)
	}

	convs, err := repo.ListConversations(branch.ID, "")
	if err != nil {
		t.Fatalf("ListConversations failed: %v", err)
	}
	if !containsConversationID(convs, conv.ID) {
		t.Errorf("expected ListConversations to include conversation %d", conv.ID)
	}
}

// ─── Conversations ────────────────────────────────────────────────────────────

func TestListConversations_DoesNotLeakAcrossBranches(t *testing.T) {
	repo := setupTestDB(t)
	branchA := createTestBranch(t, repo)
	branchB := createTestBranch(t, repo)

	clientA := createTestClient(t, repo, branchA.ID, "5511900000010", "Client A")
	clientB := createTestClient(t, repo, branchB.ID, "5511900000011", "Client B")

	convA, err := repo.FindOrCreateConversation(clientA.ID)
	if err != nil {
		t.Fatalf("failed to create conversation in branch A: %v", err)
	}
	convB, err := repo.FindOrCreateConversation(clientB.ID)
	if err != nil {
		t.Fatalf("failed to create conversation in branch B: %v", err)
	}

	listA, err := repo.ListConversations(branchA.ID, "")
	if err != nil {
		t.Fatalf("ListConversations(branchA) failed: %v", err)
	}
	if !containsConversationID(listA, convA.ID) {
		t.Errorf("branch A: expected to find its own conversation %d", convA.ID)
	}
	if containsConversationID(listA, convB.ID) {
		t.Errorf("branch A: leaked conversation %d from branch B", convB.ID)
	}

	listB, err := repo.ListConversations(branchB.ID, "")
	if err != nil {
		t.Fatalf("ListConversations(branchB) failed: %v", err)
	}
	if !containsConversationID(listB, convB.ID) {
		t.Errorf("branch B: expected to find its own conversation %d", convB.ID)
	}
	if containsConversationID(listB, convA.ID) {
		t.Errorf("branch B: leaked conversation %d from branch A", convA.ID)
	}
}

func containsConversationID(convs []models.ConversationWithClient, id int) bool {
	for _, c := range convs {
		if c.ID == id {
			return true
		}
	}
	return false
}

// ─── Appointments ────────────────────────────────────────────────────────────

func TestListAppointments_DoesNotLeakAcrossBranches(t *testing.T) {
	repo := setupTestDB(t)
	branchA := createTestBranch(t, repo)
	branchB := createTestBranch(t, repo)

	clientA := createTestClient(t, repo, branchA.ID, "5511900000020", "Client A")
	clientB := createTestClient(t, repo, branchB.ID, "5511900000021", "Client B")

	scheduledAt := time.Now().Add(24 * time.Hour).Format(time.RFC3339)
	apptA, err := repo.CreateAppointmentForClient(branchA.ID, clientA.ID, "Haircut", scheduledAt)
	if err != nil {
		t.Fatalf("failed to create appointment in branch A: %v", err)
	}
	apptB, err := repo.CreateAppointmentForClient(branchB.ID, clientB.ID, "Haircut", scheduledAt)
	if err != nil {
		t.Fatalf("failed to create appointment in branch B: %v", err)
	}

	listA, err := repo.ListAppointments(branchA.ID, "", "")
	if err != nil {
		t.Fatalf("ListAppointments(branchA) failed: %v", err)
	}
	if !containsAppointmentID(listA, apptA.ID) {
		t.Errorf("branch A: expected to find its own appointment %d", apptA.ID)
	}
	if containsAppointmentID(listA, apptB.ID) {
		t.Errorf("branch A: leaked appointment %d from branch B", apptB.ID)
	}

	listB, err := repo.ListAppointments(branchB.ID, "", "")
	if err != nil {
		t.Fatalf("ListAppointments(branchB) failed: %v", err)
	}
	if !containsAppointmentID(listB, apptB.ID) {
		t.Errorf("branch B: expected to find its own appointment %d", apptB.ID)
	}
	if containsAppointmentID(listB, apptA.ID) {
		t.Errorf("branch B: leaked appointment %d from branch A", apptA.ID)
	}

	// Cross-branch update must also fail to affect another branch's appointment.
	_, err = repo.UpdateAppointment(branchA.ID, apptB.ID, "confirmed")
	if err == nil {
		t.Error("expected UpdateAppointment to fail when appointment belongs to a different branch")
	}
}

func containsAppointmentID(appts []models.AppointmentWithClient, id int) bool {
	for _, a := range appts {
		if a.ID == id {
			return true
		}
	}
	return false
}
