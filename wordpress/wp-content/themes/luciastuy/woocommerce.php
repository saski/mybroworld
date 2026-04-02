<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

luciastuy_render_header();
?>
<main class="site-main">
    <?php
    if (function_exists('woocommerce_content')) {
        woocommerce_content();
    }
    ?>
</main>
<?php
luciastuy_render_footer();
