(function (window, document) {
  'use strict';

  var config = window.luciaGa4Ecommerce || {};
  var consentStorageKey = config.consentStorageKey || 'luciastuy_analytics_consent';
  var initialEventsSent = false;

  function hasAnalyticsConsent() {
    try {
      return window.localStorage && window.localStorage.getItem(consentStorageKey) === 'granted';
    } catch (error) {
      return false;
    }
  }

  function productItems() {
    return config.products && typeof config.products === 'object' ? config.products : {};
  }

  function eventItems() {
    return Array.isArray(config.events) ? config.events : [];
  }

  function productIdFromElement(element) {
    if (!element) {
      return '';
    }

    var dataElement = element.closest('[data-product_id]');
    if (dataElement && dataElement.getAttribute('data-product_id')) {
      return dataElement.getAttribute('data-product_id');
    }

    var productElement = element.closest('[id^="product-"], .product');
    if (!productElement) {
      return '';
    }

    var match = (productElement.id || '').match(/^product-(\d+)$/);
    return match ? match[1] : '';
  }

  function itemForElement(element) {
    var productId = productIdFromElement(element);
    var products = productItems();

    return productId && products[productId] ? products[productId] : null;
  }

  function valueForItem(item) {
    if (!item || typeof item.price !== 'number') {
      return null;
    }

    var quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    return item.price * quantity;
  }

  function itemEventParams(item) {
    var params = {
      items: [item]
    };
    var value = valueForItem(item);

    if (value !== null) {
      params.currency = config.currency || 'EUR';
      params.value = value;
    }

    if (item.item_list_id) {
      params.item_list_id = item.item_list_id;
    }

    if (item.item_list_name) {
      params.item_list_name = item.item_list_name;
    }

    return params;
  }

  function shouldSkipPurchase(eventName, params) {
    if (eventName !== 'purchase' || !params || !params.transaction_id) {
      return false;
    }

    var storageKey = 'lucia_ga4_purchase_' + params.transaction_id;
    try {
      if (window.localStorage && window.localStorage.getItem(storageKey) === 'sent') {
        return true;
      }

      if (window.localStorage) {
        window.localStorage.setItem(storageKey, 'sent');
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  function sendEvent(eventName, params) {
    if (!hasAnalyticsConsent() || typeof window.gtag !== 'function') {
      return;
    }

    if (shouldSkipPurchase(eventName, params)) {
      return;
    }

    window.gtag('event', eventName, params || {});
  }

  function sendInitialEvents() {
    if (initialEventsSent || !hasAnalyticsConsent()) {
      return;
    }

    initialEventsSent = true;
    eventItems().forEach(function (eventConfig) {
      if (!eventConfig || !eventConfig.name) {
        return;
      }

      sendEvent(eventConfig.name, eventConfig.params || {});
    });
  }

  function setupSelectItemTracking() {
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a') : null;
      if (!link || link.matches('.add_to_cart_button, .remove, .remove_from_cart_button')) {
        return;
      }

      var item = itemForElement(link);
      if (!item) {
        return;
      }

      sendEvent('select_item', itemEventParams(item));
    });
  }

  function setupAddToCartTracking() {
    if (!window.jQuery || !window.jQuery(document.body).on) {
      return;
    }

    window.jQuery(document.body).on('added_to_cart', function (event, fragments, cartHash, button) {
      var element = button && button.length ? button[0] : null;
      var item = itemForElement(element);
      if (!item) {
        return;
      }

      sendEvent('add_to_cart', itemEventParams(item));
    });
  }

  function setupRemoveFromCartTracking() {
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a.remove, .remove_from_cart_button') : null;
      if (!link) {
        return;
      }

      var item = itemForElement(link);
      if (!item) {
        return;
      }

      sendEvent('remove_from_cart', itemEventParams(item));
    });
  }

  function setupTracking() {
    sendInitialEvents();
    setupSelectItemTracking();
    setupAddToCartTracking();
    setupRemoveFromCartTracking();
  }

  document.addEventListener('lucia:analytics-consent', sendInitialEvents);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTracking);
    return;
  }

  setupTracking();
}(window, document));
