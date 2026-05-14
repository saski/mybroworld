# MyBroworld

MyBroworld is the operating workspace for the Lucia Astuy online shop and catalog PDF system. It keeps the customer-facing WordPress/WooCommerce custom layer, the Google Sheets catalog workflow, the PDF generator, and the production deployment automation in one repository.

The production goal is that the customer can run the shop and generate catalogs from her WordPress and Google accounts, without depending on this workstation.

## System Map

This diagram keeps the system at operating level: logical layers, production runtime, infrastructure boundaries, observability, and delivery stages. Detailed runbooks live in the linked docs below.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontSize": "18px", "fontFamily": "Arial, sans-serif", "lineColor": "#334155", "primaryTextColor": "#0f172a"}, "flowchart": {"nodeSpacing": 32, "rankSpacing": 42, "curve": "basis"}}}%%
flowchart LR
  governance["Stage 0<br/>Planning and governance<br/><br/>GitHub repo<br/>OpenSpec workstreams<br/>Runbooks, gates, evidence"]
  users["Stage 1<br/>Operators and customer surfaces<br/><br/>Customer WordPress account<br/>Maintainer/operator<br/>Public shop and WP admin"]
  wordpress["Stage 2<br/>Owned WordPress layer<br/><br/>DonDominio host<br/>WooCommerce core<br/>luciastuy theme<br/>MU plugins: catalog, GA4, artwork rules"]
  workspace["Stage 3<br/>Google Workspace boundary<br/><br/>Apps Script Web App<br/>Sheets: artworks and catalog_jobs<br/>Drive: _cat assets and PDF output"]
  catalog["Stage 4<br/>Catalog generation runtime<br/><br/>Cloud Run Job<br/>Node catalog agent<br/>Secret Manager<br/>PDF generator and monitor"]
  observability["Stage 5<br/>Observability<br/><br/>Site Kit and GA4<br/>Cloud Logging<br/>GitHub deploy artifacts"]
  delivery["Stage 6<br/>Delivery and rollback<br/><br/>GitHub Actions CI/CD<br/>Cloud Build and Artifact Registry<br/>DonDominio FTP<br/>Rollback archives"]
  local["Local development<br/><br/>Docker WordPress runtime<br/>owned-code tests<br/>catalog generator tests"]

  governance -->|"plans and PRs"| users
  users -->|"shop use and admin work"| wordpress
  wordpress -->|"catalog AJAX API"| workspace
  workspace -->|"queued job and source data"| catalog
  catalog -->|"PDF URL and job status"| workspace
  workspace -->|"PDF links in console"| wordpress

  wordpress -->|"page and ecommerce events"| observability
  catalog -->|"job logs and monitor results"| observability
  delivery -->|"deploy manifests and rollback evidence"| observability

  governance -->|"CI gates"| delivery
  delivery -->|"owned WordPress code deploy"| wordpress
  delivery -->|"pinned catalog image deploy"| catalog
  local -->|"validates owned code"| wordpress
  local -->|"validates generator/runtime scripts"| catalog

  classDef governanceFill fill:#dbeafe,stroke:#1d4ed8,color:#0f172a,stroke-width:2px
  classDef userFill fill:#dcfce7,stroke:#15803d,color:#0f172a,stroke-width:2px
  classDef wordpressFill fill:#ffedd5,stroke:#c2410c,color:#0f172a,stroke-width:2px
  classDef workspaceFill fill:#ede9fe,stroke:#7c3aed,color:#0f172a,stroke-width:2px
  classDef runtimeFill fill:#ccfbf1,stroke:#0f766e,color:#0f172a,stroke-width:2px
  classDef observabilityFill fill:#fef9c3,stroke:#a16207,color:#0f172a,stroke-width:2px
  classDef deliveryFill fill:#fee2e2,stroke:#b91c1c,color:#0f172a,stroke-width:2px
  classDef localFill fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px

  class governance governanceFill
  class users userFill
  class wordpress wordpressFill
  class workspace workspaceFill
  class catalog runtimeFill
  class observability observabilityFill
  class delivery deliveryFill
  class local localFill
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
