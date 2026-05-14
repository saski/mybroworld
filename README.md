# MyBroworld

MyBroworld is the operating workspace for the Lucia Astuy online shop and catalog PDF system. It keeps the customer-facing WordPress/WooCommerce custom layer, the Google Sheets catalog workflow, the PDF generator, and the production deployment automation in one repository.

The production goal is that the customer can run the shop and generate catalogs from her WordPress and Google accounts, without depending on this workstation.

## System Map

These diagrams separate stable system architecture from delivery workflow and governance. Detailed runbooks live in the linked docs below.

### Architecture

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontSize": "18px", "fontFamily": "Arial, sans-serif", "lineColor": "#334155", "primaryTextColor": "#0f172a"}, "flowchart": {"nodeSpacing": 32, "rankSpacing": 42, "curve": "basis"}}}%%
flowchart LR
  customer["Customer and visitors<br/><br/>Public shop<br/>WordPress admin"]
  operator["Maintainer/operator<br/><br/>GitHub access<br/>Google Cloud access<br/>WordPress access"]

  subgraph wpEnv["Production WordPress environment - DonDominio"]
    storefront["Storefront layer<br/><br/>WordPress pages<br/>WooCommerce shop, cart, checkout"]
    admin["Admin layer<br/><br/>WordPress dashboard<br/>Catalog PDFs console"]
    ownedWp["Owned WordPress artifacts<br/><br/>luciastuy theme<br/>MU plugins: catalog console, GA4 ecommerce, artwork rules"]
    woo["WooCommerce core dependency<br/><br/>Products<br/>Store API<br/>Order and checkout model"]
  end

  subgraph workspaceEnv["Google Workspace environment"]
    appsScript["Apps Script Web App<br/><br/>Queue API<br/>Status API<br/>Review API"]
    sheets["Google Sheets artifacts<br/><br/>Artwork source rows<br/>catalog_jobs<br/>Review state"]
    driveInput["Google Drive input artifacts<br/><br/>_cat images<br/>Logos<br/>Brand assets"]
    driveOutput["Google Drive output artifacts<br/><br/>OBRA/Catalogos PDFs"]
  end

  subgraph cloudEnv["Google Cloud environment"]
    cloudRun["Cloud Run Job<br/><br/>lucia-mybrocorp-catalog-agent<br/>europe-west1"]
    catalogCode["Catalog generator artifacts<br/><br/>Node catalog agent<br/>CSV contract<br/>HTML/CSS PDF renderer<br/>Puppeteer"]
    secrets["Secret Manager dependencies<br/><br/>Agent config<br/>OAuth client<br/>OAuth token"]
    cloudLogs["Cloud Logging<br/><br/>Worker logs<br/>Monitor logs"]
  end

  subgraph analyticsEnv["Analytics environment"]
    siteKit["Site Kit integration<br/><br/>WordPress tag placement"]
    ga4["GA4 property<br/><br/>Traffic<br/>Item events<br/>Checkout and purchase funnel"]
  end

  subgraph localEnv["Local development environment"]
    localWp["Docker WordPress runtime<br/><br/>WooCommerce core<br/>Owned theme and MU plugins"]
    localCatalog["Local catalog tooling<br/><br/>catalog-generator tests<br/>runtime helper tests"]
  end

  customer --> storefront
  operator --> admin
  storefront --> woo
  admin --> woo
  ownedWp --> storefront
  ownedWp --> admin
  admin -->|"server-side token call"| appsScript

  appsScript -->|"queue, status, review"| sheets
  appsScript -->|"starts on demand"| cloudRun
  cloudRun --> catalogCode
  secrets --> cloudRun
  sheets -->|"source rows and queued jobs"| catalogCode
  driveInput -->|"image and brand inputs"| catalogCode
  catalogCode -->|"PDF upload"| driveOutput
  catalogCode -->|"result URL and job status"| sheets
  driveOutput -->|"PDF link"| admin

  ownedWp --> siteKit
  storefront --> siteKit
  siteKit --> ga4
  cloudRun --> cloudLogs

  localWp -. mirrors .-> ownedWp
  localWp -. depends on .-> woo
  localCatalog -. validates .-> catalogCode

  classDef actor fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px
  classDef wordpress fill:#ffedd5,stroke:#c2410c,color:#0f172a,stroke-width:2px
  classDef workspace fill:#ede9fe,stroke:#7c3aed,color:#0f172a,stroke-width:2px
  classDef cloud fill:#ccfbf1,stroke:#0f766e,color:#0f172a,stroke-width:2px
  classDef analytics fill:#fef9c3,stroke:#a16207,color:#0f172a,stroke-width:2px
  classDef local fill:#dbeafe,stroke:#1d4ed8,color:#0f172a,stroke-width:2px

  class customer,operator actor
  class storefront,admin,ownedWp,woo wordpress
  class appsScript,sheets,driveInput,driveOutput workspace
  class cloudRun,catalogCode,secrets,cloudLogs cloud
  class siteKit,ga4 analytics
  class localWp,localCatalog local
