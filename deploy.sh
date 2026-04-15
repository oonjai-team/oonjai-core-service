#!/usr/bin/env bash
set -euo pipefail

# ── Config ──
SERVICE_NAME="oonjai-core-service"
REGION="asia-southeast1"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "==> Project:  $PROJECT_ID"
echo "==> Service:  $SERVICE_NAME"
echo "==> Region:   $REGION"
echo ""

# ── Enable required APIs ──
echo "==> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --quiet

# ── Load env vars from .env.production if it exists ──
# ── Load env vars from .env.production if it exists ──
ENV_VARS_FLAG=""
if [ -f .env.production ]; then
  echo "==> Found .env.production, loading env vars..."
  ENV_VARS=$(grep -v '^#' .env.production | grep -v '^\s*$' | tr '\n' ',' | sed 's/,$//')
  ENV_VARS_FLAG="--set-env-vars=$ENV_VARS"
fi

# ── Deploy ──
echo "==> Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  $ENV_VARS_FLAG \
  --quiet

# ── Output service URL ──
URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')
echo ""
echo "==> Deployed successfully!"
echo "==> URL: $URL"
