/**
 * SECRA OP Tracking – Google Tag Manager Integration
 * --------------------------------------------------
 * This file pushes structured events into the Google Tag Manager dataLayer.
 * It is used when Google Tag Manager (GTM) is active on the page.
 */

window.dataLayer = window.dataLayer || [];
window.secra_op_client = window.secra_op_client || {};
window.secra_op_client.tracking = window.secra_op_client.tracking || {};
window.secra_op_client.tracking.search = window.secra_op_client.tracking.search || {};
window.secra_op_client.tracking.object = window.secra_op_client.tracking.object || {};
window.secra_op_client.tracking.booking = window.secra_op_client.tracking.booking || {};

// Wait until the DOM is fully loaded before registering event handlers
document.addEventListener('DOMContentLoaded', function () {
    // Push an "object view" event for a holiday accommodation into the dataLayer
    var sendObjectView = function (mod, event, data) {
        if (!data || !data.ObjMetaNr) {
            return;
        }
        dataLayer.push({
            event: 'secraOpObjectView',
            eventCategory: 'OP Holiday Accommodation',
            eventAction: 'Object View',
            objectId: data.ObjMetaNr,
            // SECRA aliases for clarity in GTM (use these if you prefer vendor-prefixed keys)
            secraObjectId: data.ObjMetaNr,
            secraEventAction: 'OP Event: Objekt: load',
            secraEventCategory: 'Objekt:load',
            secraVendor: 'SECRA OP'
        });
    };

    // Push a successful booking event for a holiday accommodation into the dataLayer
    var sendBookingSuccess = function (mod, event, data) {
        if (!data || !data.ObjMetaNr || !data.BuchungNr) {
            return;
        }
        dataLayer.push({
            event: 'secraOpObjectBooking',
            eventCategory: 'OP Holiday Accommodation',
            eventAction: 'Booking Success',
            objectId: data.ObjMetaNr,
            objectName: data.name || '',
            objectBookingNumber: data.BuchungNr,
            objectBookingPrice: data.price || '',
            // SECRA aliases for clarity in GTM (use these if you prefer vendor-prefixed keys)
            secraObjectId: data.ObjMetaNr,
            secraObjectName: data.name || '',
            secraObjectBookingNumber: data.BuchungNr,
            secraObjectBookingPrice: data.price || '',
            secraEventAction: 'OP Event: Buchungsstrecke: submit-success',
            secraEventCategory: 'Buchungsstrecke:submit-success',
            secraVendor: 'SECRA OP'
        });
    };

    // Register handlers with the SECRA OP client tracking hooks
    var initEvents = function () {
        window.secra_op_client.tracking.object.load = sendObjectView;
        window.secra_op_client.tracking.booking['submit-success'] = sendBookingSuccess;
    };

    initEvents();
});