```

### Workflow, Governance, And Initiatives

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontSize": "18px", "fontFamily": "Arial, sans-serif", "lineColor": "#334155", "primaryTextColor": "#0f172a"}, "flowchart": {"nodeSpacing": 30, "rankSpacing": 38, "curve": "basis"}}}%%
flowchart LR
  subgraph governance["Governance artifacts"]
    repo["GitHub repo<br/><br/>main<br/>short-lived work branches<br/>reviewed PRs"]
    openspec["OpenSpec workstreams<br/><br/>plan-catalog-commerce-roadmap<br/>configure-shop-business-observability"]
    docs["Operating docs<br/><br/>README<br/>PROJECT_STATUS<br/>deployment and handoff docs"]
  end

  subgraph initiatives["Ongoing initiatives"]
    roadmap["Catalog commerce roadmap<br/><br/>shop theme replacement<br/>checkout readiness<br/>visual baseline"]
    observability["Shop business observability<br/><br/>GA4 evidence<br/>begin_checkout gap<br/>purchase verification"]
    handoff["Customer handoff<br/><br/>customer queues a catalog<br/>opens PDF<br/>reviews job"]
    sourceSync["Source and catalog readiness<br/><br/>_cat image gate<br/>WooCommerce auto-apply disabled"]
  end

  subgraph workflow["Delivery workflow stages"]
    plan["Plan<br/><br/>OpenSpec proposal<br/>design<br/>tasks"]
    slice["Slice<br/><br/>small reversible changes<br/>owned artifacts only"]
    validate["Validate<br/><br/>OpenSpec strict<br/>owned-code tests<br/>catalog tests<br/>secret scan"]
    review["Review<br/><br/>PR review<br/>environment approval<br/>gate decision"]
    deploy["Deploy when approved<br/><br/>Cloud Run catalog worker<br/>owned WordPress code"]
    evidence["Record evidence<br/><br/>status docs<br/>runbook updates<br/>rollback artifacts"]
  end

  repo --> openspec
  openspec --> roadmap
  openspec --> observability
  docs --> handoff
  docs --> sourceSync

  roadmap --> plan
  observability --> plan
  handoff --> plan
  sourceSync --> plan

  plan --> slice
  slice --> validate
  validate --> review
  review --> deploy
  deploy --> evidence
  evidence --> docs
  evidence --> openspec

  classDef governanceFill fill:#dbeafe,stroke:#1d4ed8,color:#0f172a,stroke-width:2px
  classDef initiativeFill fill:#dcfce7,stroke:#15803d,color:#0f172a,stroke-width:2px
  classDef workflowFill fill:#fee2e2,stroke:#b91c1c,color:#0f172a,stroke-width:2px

  class repo,openspec,docs governanceFill
  class roadmap,observability,handoff,sourceSync initiativeFill
  class plan,slice,validate,review,deploy,evidence workflowFill
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
