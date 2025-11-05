# SECRA OP Tracking

This repository provides small helper scripts to forward SECRA OP tracking events either to Google Tag Manager (GTM) or directly to Google Analytics 4 (GA4 via gtag.js).

File: `src/op-gtm.js` (GTM / dataLayer)
File: `src/op-gtag.js` (GA4 / gtag)

## About SECRA and SECRA OP
SECRA is a provider focused on marketing and technology for holiday accommodation (vacation rentals) in German-speaking markets. Their solutions help destinations, agencies, and property managers market and book inventory across channels and on their own websites.

- SECRA OP refers to SECRA’s online booking/operations widgets embedded on client websites. These widgets expose tracking hooks on `window.secra_op_client.tracking` that this script listens to.
- SECRA also offers tools like the <a href="https://www.fewo-channelmanager.de/" target="_blank" rel="noopener noreferrer">FeWo Channelmanager</a> for channel distribution and <a href="https://www.fewo-agent.de/" target="_blank" rel="noopener noreferrer">FeWo Agent</a> for agency websites and booking flows. Company site: <a href="https://www.secra.de/" target="_blank" rel="noopener noreferrer">https://www.secra.de/</a>.

## Base tags (in <head>)

Before using these integration scripts, ensure you have installed the required base tags from Google. Always copy the official snippets from your own Google accounts and keep them up to date.

- Google Tag Manager base tag: place the script in <head> and the noscript immediately after the opening <body>.

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

- GA4 base tag (gtag.js): place in <head>.

```html
<!-- GA4 base tag example -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);} 
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

Notes:
- Only one tracking platform should actively send events on a single page: either GTM (which can also feed GA4 via a GA4 Configuration Tag) OR native GA4 via gtag.js.
- The exact snippets can change over time; always verify against the versions provided by Google in your accounts.

## Important: Script placement (before </body>)

- Place the script tag right before the closing </body> tag. This applies to both variants (GTM and GA4/gtag).
- Do not include both scripts on the same page — choose GTM OR GA4 to avoid double tracking.
- Reminder: Base tags (GTM container or GA4 gtag) belong in <head> (and GTM noscript right after <body>), copied from your Google account.

GTM (dataLayer) example:

```html
<!-- page content ... -->

<!-- Place just before the closing body tag -->
<script src="/path/to/src/op-gtm.js"></script>
</body>
```

GA4 (gtag) example:

```html
<!-- Place just before the closing body tag -->
<script src="/path/to/src/op-gtag.js"></script>
</body>
```

## Google Tag Manager (GTM) integration

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


## GA4 (gtag) integration
Use this file when you run Google Analytics 4 via the native gtag.js snippet (not via Google Tag Manager).

File: `src/op-gtag.js`

What it does
- Hooks into `window.secra_op_client.tracking` (SECRA OP hooks), same as the GTM variant.
- Sends GA4 custom events via `gtag('event', <eventName>, <params>)`.
- Uses the same event names and parameter keys as the GTM script for consistency:
  - Event names: `secraOpObjectView`, `secraOpObjectBooking`
  - Parameters: `eventCategory`, `eventAction`, `objectId`, `objectName`, `objectBookingNumber`, `objectBookingPrice`, plus vendor‑prefixed aliases `secra*`.
- Gracefully no‑ops (warns in console) if `window.gtag` is not present.

Prerequisites
- GA4 base snippet loaded on the page (example):

  <!-- GA4 base tag example -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXX');
  </script>

How to use
1) Include `src/op-gtag.js` on pages where SECRA OP widgets run and GA4 is present.
2) Place the script right before the closing `</body>` tag to ensure all required globals are available:

   <script src="/path/to/src/op-gtag.js"></script>

3) In GA4, you will receive the following events and parameters:

Events sent to GA4
1) Object view
   - Triggered when `window.secra_op_client.tracking.object.load` fires.
   - Event: `secraOpObjectView`
   - Parameters example:
     {
       eventCategory: 'OP Holiday Accommodation',
       eventAction: 'Object View',
       objectId: <ObjMetaNr>,
       // SECRA‑prefixed alias keys
       secraObjectId: <ObjMetaNr>,
       secraEventAction: 'OP Event: Objekt: load',
       secraEventCategory: 'Objekt:load',
       secraVendor: 'SECRA OP'
     }
   - Required data fields from SECRA OP: `ObjMetaNr`.

2) Booking success
   - Triggered when `window.secra_op_client.tracking.booking['submit-success']` fires.
   - Event: `secraOpObjectBooking`
   - Parameters example:
     {
       eventCategory: 'OP Holiday Accommodation',
       eventAction: 'Booking Success',
       objectId: <ObjMetaNr>,
       objectName: <name | ''>,
       objectBookingNumber: <BuchungNr>,
       objectBookingPrice: <price | ''>,
       // SECRA‑prefixed alias keys
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

Notes
- The GA4 and GTM variants emit the same event names and parameters to simplify shared reporting and migration.
- Keep only one of the scripts active on a given page (either GTM or GA4), otherwise you may double‑track the same interaction.
