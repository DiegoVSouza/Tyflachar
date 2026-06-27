package database

import (
	"errors"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(databaseURL string) {
	log.Println("Verificando migrações do banco de dados...")

	m, err := migrate.New(
		"file://migrations",
		databaseURL,
	)
	if err != nil {
		log.Fatalf("Falha ao iniciar o gerenciador de migrações: %v", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Println("Banco de dados já está atualizado. Nenhuma migração necessária.")
			return
		}
		log.Fatalf("Falha ao aplicar migrações: %v", err)
	}

	log.Println("Migrações aplicadas com sucesso!")
}
