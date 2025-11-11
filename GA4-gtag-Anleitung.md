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

Binden Sie das Skript kurz vor dem schließenden `</body>` ein:

```html
<!-- direkt vor </body> -->
<script src="/path/to/src/op-gtag.js"></script>
</body>
```

Das Skript registriert sich an den SECRA OP Hooks und sendet beim Eintreten der Ereignisse die GA4-Events über `gtag('event', ...)`.

## 4) Welche Events und Parameter werden gesendet?

Das Skript sendet folgende GA4-Ereignisse mit diesen Parametern:

1) Objektansicht (Ferienunterkunft)
- Event-Name: `secra_op_object_view`
- Parameter:
  - `object_id`: String (z. B. "12345")
  - `content_type`: "vacation_rental"

2) Buchung erfolgreich
- Event-Name: `secra_op_object_booking`
- Parameter:
  - `object_id`: String
  - `transaction_id`: String
  - `currency`: "EUR"
  - `content_type`: "vacation_rental"
  - optional: `value`: Number (nur wenn Preis numerisch vorliegt)

Diese Namen/Parameter entsprechen exakt der Implementierung in `src/op-gtag.js` und sind GA4-freundlich gehalten.

## 5) Conversions in GA4 markieren (empfohlen)

Markieren Sie relevante Ereignisse als Conversions direkt in GA4:
- GA4 Admin → Conversions → New Conversion Event
- Tragen Sie den exakten Ereignisnamen ein, z. B.:
  - `secra_op_object_booking` (Buchungsabschluss)
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
<script src="/path/to/src/op-gtag.js"></script>
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
- Numerische Werte: `value` wird nur gesendet, wenn `price` numerisch ist. Stellen Sie sicher, dass Preise als Zahl vorliegen.
- Single-Page-Apps/Widgets: Die hier verwendeten Hooks werden vom SECRA OP Widget ausgelöst, zusätzliche Pageview-Logik ist in der Regel nicht nötig.
- Versionswechsel: Bei Umbau der Events/Parameter bitte die Doku und eventuelle GA4-Custom-Dimensionen konsistent halten.

## 10) Kurzübersicht: Was ist nach dieser Anleitung eingerichtet?

- GA4 (gtag.js) sendet direkt zwei SECRA OP Ereignisse an GA4.
- `secra_op_object_booking` kann in GA4 als Conversion markiert werden.
- Optionales Debug-Logging kann beim Implementieren helfen.

