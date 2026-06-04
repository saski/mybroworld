## ADDED Requirements

### Requirement: Home hero uses the live video identity
The owned `luciastuy` theme SHALL render a production-like home hero that uses the provided Lucia Astuy YouTube video reference as the primary visual identity element on the front page.

#### Scenario: Front page renders video hero
- **GIVEN** the `luciastuy` theme is active
- **WHEN** a visitor opens the front page
- **THEN** the first customer-facing visual section includes the YouTube video reference `E4_s9_Ky91E` or an approved privacy-preserving equivalent embed for the same video

#### Scenario: Video failure keeps page usable
- **GIVEN** the video embed fails, is blocked, or cannot autoplay
- **WHEN** a visitor opens the front page
- **THEN** the page still shows the Lucia Astuy identity and the navigation remains usable

### Requirement: Logo is overlaid on the hero
The owned `luciastuy` theme SHALL display the Lucia Astuy graphic logo over the home hero using the production logo reference or a locally versioned equivalent asset.

#### Scenario: Hero logo overlay is visible
- **GIVEN** the front page renders the home hero
- **WHEN** the hero is visible on desktop or mobile
- **THEN** the Lucia Astuy graphic logo is visible above the video layer and links to the home page

#### Scenario: Logo asset has an owned fallback
- **GIVEN** the production media URL is unavailable
- **WHEN** the front page renders
- **THEN** the theme uses a locally controlled fallback logo or a text fallback without breaking layout

#### Scenario: Transparent logo asset is used
- **GIVEN** the home hero logo is rendered
- **WHEN** the logo image source is inspected
- **THEN** the active logo source is `https://www.luciastuy.com/wp-content/uploads/2023/09/logo_oldschool_transp.png` or a pixel-equivalent local transparent-background asset

### Requirement: Typography follows the live identity rhythm
The owned `luciastuy` theme SHALL align its typography decisions with the live Lucia Astuy identity for navigation, visible headings, gallery/product labels, footer text, and commerce calls to action.

#### Scenario: Typography baseline is captured before styling changes
- **GIVEN** the identity adjustment work begins
- **WHEN** typography changes are planned
- **THEN** the implementation records live and local baseline evidence for font family, font size, letter spacing, text transform, and heading visibility on the affected surfaces

#### Scenario: Navigation retains sparse uppercase treatment
- **GIVEN** the owned theme renders the primary navigation
- **WHEN** a visitor views desktop or mobile navigation
- **THEN** navigation labels use the approved sparse uppercase and letter-spaced visual rhythm

### Requirement: Fonts match the original theme
The owned `luciastuy` theme SHALL use the same font family, font loading strategy, and font fallback behavior as the original live theme on affected public identity surfaces unless an explicit exception is documented and accepted.

#### Scenario: Original font source is captured
- **GIVEN** the identity adjustment work begins
- **WHEN** the original live theme is inspected
- **THEN** the implementation records the detected font family, font source, loaded font files when visible, and fallback stack for the affected public surfaces

#### Scenario: Owned theme uses matching fonts
- **GIVEN** font parity has been approved for implementation
- **WHEN** the owned theme renders the home, shop, product, cart, checkout, and footer surfaces
- **THEN** the computed font family and fallback behavior match the original live theme or the approved exception record

### Requirement: User interactions mimic the original theme
The owned `luciastuy` theme SHALL mimic the original live theme's customer-facing interaction behavior for the header, hero, logo, navigation, gallery/product entry points, cart affordance, responsive menu, hover states, focus states, and footer links.

#### Scenario: Interaction baseline records original behavior
- **GIVEN** the original live theme is available for comparison
- **WHEN** interaction parity work begins
- **THEN** the implementation records the original behavior for header links, logo home link, video controls or autoplay behavior, navigation hover/focus states, gallery/product clicks, cart entry point, mobile menu behavior, and footer links

#### Scenario: Owned theme interaction replay matches original behavior
- **GIVEN** the owned theme identity changes are implemented
- **WHEN** the local interaction baseline replays the original-theme behaviors
- **THEN** the owned theme exposes equivalent customer-facing behavior without depending on Elementor, WPBakery, Slider Revolution, Visual Portfolio, or Glacier scripts

#### Scenario: Hero playback controls visually match
- **GIVEN** the front-page hero video is visible
- **WHEN** a visitor views playback controls in desktop or mobile
- **THEN** control visibility, control placement, and pause/play affordance match the original theme behavior or an accepted parity exception

### Requirement: Home headings are intentional
The owned `luciastuy` theme SHALL avoid exposing scaffold-like home headings that are not part of the approved Lucia Astuy visual identity while preserving semantic structure for accessibility.

