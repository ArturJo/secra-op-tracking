# SECRA OP Tracking

Kleine Hilfsskripte, um Tracking-Events der SECRA OP Widgets entweder in den Google Tag Manager (GTM, dataLayer) oder direkt an Google Analytics 4 (GA4 via gtag.js) zu senden.

Tracking-API und Hook-Schnittstelle dokumentiert OP offiziell unter:
- https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html
- Eventliste: https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html#eventliste

Hinweis zur Hook-Registrierungs-Reihenfolge: Die offizielle OP-Doku empfiehlt, Hooks vor dem Boot-Script vorzubereiten. In der Praxis funktioniert das aktuell mit den nachgeladenen OP-Modulen nicht zuverlässig — empirisch muss das Tracking-Skript **nach** dem OP-Boot-Script eingebunden werden (siehe Abschnitt „Einbindung der Skripte").

Dateien:
- src/op-gtm.js (GTM / dataLayer – Quellcode mit `__VERSION__`/`__BUILD_DATE__`-Platzhaltern)
- src/op-gtag.js (GA4 / gtag – Quellcode mit `__VERSION__`/`__BUILD_DATE__`-Platzhaltern)
- dist/op-gtm.js, dist/op-gtag.js (Auslieferungsdateien mit eingebetteter Version und Build-Datum – diese per CDN einbinden, nicht src/)
- gtm/secra-op-gtm-container.json (importfertige GTM-Container-Vorlage: alle Variablen, Trigger und GA4-Tags für die GTM-Variante)
- GTM-Events-Anleitung.md (Schritt-für-Schritt-Anleitung für GTM Events und Schlüsselereignisse, inkl. Container-Import)
- GA4-gtag-Anleitung.md (Schritt-für-Schritt-Anleitung für direkte GA4/gtag Einrichtung)
- VERSION (aktuelle Versionsnummer für den Build-Prozess)
- build.sh (Build-Script: kopiert src/ nach dist/ und setzt Version + Build-Datum)
- release.sh (One-Shot-Release-Script: VERSION schreiben, CHANGELOG-Skelett, Commit, Build, Tag – siehe CLAUDE.md)

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
- Empfohlen: Einbindung via jsDelivr-CDN, gepinnt auf einen konkreten Release-Tag (`@<release-tag>`, z. B. den aktuellen Tag aus dem Repo). Damit ist die Datei unveränderlich gecached und Updates erfolgen kontrolliert durch Anpassen der Versionsnummer.
- Eingebunden werden die gebauten Dateien aus `dist/` (mit eingebetteter Version und Build-Datum), nicht die Quellen aus `src/`.

### Reihenfolge: Tracking-Skript NACH dem OP-Boot-Script

**Erforderlich: Tracking-Skript direkt vor dem schließenden `</body>`-Tag einbinden — also NACH dem OP-Boot-Script.**

Empirisch festgestellt: Die nachgeladenen OP-Module (`op-frontend-object`, `op-frontend-booking` etc.) bauen ihren eigenen Tracking-State auf und überschreiben dabei vorab gesetzte Hooks bzw. ignorieren sie. Wird `op-gtm.js`/`op-gtag.js` vor dem OP-Boot-Script geladen, gehen die Hook-Registrierungen verloren und keine Events werden gefeuert. Die OP-Doku empfiehlt zwar abweichend „vor dem Boot" – in der Praxis funktioniert mit aktuellen OP-Modulen nur die Reihenfolge „nach dem Boot".

GTM (dataLayer) Beispiel:

```html
<head>
  <!-- ... GTM-Container, GA4-Snippet etc. ... -->
  <script async src="https://www.optimale-praesentation.de/frontend/js/bin/boot?secratoid=xxxxxxxxx"></script>
</head>
<body>
  <!-- Seite/Inhalt ... -->
  <!-- direkt vor </body>: Tracking ZULETZT -->
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.8/dist/op-gtm.js"></script>
</body>
```

GA4 (gtag) Beispiel:

```html
<head>
  <!-- ... GA4 base tag etc. ... -->
  <script async src="https://www.optimale-praesentation.de/frontend/js/bin/boot?secratoid=xxxxxxxxx"></script>
</head>
<body>
  <!-- Seite/Inhalt ... -->
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.8/dist/op-gtag.js"></script>
</body>
```

Hinweise zur URL:
- Schema: `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>/<pfad>`
- Den `@<tag>` immer auf eine konkrete Version pinnen. `@main` oder weglassen würde latest-Builds liefern und Caching schwächen.
- Bei jedem neuen Release die Versionsnummer in der eigenen Seite mit hochziehen.

## Google Tag Manager (GTM) – dist/op-gtm.js

Funktion:
- Initialisiert `window.dataLayer` (falls nicht vorhanden).
- Registriert Event‑Handler an allen dokumentierten OP-Hooks unter `window.secra_op_client.tracking`.
- Pusht die Events in den dataLayer.

Gesendete Events und Payloads (alle 9 OP-Hooks der offiziellen Eventliste sind abgedeckt):

| OP-Hook | dataLayer-Event | Payload |
|---|---|---|
| `search:load` | `secra_op_search_load` | – |
| `search:view` | `secra_op_search_view` | `object_id`, `content_type` |
| `object:load` | `secra_op_object_view` | `object_id`, `content_type` |
| `object:share` | `secra_op_object_share` | `object_id`, `content_type` |
| `booking:load` | `secra_op_booking_load` **+** `begin_checkout` | `object_id`, `content_type`; `begin_checkout` mit `items[]` |
| `booking:render-step` | `secra_op_booking_render_step` | `object_id`, `step`, `content_type` |
| `booking:submit-error` | `secra_op_booking_submit_error` | `object_id`, `name` (falls geliefert), `content_type` |
| `booking:submit-success` | `secra_op_object_booking` **+** `purchase` | siehe unten |
| `contactform:submit` | `secra_op_contactform_submit` **+** `generate_lead` | `mode`, `object_id` (falls geliefert) |

- `object_id` ist immer `String(ObjMetaNr)` (beim Kontaktformular: `String(objectId)`), `content_type` immer `"vacation_rental"`.
- Die GA4-Standard-Events `begin_checkout`, `purchase` und `generate_lead` werden zusätzlich gefeuert, damit GA4-Trichter-/E-Commerce-Berichte ohne eigenes Mapping funktionieren.
- Objektbezogene Events ohne `ObjMetaNr` in den OP-Daten werden verworfen (kein Push).

Details zum Buchungserfolg:

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

b) Standard GA4 Purchase Event (befüllt "Gesamtumsatz" in GA4):
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
- Bei ungültigem/fehlendem Preis: `secra_op_object_booking` wird **ohne `value`-Feld** in den dataLayer gepusht (das Feld fehlt komplett, nicht `value: 0`); `purchase` wird **gar nicht** gepusht.

