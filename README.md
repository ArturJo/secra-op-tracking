# SECRA OP Tracking

Kleine Hilfsskripte, um Tracking-Events der SECRA OP Widgets entweder in den Google Tag Manager (GTM, dataLayer) oder direkt an Google Analytics 4 (GA4 via gtag.js) zu senden.

Tracking-API und Hook-Schnittstelle dokumentiert OP offiziell unter:
- https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html
- Eventliste: https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html#eventliste

Aussagen in diesem Repo zum Verhalten des OP-Client-Objekts (`window.secra_op_client`) und zur Hook-Registrierungs-Reihenfolge stützen sich auf diese öffentliche Doku. Bei abweichendem Verhalten ist die OP-Doku maßgeblich.

Dateien:
- src/op-gtm.js (GTM / dataLayer – Quellcode mit `__VERSION__`/`__BUILD_DATE__`-Platzhaltern)
- src/op-gtag.js (GA4 / gtag – Quellcode mit `__VERSION__`/`__BUILD_DATE__`-Platzhaltern)
- dist/op-gtm.js, dist/op-gtag.js (Auslieferungsdateien mit eingebetteter Version und Build-Datum – diese per CDN einbinden, nicht src/)
- GTM-Events-Anleitung.md (Schritt-für-Schritt-Anleitung für GTM Events und Conversions)
- GA4-gtag-Anleitung.md (Schritt-für-Schritt-Anleitung für direkte GA4/gtag Einrichtung)
- VERSION (aktuelle Versionsnummer für den Build-Prozess)
- build.sh (Build-Script: kopiert src/ nach dist/ und setzt Version + Build-Datum)

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

## Einbindung der Skripte

- Nicht beide Skripte gleichzeitig verwenden.
- Empfohlen: Einbindung via jsDelivr-CDN, gepinnt auf einen konkreten Release-Tag (z. B. `@v2.1.6`). Damit ist die Datei unveränderlich gecached und Updates erfolgen kontrolliert durch Anpassen der Versionsnummer.
- Eingebunden werden die gebauten Dateien aus `dist/` (mit eingebetteter Version und Build-Datum), nicht die Quellen aus `src/`.

### Reihenfolge: Tracking-Skript vor dem OP-Boot-Script

**Bevorzugt: im `<head>`, direkt vor dem `<script src="…/frontend/js/bin/boot?…">`-Tag.**

Hintergrund: Die [OP-Doku](https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html) empfiehlt, das Client-Objekt und die Tracking-Hooks vor dem asynchronen Laden des OP-Boot-Scripts vorzubereiten. Vorhandene Hooks bleiben erhalten und werden nicht überschrieben. Die eigentlichen Events (`object.load`, `booking['submit-success']` etc.) werden erst in den nachgeladenen OP-Modulen gefeuert. Wenn das Tracking-Skript vorher synchron geladen wurde, sind die Hooks garantiert gesetzt, bevor irgendein Modul sie aufrufen kann — keine Race Conditions, unabhängig vom Lade-Timing der OP-Module.

Alternative: Einbindung direkt vor `</body>`. Funktioniert in der Praxis, weil OP-Module typischerweise erst nach Sichtbarkeit/User-Interaktion Events feuern, ist aber theoretisch nicht race-frei (z. B. bei automatischem Objekt-Load über Deep-Link).

GTM (dataLayer) Beispiel — empfohlen, im `<head>` vor dem OP-Boot-Script:

```html
<head>
  <!-- ... -->
  <!-- Tracking zuerst (synchron) -->
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.6/dist/op-gtm.js"></script>
  <!-- danach: OP-Boot-Script -->
  <script async src="https://www.optimale-praesentation.de/frontend/js/bin/boot?secratoid=xxxxxxxxx"></script>
</head>
```

GA4 (gtag) Beispiel — empfohlen, im `<head>` vor dem OP-Boot-Script:

```html
<head>
  <!-- GA4 base tag (siehe oben) -->
  <!-- Tracking zuerst (synchron) -->
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.6/dist/op-gtag.js"></script>
  <!-- danach: OP-Boot-Script -->
  <script async src="https://www.optimale-praesentation.de/frontend/js/bin/boot?secratoid=xxxxxxxxx"></script>
</head>
```

