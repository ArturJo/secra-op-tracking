# SECRA OP Tracking (GTM)

This repository provides a small helper script that sends SECRA OP tracking events to Google Tag Manager (GTM) via the global `dataLayer`.

File: `src/op-gtm.js`

What it does
- Initializes `window.dataLayer` if it does not exist yet.
- Hooks into the global `window.secra_op_client.tracking` object exposed by SECRA OP.
- Pushes structured events to the `dataLayer` for two main actions:
  - Object view of a holiday accommodation (event name `secraOpObjectView`).
  - Successful booking of a holiday accommodation (event name `secraOpObjectBooking`).

Events sent to dataLayer
1) Object view
   - Triggered when `window.secra_op_client.tracking.object.load` fires.
   - Payload example:
     {
       event: 'secraOpObjectView',
       eventCategory: 'OP Holiday Accommodation',
       eventAction: 'Object View',
       objectId: <ObjMetaNr>,
       // SECRA-prefixed alias keys (in addition to the generic keys above)
       secraObjectId: <ObjMetaNr>,
       secraEventAction: 'OP Event: Objekt: load',
       secraEventCategory: 'Objekt:load',
       secraVendor: 'SECRA OP'
     }
   - Required data fields from SECRA OP: `ObjMetaNr`.

2) Booking success
   - Triggered when `window.secra_op_client.tracking.booking['submit-success']` fires.
   - Payload example:
     {
       event: 'secraOpObjectBooking',
       eventCategory: 'OP Holiday Accommodation',
       eventAction: 'Booking Success',
       objectId: <ObjMetaNr>,
       objectName: <name | ''>,
       objectBookingNumber: <BuchungNr>,
       objectBookingPrice: <price | ''>,
       // SECRA-prefixed alias keys (in addition to the generic keys above)
       secraObjectId: <ObjMetaNr>,
       secraObjectName: <name | ''>,
       secraObjectBookingNumber: <BuchungNr>,
       secraObjectBookingPrice: <price | ''>,
       secraEventAction: 'OP Event: Buchungsstrecke: submit-success',
       secraEventCategory: 'Buchungsstrecke:submit-success',
       secraVendor: 'SECRA OP'
     }
   - Required data fields from SECRA OP: `ObjMetaNr`, `BuchungNr`.
   - Optional fields: `name`, `price`.

How to use
1) Include the script on pages where SECRA OP widgets run and GTM is present.
2) Place the script tag right before the closing `</body>` tag to ensure all required globals are available:

   <script src="/path/to/src/op-gtm.js"></script>

3) In Google Tag Manager, create triggers that listen for the custom events `secraOpObjectView` and `secraOpObjectBooking`, and build tags/variables based on the pushed parameters (e.g., `objectId`, `objectBookingNumber`, etc.).

Notes
- The script waits for `DOMContentLoaded` before binding to `window.secra_op_client.tracking` to avoid race conditions.
- It performs basic guards and will not push events if required data is missing.
- External API fields provided by SECRA OP (e.g., ObjMetaNr, BuchungNr) are kept as-is to maintain compatibility.

## Vendor-prefixed values
To make the source explicit and avoid naming collisions in GTM, the payload also includes SECRA-prefixed alias keys alongside the generic keys.

Available alias keys:
- secraObjectId, secraObjectName, secraObjectBookingNumber, secraObjectBookingPrice
- secraEventAction, secraEventCategory
- secraVendor (always 'SECRA OP')

Recommendations:
- For existing GTM setups: you can keep using your current variables and gradually switch to the `secra*` keys if you prefer clearer vendor scoping.
- For new GTM setups: consider using the `secra*` keys to reduce naming collisions and make the data source explicit.
