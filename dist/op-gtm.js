/**
 * SECRA OP Tracking – Google Tag Manager Integration (Custom + Mapping)
 * ---------------------------------------------------------------------
 * Pushes minimal, GA4-friendly custom events into the GTM dataLayer.
 * GTM should map these parameters to your GA4 tags as needed.
 *
 * @version v2.2.0
 * @buildDate 2026-07-21 09:56:50 UTC
 */

// Initialize globals early (no need to wait for DOMContentLoaded)
window.dataLayer = window.dataLayer || [];
window.secra_op_client = window.secra_op_client || {};
window.secra_op_client.tracking = window.secra_op_client.tracking || {};
window.secra_op_client.tracking.search = window.secra_op_client.tracking.search || {};
window.secra_op_client.tracking.object = window.secra_op_client.tracking.object || {};
window.secra_op_client.tracking.booking = window.secra_op_client.tracking.booking || {};
window.secra_op_client.tracking.contactform = window.secra_op_client.tracking.contactform || {};

// Factory for events that only carry the object reference ({ObjMetaNr})
var makeObjectEventSender = function (eventName) {
    return function (mod, event, data) {
        if (!data || !data.ObjMetaNr) {
            return;
        }
        window.dataLayer.push({
            event: eventName,
            object_id: String(data.ObjMetaNr),
            content_type: 'vacation_rental'
        });
    };
};

// Custom event: object view (holiday accommodation)
var sendObjectView = makeObjectEventSender('secra_op_object_view');

// Custom event: search widget loaded (once per page load, no extra data)
var sendSearchLoad = function (mod, event, data) {
    window.dataLayer.push({
        event: 'secra_op_search_load'
    });
};

// Custom event: booking funnel loaded for an object
var sendBookingLoad = function (mod, event, data) {
    if (!data || !data.ObjMetaNr) {
        return;
    }
    window.dataLayer.push({
        event: 'secra_op_booking_load',
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    });

    // Standard GA4 begin_checkout event — enables GA4 funnel/checkout reports
    window.dataLayer.push({
        event: 'begin_checkout',
        items: [{
            item_id: String(data.ObjMetaNr),
            quantity: 1
        }]
    });
};

// Custom event: booking step rendered (fires on every step of the funnel)
var sendBookingRenderStep = function (mod, event, data) {
    if (!data || !data.ObjMetaNr) {
        return;
    }
    var dl = {
        event: 'secra_op_booking_render_step',
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    };
    if (data.step !== undefined && data.step !== null) {
        dl.step = String(data.step);
    }
    window.dataLayer.push(dl);
};

// Custom event: booking submit failed
var sendBookingSubmitError = function (mod, event, data) {
    if (!data || !data.ObjMetaNr) {
        return;
    }
    var dl = {
        event: 'secra_op_booking_submit_error',
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
    };
    if (data.name) {
        dl.name = String(data.name); // passed through as delivered by OP
    }
    window.dataLayer.push(dl);
};

// Custom event: booking success (holiday accommodation)
var sendBookingSuccess = function (mod, event, data) {
    if (!data || !data.ObjMetaNr || !data.BuchungNr) {
        return;
    }
    // Parse German-formatted price string (e.g. "1.234,56 €" → 1234.56)
    var rawPrice = typeof data.price === 'string'
        ? data.price.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
        : data.price;
    var value = parseFloat(rawPrice);
    var dl = {
        event: 'secra_op_object_booking',
        object_id: String(data.ObjMetaNr),
        transaction_id: String(data.BuchungNr),
        currency: 'EUR',
        content_type: 'vacation_rental'
    };
    if (Number.isFinite(value)) {
        dl.value = value; // numeric only when valid
    }
    window.dataLayer.push(dl);

    // Standard GA4 purchase event — populates "Gesamtumsatz" in GA4 reports
    if (Number.isFinite(value)) {
        window.dataLayer.push({
            event: 'purchase',
            transaction_id: String(data.BuchungNr),
            value: value,
            currency: 'EUR',
            items: [{
                item_id: String(data.ObjMetaNr),
                item_name: data.name || String(data.ObjMetaNr),
                price: value,
                quantity: 1
            }]
        });
    }
};

// Custom event: non-binding contact form submitted ({mode, objectId})
var sendContactformSubmit = function (mod, event, data) {
    var dl = {
        event: 'secra_op_contactform_submit'
    };
    if (data && data.mode !== undefined && data.mode !== null) {
        dl.mode = String(data.mode);
    }
    if (data && data.objectId !== undefined && data.objectId !== null) {
        dl.object_id = String(data.objectId);
    }
    window.dataLayer.push(dl);

    // Standard GA4 generate_lead event — usable as Key Event without extra mapping
    window.dataLayer.push({
        event: 'generate_lead'
    });
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
