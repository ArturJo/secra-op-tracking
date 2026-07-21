# Anleitung: SECRA OP – Direkte GA4 (gtag.js) Einrichtung mit op-gtag.js

Diese Anleitung beschreibt die direkte Einbindung von Google Analytics 4 (GA4) via gtag.js und die Nutzung des Skripts `src/op-gtag.js`, um SECRA OP Ereignisse ohne Google Tag Manager zu senden.

Wichtiger Hinweis:
- Pro Seite nur eine Variante nutzen: Entweder GTM (`src/op-gtm.js`) oder direkte GA4/gtag-Integration (`src/op-gtag.js`). Nicht beides gleichzeitig verwenden (Doppeltracking).

## 1) Voraussetzungen

- Zugriff auf Ihre GA4 Property (Measurement ID, z. B. `G-XXXXXXX`).
- GA4 Basis-Snippet (gtag.js) ist im `<head>` der Seite eingebunden.
- Sie können Skripte kurz vor `</body>` einbinden.

## 2) GA4 Basis-Tag in den Head einfügen

Fügen Sie das offizielle GA4 Snippet in den `<head>` Ihrer Seite ein (Mess-ID anpassen):

```html
<!-- GA4 base tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);} 
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

Hinweise:
- Ersetzen Sie `G-XXXXXXX` durch Ihre GA4 Measurement ID.
- Fügen Sie zusätzliche `gtag('consent', ...)` oder `gtag('config', ...)` Aufrufe hier an, falls erforderlich (z. B. Consent Mode, IP-Anonymisierung ist in GA4 standardmäßig aktiv).

## 3) op-gtag.js auf der Seite einbinden (vor </body>)

**Erforderlich: Tracking-Skript direkt vor dem schließenden `</body>` einbinden — also NACH dem OP-Boot-Script.** Auslieferung via jsDelivr-CDN, gepinnt auf einen konkreten Release-Tag.

```html
<head>
  <!-- ... GA4 base tag (siehe Abschnitt 2) ... -->
  <script async src="https://www.optimale-praesentation.de/frontend/js/bin/boot?secratoid=xxxxxxxxx"></script>
</head>
<body>
  <!-- Seite/Inhalt ... -->

  <!-- direkt vor </body>: Tracking zuletzt -->
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.2.0/dist/op-gtag.js"></script>
</body>
```

Warum diese Reihenfolge: Empirisch festgestellt — die nachgeladenen OP-Module (`op-frontend-object`, `op-frontend-booking` etc.) bauen ihren eigenen Tracking-State auf und überschreiben oder ignorieren vorab gesetzte Hooks. Wird `op-gtag.js` vor dem OP-Boot-Script geladen, gehen die Hook-Registrierungen verloren und keine Events werden gefeuert. Die [OP-Doku](https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html) empfiehlt zwar abweichend „vor dem Boot" — in der Praxis funktioniert mit aktuellen OP-Modulen nur die Reihenfolge „nach dem Boot".

Hinweise:
- Eingebunden wird die gebaute Datei aus `dist/` (enthält Version und Build-Datum), nicht die Quelle aus `src/`.
- Den Tag (`@<release-tag>`) immer auf eine konkrete Version pinnen – `@main` oder weglassen würde latest-Builds liefern und das Caching schwächen.
- Bei einem neuen Release die Versionsnummer in der eigenen Seite mit hochziehen.

Das Skript registriert sich an den SECRA OP Hooks und sendet beim Eintreten der Ereignisse die GA4-Events über `gtag('event', ...)`.

## 4) Welche Events und Parameter werden gesendet?

Das Skript deckt alle in der [OP-Doku](https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html#eventliste) dokumentierten Tracking-Hooks ab und sendet folgende GA4-Ereignisse:

| OP-Hook | GA4-Event | Parameter | Bemerkung |
|---|---|---|---|
| `search:load` | `secra_op_search_load` | – | Suche geladen (einmalig pro Seitenaufruf) |
| `search:view` | `secra_op_search_view` | `object_id`, `content_type` | Objekt in der Suche geladen |
| `object:load` | `secra_op_object_view` | `object_id`, `content_type` | Objektansicht (Ferienunterkunft) |
| `object:share` | `secra_op_object_share` | `object_id`, `content_type` | Share-Button genutzt |
| `booking:load` | `secra_op_booking_load` **+** `begin_checkout` | `object_id`, `content_type`; `begin_checkout` mit `items[]` | Einstieg in die Buchungsstrecke |
| `booking:render-step` | `secra_op_booking_render_step` | `object_id`, `step`, `content_type` | feuert bei jedem Buchungsschritt |
| `booking:submit-error` | `secra_op_booking_submit_error` | `object_id`, `name` (falls geliefert), `content_type` | fehlgeschlagene Buchung |
| `booking:submit-success` | `secra_op_object_booking` **+** `purchase` | siehe unten | erfolgreiche Buchung |
| `contactform:submit` | `secra_op_contactform_submit` **+** `generate_lead` | `mode`, `object_id` (falls geliefert) | unverbindliche Anfrage verschickt |

Hinweise:
- Die GA4-Standard-Events `begin_checkout` und `generate_lead` werden zusätzlich zu den Custom Events gefeuert, damit GA4-Trichter-/E-Commerce-Berichte ohne eigenes Mapping funktionieren.
- Das Feld `name` bei `secra_op_booking_submit_error` wird unverändert durchgereicht, wie es die OP-API liefert.
- Laut OP-Doku können alle Events innerhalb eines Seitenaufrufs mehrfach auslösen, da Nutzer ohne Seitenwechsel andere dynamische Inhalte laden können.

Details zum Buchungserfolg (`booking:submit-success`) – es werden zwei Events gefeuert:

a) Custom Event: `secra_op_object_booking`
- Parameter:
  - `object_id`: String
  - `transaction_id`: String
  - `value`: Number (aus deutschem Preisstring normalisiert, Fallback: `0`)
  - `currency`: "EUR"
  - `content_type`: "vacation_rental"

b) Standard GA4 Event: `purchase`
- Befüllt die Spalte "Gesamtumsatz" in GA4 → Engagement → Ereignisse
- Parameter:
  - `transaction_id`: String
  - `value`: Number
  - `currency`: "EUR"
  - `items`: Array mit einem Eintrag (`item_id`, `item_name`, `price`, `quantity`)

Hinweis: `data.price` der OP-API ist ein deutscher Anzeigestring (z. B. `"1.234,56 €"`). Das Skript normalisiert diesen automatisch zu einem numerischen Wert (z. B. `1234.56`).

## 5) Conversions in GA4 markieren (empfohlen)

Markieren Sie relevante Ereignisse als Conversions direkt in GA4:
- GA4 Admin → Conversions → New Conversion Event
- Tragen Sie den exakten Ereignisnamen ein, z. B.:
  - `secra_op_object_booking` (Buchungsabschluss)
  - `generate_lead` oder `secra_op_contactform_submit` (unverbindliche Anfrage)
  - optional: `secra_op_object_view` (nur falls fachlich wirklich ein Conversion-Ziel)
- Ab jetzt zählt GA4 jedes Eintreffen dieser Ereignisse als Conversion.

Vorteile: Keine zusätzlichen Tags nötig, robuste Zählung, Reporting/Attribution zentral in GA4.

## 6) Debugging und Tests

- GA4 DebugView: Öffnen Sie GA4 → Admin → DebugView und prüfen Sie, ob die Events mit Parametern eintreffen.
- Browser-Konsole: Optional kann ein Debug-Flag aktiviert werden (siehe Abschnitt 7). Bei fehlendem `gtag()` oder Sende-Fehlern gibt es dann Warnungen.
- E2E-Test: Führen Sie in Ihrer Anwendung eine Objektansicht und eine Testbuchung (falls möglich in Staging/Dev) aus und prüfen Sie die Events.

## 7) Optionales Debug-Flag in op-gtag.js aktivieren

Vor dem Laden von `src/op-gtag.js` können Sie Debug-Logs aktivieren:

```html
<script>
  window.secra_op_client = window.secra_op_client || {};
  window.secra_op_client.tracking = window.secra_op_client.tracking || {};
  window.secra_op_client.tracking.debug = true; // Debug aktivieren