Alternativ direkt vor `</body>` (siehe Abschnitt „Reihenfolge" oben — funktioniert in der Praxis, aber nicht garantiert race-frei).

Hinweise zur URL:
- Schema: `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>/<pfad>`
- Den `@<tag>` immer auf eine konkrete Version pinnen. `@main` oder weglassen würde latest-Builds liefern und Caching schwächen.
- Bei jedem neuen Release die Versionsnummer in der eigenen Seite mit hochziehen.

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
- Es werden zwei Events gefeuert:

a) Custom Event (unverändert):
```json
{
  "event": "secra_op_object_booking",
  "object_id": "<ObjMetaNr>",
  "transaction_id": "<BuchungNr>",
  "currency": "EUR",
  "content_type": "vacation_rental",
  "value": 123.45
}
```

b) Standard GA4 Purchase Event (neu – befüllt "Gesamtumsatz" in GA4):
```json
{
  "event": "purchase",
  "transaction_id": "<BuchungNr>",
  "value": 123.45,
  "currency": "EUR",
  "items": [{
    "item_id": "<ObjMetaNr>",
    "item_name": "<name>",
    "price": 123.45,
    "quantity": 1
  }]
}
```
- Pflichtfelder: `ObjMetaNr`, `BuchungNr`
- `value`: Wird aus `data.price` geparst. OP liefert einen deutschen Anzeigestring (z. B. `"1.234,56 €"`), der automatisch zu `1234.56` normalisiert wird.
- Bei ungültigem/fehlendem Preis: `secra_op_object_booking` sendet `value: 0`; `purchase` wird in der GTM-Variante nur bei gültigem Preis gesendet.

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
- Es werden zwei Events gefeuert:

a) Custom Event: `secra_op_object_booking`
```json
{
  "object_id": "<ObjMetaNr>",
  "transaction_id": "<BuchungNr>",
  "currency": "EUR",
  "content_type": "vacation_rental",
  "value": 123.45
}
```

b) Standard GA4 Event: `purchase` (befüllt "Gesamtumsatz" in GA4-Berichten)
```json
{
  "transaction_id": "<BuchungNr>",
  "value": 123.45,
  "currency": "EUR",
  "items": [{
    "item_id": "<ObjMetaNr>",
    "item_name": "<name>",
    "price": 123.45,
    "quantity": 1
  }]
}
```
- `value` wird aus dem deutschen Preisstring der OP-API normalisiert (z. B. `"1.234,56 €"` → `1234.56`)
- Fallback `value: 0` bei fehlendem/ungültigem Preis (nur `secra_op_object_booking`; `purchase` wird in der GTM-Variante bei Preis `0` nicht gefeuert)
- Bei aktiviertem Debug-Modus (`window.secra_op_client.tracking.debug = true`) erscheint eine Konsolen-Warnung, wenn der Preis fehlt oder ungültig ist

### Optionales Debug‑Logging (nur op-gtag.js)

Vor Einbindung von `src/op-gtag.js` kann ein Debug‑Flag gesetzt werden:

```html
<script>
  window.secra_op_client = window.secra_op_client || {};
  window.secra_op_client.tracking = window.secra_op_client.tracking || {};
  window.secra_op_client.tracking.debug = true; // Debug aktivieren
</script>
<script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.6/dist/op-gtag.js"></script>
```

- Wenn `debug = true` und `gtag` fehlt oder ein Fehler beim Senden auftritt, erscheinen Warnungen in der Konsole (z. B. "gtag() is not available — event skipped.").
- Standard ist `debug = false` (keine Konsolenmeldungen).

## Kompatibilität & Migration

- Aktuelle Implementierung verwendet snake_case Eventnamen und Parameter:
  - Events: `secra_op_object_view`, `secra_op_object_booking`, `purchase`
  - Parameter: `object_id`, `transaction_id`, `currency`, `value`, `content_type`, `items[]` (nur bei `purchase`)
- Ältere Dokumentation/Vorversionen enthielten camelCase Events und zusätzliche, vendor‑spezifische Alias‑Keys (`secraObjectId`, `secraEventCategory` etc.). Diese werden nicht mehr gesendet.
- Passen Sie ggf. GTM Trigger/Variablen und GA4 Berichte auf die obigen, aktuellen Namen an.

## Hilfe

- SECRA OP stellt die Tracking‑Hooks unter `window.secra_op_client.tracking` bereit.
- Fragen zu GA4/GTM‑Konfiguration bitte an Ihr Analytics‑Team.

