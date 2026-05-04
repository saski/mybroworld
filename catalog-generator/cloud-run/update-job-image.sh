#!/bin/sh
set -eu

PROJECT_ID="${PROJECT_ID:-mybroworld-catalog-260501}"
REGION="${REGION:-europe-west1}"
JOB_NAME="${JOB_NAME:-lucia-mybrocorp-catalog-agent}"
PREVIOUS_IMAGE_FILE="${PREVIOUS_IMAGE_FILE:-catalog-generator/cloud-run/previous-image.txt}"
IMAGE=""
DRY_RUN=0

usage() {
  echo "Usage: $0 --image REGION-docker.pkg.dev/PROJECT/REPO/catalog-agent:TAG" >&2
  echo "  Updates the Cloud Run job to IMAGE and runs verify-job.sh (no Cloud Build)." >&2
  echo "  Env: PROJECT_ID, REGION, JOB_NAME, PREVIOUS_IMAGE_FILE" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project)
      PROJECT_ID="${2:?Missing value for --project}"
      shift 2
      ;;
    --region)
      REGION="${2:?Missing value for --region}"
      shift 2
      ;;
    --job)
      JOB_NAME="${2:?Missing value for --job}"
      shift 2
      ;;
    --image)
      IMAGE="${2:?Missing value for --image}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      usage
      ;;
  esac
done

if [ -z "$IMAGE" ]; then
  usage
fi

if [ "$DRY_RUN" -eq 1 ]; then
  printf 'Would record current image to %s\n' "$PREVIOUS_IMAGE_FILE"
  printf 'Would run: gcloud run jobs update %s --image %s --region %s --project %s\n' "$JOB_NAME" "$IMAGE" "$REGION" "$PROJECT_ID"
  printf 'Would run: catalog-generator/cloud-run/verify-job.sh --project %s --region %s --job %s\n' "$PROJECT_ID" "$REGION" "$JOB_NAME"
  exit 0
fi

gcloud run jobs describe "$JOB_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format='value(spec.template.spec.template.spec.containers[0].image)' > "$PREVIOUS_IMAGE_FILE"

gcloud run jobs update "$JOB_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID"

if ! catalog-generator/cloud-run/verify-job.sh --project "$PROJECT_ID" --region "$REGION" --job "$JOB_NAME"; then
  previous_image=$(cat "$PREVIOUS_IMAGE_FILE")
  echo "Verification failed. Rolling back $JOB_NAME to $previous_image" >&2
  gcloud run jobs update "$JOB_NAME" \
    --image "$previous_image" \
    --region "$REGION" \
    --project "$PROJECT_ID"
  exit 1
fi

printf 'Updated %s to %s and verification passed.\n' "$JOB_NAME" "$IMAGE"
