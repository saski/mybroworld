# Production Deployments

This document records the automated deployment surfaces for the Lucía Astuy production stack.

## GitHub Environments

Create these GitHub Environments before enabling unattended production deployments:

- `production-catalog-agent`
- `production-wordpress`

Both environments should require manual approval from a repository maintainer. Without required reviewers, GitHub will run the deployment jobs immediately after a matching push to `main`.

Automatic deployment on push is disabled until these GitHub Environment or repository variables are set:

- `ENABLE_CATALOG_AGENT_AUTO_DEPLOY=true`
- `ENABLE_WORDPRESS_AUTO_DEPLOY=true`

Manual `workflow_dispatch` deployments remain available without these variables, but still use the configured GitHub Environment.

Configured state on 2026-05-02:

- `production-catalog-agent` exists and requires approval from `saski`.
- `production-wordpress` exists and requires approval from `saski`.
- `main` has branch protection requiring the `Repository checks` status check for normal merges; admins can bypass for emergency direct pushes.
- Push-triggered production deploys remain disabled because `ENABLE_CATALOG_AGENT_AUTO_DEPLOY` and `ENABLE_WORDPRESS_AUTO_DEPLOY` are not set.

## Required GitHub Secrets

### `production-catalog-agent`

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity Federation provider resource name.
- `GCP_DEPLOY_SERVICE_ACCOUNT`: Google service account email used by GitHub Actions to deploy Cloud Run.

The deploy service account needs the minimum Google Cloud permissions to:

- submit Cloud Build builds
- push/read Artifact Registry images through Cloud Build
- read and update Cloud Run Jobs
- execute Cloud Run Jobs for verification
- read Cloud Logging entries for verification
- act as the Cloud Run runtime service account when updating jobs
- act as the Cloud Build execution service account used by this project
- use Service Usage and the Cloud Build staging bucket required by `gcloud builds submit`

Do not use a downloaded Google service account JSON key.

Configured state on 2026-05-02:

- Workload Identity Pool: `github-actions`
- OIDC provider: `mybroworld-github`
- Trusted repository condition: `assertion.repository == 'saski/mybroworld'`
- GitHub provider secret: `projects/289786381719/locations/global/workloadIdentityPools/github-actions/providers/mybroworld-github`
- Deploy service account: `github-catalog-deployer@mybroworld-catalog-260501.iam.gserviceaccount.com`
- Runtime service account remains `catalog-agent-runner@mybroworld-catalog-260501.iam.gserviceaccount.com`
- The deployer has Cloud Build, Cloud Run Developer, Logging Viewer, Artifact Registry Reader, Service Usage Consumer, and Storage access needed for the default Cloud Build staging path.
- The deployer can act as `catalog-agent-runner@...` for Cloud Run Job updates and `289786381719-compute@developer.gserviceaccount.com` for Cloud Build execution.

### `production-wordpress`

- `WP_FTP_USER`: DonDominio FTP username.
- `WP_FTP_PASSWORD`: DonDominio FTP password.

Optional environment variables:

- `WP_BASE_URL`, defaults to `https://www.luciastuy.com`
- `WOO_BASE_URL`, defaults to `https://www.luciastuy.com`
- `WP_FTP_HOST`, defaults to `ftp.dondominio.com`
- `WP_REMOTE_PATH`, defaults to `/public`
- `WP_REMOTE_THEME_DIR`, defaults to `/public/wp-content/themes/luciastuy`
- `WP_REMOTE_MU_PLUGIN_DIR`, defaults to `/public/wp-content/mu-plugins`

Configured state on 2026-05-02:

- `WP_FTP_USER` and `WP_FTP_PASSWORD` exist as `production-wordpress` environment secrets.
- `WP_FTP_HOST`, `WP_REMOTE_PATH`, `WP_REMOTE_THEME_DIR`, and `WP_REMOTE_MU_PLUGIN_DIR` exist as `production-wordpress` environment variables.
- Manual WordPress deployment is still held until the pre-deploy archive and rollback helper are automated.

## Workflows

### CI

Workflow: `.github/workflows/ci.yml`

Runs on pull requests and pushes to `main`.

Checks:

- npm install for `catalog-generator`
- high-confidence secret scan
- WordPress owned-code PHP lint and tests
- WordPress deploy/local-runtime script tests
- catalog generator tests
- Cloud Run deploy helper dry-run tests
- `git diff --check`

