#!/bin/bash
# ============================================================================
# OWASP ZAP Security Scan Runner
# Online Business Permit System
#
# Prerequisites:
#   - Docker installed
#   - App running at http://localhost:8000
#
# Usage:
#   chmod +x tests/security/run-zap-scan.sh
#   ./tests/security/run-zap-scan.sh [baseline|full|api]
# ============================================================================

set -euo pipefail

TARGET_URL="${TARGET_URL:-http://host.docker.internal:8000}"
REPORT_DIR="tests/security/reports"
SCAN_TYPE="${1:-baseline}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create reports directory
mkdir -p "$REPORT_DIR"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  OWASP ZAP Security Scan — Online Business Permit System    ║"
echo "║  Scan Type: $SCAN_TYPE                                      ║"
echo "║  Target: $TARGET_URL                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

case "$SCAN_TYPE" in
  baseline)
    echo ""
    echo "Running Baseline Scan (passive only, ~2 min)..."
    docker run --rm \
      --add-host=host.docker.internal:host-gateway \
      -v "$(pwd)/tests/security:/zap/wrk:rw" \
      ghcr.io/zaproxy/zaproxy:stable \
      zap-baseline.py \
        -t "$TARGET_URL" \
        -c zap-config.conf \
        -r "reports/zap-baseline-${TIMESTAMP}.html" \
        -J "reports/zap-baseline-${TIMESTAMP}.json" \
        -I
    ;;

  full)
    echo ""
    echo "Running Full Scan (active + passive, ~15-30 min)..."
    docker run --rm \
      --add-host=host.docker.internal:host-gateway \
      -v "$(pwd)/tests/security:/zap/wrk:rw" \
      ghcr.io/zaproxy/zaproxy:stable \
      zap-full-scan.py \
        -t "$TARGET_URL" \
        -c zap-config.conf \
        -r "reports/zap-full-${TIMESTAMP}.html" \
        -J "reports/zap-full-${TIMESTAMP}.json" \
        -I
    ;;

  api)
    echo ""
    echo "Running API Scan (~5-10 min)..."
    docker run --rm \
      --add-host=host.docker.internal:host-gateway \
      -v "$(pwd)/tests/security:/zap/wrk:rw" \
      ghcr.io/zaproxy/zaproxy:stable \
      zap-api-scan.py \
        -t "$TARGET_URL/api" \
        -f openapi \
        -r "reports/zap-api-${TIMESTAMP}.html" \
        -J "reports/zap-api-${TIMESTAMP}.json" \
        -I
    ;;

  *)
    echo "Unknown scan type: $SCAN_TYPE"
    echo "Usage: $0 [baseline|full|api]"
    exit 1
    ;;
esac

echo ""
echo "✅ Scan complete! Reports saved to $REPORT_DIR/"
ls -la "$REPORT_DIR/"*"${TIMESTAMP}"* 2>/dev/null || echo "(no reports found)"
