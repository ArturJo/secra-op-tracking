/**
 * SECRA OP Tracking – Google Analytics 4 (gtag) Integration
 * ---------------------------------------------------------
 * This file listens to SECRA OP tracking hooks and forwards events to GA4 via gtag('event', ...).
 * Use this when you load GA4 directly with the gtag.js snippet (not via Google Tag Manager).
 */

(function () {
    // Ensure the SECRA OP global namespaces exist
    window.secra_op_client = window.secra_op_client || {};
    window.secra_op_client.tracking = window.secra_op_client.tracking || {};
    window.secra_op_client.tracking.search = window.secra_op_client.tracking.search || {};
    window.secra_op_client.tracking.object = window.secra_op_client.tracking.object || {};
    window.secra_op_client.tracking.booking = window.secra_op_client.tracking.booking || {};

    // Utility: safe gtag call
    function sendGtagEvent(eventName, params) {
        if (typeof window.gtag !== 'function') {
            // GA4 base snippet is not present; avoid throwing. You can replace with your own logging as needed.
            if (window && window.console && typeof window.console.warn === 'function') {
                console.warn('[SECRA-OP][gtag] gtag() is not available. Skipping event:', eventName, params);
            }
            return;
        }
        try {
            window.gtag('event', eventName, params || {});
        } catch (e) {
            if (window && window.console && typeof window.console.error === 'function') {
                console.error('[SECRA-OP][gtag] Failed to send event', eventName, e);
            }
        }
    }

    // Wait until the DOM is fully loaded before registering event handlers
    document.addEventListener('DOMContentLoaded', function () {
        // Object view event (holiday accommodation)
        var sendObjectView = function (mod, event, data) {
            if (!data || !data.ObjMetaNr) {
                return;
            }
            var params = {
                // Generic keys
                eventCategory: 'OP Holiday Accommodation',
                eventAction: 'Object View',
                objectId: data.ObjMetaNr,
                // SECRA aliases for clarity
                secraObjectId: data.ObjMetaNr,
                secraEventAction: 'OP Event: Objekt: load',
                secraEventCategory: 'Objekt:load',
                secraVendor: 'SECRA OP'
            };
            sendGtagEvent('secraOpObjectView', params);
        };

        // Booking success event (holiday accommodation)
        var sendBookingSuccess = function (mod, event, data) {
            if (!data || !data.ObjMetaNr || !data.BuchungNr) {
                return;
            }
            var params = {
                // Generic keys
                eventCategory: 'OP Holiday Accommodation',
                eventAction: 'Booking Success',
                objectId: data.ObjMetaNr,
                objectName: data.name || '',
                objectBookingNumber: data.BuchungNr,
                objectBookingPrice: data.price || '',
                // SECRA aliases for clarity
                secraObjectId: data.ObjMetaNr,
                secraObjectName: data.name || '',
                secraObjectBookingNumber: data.BuchungNr,
                secraObjectBookingPrice: data.price || '',
                secraEventAction: 'OP Event: Buchungsstrecke: submit-success',
                secraEventCategory: 'Buchungsstrecke:submit-success',
                secraVendor: 'SECRA OP'
            };
            sendGtagEvent('secraOpObjectBooking', params);
        };

        // Register handlers with the SECRA OP client tracking hooks
        var initEvents = function () {
            window.secra_op_client.tracking.object.load = sendObjectView;
            window.secra_op_client.tracking.booking['submit-success'] = sendBookingSuccess;
        };

        initEvents();
    });
})();