</script>
<script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.2.0/dist/op-gtag.js"></script>
```

- Wenn `debug = true` und `gtag` fehlt, erscheint eine Warnung: "gtag() is not available — event skipped." (nicht fatal).
- Standard ist `debug = false` (keine Konsolenmeldungen).

## 8) Consent Mode (optional)

Wenn Sie den Google Consent Mode nutzen, konfigurieren Sie ihn VOR dem ersten `gtag('config', ...)` Aufruf, also im Head-Snippet:

```html
<script>
  gtag('consent', 'default', {
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    ad_storage: 'denied',
    analytics_storage: 'granted'
  });
</script>
```

Passen Sie die Defaults an Ihr CMP und Ihre Rechtslage an. Stellen Sie sicher, dass das CMP den Consent-Status zeitnah aktualisiert.

## 9) Häufige Stolperfallen und Tipps

- Nicht beide Skripte verwenden: `op-gtm.js` ODER `op-gtag.js`.
- `gtag` fehlt: Prüfen Sie, ob das GA4 Basis-Snippet im Head korrekt eingebunden ist und die Mess-ID stimmt.
- Preisformat: OP liefert `price` als deutschen Anzeigestring (z. B. `"1.234,56 €"`). Das Skript parst diesen automatisch. Kein manueller Eingriff nötig.
- Single-Page-Apps/Widgets: Die hier verwendeten Hooks werden vom SECRA OP Widget ausgelöst, zusätzliche Pageview-Logik ist in der Regel nicht nötig.
- Versionswechsel: Bei Umbau der Events/Parameter bitte die Doku und eventuelle GA4-Custom-Dimensionen konsistent halten.

## 10) Kurzübersicht: Was ist nach dieser Anleitung eingerichtet?

- GA4 (gtag.js) sendet direkt 12 Ereignisse an GA4: alle 9 OP-Hooks als `secra_op_*` Custom Events plus die GA4-Standard-Events `purchase`, `begin_checkout` und `generate_lead`.
- Der komplette Buchungs-Funnel ist abbildbar: `secra_op_booking_load` → `secra_op_booking_render_step` (mit `step`) → `secra_op_object_booking`/`secra_op_booking_submit_error`.
- `purchase` befüllt automatisch die Spalte "Gesamtumsatz" in GA4 → Engagement → Ereignisse.
- `secra_op_object_booking` und `generate_lead` können zusätzlich als Schlüsselereignis (Key Event) markiert werden.
- Optionales Debug-Logging kann beim Implementieren helfen.

