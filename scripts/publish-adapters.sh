#!/bin/bash
# Publish adapter packages used by node-mod-editor (and other buildable adapters).
# Usage: ./scripts/publish-adapters.sh [--otp=CODE]
# If OTP is required, run: ./scripts/publish-adapters.sh --otp=123456

ADAPTERS=(
  cave-adapters-interfaces
  container-cave-adapter
  continuum-cave-adapter
  docker-cavestartup-adapter
  dotcms-cavemodloader-adapter
  dotcms-login-adapter
  dotcms-pam-cave-adapter
  dotcms-startup-adapter
  duckdb-cavedb-adapter
  email-send-adapter
  express-cave-adapter
  genericeditor-cavemod-adapter
  google-login-adapter
  login-handler-adapter
  modload-eventedcavemodorder-adapter
  opentelemetry-cavemetrics-adapter
  opentelemetry-cavestartup-adapter
  pact-cavemod-adapter
  port-cavestartup-adapter
  pythonapp-caveservice-adapter
  security-adapter
  sharepoint-cave-adapter
  unleash-cavestartup-adapter
  unleash-cavetoggle-adapter
  unleash-cavetoggles-adapter
)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for pkg in "${ADAPTERS[@]}"; do
  echo "Publishing $pkg..."
  (cd "packages/$pkg" && npm publish "$@") || { echo "Failed: $pkg"; exit 1; }
done

echo "All adapters published successfully."
