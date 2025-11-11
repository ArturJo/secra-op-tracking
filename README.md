# SECRA OP Tracking

Kleine Hilfsskripte, um Tracking-Events der SECRA OP Widgets entweder in den Google Tag Manager (GTM, dataLayer) oder direkt an Google Analytics 4 (GA4 via gtag.js) zu senden.

Dateien:
- src/op-gtm.js (GTM / dataLayer)
- src/op-gtag.js (GA4 / gtag)
- GTM-Events-Anleitung.md (Schritt-für-Schritt-Anleitung für GTM Events und Conversions)
- GA4-gtag-Anleitung.md (Schritt-für-Schritt-Anleitung für direkte GA4/gtag Einrichtung)

Wichtig:
- Pro Seite nur eine Variante verwenden (GTM oder GA4). Beide gleichzeitig führt zu Doppeltracking.
- Die Basis-Snippets (GTM-Container oder GA4 gtag) gehören in den Head. Diese immer aus dem eigenen Google-Konto kopieren und aktuell halten.

## Voraussetzungen (Head-Snippets)

GTM Basis-Tag (in <head>, Noscript direkt nach <body>):

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

GA4 Basis-Tag (gtag.js, in <head>):

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

Hinweise:
- Nur eine aktive Sendequelle je Seite: GTM oder natives GA4/gtag.
- Snippets können sich ändern – bitte mit den aktuellen Vorgaben in Ihrem Google‑Konto abgleichen.

## Einbindung der Skripte (vor </body>)

- Skript direkt vor dem schließenden </body> einbinden (gilt für beide Varianten).
- Nicht beide Skripte gleichzeitig verwenden.

GTM (dataLayer) Beispiel:

```html
<!-- Seite/Inhalt ... -->
<!-- direkt vor </body> -->
<script src="/path/to/src/op-gtm.js"></script>
</body>
```

GA4 (gtag) Beispiel:

```html
<!-- direkt vor </body> -->
<script src="/path/to/src/op-gtag.js"></script>
</body>
```

## Google Tag Manager (GTM) – src/op-gtm.js

Funktion:
- Initialisiert `window.dataLayer` (falls nicht vorhanden).
- Registriert Event‑Handler an `window.secra_op_client.tracking`.
- Pusht zwei Custom Events in den dataLayer.

Gesendete Events und Payloads:

1) Objektansicht (Ferienunterkunft)
- Auslöser: `window.secra_op_client.tracking.object.load`
- Beispiel‑Payload (dataLayer Push):
```json
{
  "event": "secra_op_object_view",
  "object_id": "<ObjMetaNr>",
  "content_type": "vacation_rental"
}
```
- Pflichtfeld: `ObjMetaNr`.

2) Buchung erfolgreich
- Auslöser: `window.secra_op_client.tracking.booking['submit-success']`
- Beispiel‑Payload (dataLayer Push):
```json
{
  "event": "secra_op_object_booking",
  "object_id": "<ObjMetaNr>",
  "transaction_id": "<BuchungNr>",
  "currency": "EUR",
  "content_type": "vacation_rental"
}
```
Optionaler Zusatzparameter (falls Preis vorhanden und numerisch):

```json
{
  "value": 123.45
}
```
- Pflichtfelder: `ObjMetaNr`, `BuchungNr`; optional: `price` (wird als numerischer `value` gesendet, wenn gültig).

Hinweise:
- Die Parameter sind bewusst minimal und GA4‑freundlich. Mapping in GTM (Variablen/Tags) erfolgt durch Sie.

## Google Analytics 4 (gtag) – src/op-gtag.js

Funktion:
- Registriert die gleichen Hooks und sendet GA4‑Events via `gtag('event', ...)`.
- Identische Eventnamen und Parameter wie in der GTM‑Variante.

Gesendete Events und Parameter:

1) Objektansicht
- Event: `secra_op_object_view`
- Parameter:
```json
{
  "object_id": "<ObjMetaNr>",
  "content_type": "vacation_rental"
}
```

2) Buchung erfolgreich
- Event: `secra_op_object_booking`
- Parameter:
```json
{
  "object_id": "<ObjMetaNr>",
  "transaction_id": "<BuchungNr>",
  "currency": "EUR",
  "content_type": "vacation_rental"
}
```
Optionaler Zusatzparameter (falls Preis vorhanden und numerisch):

```json
{
  "value": 123.45
}
```

### Optionales Debug‑Logging (nur op-gtag.js)

Vor Einbindung von `src/op-gtag.js` kann ein Debug‑Flag gesetzt werden:

```html
<script>
  window.secra_op_client = window.secra_op_client || {};
  window.secra_op_client.tracking = window.secra_op_client.tracking || {};
  window.secra_op_client.tracking.debug = true; // Debug aktivieren
</script>
<script src="/path/to/src/op-gtag.js"></script>
```

- Wenn `debug = true` und `gtag` fehlt oder ein Fehler beim Senden auftritt, erscheinen Warnungen in der Konsole (z. B. "gtag() is not available — event skipped.").
- Standard ist `debug = false` (keine Konsolenmeldungen).

## Kompatibilität & Migration

- Aktuelle Implementierung verwendet snake_case Eventnamen und Parameter:
  - Events: `secra_op_object_view`, `secra_op_object_booking`
  - Parameter: `object_id`, `transaction_id`, `currency`, `value` (optional), `content_type`
- Ältere Dokumentation/Vorversionen enthielten camelCase Events und zusätzliche, vendor‑spezifische Alias‑Keys (`secraObjectId`, `secraEventCategory` etc.). Diese werden nicht mehr gesendet.
- Passen Sie ggf. GTM Trigger/Variablen und GA4 Berichte auf die obigen, aktuellen Namen an.

## Hilfe

- SECRA OP stellt die Tracking‑Hooks unter `window.secra_op_client.tracking` bereit.
- Fragen zu GA4/GTM‑Konfiguration bitte an Ihr Analytics‑Team.

