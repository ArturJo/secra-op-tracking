/**
 * SECRA OP Tracking – Google Analytics 4 (gtag) Integration
 * ---------------------------------------------------------
 * Modern GA4 implementation that listens to SECRA OP hooks and sends
 * GA4-native events via gtag('event', ...). Use this when GA4 is loaded
 * directly with the gtag.js snippet (not via Google Tag Manager).
 *
 * @version __VERSION__
 * @buildDate __BUILD_DATE__
 */

// Initialize globals early (no need to wait for DOMContentLoaded)
window.secra_op_client = window.secra_op_client || {};
window.secra_op_client.tracking = window.secra_op_client.tracking || {};
window.secra_op_client.tracking.search = window.secra_op_client.tracking.search || {};
window.secra_op_client.tracking.object = window.secra_op_client.tracking.object || {};
window.secra_op_client.tracking.booking = window.secra_op_client.tracking.booking || {};
window.secra_op_client.tracking.contactform = window.secra_op_client.tracking.contactform || {};
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

// Factory for events that only carry the object reference ({ObjMetaNr})
const makeObjectEventSender = (eventName) => (mod, event, data) => {
    if (!data || !data.ObjMetaNr) return;

    sendGtagEvent(eventName, {
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    });
};

// Custom event: object view (holiday accommodation)
const sendObjectView = makeObjectEventSender('secra_op_object_view');

// Custom event: search widget loaded (once per page load, no extra data)
const sendSearchLoad = (mod, event, data) => {
    sendGtagEvent('secra_op_search_load', {});
};

// Custom event: booking funnel loaded for an object
const sendBookingLoad = (mod, event, data) => {
    if (!data || !data.ObjMetaNr) return;

    sendGtagEvent('secra_op_booking_load', {
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    });

    // Standard GA4 begin_checkout event — enables GA4 funnel/checkout reports
    sendGtagEvent('begin_checkout', {
        items: [{
            item_id: String(data.ObjMetaNr),
            quantity: 1
        }]
    });
};

// Custom event: booking step rendered (fires on every step of the funnel)
const sendBookingRenderStep = (mod, event, data) => {
    if (!data || !data.ObjMetaNr) return;

    const params = {
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    };
    if (data.step !== undefined && data.step !== null) {
        params.step = String(data.step);
    }

    sendGtagEvent('secra_op_booking_render_step', params);
};

// Custom event: booking submit failed
const sendBookingSubmitError = (mod, event, data) => {
    if (!data || !data.ObjMetaNr) return;

    const params = {
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    };
    if (data.name) {
        params.name = String(data.name); // passed through as delivered by OP
    }

    sendGtagEvent('secra_op_booking_submit_error', params);
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

// Custom event: non-binding contact form submitted ({mode, objectId})
const sendContactformSubmit = (mod, event, data) => {
    const params = {};
    if (data && data.mode !== undefined && data.mode !== null) {
        params.mode = String(data.mode);
    }
    if (data && data.objectId !== undefined && data.objectId !== null) {
        params.object_id = String(data.objectId);
    }

    sendGtagEvent('secra_op_contactform_submit', params);

    // Standard GA4 generate_lead event — usable as Key Event without extra mapping
    sendGtagEvent('generate_lead', {});
};

// Register handlers with the SECRA OP client tracking hooks immediately
(function initEvents() {
    window.secra_op_client.tracking.search.load = sendSearchLoad;
    window.secra_op_client.tracking.search.view = makeObjectEventSender('secra_op_search_view');
    window.secra_op_client.tracking.object.load = sendObjectView;
    window.secra_op_client.tracking.object.share = makeObjectEventSender('secra_op_object_share');
    window.secra_op_client.tracking.booking.load = sendBookingLoad;
    window.secra_op_client.tracking.booking['render-step'] = sendBookingRenderStep;
    window.secra_op_client.tracking.booking['submit-error'] = sendBookingSubmitError;
    window.secra_op_client.tracking.booking['submit-success'] = sendBookingSuccess;
    window.secra_op_client.tracking.contactform.submit = sendContactformSubmit;
})();
