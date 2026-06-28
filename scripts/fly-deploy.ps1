<#
.SYNOPSIS
  Deploy and lifecycle management for Tyflachar backend on Fly.io.

.DESCRIPTION
  First-time setup: run fly-setup-infra.ps1 first to create Postgres + Redis.

  Commands:
    deploy      - Full deploy: push secrets, run migrations, deploy app
    secrets     - Push .env secrets to Fly.io (skip commented and local-only vars)
    migrate     - Run DB migrations remotely via fly ssh console
    destroy     - Delete the Fly.io app completely (asks for confirmation)
    status      - Show app status, logs URL and secrets list
    logs        - Tail live logs from Fly.io

.EXAMPLE
  .\scripts\fly-setup-infra.ps1        # first time only: create DB + Redis
  .\scripts\fly-deploy.ps1 deploy
  .\scripts\fly-deploy.ps1 secrets
  .\scripts\fly-deploy.ps1 destroy
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('deploy', 'secrets', 'migrate', 'destroy', 'status', 'logs')]
    [string]$Command = 'deploy'
)

$ErrorActionPreference = 'Stop'
$Root        = Split-Path -Parent $PSScriptRoot
$BackendDir  = Join-Path $Root 'apps\backend'
$EnvFile     = Join-Path $BackendDir '.env'
$AppName     = 'tyflachar'

# ── Helpers ───────────────────────────────────────────────────────────────────

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "  >> $msg" -ForegroundColor Cyan
}

function Write-Ok([string]$msg) {
    Write-Host "     OK — $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "     WARN — $msg" -ForegroundColor Yellow
}

function Write-Banner([string]$title) {
    $line = '─' * ($title.Length + 6)
    Write-Host ""
    Write-Host "  $line"    -ForegroundColor Magenta
    Write-Host "    $title" -ForegroundColor Magenta
    Write-Host "  $line"    -ForegroundColor Magenta
    Write-Host ""
}

# Vars we never upload to Fly (local only)
$LocalOnlyKeys = @(
    'DATABASE_URL',      # Fly uses its own Postgres attach — set separately via fly secrets set
    'REDIS_URL',         # Fly uses its own Upstash/Redis attach — set separately via fly secrets set
    'APP_ENV',           # set in fly.toml [env]
    'APP_PORT',          # set in fly.toml [env]
    'DEFAULT_SALON_ID',  # legacy key (renamed to DEFAULT_BRANCH_ID)
    'BOT_MODE'           # legacy key
)

function Read-EnvFile {
    if (-not (Test-Path $EnvFile)) {
        Write-Error "Could not find .env at $EnvFile"
        exit 1
    }

    $pairs = @{}
    foreach ($line in Get-Content $EnvFile) {
        $trimmed = $line.Trim()
        # Skip blanks and comments
        if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }
        if ($trimmed -notmatch '^([A-Z_][A-Z0-9_]*)=(.*)$') { continue }

        $key   = $Matches[1]
        $value = $Matches[2].Trim('"').Trim("'").Trim()

        # Skip local-only keys
        if ($LocalOnlyKeys -contains $key) { continue }
        # Skip empty values
        if ($value -eq '') { continue }

        $pairs[$key] = $value
    }
    return $pairs
}

function Assert-FlyAuth {
    $status = flyctl auth whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Not authenticated to Fly.io. Run: flyctl auth login"
        exit 1
    }
    Write-Ok "Fly.io authenticated as $status"
}

# ── Commands ──────────────────────────────────────────────────────────────────

function Invoke-Secrets {
    Write-Step "Reading $EnvFile and pushing secrets to $AppName..."
    $pairs = Read-EnvFile

    if ($pairs.Count -eq 0) {
        Write-Warn "No uploadable secrets found in .env"
        return
    }

    # Build the argument list: KEY=VALUE KEY2=VALUE2 ...
    $args = $pairs.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }

    Write-Host "     Uploading $($pairs.Count) secret(s):" -ForegroundColor Gray
    $pairs.Keys | ForEach-Object { Write-Host "       - $_" -ForegroundColor Gray }

    Set-Location $BackendDir
    flyctl secrets set @args --app $AppName

    Write-Ok "Secrets pushed. Fly will restart the app automatically."
}

function Invoke-Migrate {
    Write-Step "Running DB migrations on $AppName..."
    Set-Location $BackendDir

    # The migration is run as part of server startup (database.RunMigrations in main.go)
    # We trigger it by running the binary in a one-off machine with the migrate sub-command.
    # If the app doesn't have a dedicated migrate command, we restart the app — startup runs migrations.
    flyctl machine restart --app $AppName 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Could not restart via machine API — trying app restart..."
        flyctl apps restart $AppName
    }
    Write-Ok "App restarted — migrations run automatically on startup (database.RunMigrations)."
}

function Invoke-Deploy {
    Write-Banner "tyflachar -- Full Deploy"

    Assert-FlyAuth

    Write-Step "[1/3] Pushing secrets..."
    Invoke-Secrets

    Write-Step "[2/3] Deploying app to Fly.io..."
    Set-Location $BackendDir
    flyctl deploy --remote-only --app $AppName

    Write-Step "[3/3] Migrations run on startup automatically."
    Write-Ok "Deploy complete → https://$AppName.fly.dev"
    Write-Host ""
}

function Invoke-Destroy {
    Write-Banner "DESTROY $AppName"
    Write-Host "  This will permanently delete the Fly.io app '$AppName'." -ForegroundColor Red
    Write-Host "  Volumes, secrets, and machines will be lost."              -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "  Type the app name to confirm"

    if ($confirm -ne $AppName) {
        Write-Host "  Aborted." -ForegroundColor Yellow
        exit 0
    }

    flyctl apps destroy $AppName --yes
    Write-Ok "App '$AppName' destroyed."
    Write-Host ""
    Write-Host "  To recreate: .\scripts\fly-deploy.ps1 deploy" -ForegroundColor Cyan
}

function Invoke-Status {
    Write-Step "App status"
    flyctl status --app $AppName

    Write-Step "Secrets list (keys only)"
    flyctl secrets list --app $AppName

    Write-Host ""
    Write-Host "  Logs: flyctl logs --app $AppName" -ForegroundColor Gray
}

function Invoke-Logs {
    Write-Step "Tailing logs for $AppName (Ctrl+C to stop)..."
    flyctl logs --app $AppName
}

# ── Main ──────────────────────────────────────────────────────────────────────

switch ($Command) {
    'deploy'  { Invoke-Deploy  }
    'secrets' { Assert-FlyAuth; Invoke-Secrets }
    'migrate' { Assert-FlyAuth; Invoke-Migrate }
    'destroy' { Assert-FlyAuth; Invoke-Destroy }
    'status'  { Assert-FlyAuth; Invoke-Status  }
    'logs'    { Invoke-Logs                    }
}
