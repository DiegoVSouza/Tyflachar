#!/usr/bin/env bash
# dev.sh — Sobe o ambiente completo de desenvolvimento (Linux / macOS / WSL)
#
# Uso: ./scripts/dev.sh
# Ctrl+C encerra todos os processos

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Limpa processos filhos ao sair
cleanup() {
  echo ""
  echo "Encerrando processos..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  docker compose -f "$ROOT/docker-compose.yml" stop
  echo "Encerrado."
}
trap cleanup INT TERM EXIT

echo ""
echo "======================================"
echo "  Tyflachar — Dev Environment"
echo "======================================"
echo ""

# 1. Infra (Postgres + Redis)
echo "[1/3] Subindo Postgres e Redis..."
docker compose -f "$ROOT/docker-compose.yml" up -d
echo "      OK — Postgres :5432 | Redis :6379"
echo ""

# Aguarda banco ficar pronto
echo "      Aguardando banco ficar pronto..."
sleep 3

# 2. Backend Go
echo "[2/3] Iniciando Backend (Go)..."
(cd "$ROOT/apps/backend" && go run ./cmd/server) &
BACKEND_PID=$!
echo "      OK — http://localhost:8080 (PID: $BACKEND_PID)"
echo ""

# 3. Frontend React
echo "[3/3] Iniciando Frontend (React)..."
(cd "$ROOT/apps/frontend" && npm start) &
FRONTEND_PID=$!
echo "      OK — http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""

echo "======================================"
echo "  Tudo rodando. Ctrl+C para parar."
echo "======================================"
echo ""
echo "  Banco vazio? O seed de dev (filial, login admin@test.com/admin123,"
echo "  clientes/conversas de exemplo) nao roda mais automaticamente."
echo "  Rode manualmente, apos o backend subir e aplicar as migrations:"
echo "    (cd apps/backend && go run scripts/seed/main.go)"
echo ""

# Aguarda processos
wait "$BACKEND_PID" "$FRONTEND_PID"
