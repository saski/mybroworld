import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateInteractionReport,
  requiredCheckoutFieldIds,
} from './woo-interaction-baseline.mjs';

test('evaluateInteractionReport accepts a healthy non-mutating storefront interaction report', () => {
  const report = {
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 2,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 4,
      sortControlCount: 1,
    },
  };

  assert.deepEqual(evaluateInteractionReport(report), []);
});

test('evaluateInteractionReport reports shop and product typography that does not match the portfolio rhythm', () => {
  const failures = evaluateInteractionReport({
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 64,
        textTransform: 'none',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
      productTitleStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  });

  assert.deepEqual(failures, [
    'shop_titles_not_uppercase',
    'shop_titles_missing_tracking',
    'shop_page_title_not_uppercase',
    'shop_page_title_missing_tracking',
    'product_title_not_uppercase',
    'product_title_too_large',
  ]);
});

test('evaluateInteractionReport reports cart and checkout typography that does not match the portfolio rhythm', () => {
  const failures = evaluateInteractionReport({
    cart: {
      checkoutButtonStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
      checkoutLinkCount: 1,
      lineItemCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
      totalsTitleStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
    },
    checkout: {
      pageTitleStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
      placeOrderButtonStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
      presentFieldIds: requiredCheckoutFieldIds(),
      sectionTitleStyle: {
        letterSpacingPx: 0,
        textTransform: 'none',
      },
    },
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  }, { expectCartMutation: true });

  assert.deepEqual(failures, [
    'cart_page_title_not_uppercase',
    'cart_page_title_missing_tracking',
    'cart_totals_title_not_uppercase',
    'cart_totals_title_missing_tracking',
    'cart_checkout_button_not_uppercase',
    'cart_checkout_button_missing_tracking',
    'checkout_page_title_not_uppercase',
    'checkout_page_title_missing_tracking',
    'checkout_section_title_not_uppercase',
    'checkout_section_title_missing_tracking',
    'checkout_place_order_button_not_uppercase',
    'checkout_place_order_button_missing_tracking',
  ]);
});

test('evaluateInteractionReport reports a missing mobile menu toggle', () => {
  const failures = evaluateInteractionReport({
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: false, toggleCount: 0 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  });

  assert.deepEqual(failures, ['missing_mobile_menu_toggle']);
});

test('evaluateInteractionReport reports a mobile menu toggle that does not open', () => {
  const failures = evaluateInteractionReport({
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: false, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  });

  assert.deepEqual(failures, ['mobile_menu_toggle_did_not_open']);
});

test('evaluateInteractionReport reports a missing header logo image', () => {
  const failures = evaluateInteractionReport({
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 0,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  });

  assert.deepEqual(failures, ['missing_header_logo_image']);
});

test('evaluateInteractionReport reports missing critical shop affordances', () => {
  const failures = evaluateInteractionReport({
    navigation: {
      cartLinkCount: 0,
      linkCount: 0,
      mobileMenu: { opensOnToggle: false, toggleCount: 0 },
    },
    product: { primaryImageCount: 0, zoomTriggerCount: 0 },
    shop: {
      addToCartActionCount: 0,
      productLinkCount: 0,
      sortControlCount: 0,
    },
  });

  assert.deepEqual(failures, [
    'missing_navigation_links',
    'missing_header_cart_link',
    'missing_header_logo_image',
    'missing_mobile_menu_toggle',
    'missing_shop_product_links',
    'missing_shop_sort_control',
    'missing_shop_add_to_cart_actions',
    'shop_titles_not_uppercase',
    'shop_titles_missing_tracking',
    'shop_page_title_not_uppercase',
    'shop_page_title_missing_tracking',
    'missing_product_primary_image',
    'missing_visible_product_primary_image',
    'missing_product_zoom_trigger',
    'product_title_not_uppercase',
    'product_title_too_large',
  ]);
});

test('evaluateInteractionReport checks cart and checkout only when mutation is expected', () => {
  const report = {
    cart: {
      checkoutButtonStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      checkoutLinkCount: 0,
      lineItemCount: 0,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      totalsTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
    },
    checkout: {
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      placeOrderButtonStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      presentFieldIds: ['billing_first_name'],
      sectionTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
    },
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  };

  assert.deepEqual(evaluateInteractionReport(report), []);
  assert.deepEqual(evaluateInteractionReport(report, { expectCartMutation: true }), [
    'cart_did_not_receive_item',
    'missing_checkout_link',
    'missing_checkout_field:billing_last_name',
    'missing_checkout_field:billing_address_1',
    'missing_checkout_field:billing_city',
    'missing_checkout_field:billing_postcode',
    'missing_checkout_field:billing_phone',
    'missing_checkout_field:billing_email',
  ]);
});

test('evaluateInteractionReport requires an available payment method only for buyer-ready checks', () => {
  const report = {
    checkout: {
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      paymentMethodCount: 0,
      placeOrderButtonStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      presentFieldIds: requiredCheckoutFieldIds(),
      sectionTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
    },
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  };

  assert.deepEqual(evaluateInteractionReport(report), []);
  assert.deepEqual(evaluateInteractionReport(report, { requirePaymentMethod: true }), [
    'missing_checkout_payment_method',
  ]);
});

test('evaluateInteractionReport requires home identity signals only when requested', () => {
  const report = {
    homeIdentity: {
      footerIdentityTextCount: 1,
      footerInstagramLinkCount: 1,
      heroVideoCount: 1,
    },
    navigation: {
      cartLinkCount: 1,
      linkCount: 3,
      logoImageCount: 1,
      mobileMenu: { opensOnToggle: true, toggleCount: 1 },
    },
    product: {
      primaryImageCount: 1,
      primaryImageVisibleCount: 1,
      titleStyle: {
        fontSizePx: 26,
        textTransform: 'uppercase',
      },
      zoomTriggerCount: 1,
    },
    shop: {
      addToCartActionCount: 1,
      pageTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productTitleStyle: {
        letterSpacingPx: 2,
        textTransform: 'uppercase',
      },
      productLinkCount: 1,
      sortControlCount: 1,
    },
  };

  assert.deepEqual(evaluateInteractionReport(report), []);
  assert.deepEqual(evaluateInteractionReport({
    ...report,
    homeIdentity: {
      footerIdentityTextCount: 0,
      footerInstagramLinkCount: 0,
      heroVideoCount: 0,
    },
  }, { requireHomeIdentity: true }), [
    'missing_home_video_identity',
    'missing_footer_instagram_link',
    'missing_footer_identity_text',
  ]);
});

test('requiredCheckoutFieldIds captures the minimum buyer data needed for fulfillment', () => {
  assert.deepEqual(requiredCheckoutFieldIds(), [
    'billing_first_name',
    'billing_last_name',
    'billing_address_1',
    'billing_city',
    'billing_postcode',
    'billing_phone',
    'billing_email',
  ]);
});
