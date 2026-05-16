(function portfolioItemLightbox() {
  const lightbox = document.querySelector('[data-portfolio-lightbox]');
  if (!lightbox) {
    return;
  }

  const image = lightbox.querySelector('[data-portfolio-lightbox-image]');
  const triggers = document.querySelectorAll('[data-portfolio-image-trigger]');
  const closeTargets = lightbox.querySelectorAll('[data-portfolio-lightbox-close]');
  let lastFocusedElement = null;

  function openLightbox(trigger) {
    const url = trigger.getAttribute('data-full-url');
    if (!url || !image) {
      return;
    }

    lastFocusedElement = trigger;
    image.src = url;
    image.alt = trigger.getAttribute('data-image-alt') || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.luciastuy-portfolio-lightbox__close')?.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (image) {
      image.removeAttribute('src');
      image.alt = '';
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openLightbox(trigger));
  });

  closeTargets.forEach((target) => {
    target.addEventListener('click', closeLightbox);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) {
      event.preventDefault();
      closeLightbox();
      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    }
  });
})();
