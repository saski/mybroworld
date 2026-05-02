#!/bin/sh
set -eu

PROJECT_ID="${PROJECT_ID:-mybroworld-catalog-260501}"
REGION="${REGION:-europe-west1}"
REPOSITORY="${REPOSITORY:-mybroworld}"
JOB_NAME="${JOB_NAME:-lucia-mybrocorp-catalog-agent}"
IMAGE_TAG="${CATALOG_AGENT_IMAGE_TAG:-${GITHUB_SHA:-}}"
DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Usage: $0 [--dry-run]" >&2
      exit 1
      ;;
  esac
done

if [ -z "$IMAGE_TAG" ]; then
  IMAGE_TAG=$(git rev-parse HEAD)
fi

IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/catalog-agent:$IMAGE_TAG"
PREVIOUS_IMAGE_FILE="${PREVIOUS_IMAGE_FILE:-catalog-generator/cloud-run/previous-image.txt}"
DEPLOYMENT_SUMMARY_FILE="${DEPLOYMENT_SUMMARY_FILE:-catalog-generator/cloud-run/deployment-summary.txt}"

run_or_print() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf '%s\n' "$*"
    return
  fi

  "$@"
}

if [ "$DRY_RUN" -eq 1 ]; then
  cat <<MSG
PROJECT_ID=$PROJECT_ID
REGION=$REGION
JOB_NAME=$JOB_NAME
IMAGE=$IMAGE
gcloud builds submit catalog-generator --config catalog-generator/cloud-run/cloudbuild.yaml --substitutions _IMAGE=$IMAGE --project=$PROJECT_ID --async --suppress-logs --format=value(id)
gcloud builds describe BUILD_ID --project=$PROJECT_ID --format=value(status)
gcloud run jobs describe $JOB_NAME --region $REGION --project=$PROJECT_ID --format=value(spec.template.spec.template.spec.containers[0].image) > $PREVIOUS_IMAGE_FILE
gcloud run jobs update $JOB_NAME --image $IMAGE --region $REGION --project=$PROJECT_ID
catalog-generator/cloud-run/verify-job.sh --project $PROJECT_ID --region $REGION --job $JOB_NAME
MSG
  exit 0
fi

build_id=$(gcloud builds submit catalog-generator \
  --config catalog-generator/cloud-run/cloudbuild.yaml \
  --substitutions "_IMAGE=$IMAGE" \
  --project "$PROJECT_ID" \
  --async \
  --suppress-logs \
  --format='value(id)')

if [ -z "$build_id" ]; then
  echo "Cloud Build did not return a build id" >&2
  exit 1
fi

echo "Cloud Build build_id=$build_id"

while :; do
  build_status=$(gcloud builds describe "$build_id" \
    --project "$PROJECT_ID" \
    --format='value(status)')

  case "$build_status" in
    SUCCESS)
      break
      ;;
    FAILURE|INTERNAL_ERROR|TIMEOUT|CANCELLED|EXPIRED)
      echo "Cloud Build $build_id finished with status $build_status" >&2
      exit 1
      ;;
    *)
      echo "Cloud Build $build_id status=$build_status"
      sleep 5
      ;;
  esac
done

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
  catalog-generator/cloud-run/verify-job.sh --project "$PROJECT_ID" --region "$REGION" --job "$JOB_NAME" || true
  exit 1
fi

{
  printf 'project=%s\n' "$PROJECT_ID"
  printf 'region=%s\n' "$REGION"
  printf 'job=%s\n' "$JOB_NAME"
  printf 'image=%s\n' "$IMAGE"
  printf 'previous_image=%s\n' "$(cat "$PREVIOUS_IMAGE_FILE")"
} > "$DEPLOYMENT_SUMMARY_FILE"

cat "$DEPLOYMENT_SUMMARY_FILE"
