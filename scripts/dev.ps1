# dev.ps1 — Sobe o ambiente completo de desenvolvimento (Windows)
#
# Uso: ./scripts/dev.ps1
# Ctrl+C encerra todos os processos

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Tyflachar — Dev Environment" -ForegroundColor Cyan
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

# 2. Backend — terminal separado com titulo
Write-Host "[2/3] Iniciando Backend (Go + Air)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$host.UI.RawUI.WindowTitle = 'Tyflachar — Backend :8080'; Set-Location '$Root\apps\backend'; air }"
)
Write-Host "      OK — http://localhost:8080" -ForegroundColor Green
Write-Host ""

# 3. Frontend — terminal separado com titulo
Write-Host "[3/3] Iniciando Frontend (React/Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$host.UI.RawUI.WindowTitle = 'Tyflachar — Frontend :3000'; Set-Location '$Root\apps\frontend'; npm run dev }"
)
Write-Host "      OK — http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Tudo rodando em terminais separados." -ForegroundColor Cyan
Write-Host "  Feche as janelas para encerrar." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Opcional: abre o browser automaticamente
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"