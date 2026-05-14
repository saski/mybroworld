# MyBroworld

MyBroworld is the operating workspace for the Lucia Astuy online shop and catalog PDF system. It keeps the customer-facing WordPress/WooCommerce custom layer, the Google Sheets catalog workflow, the PDF generator, and the production deployment automation in one repository.

The production goal is that the customer can run the shop and generate catalogs from her WordPress and Google accounts, without depending on this workstation.

## System Map

This diagram keeps the system at operating level: logical layers, production runtime, infrastructure boundaries, observability, and delivery stages. Detailed runbooks live in the linked docs below.

```mermaid
flowchart TB
  subgraph governance["Stage 0 - Planning and governance"]
    repo["GitHub repo<br/>saski/mybroworld"]
    openspec["OpenSpec changes<br/>catalog roadmap and shop observability"]
    plans["Project docs and plans<br/>runbooks, readiness gates, evidence"]
    ci["GitHub Actions CI<br/>secret scan, tests, diff check"]
  end

  subgraph users["Stage 1 - Operators and customer surfaces"]
    customer["Customer<br/>mybro WordPress account"]
    operator["Maintainer / operator<br/>GitHub, WordPress, Google Cloud"]
    publicShop["Public shop<br/>WordPress + WooCommerce"]
    wpAdmin["WordPress admin<br/>shop operations"]
    catalogConsole["Catalog PDFs console<br/>owned MU plugin"]
  end

  subgraph wordpressLayer["Stage 2 - Owned WordPress layer"]
    host["DonDominio WordPress host<br/>production PHP runtime"]
    theme["Owned theme<br/>wp-content/themes/luciastuy"]
    muPlugins["Owned MU plugins<br/>catalog console, GA4 ecommerce, artwork rules"]
    woo["WooCommerce core<br/>products, cart, checkout, Store API"]
    localWp["Local WordPress runtime<br/>Docker Compose, setup, smoke checks"]
  end

  subgraph sourceData["Stage 3 - Source data and Google Workspace"]
    sheets["Google Sheets<br/>artworks, catalog_jobs, review state"]
    appsScript["Apps Script Web App<br/>queue, status, review, Cloud Run trigger"]
    driveAssets["Google Drive input assets<br/>_cat images, logos, brand files"]
    driveOutput["Google Drive output<br/>OBRA/Catalogos PDFs"]
  end

  subgraph catalogRuntime["Stage 4 - Catalog generation runtime"]
    cloudRunJob["Cloud Run Job<br/>lucia-mybrocorp-catalog-agent"]
    runtimeSecrets["Secret Manager<br/>agent config, OAuth client, OAuth token"]
    catalogAgent["Node catalog agent<br/>one queued job per run"]
    generator["PDF generator<br/>CSV contract, HTML/CSS, Puppeteer"]
    monitor["Cloud Run monitor<br/>failed, stale, incomplete jobs"]
  end

  subgraph observability["Stage 5 - Business and runtime observability"]
    siteKit["Site Kit + GA4<br/>page and ecommerce events"]
    ga4["GA4 reports<br/>traffic, product interest, funnel, purchase"]
    cloudLogging["Cloud Logging<br/>Cloud Run execution logs"]
    ghArtifacts["GitHub workflow artifacts<br/>deploy manifests and rollback evidence"]
  end

  subgraph delivery["Stage 6 - Delivery and rollback infrastructure"]
    catalogDeploy["Deploy catalog agent workflow<br/>production-catalog-agent"]
    cloudBuild["Cloud Build<br/>container image build"]
    artifactRegistry["Artifact Registry<br/>SHA-tagged catalog-agent images"]
    wpDeploy["Deploy WordPress workflow<br/>production-wordpress"]
    ftp["DonDominio FTP<br/>owned theme and MU plugin upload"]
    wpBackup["WordPress rollback archive<br/>owned code backup and restore"]
  end

  repo --> openspec
  repo --> plans
  repo --> ci
  ci --> catalogDeploy
  ci --> wpDeploy

  customer --> publicShop
  customer --> wpAdmin
  operator --> repo
  operator --> wpAdmin
  wpAdmin --> catalogConsole

  publicShop --> host
  wpAdmin --> host
  host --> theme
  host --> muPlugins
  host --> woo
  theme --> publicShop
  muPlugins --> catalogConsole
  muPlugins --> siteKit
  woo --> publicShop
  woo --> siteKit
  localWp --> theme
  localWp --> muPlugins
  localWp --> woo

  catalogConsole -->|"server-side AJAX with token"| appsScript
  appsScript -->|"read/write queue and review state"| sheets
  appsScript -->|"run job on demand"| cloudRunJob
  sheets -->|"source rows and queued jobs"| catalogAgent
  driveAssets -->|"catalog images and brand assets"| generator
  runtimeSecrets -->|"runtime identity and config"| catalogAgent
  cloudRunJob --> catalogAgent
  catalogAgent --> generator
  generator -->|"PDF upload"| driveOutput
  catalogAgent -->|"status, result URL, errors"| sheets
  driveOutput -->|"PDF link"| catalogConsole

  monitor -->|"health sweep"| sheets
  catalogAgent --> cloudLogging
  monitor --> cloudLogging
  siteKit --> ga4
  publicShop --> siteKit

  catalogDeploy --> cloudBuild
  cloudBuild --> artifactRegistry
  artifactRegistry -->|"deploy pinned image"| cloudRunJob
  catalogDeploy -->|"execute and verify job"| cloudRunJob
  catalogDeploy -->|"rollback to previous image on failure"| artifactRegistry
  catalogDeploy --> ghArtifacts

  wpDeploy -->|"pre-deploy archive"| wpBackup
  wpDeploy -->|"dry-run, upload, smoke, Store API assert"| ftp
  ftp --> host
  wpDeploy -->|"restore owned code on failure"| wpBackup
  wpBackup --> host
  wpDeploy --> ghArtifacts
```

