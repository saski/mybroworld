# Customer Testing And Handoff Guide

Use this guide when the customer needs to test the live online shop and the WordPress catalog PDF console from her own accounts.

## Current Readiness

- The production WordPress shop is live at `https://www.luciastuy.com/`.
- The canonical artwork products have been created in production WooCommerce with images.
- The catalog PDF console is deployed in production WordPress.
- New production catalog jobs now target the on-demand Cloud Run `lucia-mybrocorp` worker authorized as `mybrocorp@gmail.com`.
- Customer-operated catalog generation is complete only after that worker completes a job queued from the customer's mybro WordPress account and the customer can open/review the resulting Drive PDF.

## Accounts Needed

- WordPress: the customer's mybro account on `https://www.luciastuy.com/wp-admin/`.
- Google: `mybrocorp@gmail.com`.
- Drive: access to the configured catalog output folder.
- Optional for diagnosis: access to the source spreadsheet that contains `catalog_jobs` and `catalog_profiles`.

## Online Shop Test

Ask the customer to test from a normal browser session, preferably in a private window first so the public buyer experience is visible.

1. Open `https://www.luciastuy.com/`.
2. Open `https://www.luciastuy.com/shop/`.
3. Confirm the shop shows artwork products, not demo furniture or unrelated products.
4. Open three artwork product pages.
5. For each product page, confirm:
   - the artwork image loads
   - the primary image shows the actual artwork and is not visibly cropped in a misleading way
   - the thumbnail and product-detail image look sharp enough for a buyer to inspect the work
   - the title is correct
   - the price is correct when present
   - the availability label matches the expected status
   - there are no visible broken layout sections
6. Add one available artwork to the cart.
7. Open `https://www.luciastuy.com/cart/`.
8. Confirm the product, price, and quantity are correct.
9. Open `https://www.luciastuy.com/checkout/`.
10. Confirm the checkout page loads without a critical error.
11. Stop before placing a real paid order unless a deliberate production checkout test has been approved.

Record every issue with:

- page URL
- product title or artwork id
- expected result
- actual result
- screenshot if possible

## Catalog PDF Console Test

Run this only after the catalog worker is confirmed ready. For portable customer validation, that worker must be the Cloud Run `lucia-mybrocorp` job authorized as `mybrocorp@gmail.com`.

1. Log into `https://www.luciastuy.com/wp-admin/` with the customer's mybro WordPress account.
2. Open `Catalog PDFs` from the WordPress admin menu, or go directly to `https://www.luciastuy.com/wp-admin/admin.php?page=lucia-catalog-console`.
3. Confirm the page loads and shows:
   - a catalog title field
   - a scope selector
   - a `Generate PDF` button
   - a recent jobs table
4. Keep the default scope unless a multi-year catalog test is intentional.
5. Enter a recognizable test title, for example `Customer test catalog YYYY-MM-DD`.
6. Click `Generate PDF`.
7. Confirm the job appears in the recent jobs table as `queued` or another in-progress state.
8. Wait for the worker to complete the job.
9. Confirm the recent jobs table shows:
   - `completed` status
   - an `Open PDF` link
   - review actions
10. Open the PDF link and confirm the file is visible from the customer's browser session.
11. Return to WordPress and click either `Approve` or `Needs changes`.
12. Reload the page.
13. Confirm the chosen review state is still visible.

Record the job id and the resulting Drive URL.

## Portable Catalog Completion Gate

Do not mark the handoff complete until all checks below are true:

1. Google Cloud project `mybroworld-catalog-260501` remains the Nacho-managed, Nacho-billed production runtime project.
2. The Cloud Run worker secrets are stored in Secret Manager and are not committed to git.
3. The Cloud Run `lucia-mybrocorp` job is authorized as `mybrocorp@gmail.com`.
4. The worker rejects any other configured Google identity before claiming jobs.
5. Apps Script starts the worker job immediately when the customer clicks `Generate PDF`.
6. The worker claims `lucia-mybrocorp` jobs and ignores `nacho-saski` jobs.
7. The local `nacho-saski` LaunchAgent is stopped or irrelevant during the validation run.
8. The Drive output folder is writable by `mybrocorp@gmail.com`.
9. The customer can open the completed Drive PDF from her own browser session.
10. The completed `catalog_jobs` row records the customer WordPress identity.

## Pending Work Plan

1. Customer account access check
   - Verify the mybro WordPress account can access `wp-admin`.
   - Verify it can see the `Catalog PDFs` menu.
   - If it cannot, adjust `LUCIA_CATALOG_CONSOLE_CAPABILITY` or the user role/capabilities.

2. Cloud Run worker setup
   - Status: complete as of 2026-05-02.
   - Use Google Cloud project `mybroworld-catalog-260501`.
   - Keep billing under Nacho's billing account.
   - Package the catalog worker for Cloud Run with Node, dependencies, and Chromium/Puppeteer runtime support.
   - Store worker config, OAuth client JSON, and `mybrocorp@gmail.com` OAuth token material in Secret Manager.
   - Ensure the container copies read-only secrets into a writable runtime path before OAuth refresh.

3. Worker on-demand trigger and validation
   - Status: production Apps Script trigger validated by direct token-authenticated job as of 2026-05-03; WordPress UI customer-account validation is still pending.
   - Create the Cloud Run Job for `lucia-mybrocorp`.
   - Configure Apps Script trigger properties for the Cloud Run Job.
   - Grant `roles/run.invoker` on the job to the account that executes the Apps Script Web App.
   - Pause the legacy worker polling scheduler after the Apps Script trigger is deployed and validated.
   - Configure `profileKey = lucia-mybrocorp`.
   - Configure `googleAccountEmail = mybrocorp@gmail.com`.
   - Add the production spreadsheet id to `watchSpreadsheetIds`.
   - Authorize the worker with `mybrocorp@gmail.com`.
   - Run the job manually once before relying on the on-demand trigger.
   - Production evidence: Apps Script Web App deployment `AKfycbz9C2jMtj42LWgWFl1duHEFUiGqs0b6svz0zgcOJjeSQtBUl-8j_iTH7S2iAUIAKVBJ` version 6 queued `catalog_20260503_100246_1dd2`, started Cloud Run execution `lucia-mybrocorp-catalog-agent-s22ln`, and completed a 14-artwork PDF as `mybrocorp@gmail.com`.

4. Customer catalog validation
   - Status: pending.
   - Queue one job from the customer's mybro WordPress account.
   - Complete it through the Cloud Run `lucia-mybrocorp` worker.
   - Verify Drive access and persisted review state.
   - Record the job id and Drive URL in the rollout notes.

5. Shop validation
   - Run the online shop test above.
   - Triage any content, image, price, status, cart, or checkout issue before inviting external buyers.

6. Optional production cleanup
   - Decide whether to clean up unmanaged legacy/demo products.
   - Use backup id `production-db-export-20260501-195148`.
   - Run cleanup only as a separate approved action with `--allow-unmanaged-cleanup`.
