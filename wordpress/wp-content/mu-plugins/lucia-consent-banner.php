<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

function lucia_consent_banner_storage_key(): string
{
    return 'luciastuy_analytics_consent';
}

function lucia_consent_banner_default_state(): array
{
    return [
        'ad_storage' => 'denied',
        'ad_user_data' => 'denied',
        'ad_personalization' => 'denied',
        'analytics_storage' => 'denied',
    ];
}

function lucia_consent_banner_state_for_choice(string $choice): array
{
    $state = lucia_consent_banner_default_state();

    if ($choice === 'granted') {
        $state['analytics_storage'] = 'granted';
    }

    return $state;
}

function lucia_consent_banner_asset_version(string $relativePath): string
{
    $assetPath = __DIR__ . '/' . ltrim($relativePath, '/');

    return file_exists($assetPath) ? (string) filemtime($assetPath) : '1';
}

function lucia_consent_banner_enqueue_assets(): void
{
    wp_enqueue_style(
        'lucia-consent-banner',
        plugins_url('assets/lucia-consent-banner.css', __FILE__),
        [],
        lucia_consent_banner_asset_version('assets/lucia-consent-banner.css'),
    );

    wp_enqueue_script(
        'lucia-consent-banner',
        plugins_url('assets/lucia-consent-banner.js', __FILE__),
        [],
        lucia_consent_banner_asset_version('assets/lucia-consent-banner.js'),
        true,
    );
}
add_action('wp_enqueue_scripts', 'lucia_consent_banner_enqueue_assets');

function lucia_consent_banner_render_default_script(): void
{
    $defaultState = lucia_consent_banner_default_state();
    $storageKey = lucia_consent_banner_storage_key();
    ?>
    <script id="lucia-consent-default">
    (function (window) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

      var storageKey = <?php echo wp_json_encode($storageKey); ?>;
      var consentState = <?php echo wp_json_encode($defaultState); ?>;

      try {
        var storedChoice = window.localStorage ? window.localStorage.getItem(storageKey) : null;
        if (storedChoice === 'granted') {
          consentState.analytics_storage = 'granted';
        }
      } catch (error) {
        consentState.analytics_storage = 'denied';
      }

      consentState.wait_for_update = 500;
      window.gtag('consent', 'default', consentState);
    }(window));
    </script>
    <?php
}
add_action('wp_head', 'lucia_consent_banner_render_default_script', 0);

function lucia_consent_banner_render_banner(): void
{
    ?>
    <section class="lucia-consent-banner" data-lucia-consent-banner hidden aria-label="<?php echo esc_attr('Analytics consent'); ?>">
        <p class="lucia-consent-banner__text">
            <?php echo esc_html('We use simple analytics to understand visits and improve the shop. Advertising cookies stay off.'); ?>
        </p>
        <div class="lucia-consent-banner__actions">
            <button class="lucia-consent-banner__button lucia-consent-banner__button--secondary" type="button" data-consent-choice="denied">
                <?php echo esc_html('Reject'); ?>
            </button>
            <button class="lucia-consent-banner__button lucia-consent-banner__button--primary" type="button" data-consent-choice="granted">
                <?php echo esc_html('Accept analytics'); ?>
            </button>
        </div>
    </section>
    <?php
}
add_action('wp_footer', 'lucia_consent_banner_render_banner', 20);
