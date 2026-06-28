<#
.SYNOPSIS
  Provisions Fly.io Postgres + Upstash Redis for the tyflachar backend.
  Sets DATABASE_URL and REDIS_URL as Fly secrets automatically.

.DESCRIPTION
  Steps:
    1. Create app (if missing)
    2. Create Postgres cluster and attach to app -> auto-sets DATABASE_URL secret
    3. Create Upstash Redis -> sets REDIS_URL secret
    4. Print status summary

  Safe to re-run -- skips steps already done.
  Use -Force to destroy and recreate DB + Redis from scratch.

.EXAMPLE
  .\scripts\fly-setup-infra.ps1
  .\scripts\fly-setup-infra.ps1 -Force
  .\scripts\fly-setup-infra.ps1 -Region gru
#>

param(
    [string]$AppName   = 'tyflachar',
    [string]$Region    = 'iad',
    [string]$PgName    = 'tyflachar-db',
    [string]$RedisName = 'tyflachar-redis',
    [switch]$Force
)

$ErrorActionPreference = 'Continue'
$Root    = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root 'apps\backend\.env'

# ── Helpers ───────────────────────────────────────────────────────────────────

function Write-Banner([string]$title) {
    $line = '-' * ($title.Length + 4)
    Write-Host ""
    Write-Host "  $line"    -ForegroundColor Magenta
    Write-Host "    $title" -ForegroundColor Magenta
    Write-Host "  $line"    -ForegroundColor Magenta
    Write-Host ""
}
function Write-Step([string]$msg)  { Write-Host ""; Write-Host "  >> $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg)    { Write-Host "     OK -- $msg" -ForegroundColor Green }
function Write-Warn([string]$msg)  { Write-Host "     WARN -- $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg)  { Write-Host "     FAIL -- $msg" -ForegroundColor Red; exit 1 }

function Run-Fly([string[]]$flyArgs) {
    $out = & flyctl @flyArgs 2>&1
    return [PSCustomObject]@{ Output = ($out -join "`n"); ExitCode = $LASTEXITCODE }
}

function App-Exists([string]$name) {
    $r = Run-Fly @('apps', 'list')
    return $r.Output -match "\b$name\b"
}

function Pg-Exists([string]$name) {
    $r = Run-Fly @('postgres', 'list')
    return $r.Output -match "\b$name\b"
}

function Redis-Exists([string]$name) {
    $r = Run-Fly @('redis', 'list')
    return $r.Output -match "\b$name\b"
}

function Secret-Exists([string]$app, [string]$key) {
    $r = Run-Fly @('secrets', 'list', '--app', $app)
    return $r.Output -match "\b$key\b"
}

function Set-EnvValue([string]$key, [string]$value) {
    if (-not (Test-Path $EnvFile)) { return }
    $lines = Get-Content $EnvFile
    $found = $false
    $new   = $lines | ForEach-Object {
        if ($_ -match "^#?$key=") { $found = $true; "$key=$value" }
        else { $_ }
    }
    if (-not $found) { $new += "$key=$value" }
    $new | Set-Content $EnvFile -Encoding UTF8
    Write-Ok ".env updated: $key"
}


Write-Banner "tyflachar -- Fly.io Infra Setup"

$auth = Run-Fly @('auth', 'whoami')
if ($auth.ExitCode -ne 0) { Write-Fail "Not authenticated. Run: flyctl auth login" }
Write-Ok "Authenticated as $($auth.Output.Trim())"

# ── 0. App ────────────────────────────────────────────────────────────────────

Write-Step "[0] App '$AppName'..."

if (-not (App-Exists $AppName)) {
    Write-Warn "Not found -- creating app..."
    $r = Run-Fly @('apps', 'create', $AppName)
    Write-Host $r.Output -ForegroundColor Gray
    if ($r.ExitCode -ne 0) { Write-Fail "Could not create app '$AppName'. Check the name (lowercase, dashes only)." }
    Write-Ok "App '$AppName' created."
} else {
    Write-Ok "App '$AppName' already exists."
}

# ── 1. Postgres ───────────────────────────────────────────────────────────────

Write-Step "[1] Postgres '$PgName'..."

if ($Force -and (Pg-Exists $PgName)) {
    Write-Warn "-Force: destroying '$PgName'..."
    Run-Fly @('postgres', 'destroy', $PgName, '--yes') | Out-Null
}

if (Secret-Exists $AppName 'DATABASE_URL') {
    Write-Ok "DATABASE_URL already set as secret -- skipping Postgres creation."
} elseif (Pg-Exists $PgName) {
    Write-Warn "Postgres '$PgName' exists but DATABASE_URL not set. Re-attaching..."
    $r = Run-Fly @('postgres', 'attach', $PgName, '--app', $AppName)
    Write-Host $r.Output -ForegroundColor Gray
    $url = [regex]::Match($r.Output, 'postgres://[^\s]+').Value
    if ($url) { Set-EnvValue 'DATABASE_URL' $url }
} else {
    Write-Host "     Creating Postgres cluster (region: $Region)..." -ForegroundColor Gray
    $r = Run-Fly @(
        'postgres', 'create',
        '--name',                 $PgName,
        '--region',               $Region,
        '--initial-cluster-size', '1',
        '--vm-size',              'shared-cpu-1x',
        '--volume-size',          '1'
    )
    Write-Host $r.Output -ForegroundColor Gray
    if ($r.ExitCode -ne 0 -and $r.Output -notmatch 'already exists') {
        Write-Fail "Postgres create failed.`n$($r.Output)"
    }

    Write-Host "     Attaching Postgres -> app (sets DATABASE_URL secret)..." -ForegroundColor Gray
    $r2 = Run-Fly @('postgres', 'attach', $PgName, '--app', $AppName)
    Write-Host $r2.Output -ForegroundColor Gray

    $url = [regex]::Match($r2.Output, 'postgres://[^\s]+').Value
    if ($url) {
        Set-EnvValue 'DATABASE_URL' $url
        Write-Ok "DATABASE_URL saved to .env (reference only -- secret already set on Fly)."
    } else {
        Write-Warn "DATABASE_URL could not be auto-parsed. Run manually if needed:"
        Write-Host "     flyctl postgres attach $PgName --app $AppName" -ForegroundColor Gray
    }
}

# ── 2. Redis ──────────────────────────────────────────────────────────────────

Write-Step "[2] Redis '$RedisName'..."

if ($Force -and (Redis-Exists $RedisName)) {
    Write-Warn "-Force: destroying '$RedisName'..."
    Run-Fly @('redis', 'destroy', $RedisName, '--yes') | Out-Null
}

if (Secret-Exists $AppName 'REDIS_URL') {
    Write-Ok "REDIS_URL already set as secret -- skipping Redis creation."
} elseif (Redis-Exists $RedisName) {
    Write-Warn "Redis '$RedisName' exists but REDIS_URL not set. Fetching URL..."
    $r = Run-Fly @('redis', 'status', $RedisName)
    Write-Host $r.Output -ForegroundColor Gray
    $url = [regex]::Match($r.Output, 'redis://[^\s]+').Value
    if ($url) {
        $set = Run-Fly @('secrets', 'set', "REDIS_URL=$url", '--app', $AppName)
        Write-Host $set.Output -ForegroundColor Gray
        Set-EnvValue 'REDIS_URL' $url
        Write-Ok "REDIS_URL set."
    } else {
        Write-Warn "Could not parse URL -- check: flyctl redis status $RedisName"
    }
} else {
    Write-Host ""
    Write-Host "     Crie o Redis manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "     flyctl redis create --name $RedisName --region $Region --no-replicas --enable-eviction" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "     Cole o comando acima em outro terminal, complete o processo" -ForegroundColor Gray
    Write-Host "     e quando terminar, pressione ENTER aqui para continuar..." -ForegroundColor Gray
    Read-Host

    Write-Host "     Buscando URL do Redis criado..." -ForegroundColor Gray
    $rs = Run-Fly @('redis', 'status', $RedisName)
    Write-Host $rs.Output -ForegroundColor Gray

    $url = [regex]::Match($rs.Output, 'redis://[^\s]+').Value

    if ($url) {
        $set = Run-Fly @('secrets', 'set', "REDIS_URL=$url", '--app', $AppName)
        Write-Host $set.Output -ForegroundColor Gray
        Set-EnvValue 'REDIS_URL' $url
        Write-Ok "REDIS_URL set and saved to .env."
    } else {
        Write-Warn "URL nao encontrada no status. Cole manualmente:"
        $url = Read-Host "     Cole aqui a URL do Redis (redis://...)"
        if ($url) {
            $set = Run-Fly @('secrets', 'set', "REDIS_URL=$url", '--app', $AppName)
            Write-Host $set.Output -ForegroundColor Gray
            Set-EnvValue 'REDIS_URL' $url
            Write-Ok "REDIS_URL set and saved to .env."
        }
    }
}

# ── Summary ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ================================" -ForegroundColor Magenta
Write-Host "    Setup Complete" -ForegroundColor Magenta
Write-Host "  ================================" -ForegroundColor Magenta
Write-Host ""

$dbSet    = Secret-Exists $AppName 'DATABASE_URL'
$redisSet = Secret-Exists $AppName 'REDIS_URL'

$dbLabel    = if ($dbSet)    { "[SET]    " } else { "[MISSING]" }
$redisLabel = if ($redisSet) { "[SET]    " } else { "[MISSING]" }
$dbColor    = if ($dbSet)    { 'Green' } else { 'Red' }
$redisColor = if ($redisSet) { 'Green' } else { 'Red' }

Write-Host "  DATABASE_URL  $dbLabel" -ForegroundColor $dbColor
Write-Host "  REDIS_URL     $redisLabel" -ForegroundColor $redisColor
Write-Host ""

if ($dbSet -and $redisSet) {
    Write-Host "  All good! Run the full deploy:" -ForegroundColor Green
    Write-Host "    .\scripts\fly-deploy.ps1 deploy" -ForegroundColor Cyan
} else {
    Write-Host "  Fix missing secrets above, then:" -ForegroundColor Yellow
    Write-Host "    .\scripts\fly-deploy.ps1 deploy" -ForegroundColor Cyan
}
Write-Host ""
