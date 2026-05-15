# Anleitung: SECRA OP Events im Google Tag Manager (GTM) einrichten und Conversions auslösen

Diese Anleitung beschreibt, wie die von diesem Projekt bereitgestellten SECRA OP Events im Google Tag Manager (GTM) verarbeitet und an Google Analytics 4 (GA4) und/oder Google Ads als Conversions gemeldet werden können.

Wichtiger Hinweis:
- Nutzen Sie pro Seite entweder die GTM-Variante (src/op-gtm.js) oder die direkte GA4-Variante (src/op-gtag.js), nicht beide gleichzeitig.
- Die hier beschriebene Einrichtung bezieht sich auf die GTM-Variante (dataLayer).

## 1) Voraussetzungen

- GTM Container im <head> eingebunden (inkl. Noscript im <body>). Siehe README.
- Entweder:
  - GA4 Konfiguration soll über GTM erfolgen (empfohlen), oder
  - GA4 Tracking läuft bereits nativ (gtag.js). In diesem Dokument wird der Weg über GTM beschrieben.
- In Ihrer Seite ist das Skript `op-gtm.js` eingebunden (direkt vor `</body>`, also NACH dem OP-Boot-Script im `<head>`). Dieses Skript pusht Events in den dataLayer.

**Erforderlich: Einbindung direkt vor `</body>`, also NACH dem OP-Boot-Script** (via jsDelivr-CDN, gepinnt auf einen konkreten Release-Tag):

```html
<head>
  <!-- ... GTM-Container (siehe README) ... -->
  <script async src="https://www.optimale-praesentation.de/frontend/js/bin/boot?secratoid=xxxxxxxxx"></script>
</head>
<body>
  <!-- Seite/Inhalt ... -->

  <!-- direkt vor </body>: Tracking zuletzt -->
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.1.8/dist/op-gtm.js"></script>
</body>
```

Warum diese Reihenfolge: Empirisch festgestellt — die nachgeladenen OP-Module (`op-frontend-object`, `op-frontend-booking` etc.) bauen ihren eigenen Tracking-State auf und überschreiben oder ignorieren vorab gesetzte Hooks. Wird `op-gtm.js` vor dem OP-Boot-Script geladen, gehen die Hook-Registrierungen verloren und keine Events werden gefeuert. Die [OP-Doku](https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html) empfiehlt zwar abweichend „vor dem Boot" — in der Praxis funktioniert mit aktuellen OP-Modulen nur die Reihenfolge „nach dem Boot".

Hinweise:
- Eingebunden wird die gebaute Datei aus `dist/` (mit eingebetteter Version und Build-Datum), nicht die Quelle aus `src/`.
- Den Tag (`@v2.1.6`) immer auf eine konkrete Version pinnen – `@main` oder weglassen würde latest-Builds liefern und das Caching schwächen.
- Bei einem neuen Release die Versionsnummer in der eigenen Seite mit hochziehen.

## 2) Welche Events werden gesendet?

Das Skript src/op-gtm.js pusht folgende Custom Events in den dataLayer:

1) Objektansicht (Ferienunterkunft)
- Event-Name: secra_op_object_view
- Payload:
  - object_id: String (z. B. "12345")
  - content_type: "vacation_rental"

2) Buchung erfolgreich
- Es werden zwei dataLayer Pushes ausgeführt:

a) Custom Event: secra_op_object_booking
- Payload:
  - object_id: String
  - transaction_id: String
  - currency: "EUR"
  - content_type: "vacation_rental"
  - value: Number (nur wenn Preis gültig)

b) Standard GA4 Event: purchase (neu – befüllt "Gesamtumsatz" in GA4)
- Wird nur gefeuert wenn value gültig (> 0)
- Payload:
  - transaction_id: String
  - value: Number
  - currency: "EUR"
  - items: Array mit einem Eintrag (item_id, item_name, price, quantity)

Hinweis: `data.price` der OP-API ist ein deutscher Anzeigestring (z. B. `"1.234,56 €"`). Das Skript normalisiert diesen automatisch zu einem numerischen Wert (z. B. `1234.56`).

Diese Namen/Parameter sind absichtlich minimal und GA4-freundlich.

## 3) Variablen in GTM anlegen

