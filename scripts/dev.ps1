# dev.ps1 — Sobe o ambiente completo de desenvolvimento (Windows)
#
# Uso: ./scripts/dev.ps1
# Ctrl+C encerra todos os processos

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Raissa Cachos — Dev Environment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Infra (Postgres + Redis)
Write-Host "[1/3] Subindo Postgres e Redis..." -ForegroundColor Yellow
docker compose -f "$Root\docker-compose.yml" up -d
Write-Host "      OK — Postgres :5432 | Redis :6379" -ForegroundColor Green
Write-Host ""

# Aguarda banco ficar pronto
Write-Host "      Aguardando banco ficar pronto..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 2. Backend Go
Write-Host "[2/3] Iniciando Backend (Go)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\backend"
    go run ./cmd/server
} -ArgumentList $Root
Write-Host "      OK — http://localhost:8080" -ForegroundColor Green
Write-Host ""

# 3. Frontend React
Write-Host "[3/3] Iniciando Frontend (React)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\frontend"
    npm start
} -ArgumentList $Root
Write-Host "      OK — http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Tudo rodando. Ctrl+C para parar." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Mantém o script vivo e mostra logs
try {
    while ($true) {
        Receive-Job $backendJob  -ErrorAction SilentlyContinue
        Receive-Job $frontendJob -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nEncerrando processos..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    docker compose -f "$Root\docker-compose.yml" stop
    Write-Host "Encerrado." -ForegroundColor Red
}
