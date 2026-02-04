/**
 * SECRA OP Tracking – Google Analytics 4 (gtag) Integration
 * ---------------------------------------------------------
 * Modern GA4 implementation that listens to SECRA OP hooks and sends
 * GA4-native events via gtag('event', ...). Use this when GA4 is loaded
 * directly with the gtag.js snippet (not via Google Tag Manager).
 *
 * @version v2.1.0-2-g4d06beb
 * @buildDate 2026-02-04 13:23:44 UTC
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

    // Parse and validate price with fallback
    const parsedValue = parseFloat(data.price);
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
};

// Register handlers with the SECRA OP client tracking hooks immediately
(function initEvents() {
    window.secra_op_client.tracking.object.load = sendObjectView;
    window.secra_op_client.tracking.booking['submit-success'] = sendBookingSuccess;
})();