Legen Sie für die aus dem dataLayer gelesenen Felder Variablen an (Typ: Data Layer-Variable):

- dlv.object_id → Name: dlv.object_id, Data Layer Variable Name: object_id, Version: 2
- dlv.transaction_id → Name: dlv.transaction_id, Data Layer Variable Name: transaction_id, Version: 2
- dlv.value → Name: dlv.value, Data Layer Variable Name: value, Version: 2
- dlv.currency → Name: dlv.currency, Data Layer Variable Name: currency, Version: 2
- dlv.content_type → Name: dlv.content_type, Data Layer Variable Name: content_type, Version: 2

Optional: Legen Sie eine Data Layer-Variable für event an, um in Debugging-Sichten den Eventnamen zu sehen.

## 4) Trigger (Auslöser) in GTM anlegen

Legen Sie zwei Custom Event Trigger an:

- Trigger: CE – secra_op_object_view
  - Typ: Benutzerdefiniertes Ereignis (Custom Event)
  - Event-Name: secra_op_object_view
  - Übereinstimmung: Genau passend

- Trigger: CE – secra_op_object_booking
  - Typ: Benutzerdefiniertes Ereignis (Custom Event)
  - Event-Name: secra_op_object_booking
  - Übereinstimmung: Genau passend

- Trigger: CE – purchase
  - Typ: Benutzerdefiniertes Ereignis (Custom Event)
  - Event-Name: purchase
  - Übereinstimmung: Genau passend

## 5) GA4 Konfiguration in GTM (falls noch nicht vorhanden)

- Tag: GA4 – Konfig
  - Typ: Google Analytics: GA4-Konfigurations-Tag
  - Mess-ID: G-XXXXXXX (Ihre GA4 Property)
  - Auslöser: All Pages (oder entsprechend Ihrer Richtlinien)

## 6) GA4 Event Tags anlegen (Mapping der SECRA Events)

1) GA4 Event: secra_op_object_view
- Tag: GA4 – Event – secra_op_object_view
  - Typ: Google Analytics: GA4-Ereignis
  - Konfigurations-Tag: GA4 – Konfig (oder Mess-ID direkt eintragen)
  - Ereignisname: secra_op_object_view
  - Ereignisparameter:
    - object_id → {{dlv.object_id}}
    - content_type → {{dlv.content_type}}
  - Auslöser: CE – secra_op_object_view

2) GA4 Event: secra_op_object_booking
- Tag: GA4 – Event – secra_op_object_booking
  - Typ: Google Analytics: GA4-Ereignis
  - Konfigurations-Tag: GA4 – Konfig (oder Mess-ID direkt eintragen)
  - Ereignisname: secra_op_object_booking
  - Ereignisparameter:
    - object_id → {{dlv.object_id}}
    - transaction_id → {{dlv.transaction_id}}
    - currency → {{dlv.currency}}
    - content_type → {{dlv.content_type}}
    - value → {{dlv.value}} (optional; wird gesendet, wenn vorhanden)
  - Auslöser: CE – secra_op_object_booking

3) GA4 Event: purchase (befüllt "Gesamtumsatz" in GA4-Berichten)
- Tag: GA4 – Event – purchase
  - Typ: Google Analytics: GA4-Ereignis
  - Konfigurations-Tag: GA4 – Konfig (oder Mess-ID direkt eintragen)
  - Ereignisname: purchase
  - Ereignisparameter:
    - transaction_id → {{dlv.transaction_id}}
    - value → {{dlv.value}}
    - currency → {{dlv.currency}}
    - items → {{dlv.items}}
  - Auslöser: CE – purchase

Hinweis: Für `items` eine Data Layer-Variable anlegen (Name: dlv.items, Data Layer Variable Name: items, Version: 2).
In GA4 können Sie diese Ereignisnamen als Conversions markieren (siehe Abschnitt 7).

## 7) Conversions in GA4 markieren (empfohlen)

Es gibt zwei gängige Wege, Conversions zu erfassen:

A) Direkt in GA4 Conversions markieren (meist ausreichend)
- GA4 Admin → Conversions → New Conversion Event
- Tragen Sie den exakten Ereignisnamen ein, z. B.:
  - secra_op_object_booking (Buchungsabschluss)
  - optional: secra_op_object_view (nur wenn dies für Sie ein echtes Conversion-Ziel ist)