## Stage Summary

| Stage | Main components | Purpose | Current state |
| --- | --- | --- | --- |
| Customer operation | WordPress, WooCommerce | Run the shop and request catalog PDFs | Live; customer-account validation still pending |
| Queue and source data | Apps Script, Google Sheets | Store catalog source rows, queued jobs, status, and review state | Live |
| PDF runtime | Apps Script, Cloud Run, Secret Manager, Google Drive | Render catalogs in Google Cloud as `mybrocorp@gmail.com` only when an operator requests a PDF | Live and manually deploy-validated; PDFs write to `OBRA/Catalogos` |
| Monitoring | Cloud Run monitor, Cloud Logging | Detect failed, stale, or incomplete jobs | Live |
| Catalog-agent delivery | GitHub Actions, Cloud Build, Artifact Registry | Validate, build, deploy, verify, and roll back the catalog worker | Configured and manually validated; auto-deploy disabled |
| WordPress delivery | GitHub Actions, DonDominio FTP | Deploy owned theme and MU plugin changes | Manually validated with rollback archive/restore; auto-deploy disabled |

## Current Gates

- Customer handoff gate: one catalog still needs to be queued, completed, opened, and reviewed from the customer's mybro WordPress account.
- Catalog image gate: strict `_cat` image selection should stay disabled until the shared Drive image folder contains exactly one `_cat` image per included, catalog-ready artwork.
- WordPress CD gate: reviewed manual workflow run `25509617424` validated the pre-deploy archive, rollback restore path, deploy, and production smoke checks on 2026-05-07; unattended WordPress deploys remain disabled.
- Auto-deploy gate: `ENABLE_CATALOG_AGENT_AUTO_DEPLOY` and `ENABLE_WORDPRESS_AUTO_DEPLOY` remain unset until manual validation is complete.
- Source-sync gate: WooCommerce auto-apply remains disabled until source readiness monitoring and repeated safe dry-runs are proven.

## Key References

- Project status: [PROJECT_STATUS.md](PROJECT_STATUS.md)
- Production deployments: [thoughts/shared/docs/deployments.md](thoughts/shared/docs/deployments.md)
- Customer testing and handoff: [thoughts/shared/docs/customer-testing-and-handoff.md](thoughts/shared/docs/customer-testing-and-handoff.md)
- Catalog generator: [catalog-generator/README.md](catalog-generator/README.md)
- Cloud Run catalog worker: [catalog-generator/cloud-run/README.md](catalog-generator/cloud-run/README.md)
- WordPress workspace: [wordpress/README.md](wordpress/README.md)
