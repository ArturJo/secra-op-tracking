/**
 * SECRA OP Tracking – Google Tag Manager Integration (Custom + Mapping)
 * ---------------------------------------------------------------------
 * Pushes minimal, GA4-friendly custom events into the GTM dataLayer.
 * GTM should map these parameters to your GA4 tags as needed.
 *
 * @version v2.1.5
 * @buildDate 2026-03-02 12:02:11 UTC
 */

// Initialize globals early (no need to wait for DOMContentLoaded)
window.dataLayer = window.dataLayer || [];
window.secra_op_client = window.secra_op_client || {};
window.secra_op_client.tracking = window.secra_op_client.tracking || {};
window.secra_op_client.tracking.search = window.secra_op_client.tracking.search || {};
window.secra_op_client.tracking.object = window.secra_op_client.tracking.object || {};
window.secra_op_client.tracking.booking = window.secra_op_client.tracking.booking || {};

// Custom event: object view (holiday accommodation)
var sendObjectView = function (mod, event, data) {
    if (!data || !data.ObjMetaNr) {
        return;
    }
    window.dataLayer.push({
        event: 'secra_op_object_view',
        object_id: String(data.ObjMetaNr),
        content_type: 'vacation_rental'
        // Add more business-critical parameters here only if truly needed for GTM mapping
    });
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
};

// Register handlers with the SECRA OP client tracking hooks immediately
(function initEvents() {
    window.secra_op_client.tracking.object.load = sendObjectView;
    window.secra_op_client.tracking.booking['submit-success'] = sendBookingSuccess;
})();
