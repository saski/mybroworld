(function () {
  function setupHeaderNavigation() {
    var actions = document.querySelector('.site-actions');
    var toggle = document.querySelector('.site-menu-toggle');

    if (!actions || !toggle) {
      return;
    }

    var navigationId = toggle.getAttribute('aria-controls');
    var navigation = navigationId ? document.getElementById(navigationId) : null;

    if (!navigation) {
      return;
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      actions.classList.toggle('is-navigation-open', !isOpen);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeaderNavigation);
    return;
  }

  setupHeaderNavigation();
}());
