<?php

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

luciastuy_render_header();
?>
<main class="site-main site-catalogo">
    <article class="site-catalogo__panel">
        <h1 class="site-page-title"><?php the_title(); ?></h1>

        <section class="site-catalogo__obra">
            <h2 class="site-catalogo__heading"><?php esc_html_e('Obra disponible', 'luciastuy'); ?></h2>
            <p class="site-catalogo__lede">
                <?php
                echo esc_html__(
                    'Para ver la obra en persona puedes concertar una cita para visitar mi estudio en el centro de Madrid. Puedes contactar por email, por teléfono o vía WhatsApp.',
                    'luciastuy'
                );
                ?>
            </p>

            <dl class="site-catalogo__contact">
                <div class="site-catalogo__contact-row">
                    <dt class="site-catalogo__contact-label"><?php esc_html_e('Email', 'luciastuy'); ?></dt>
                    <dd class="site-catalogo__contact-value">
                        <a href="mailto:hola@luciastuy.com">hola@luciastuy.com</a>
                    </dd>
                </div>
                <div class="site-catalogo__contact-row">
                    <dt class="site-catalogo__contact-label"><?php esc_html_e('Teléfono', 'luciastuy'); ?></dt>
                    <dd class="site-catalogo__contact-value">
                        <a href="tel:+34635166253">+34 635.166.253</a>
                    </dd>
                </div>
                <div class="site-catalogo__contact-row">
                    <dt class="site-catalogo__contact-label"><?php esc_html_e('Sígueme en Instagram', 'luciastuy'); ?></dt>
                    <dd class="site-catalogo__contact-value">
                        <a href="https://www.instagram.com/luciastuy/" target="_blank" rel="noopener noreferrer">@luciastuy</a>
                    </dd>
                </div>
            </dl>
        </section>
    </article>
</main>
<?php
luciastuy_render_footer();
