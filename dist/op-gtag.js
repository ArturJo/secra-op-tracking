/**
 * SECRA OP Tracking – Google Analytics 4 (gtag) Integration
 * ---------------------------------------------------------
 * Modern GA4 implementation that listens to SECRA OP hooks and sends
 * GA4-native events via gtag('event', ...). Use this when GA4 is loaded
 * directly with the gtag.js snippet (not via Google Tag Manager).
 *
 * @version v2.1.7
 * @buildDate 2026-05-15 12:52:27 UTC
 */

// Initialize globals early (no need to wait for DOMContentLoaded)
window.secra_op_client = window.secra_op_client || {};
window.secra_op_client.tracking = window.secra_op_client.tracking || {};
window.secra_op_client.tracking.search = window.secra_op_client.tracking.search || {};
window.secra_op_client.tracking.object = window.secra_op_client.tracking.object || {};
window.secra_op_client.tracking.booking = window.secra_op_client.tracking.booking || {};
// Optional debug flag to control console logging (defaults to false)
window.secra_op_client.tracking.debug = (typeof window.secra_op_client.tracking.debug === 'boolean')
    ? window.secra_op_client.tracking.debug
    : false;

// Utility: safe gtag call with graceful fallback
const sendGtagEvent = (eventName, params) => {
    const debug = !!(window && window.secra_op_client && window.secra_op_client.tracking && window.secra_op_client.tracking.debug);
    if (typeof window.gtag !== 'function') {
        if (debug && window && window.console && typeof window.console.warn === 'function') {
            console.warn('[SECRA-OP][gtag] gtag() is not available — event skipped.\nHinweis/Note: Laden Sie das GA4 gtag-Snippet oder schalten Sie Debug aus. Event:', eventName, params);
        }
        return;
    }
    try {
        window.gtag('event', eventName, params || {});
    } catch (e) {
        if (debug && window && window.console && typeof window.console.warn === 'function') {
            console.warn('[SECRA-OP][gtag] Failed to send event (non-fatal diagnostic)', eventName, e);
        }
    }
};

// Custom event: object view (holiday accommodation)
const sendObjectView = (mod, event, data) => {
    if (!data || !data.ObjMetaNr) return;

    const params = {
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    };

    sendGtagEvent('secra_op_object_view', params);
};

// Custom event: booking success (holiday accommodation)
const sendBookingSuccess = (mod, event, data) => {
    if (!data || !data.ObjMetaNr || !data.BuchungNr) return;

    // Parse German-formatted price string (e.g. "1.234,56 €" → 1234.56)
    // OP delivers price as a localized display string: thousand-sep='.', decimal-sep=','
    const rawPrice = typeof data.price === 'string'
        ? data.price.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
        : data.price;
    const parsedValue = parseFloat(rawPrice);
    const finalValue = Number.isFinite(parsedValue) ? parsedValue : 0;

    // Debug warning if price is missing or invalid
    if (finalValue === 0 && window.secra_op_client.tracking.debug) {
        console.warn('[SECRA-OP] Booking ohne gültigen Preis:', data);
    }

    const params = {
        object_id: String(data.ObjMetaNr),
        transaction_id: String(data.BuchungNr),
        value: finalValue,
        currency: 'EUR',
        content_type: 'vacation_rental'
    };

    sendGtagEvent('secra_op_object_booking', params);

    // Standard GA4 purchase event — populates "Gesamtumsatz" in GA4 reports
    sendGtagEvent('purchase', {
        transaction_id: String(data.BuchungNr),
        value: finalValue,
        currency: 'EUR',
        items: [{
            item_id: String(data.ObjMetaNr),
            item_name: data.name || String(data.ObjMetaNr),
            price: finalValue,
            quantity: 1
        }]
    });
};

// Register handlers with the SECRA OP client tracking hooks immediately
(function initEvents() {
    window.secra_op_client.tracking.object.load = sendObjectView;
    window.secra_op_client.tracking.booking['submit-success'] = sendBookingSuccess;
})();
