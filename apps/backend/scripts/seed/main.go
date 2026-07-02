// seed: populates the database with development seed data by running
// scripts/seed/seed.sql as a single transaction.
// Usage (from apps/backend): go run scripts/seed/main.go
package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("❌ DATABASE_URL não definido — configure o .env ou a variável de ambiente antes de rodar o seed")
	}

	sqlPath := seedSQLPath()
	sqlBytes, err := os.ReadFile(sqlPath)
	if err != nil {
		log.Fatalf("❌ Falha ao ler %s: %v", sqlPath, err)
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("❌ Falha ao conectar ao Postgres: %v", err)
	}
	defer conn.Close(ctx)

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Fatalf("❌ Falha ao iniciar transação: %v", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
		log.Fatalf("❌ Falha ao executar seed.sql: %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("❌ Falha ao confirmar transação do seed: %v", err)
	}

	log.Println("✅ Seed de desenvolvimento aplicado com sucesso!")
}

// seedSQLPath resolves seed.sql relative to this source file, so the script
// works regardless of the caller's current working directory.
func seedSQLPath() string {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		log.Fatal("❌ Não foi possível resolver o caminho de scripts/seed/main.go")
	}
	return filepath.Join(filepath.Dir(thisFile), "seed.sql")
}