- Ab jetzt zählt GA4 jedes Eintreffen dieser Ereignisse als Conversion.

Vorteile: Einfach, robust, kein zusätzlicher Tag notwendig. Reporting und Attributionslogik bleiben in GA4.

B) Google Ads Conversions via GTM taggen (optional/ergänzend)
- Nutzen Sie diesen Weg, wenn Sie Conversions direkt an Google Ads senden möchten (z. B. für schnellere Rückmeldungen oder wenn nicht über GA4 importiert wird).
- Voraussetzungen: Google Ads Conversion ID (AW-XXXXXXXXX) und Conversion Label vorhanden.

Schritte in GTM:
1) Tag: Ads – Conversion – Buchung
   - Typ: Google Ads Conversion Tracking
   - Conversion-ID: AW-XXXXXXXXX
   - Conversion Label: AbcDefGhijkLmNoPq
   - Wert: {{dlv.value}} (optional) – setzen Sie einen Standardwert, wenn nicht vorhanden
   - Währung: {{dlv.currency}} (oder "EUR")
   - Order ID/Transaction ID: {{dlv.transaction_id}}
   - Auslöser: CE – secra_op_object_booking

2) Optional: Deduplication mit GA4/Ads
   - Wenn Sie dasselbe Ereignis auch über GA4 nach Google Ads importieren, vermeiden Sie Doppelzählungen. Entscheiden Sie sich entweder für direkten Ads-Tag ODER Import der GA4-Conversions in Google Ads (empfohlen). In Google Ads: Tools → Conversions → Neue Conversion-Aktion → Import → GA4.

## 8) Testen & Debugging

- GTM Vorschau (Preview) starten, Ihre Seite laden.
- Prüfen, ob die Custom Events secra_op_object_view und secra_op_object_booking im Debug Panel erscheinen.
- Kontrollieren, ob die GA4 Event Tags korrekt auslösen und die Parameter gesetzt werden.
- In GA4: DebugView prüfen (entwicklerseitig) – Ereignisnamen und Parameter sollten sichtbar sein.
- Bei Google Ads Conversions: Tag Assistant und Conversion-Diagnose nutzen.

## 9) Häufige Stolperfallen und Tipps

- Nicht beide Skripte nutzen: op-gtm.js (GTM) ODER op-gtag.js (gtag). Doppeltracking vermeiden.
- SPA/Widget-Navigation: Die hier verwendeten Hooks werden durch SECRA OP ausgelöst. Zusätzliche Pageview-Logik ist i. d. R. nicht notwendig.
- Preisformat: OP liefert `price` als deutschen Anzeigestring (z. B. `"1.234,56 €"`). Das Skript parst diesen automatisch. Kein manueller Eingriff nötig.
- Consent Mode (optional): Falls Sie Consent Mode nutzen, konfigurieren Sie ihn vor dem Laden des GTM Containers und berücksichtigen Sie die Consent-Einstellungen in Ihren Tags/Triggern.
- Versionsverwaltung: Änderungen im GTM Container stets als Version veröffentlichen.

## 10) Erweiterungen (optional)

- Zusätzliche Parameter: Falls Ihr Reporting weitere Dimensionen benötigt (z. B. Region, Unterkunftstyp), können Sie diese in op-gtm.js ergänzen und als zusätzliche Data Layer-Variablen/GA4 Parameter mappen. Dabei immer auf Datenminimierung und Datenschutz achten.
- Ereignis-Alias: Vermeiden Sie parallele Alias-Namen. Arbeiten Sie konsistent mit den hier definierten Event- und Parameternamen.

## 11) Kurzübersicht: Was ist nach dieser Anleitung eingerichtet?

- 3 Events werden per GTM an GA4 gesendet: `secra_op_object_view`, `secra_op_object_booking`, `purchase`.
- `purchase` befüllt automatisch die Spalte "Gesamtumsatz" in GA4 → Engagement → Ereignisse.
- `secra_op_object_booking` kann zusätzlich als Conversion in GA4 markiert oder an Google Ads gemeldet werden.
- Saubere Trennung zwischen Datenerhebung (Events) und Zieldetektion (Conversions).