Hinweise:
- Die Parameter sind bewusst minimal und GA4‑freundlich. Mapping in GTM (Variablen/Tags) erfolgt durch Sie.
- **Schnelleinrichtung in GTM:** Statt Variablen/Trigger/Tags manuell anzulegen, kann die fertige Container-Vorlage `gtm/secra-op-gtm-container.json` importiert werden – alle Bausteine sind mit Prefix `SECRA OP – ` versehen und im Ordner „SECRA OP Tracking" gruppiert, um Konflikte mit bestehenden Tags zu vermeiden. Details: siehe `GTM-Events-Anleitung.md`, Abschnitt 2.

## Google Analytics 4 (gtag) – dist/op-gtag.js

Funktion:
- Registriert die gleichen Hooks und sendet GA4‑Events via `gtag('event', ...)`.
- Identische Eventnamen und Parameter wie in der GTM‑Variante (siehe Tabelle oben).

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
- Fallback `value: 0` bei fehlendem/ungültigem Preis – bei **beiden** Events (`secra_op_object_booking` UND `purchase`). Im Unterschied zur GTM-Variante wird `purchase` hier also auch bei ungültigem Preis gesendet (mit `value: 0`).
- Bei aktiviertem Debug-Modus (`window.secra_op_client.tracking.debug = true`) erscheint eine Konsolen-Warnung, wenn der Preis fehlt oder ungültig ist

### Optionales Debug‑Logging (nur op-gtag.js)

Vor Einbindung von `src/op-gtag.js` kann ein Debug‑Flag gesetzt werden:

```html
<script>
  window.secra_op_client = window.secra_op_client || {};
  window.secra_op_client.tracking = window.secra_op_client.tracking || {};
  window.secra_op_client.tracking.debug = true; // Debug aktivieren
</script>
<script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.8/dist/op-gtag.js"></script>
```

- Wenn `debug = true` und `gtag` fehlt oder ein Fehler beim Senden auftritt, erscheinen Warnungen in der Konsole (z. B. "gtag() is not available — event skipped.").
- Standard ist `debug = false` (keine Konsolenmeldungen).

## Kompatibilität & Migration

- Aktuelle Implementierung verwendet snake_case Eventnamen und Parameter:
  - Custom Events: `secra_op_search_load`, `secra_op_search_view`, `secra_op_object_view`, `secra_op_object_share`, `secra_op_booking_load`, `secra_op_booking_render_step`, `secra_op_booking_submit_error`, `secra_op_object_booking`, `secra_op_contactform_submit`
  - GA4-Standard-Events: `purchase`, `begin_checkout`, `generate_lead`
  - Parameter: `object_id`, `transaction_id`, `currency`, `value`, `content_type`, `step`, `name`, `mode`, `items[]` (nur bei `purchase`/`begin_checkout`)
- Bestandsintegrationen (bis v2.1.8: nur `secra_op_object_view`, `secra_op_object_booking`, `purchase`) funktionieren unverändert weiter – Eventnamen und Payloads dieser drei Events sind unverändert, es kommen nur neue Events hinzu.
- Ältere Dokumentation/Vorversionen enthielten camelCase Events und zusätzliche, vendor‑spezifische Alias‑Keys (`secraObjectId`, `secraEventCategory` etc.). Diese werden nicht mehr gesendet.
- Passen Sie ggf. GTM Trigger/Variablen und GA4 Berichte auf die obigen, aktuellen Namen an.

## Hilfe

- SECRA OP stellt die Tracking‑Hooks unter `window.secra_op_client.tracking` bereit.
- Fragen zu GA4/GTM‑Konfiguration bitte an Ihr Analytics‑Team.

