(function (window, document) {
  'use strict';

  var storageKey = 'luciastuy_analytics_consent';

  function consentState(choice) {
    return {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: choice === 'granted' ? 'granted' : 'denied'
    };
  }

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
  }

  function getStoredChoice() {
    try {
      return window.localStorage ? window.localStorage.getItem(storageKey) : null;
    } catch (error) {
      return null;
    }
  }

  function storeChoice(choice) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(storageKey, choice);
      }
    } catch (error) {
      return;
    }
  }

  function applyChoice(choice) {
    ensureGtag();
    window.gtag('consent', 'update', consentState(choice));
    document.documentElement.setAttribute('data-lucia-analytics-consent', choice);

    try {
      document.dispatchEvent(new CustomEvent('lucia:analytics-consent', {
        detail: { choice: choice }
      }));
    } catch (error) {
      return;
    }
  }

  function setupConsentBanner() {
    var banner = document.querySelector('[data-lucia-consent-banner]');
    var storedChoice = getStoredChoice();

    if (storedChoice === 'granted' || storedChoice === 'denied') {
      applyChoice(storedChoice);
      return;
    }

    if (!banner) {
      return;
    }

    banner.hidden = false;
    banner.addEventListener('click', function (event) {
      var target = event.target;

      if (!target || !target.matches('[data-consent-choice]')) {
        return;
      }

      var choice = target.getAttribute('data-consent-choice') === 'granted' ? 'granted' : 'denied';
      storeChoice(choice);
      applyChoice(choice);
      banner.hidden = true;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupConsentBanner);
    return;
  }

  setupConsentBanner();
}(window, document));
