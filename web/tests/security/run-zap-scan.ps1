# ============================================================================
# OWASP ZAP Security Scan Runner (PowerShell)
# Online Business Permit System
#
# Prerequisites:
#   - Docker Desktop installed
#   - App running at http://localhost:8000
#
# Usage:
#   .\tests\security\run-zap-scan.ps1 [-ScanType baseline|full|api]
# ============================================================================

param(
    [ValidateSet("baseline", "full", "api")]
    [string]$ScanType = "baseline",

    [string]$TargetUrl = "http://host.docker.internal:8000"
)

$ErrorActionPreference = "Stop"
$ReportDir = "tests\security\reports"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Create reports directory
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "  OWASP ZAP Security Scan — Business Permit System" -ForegroundColor Cyan
Write-Host "  Scan Type: $ScanType" -ForegroundColor Cyan
Write-Host "  Target: $TargetUrl" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$SecurityDir = (Resolve-Path "tests\security").Path

switch ($ScanType) {
    "baseline" {
        Write-Host "`nRunning Baseline Scan (passive only, ~2 min)..." -ForegroundColor Yellow
        docker run --rm `
            --add-host=host.docker.internal:host-gateway `
            -v "${SecurityDir}:/zap/wrk:rw" `
            ghcr.io/zaproxy/zaproxy:stable `
            zap-baseline.py `
                -t $TargetUrl `
                -c zap-config.conf `
                -r "reports/zap-baseline-${Timestamp}.html" `
                -J "reports/zap-baseline-${Timestamp}.json" `
                -I
    }
    "full" {
        Write-Host "`nRunning Full Scan (active + passive, ~15-30 min)..." -ForegroundColor Yellow
        docker run --rm `
            --add-host=host.docker.internal:host-gateway `
            -v "${SecurityDir}:/zap/wrk:rw" `
            ghcr.io/zaproxy/zaproxy:stable `
            zap-full-scan.py `
                -t $TargetUrl `
                -c zap-config.conf `
                -r "reports/zap-full-${Timestamp}.html" `
                -J "reports/zap-full-${Timestamp}.json" `
                -I
    }
    "api" {
        Write-Host "`nRunning API Scan (~5-10 min)..." -ForegroundColor Yellow
        docker run --rm `
            --add-host=host.docker.internal:host-gateway `
            -v "${SecurityDir}:/zap/wrk:rw" `
            ghcr.io/zaproxy/zaproxy:stable `
            zap-api-scan.py `
                -t "$TargetUrl/api" `
                -f openapi `
                -r "reports/zap-api-${Timestamp}.html" `
                -J "reports/zap-api-${Timestamp}.json" `
                -I
    }
}

Write-Host "`n✅ Scan complete! Reports saved to $ReportDir\" -ForegroundColor Green
Get-ChildItem "$ReportDir\*$Timestamp*" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