#### Scenario: Scaffold heading is not visually dominant
- **GIVEN** the front page content includes a default page or gallery heading
- **WHEN** a visitor opens the front page
- **THEN** the heading is either removed from the visual layout, visually restrained, or replaced with an approved customer-facing heading treatment

#### Scenario: Semantic heading remains available when needed
- **GIVEN** a heading is required for document structure or assistive technology
- **WHEN** the heading is not intended to be visually prominent
- **THEN** the theme preserves an accessible semantic heading without exposing a scaffold-like visual label

### Requirement: Footer matches the live minimal footer
The owned `luciastuy` theme SHALL render a minimal footer consistent with the live Lucia Astuy site, including the approved social link and compact copyright identity line.

#### Scenario: Footer exposes social link and identity line
- **GIVEN** a visitor reaches the bottom of the page
- **WHEN** the footer is visible
- **THEN** the footer includes the same approved Instagram link, compact Lucia Astuy copyright identity line, typography, spacing, alignment, and visual hierarchy as the original live theme

#### Scenario: Footer identity line includes heart accent
- **GIVEN** the footer identity line is rendered
- **WHEN** a visitor reads the copyright row
- **THEN** the text pattern and red heart accent match the original live theme presentation

#### Scenario: Footer does not add unapproved support clutter
- **GIVEN** the footer is rendered on shop, product, cart, or checkout pages
- **WHEN** a visitor reviews the footer
- **THEN** the footer does not introduce unapproved plugin badges, builder artifacts, or broad support content that is absent from the approved identity

#### Scenario: Footer interactions match the original theme
- **GIVEN** the footer is visible on desktop or mobile
- **WHEN** a visitor hovers, focuses, or activates the footer links
- **THEN** the link behavior and visible states match the original live theme or an accepted simplification record

### Requirement: Portfolio hover labels match original typography
The owned `luciastuy` theme SHALL match original-theme hover label typography and placement on portfolio/product image overlays.

#### Scenario: Hover title typography parity
- **GIVEN** a visitor hovers a product/portfolio tile
- **WHEN** the overlay title is visible
- **THEN** the font family, size, weight, casing, letter spacing, and alignment match the original theme treatment

#### Scenario: Hover overlay contrast parity
- **GIVEN** an overlay title is visible over an image
- **WHEN** the overlay is rendered
- **THEN** background darkness and text contrast match the original theme readability level

### Requirement: Action buttons match original style
The owned `luciastuy` theme SHALL match original-theme button styling for primary actions and load-more controls.

#### Scenario: Load-more button parity
- **GIVEN** the grid load-more button is visible
- **WHEN** a visitor views it on desktop or mobile
- **THEN** button dimensions, border radius, color, text style, casing, and spacing match the original theme

#### Scenario: Commerce button parity
- **GIVEN** shop/product/cart/checkout action buttons are visible
- **WHEN** a visitor hovers or focuses those buttons
- **THEN** default and interactive button states match original-theme style or an accepted parity exception

### Requirement: Identity changes preserve commerce behavior
The owned `luciastuy` theme SHALL preserve existing WooCommerce navigation, product, cart, checkout, and buyer-data behavior while applying the live identity adjustments.

#### Scenario: Commerce interaction baseline still passes
- **GIVEN** the hero, logo, typography, footer, and heading adjustments are implemented
- **WHEN** the local interaction baseline runs against the owned theme
- **THEN** navigation, product links, add-to-cart controls, cart state, checkout link, payment-method visibility when required, and buyer field visibility continue to pass

#### Scenario: No new paid visual dependency is introduced
- **GIVEN** the identity work is complete
- **WHEN** the implementation is reviewed
- **THEN** the change does not add Elementor, WPBakery, paid/freemium visual plugins, gallery plugins, or broad visual dependencies

### Requirement: Migration records removable Glacier-era dependencies
The project SHALL record which Glacier-era plugins, bundled extensions, builder dependencies, and theme helpers become deletion candidates after the owned `luciastuy` migration is accepted, without deleting or deactivating them as part of this identity change.

#### Scenario: Post-migration cleanup note is created
- **GIVEN** the owned theme identity is accepted as a replacement candidate for `Glacier`
- **WHEN** the migration cleanup review runs
- **THEN** the project records candidate dependencies, evidence, affected surfaces, rollback notes, and the required one-plugin-at-a-time validation path in the existing plugin inventory or removal log artifacts

#### Scenario: Visual parity does not imply safe deletion
- **GIVEN** a Glacier-era plugin, bundled extension, builder dependency, or theme helper is no longer needed for the customer-facing owned theme presentation
- **WHEN** it is listed as a deletion candidate
- **THEN** it remains only a candidate until backup, deactivation, smoke validation, admin review, and rollback criteria pass under the existing plugin safety process