### Catalog Agent Deployment

Workflow: `.github/workflows/deploy-catalog-agent.yml`

Runs on pushes to `main` that change catalog generator, catalog-agent, assets, package, Docker, or Cloud Run files. It can also be run manually.

Push-triggered deployment is skipped unless `ENABLE_CATALOG_AGENT_AUTO_DEPLOY=true` is configured. This prevents the first workflow commit from trying to deploy before Workload Identity Federation and Environment reviewers are configured.

The workflow:

1. Authenticates to Google Cloud through Workload Identity Federation.
2. Builds a Cloud Run image with Cloud Build.
3. Tags the image with the git SHA or explicit workflow input tag.
4. Records the previous Cloud Run Job image.
5. Updates `lucia-mybrocorp-catalog-agent`.
6. Executes the job once.
7. Verifies Cloud Run logs include `authenticated as mybrocorp@gmail.com`.
8. Rolls back to the previous image if verification fails.

The workflow does not deploy `latest`.

Normal customer PDF generation does not rely on a worker polling schedule. After
the Apps Script source is deployed, `queue_catalog_job` starts
`lucia-mybrocorp-catalog-agent` through the Cloud Run Admin API `jobs.run`
method when a `lucia-mybrocorp` job is queued.

Last verified manual deployment:

- Workflow run: `https://github.com/saski/mybroworld/actions/runs/25258963235`
- Git SHA: `298b50c6fa901d3a279492bd9aa1ba86f7770acc`
- Cloud Build: `31dec80d-e034-4ebc-8478-a16c71c071ac`
- Cloud Run Job image: `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:298b50c6fa901d3a279492bd9aa1ba86f7770acc`
- Verification execution: `lucia-mybrocorp-catalog-agent-xxkkn`, `EXECUTION_SUCCEEDED`
- Identity log: `[catalog-agent] authenticated as mybrocorp@gmail.com`

### Apps Script On-Demand Trigger

The Apps Script Web App is the production queue boundary for WordPress. Deploy
the updated source from `catalog-generator/apps-script` to the bound spreadsheet
project, then configure these script properties:

- `CATALOG_CLOUD_RUN_TRIGGER_ENABLED=true`
- `CATALOG_CLOUD_RUN_TRIGGER_PROFILE_KEYS=lucia-mybrocorp`
- `CATALOG_CLOUD_RUN_PROJECT_ID=mybroworld-catalog-260501`
- `CATALOG_CLOUD_RUN_REGION=europe-west1`
- `CATALOG_CLOUD_RUN_JOB_NAME=lucia-mybrocorp-catalog-agent`

Grant `roles/run.invoker` on the Cloud Run Job to the account that executes the
Web App. Pause the legacy `lucia-mybrocorp-catalog-agent-every-5m` scheduler
after one controlled WordPress queue request starts Cloud Run successfully.

### WordPress Owned-Code Deployment

Workflow: `.github/workflows/deploy-wordpress.yml`

Runs on pushes to `main` that change owned WordPress theme, MU plugins, or WordPress deployment scripts. It can also be run manually.

Push-triggered deployment is skipped unless `ENABLE_WORDPRESS_AUTO_DEPLOY=true` is configured. This prevents accidental FTP uploads before the Environment reviewers and secrets are configured.

The workflow:

1. Runs WordPress owned-code checks.
2. Creates a checksum manifest for owned deployable files.
3. Writes FTP runtime config from GitHub Environment secrets into a temporary file.
4. Runs `scripts/wp-push-theme.sh --dry-run`.
5. Uploads only the owned theme and MU plugin directories.
6. Smoke-tests the public storefront.
7. Verifies the WooCommerce Store API exposes the canonical managed catalog with images.
8. Stores the deploy manifest as a workflow artifact.

## Rollback Notes

Cloud Run rollback is automated in `catalog-generator/cloud-run/deploy.sh`: if verification fails, the script restores the previous Cloud Run Job image.

WordPress rollback is not fully automated yet. The deployment manifest records what was sent, but restoring the previous remote owned-code archive still needs an explicit archive/restore helper before this gate is complete.

## Source Changes

Google Sheet and Drive source changes are monitored by the Cloud Run catalog monitor and the existing source/data validation scripts. Production WooCommerce auto-apply remains disabled until dry-run stability and backup gates are encoded.
