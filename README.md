# SECRA OP Tracking (GTM)

This repository provides a small helper script that sends SECRA OP tracking events to Google Tag Manager (GTM) via the global `dataLayer`.

File: `src/op-gtm.js`

What it does
- Initializes `window.dataLayer` if it does not exist yet.
- Hooks into the global `secra_op_client.tracking` object exposed by SECRA OP.
- Pushes structured events to the `dataLayer` for two main actions:
  - Object view of a holiday accommodation ("objectView").
  - Successful booking of a holiday accommodation ("objectBooking").

Events sent to dataLayer
1) Object view
   - Triggered when `secra_op_client.tracking.object.load` fires.
   - Payload example:
     {
       event: 'objectView',
       eventCategory: 'OP Holiday Accommodation',
       eventAction: 'Object View',
       objectId: <ObjMetaNr>
     }
   - Required data fields from SECRA OP: `ObjMetaNr`.

2) Booking success
   - Triggered when `secra_op_client.tracking.booking['submit-success']` fires.
   - Payload example:
     {
       event: 'objectBooking',
       eventCategory: 'OP Holiday Accommodation',
       eventAction: 'Booking Success',
       objectId: <ObjMetaNr>,
       objectName: <name | ''>,
       objectBookingNumber: <BuchungNr>,
       objectBookingPrice: <price | ''>
     }
   - Required data fields from SECRA OP: `ObjMetaNr`, `BuchungNr`.
   - Optional fields: `name`, `price`.

How to use
1) Include the script on pages where SECRA OP widgets run and GTM is present.
2) Place the script tag right before the closing `</body>` tag to ensure all required globals are available:

   <script src="/path/to/src/op-gtm.js"></script>

3) In Google Tag Manager, create triggers that listen for the custom events `objectView` and `objectBooking`, and build tags/variables based on the pushed parameters (e.g., `objectId`, `objectBookingNumber`, etc.).

Notes
- The script waits for `DOMContentLoaded` before binding to `secra_op_client.tracking` to avoid race conditions.
- It performs basic guards and will not push events if required data is missing.