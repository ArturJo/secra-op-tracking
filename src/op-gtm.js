/**
 * SECRA OP Tracking – Google Tag Manager Integration
 * --------------------------------------------------
 * This file pushes structured events into the Google Tag Manager dataLayer.
 * It is used when Google Tag Manager (GTM) is active on the page.
 */

window.dataLayer = window.dataLayer || [];
var secra_op_client = window.secra_op_client || {};
secra_op_client.tracking = secra_op_client.tracking || {};
secra_op_client.tracking.search = secra_op_client.tracking.search || {};
secra_op_client.tracking.object = secra_op_client.tracking.object || {};
secra_op_client.tracking.booking = secra_op_client.tracking.booking || {};

// Wait until the DOM is fully loaded before registering event handlers
document.addEventListener('DOMContentLoaded', function () {
    // Push an "object view" event for a holiday accommodation into the dataLayer
    var sendObjektaufrufFerienunterkunft = function (mod, event, data) {
        if (!data || !data.ObjMetaNr) {
            return;
        }
        dataLayer.push({
            event: 'objectView',
            eventCategory: 'OP Holiday Accommodation',
            eventAction: 'Object View',
            objectId: data.ObjMetaNr
        });
    };

    // Push a successful booking event for a holiday accommodation into the dataLayer
    var sendBuchungFerienunterkunft = function (mod, event, data) {
        if (!data || !data.ObjMetaNr || !data.BuchungNr) {
            return;
        }
        dataLayer.push({
            event: 'objectBooking',
            eventCategory: 'OP Holiday Accommodation',
            eventAction: 'Booking Success',
            objectId: data.ObjMetaNr,
            objectName: data.name || '',
            objectBookingNumber: data.BuchungNr,
            objectBookingPrice: data.price || ''
        });
    };

    // Register handlers with the SECRA OP client tracking hooks
    var initEvents = function () {
        secra_op_client.tracking.object.load = sendObjektaufrufFerienunterkunft;
        secra_op_client.tracking.booking['submit-success'] = sendBuchungFerienunterkunft;
    };

    initEvents();
});
