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
  <script src="https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@v2.2.0/dist/op-gtm.js"></script>
</body>
```

Warum diese Reihenfolge: Empirisch festgestellt — die nachgeladenen OP-Module (`op-frontend-object`, `op-frontend-booking` etc.) bauen ihren eigenen Tracking-State auf und überschreiben oder ignorieren vorab gesetzte Hooks. Wird `op-gtm.js` vor dem OP-Boot-Script geladen, gehen die Hook-Registrierungen verloren und keine Events werden gefeuert. Die [OP-Doku](https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html) empfiehlt zwar abweichend „vor dem Boot" — in der Praxis funktioniert mit aktuellen OP-Modulen nur die Reihenfolge „nach dem Boot".

Hinweise:
- Eingebunden wird die gebaute Datei aus `dist/` (mit eingebetteter Version und Build-Datum), nicht die Quelle aus `src/`.
- Den jsDelivr-Tag (`@<release-tag>`) immer auf eine konkrete Version pinnen – `@main` oder weglassen würde latest-Builds liefern und das Caching schwächen.
- Bei einem neuen Release die Versionsnummer in der eigenen Seite mit hochziehen.

## 2) Schnelleinrichtung via Container-Import (empfohlen)

Wer nicht jede Variable/jeden Trigger/jedes Tag manuell anlegen möchte, kann den vorbereiteten GTM-Container importieren. Die Datei liegt im Repository unter:

```
gtm/secra-op-gtm-container.json
```

Sie enthält alle in dieser Anleitung beschriebenen Bausteine. **Alle Namen tragen das Prefix `SECRA OP – `** und werden in den **Ordner „SECRA OP Tracking"** importiert – so sind sie für jeden GTM-Operator sofort als Teil dieser Integration erkennbar und stören keine bestehenden Tags/Variablen.

- **1 Ordner:** `SECRA OP Tracking` – gruppiert alle unten genannten Bausteine
- **1 Konstante:** `SECRA OP – Const – GA4 Measurement ID` (Default `G-XXXXXXXX`, muss ersetzt werden)
- **9 Data Layer-Variablen (Version 2):** `SECRA OP – dlv.object_id`, `SECRA OP – dlv.transaction_id`, `SECRA OP – dlv.value`, `SECRA OP – dlv.currency`, `SECRA OP – dlv.content_type`, `SECRA OP – dlv.items`, `SECRA OP – dlv.step`, `SECRA OP – dlv.name`, `SECRA OP – dlv.mode`
- **12 Custom Event Trigger:** je ein `SECRA OP – CE – <event>` Trigger für jedes in Abschnitt 3 gelistete Event (alle `secra_op_*` Custom Events sowie `purchase`, `begin_checkout` und `generate_lead`)
- **1 Google Tag (GA4 Config, `googtag`):** `SECRA OP – Google Tag – GA4 (Config)` auf „All Pages"
- **12 GA4-Event-Tags:** je ein `SECRA OP – GA4 – Event – <event>` Tag pro Trigger (`purchase` und `begin_checkout` mit aktivierter E-Commerce-Datenübernahme aus dem dataLayer)

Zusätzlich trägt **jeder einzelne Baustein ein Notes-Feld** mit Zweck-Beschreibung, Versionsangabe und Doku-Link – sichtbar im GTM-UI per Hover/Klick auf das Notiz-Icon.

> **Konvention:** Die *Namen* der GTM-Variablen sind mit `SECRA OP – ` geprefixt; die *DataLayer-Keys* (Feldwert „Data Layer Variable Name" innerhalb der Variable) bleiben unverändert (`object_id`, `value`, `items`, …), da sie durch `op-gtm.js` festgelegt sind.

### Import-Schritte in GTM

1. GTM öffnen → gewünschten Container wählen → **Verwaltung** → **Container importieren**
2. Datei `gtm/secra-op-gtm-container.json` aus diesem Repository auswählen
3. **Workspace** wählen (z. B. „Default Workspace") oder einen neuen Workspace „SECRA OP Tracking" anlegen
4. Import-Modus wählen:
   - **„In bestehenden Container zusammenführen" → „Konflikte überschreiben"** (empfohlen, falls die Variablen-/Tag-Namen frei sind)
   - oder **„Container überschreiben"** (Achtung: löscht vorhandene Tags – nur in leeren Test-Containern verwenden)
5. Vorschau prüfen → **Bestätigen**

### Nach dem Import zwingend erforderlich

1. Variable **`SECRA OP – Const – GA4 Measurement ID`** öffnen und Wert `G-XXXXXXXX` durch die eigene GA4 Mess-ID ersetzen.
2. Im Vorschau-Modus (Preview) eine Testseite mit eingebundenem `op-gtm.js` laden, Objektansicht und Test-Buchung auslösen, Events im Tag-Assistant prüfen.
3. Wenn alles passt: **Container veröffentlichen** – idealerweise mit Versionsbeschreibung „Import SECRA OP Tracking v2.1.8" für saubere Historie.

### Konflikt-Strategie und Wiederverwendung bestehender Bausteine

- **Bestehender Google Tag (GA4 Config) im Container:** Den importierten `SECRA OP – Google Tag – GA4 (Config)` pausieren oder löschen und in allen `SECRA OP – GA4 – Event – …` Tags den Eintrag „Messung-ID" auf die bestehende Mess-ID-Variable umstellen. Damit läuft nur eine GA4-Config im Container.
- **Bestehende Mess-ID-Konstante im Container:** Analog: die importierte `SECRA OP – Const – GA4 Measurement ID` löschen, in den GA4-Event-Tags und im Google Tag (Config) auf die bestehende Konstante umstellen.
- **Bestehende generische DataLayer-Variablen (`dlv.value`, `dlv.items` etc.):** Werden durch das Prefix nicht überschrieben – die importierten `SECRA OP – dlv.*` koexistieren mit deinen vorhandenen.

### Hinweise

- `accountId`, `containerId` und `publicId` in der JSON sind Platzhalter (`"0"` bzw. `"GTM-XXXXXXX"`); GTM mappt diese beim Import automatisch auf den Zielcontainer.
- Die Ads-Conversion-Tags (siehe Abschnitt 8 B) sind in der JSON **nicht** enthalten, da Conversion-ID und Label kontoindividuell sind. Diese ggf. manuell ergänzen – Empfehlung: ebenfalls im Ordner „SECRA OP Tracking" ablegen und Namens-Prefix `SECRA OP – Ads – …` nutzen.
- Bei Aktualisierungen des Containers (z. B. neue Event-Parameter): JSON aktualisieren und erneut importieren – konfliktierende Bausteine werden über den Namen identisch gehalten und überschrieben.

## 3) Welche Events werden gesendet?

Das Skript `dist/op-gtm.js` deckt alle in der [OP-Doku](https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html#eventliste) dokumentierten Tracking-Hooks ab und pusht folgende Events in den dataLayer:

| OP-Hook | dataLayer-Event | Payload | Bemerkung |
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

Details zum Buchungserfolg (`booking:submit-success`) – es werden zwei dataLayer Pushes ausgeführt:

a) Custom Event: secra_op_object_booking
- Payload:
  - object_id: String
  - transaction_id: String
  - currency: "EUR"
  - content_type: "vacation_rental"
  - value: Number (nur wenn Preis gültig)

b) Standard GA4 Event: purchase (befüllt "Gesamtumsatz" in GA4)
- Wird nur gefeuert wenn value gültig (> 0)
- Payload:
  - transaction_id: String
  - value: Number
  - currency: "EUR"
  - items: Array mit einem Eintrag (item_id, item_name, price, quantity)

Hinweis: `data.price` der OP-API ist ein deutscher Anzeigestring (z. B. `"1.234,56 €"`). Das Skript normalisiert diesen automatisch zu einem numerischen Wert (z. B. `1234.56`).

Diese Namen/Parameter sind absichtlich minimal und GA4-freundlich.

> **Die Abschnitte 4–7 sind nur relevant, wenn Sie den Container-Import (Abschnitt 2) NICHT nutzen** und die Bausteine manuell anlegen wollen. Wer per JSON importiert hat, kann direkt zu Abschnitt 8 (Schlüsselereignisse) springen.

## 4) Variablen in GTM anlegen (manueller Weg)

Legen Sie für die aus dem dataLayer gelesenen Felder Variablen an (Typ: Data Layer-Variable). Die folgenden Namen entsprechen denen aus der Import-JSON.

- Name: `SECRA OP – dlv.object_id` → Data Layer Variable Name: `object_id`, Version: 2
- Name: `SECRA OP – dlv.transaction_id` → Data Layer Variable Name: `transaction_id`, Version: 2
- Name: `SECRA OP – dlv.value` → Data Layer Variable Name: `value`, Version: 2
- Name: `SECRA OP – dlv.currency` → Data Layer Variable Name: `currency`, Version: 2
- Name: `SECRA OP – dlv.content_type` → Data Layer Variable Name: `content_type`, Version: 2
- Name: `SECRA OP – dlv.items` → Data Layer Variable Name: `items`, Version: 2
- Name: `SECRA OP – dlv.step` → Data Layer Variable Name: `step`, Version: 2
- Name: `SECRA OP – dlv.name` → Data Layer Variable Name: `name`, Version: 2
- Name: `SECRA OP – dlv.mode` → Data Layer Variable Name: `mode`, Version: 2

Zusätzlich Konstante:
- Name: `SECRA OP – Const – GA4 Measurement ID`, Typ: Konstante, Wert: `G-XXXXXXXX` (eigene Mess-ID eintragen)

Optional: Legen Sie eine Data Layer-Variable für `event` an, um in Debugging-Sichten den Eventnamen zu sehen.

## 5) Trigger (Auslöser) in GTM anlegen (manueller Weg)

Legen Sie für jedes Event aus Abschnitt 3 einen Custom Event Trigger nach demselben Muster an (Typ: Benutzerdefiniertes Ereignis, Übereinstimmung: Genau passend, Name: `SECRA OP – CE – <event>`):

- `secra_op_search_load`
- `secra_op_search_view`
- `secra_op_object_view`
- `secra_op_object_share`
- `secra_op_booking_load`
- `secra_op_booking_render_step`
- `secra_op_booking_submit_error`
- `secra_op_object_booking`
- `secra_op_contactform_submit`
- `purchase`
- `begin_checkout`
- `generate_lead`

## 6) GA4 Konfiguration in GTM (manueller Weg, falls noch nicht vorhanden)

- Tag: `SECRA OP – Google Tag – GA4 (Config)`
  - Typ: Google Tag (`googtag`)
  - Tag-ID: `{{SECRA OP – Const – GA4 Measurement ID}}`
  - Auslöser: All Pages (oder entsprechend Ihrer Richtlinien)

Hinweis: Existiert im Container bereits ein Google Tag / GA4 Config Tag, diesen Tag nicht erneut anlegen – stattdessen in den nachfolgenden Event-Tags die bestehende Mess-ID-Variable verwenden.

## 7) GA4 Event Tags anlegen (manueller Weg – Mapping der SECRA Events)

1) GA4 Event: secra_op_object_view
- Tag: `SECRA OP – GA4 – Event – secra_op_object_view`
  - Typ: Google Analytics: GA4-Ereignis (`gaawe`)
  - Messung-ID-Override: `{{SECRA OP – Const – GA4 Measurement ID}}` (oder bestehende GA4-Config nutzen)
  - Ereignisname: `secra_op_object_view`
  - Ereignisparameter:
    - `object_id` → `{{SECRA OP – dlv.object_id}}`
    - `content_type` → `{{SECRA OP – dlv.content_type}}`
  - Auslöser: `SECRA OP – CE – secra_op_object_view`

2) GA4 Event: secra_op_object_booking
- Tag: `SECRA OP – GA4 – Event – secra_op_object_booking`
  - Typ: Google Analytics: GA4-Ereignis (`gaawe`)
  - Messung-ID-Override: `{{SECRA OP – Const – GA4 Measurement ID}}` (oder bestehende GA4-Config nutzen)
  - Ereignisname: `secra_op_object_booking`
  - Ereignisparameter:
    - `object_id` → `{{SECRA OP – dlv.object_id}}`
    - `transaction_id` → `{{SECRA OP – dlv.transaction_id}}`
    - `currency` → `{{SECRA OP – dlv.currency}}`
    - `content_type` → `{{SECRA OP – dlv.content_type}}`
    - `value` → `{{SECRA OP – dlv.value}}` (optional; wird gesendet, wenn vorhanden)
  - Auslöser: `SECRA OP – CE – secra_op_object_booking`

3) GA4 Event: purchase (befüllt "Gesamtumsatz" in GA4-Berichten)
- Tag: `SECRA OP – GA4 – Event – purchase`
  - Typ: Google Analytics: GA4-Ereignis (`gaawe`)
  - Messung-ID-Override: `{{SECRA OP – Const – GA4 Measurement ID}}` (oder bestehende GA4-Config nutzen)
  - E-Commerce-Daten senden: aktiv, Quelle: Data Layer
  - Ereignisname: `purchase`
  - Ereignisparameter (zusätzlich zu den automatisch übernommenen Ecommerce-Feldern):
    - `transaction_id` → `{{SECRA OP – dlv.transaction_id}}`
    - `value` → `{{SECRA OP – dlv.value}}`
    - `currency` → `{{SECRA OP – dlv.currency}}`
    - `items` → `{{SECRA OP – dlv.items}}`
  - Auslöser: `SECRA OP – CE – purchase`

4) Übrige Events (gleiches Muster)

Die restlichen Tags folgen exakt dem Muster aus 1) — Typ `gaawe`, Messung-ID-Override, Ereignisname = Custom-Event-Name, Auslöser = zugehöriger `SECRA OP – CE – …` Trigger:

| Tag / Ereignisname | Ereignisparameter |
|---|---|
| `secra_op_search_load` | – |
| `secra_op_search_view` | `object_id`, `content_type` |
| `secra_op_object_share` | `object_id`, `content_type` |
| `secra_op_booking_load` | `object_id`, `content_type` |
| `secra_op_booking_render_step` | `object_id`, `step`, `content_type` |
| `secra_op_booking_submit_error` | `object_id`, `name`, `content_type` |
| `secra_op_contactform_submit` | `mode`, `object_id` |
| `begin_checkout` | – (E-Commerce-Daten senden: aktiv, Quelle: Data Layer → übernimmt `items[]`) |
| `generate_lead` | – |

Hinweis: In GA4 können Sie diese Ereignisnamen als Schlüsselereignisse (Key Events) markieren (siehe Abschnitt 8).

## 8) Schlüsselereignisse in GA4 markieren (empfohlen)

> Hinweis: GA4 hat „Conversions" im März 2024 in **„Schlüsselereignisse" (Key Events)** umbenannt. Der Begriff „Conversion" existiert in GA4 nicht mehr – nur noch in Google Ads.

Es gibt zwei gängige Wege, einen Buchungsabschluss als geschäftsrelevantes Ereignis zu erfassen:

### A) Direkt in GA4 als Schlüsselereignis markieren (meist ausreichend)

- **GA4 Admin → Datenanzeige → Schlüsselereignisse → „Neues Schlüsselereignis"** (oder im Bereich **Ereignisse** den Toggle „Als Schlüsselereignis markieren" pro Zeile aktivieren)
- Tragen Sie den exakten Ereignisnamen ein, z. B.:
  - `secra_op_object_booking` (Buchungsabschluss)
  - `generate_lead` oder `secra_op_contactform_submit` (unverbindliche Anfrage)
  - optional: `secra_op_object_view` (nur wenn dies für Sie ein echtes Schlüsselereignis ist)
- Ab jetzt zählt GA4 jedes Eintreffen dieser Ereignisse als Schlüsselereignis – in Berichten unter **Engagement → Conversions** (Reporting-Begriff) bzw. **Werbung → Performance** sichtbar.

Vorteile: Einfach, robust, kein zusätzlicher Tag notwendig. Reporting und Attributionslogik bleiben in GA4.

### B) Google Ads Conversions via GTM taggen (optional/ergänzend)

- Nutzen Sie diesen Weg, wenn Sie Conversions direkt an Google Ads senden möchten (z. B. für schnellere Rückmeldungen oder wenn nicht über GA4 importiert wird).
- Voraussetzungen: Google Ads Conversion-ID (AW-XXXXXXXXX) und Conversion-Label vorhanden.
- Hinweis: In **Google Ads** heißt es weiterhin „Conversions" (nur GA4 hat umbenannt).

Schritte in GTM:
1) Tag: `SECRA OP – Ads – Conversion – Buchung`
   - Typ: Google Ads Conversion Tracking
   - Conversion-ID: AW-XXXXXXXXX
   - Conversion Label: AbcDefGhijkLmNoPq
   - Wert: `{{SECRA OP – dlv.value}}` (optional) – setzen Sie einen Standardwert, wenn nicht vorhanden
   - Währung: `{{SECRA OP – dlv.currency}}` (oder "EUR")
   - Order ID/Transaction ID: `{{SECRA OP – dlv.transaction_id}}`
   - Auslöser: `SECRA OP – CE – secra_op_object_booking`
   - Ordner: `SECRA OP Tracking` (zur konsistenten Gruppierung mit den importierten Bausteinen)

2) Optional: Deduplication mit GA4/Ads
   - Wenn Sie dasselbe Ereignis auch via GA4-Schlüsselereignis-Import nach Google Ads übergeben, vermeiden Sie Doppelzählungen. Entscheiden Sie sich entweder für den direkten Ads-Tag (oben) ODER den Import der GA4-Schlüsselereignisse in Google Ads (empfohlen) – nicht beides parallel.
   - Pfad in Google Ads (UI-Stand 2026): unter **Ziele → Conversions** eine neue Conversion-Aktion vom Typ **Import → Google Analytics 4 (Web)** anlegen und dort das gewünschte Schlüsselereignis auswählen. Die exakte Bezeichnung der Menüpunkte kann sich ändern – aktuelle Anleitung: <https://support.google.com/google-ads/answer/10967938>.

### C) Optional: Erweiterte Conversions (Enhanced Conversions) für Google Ads

Erweiterte Conversions (Enhanced Conversions) verbessern die Conversion-Zuordnung in Google Ads, indem **gehashte First-Party-Daten** (E-Mail, Telefon, Name, Adresse) zusammen mit der Conversion an Google gesendet werden. Sinnvoll, sobald Sie mindestens einen Google Ads Conversion Tag (siehe 8 B) im Container haben.

> **Aktivierung erfolgt bewusst nicht über die Basis-Importvorlage**, da Enhanced Conversions personenbezogene Daten verarbeitet und damit zwingend an einen Consent-Mechanismus und eine angepasste Datenschutzerklärung gebunden ist. Die Aktivierung muss pro Kunde eine bewusste Entscheidung sein.

**Voraussetzungen vor Aktivierung:**

- Funktionierende Consent-Lösung (z. B. Google Consent Mode v2) mit Einwilligung für `ad_user_data` und `ad_personalization`
- Datenschutzerklärung enthält Hinweis auf gehashte Übermittlung von Kontaktdaten an Google
- Mindestens ein Google Ads Conversion Tag im Container (siehe 8 B)
- In Google Ads ist die Conversion-Aktion auf „Erweiterte Conversions: Wird über Google Tag Manager verwaltet" konfiguriert

**Einrichtung in GTM (zentraler Weg – empfohlen):**

1. Variable anlegen
   - Name: `SECRA OP – UserData – Automatic`
   - Typ: **Von Nutzern bereitgestellte Daten** (User-provided data)
   - Modus: **Automatic collection**
   - Aktive Felder: E-Mail, Telefonnummer, Name und Adresse (Default)
2. Im bestehenden `SECRA OP – Google Tag – GA4 (Config)` Tag (siehe Abschnitt 6) den Abschnitt **Konfigurationsparameter** erweitern:
   - **Parameter:** `user_data`
   - **Wert:** `{{SECRA OP – UserData – Automatic}}`
3. Container speichern und im **Vorschau-Modus** testen (siehe unten)

Vorteil des zentralen Wegs: Der `user_data`-Parameter im Google Tag wird von allen nachgelagerten Google-Tags (Google Ads Conversion Tracking, Floodlight) automatisch mit übernommen – kein Eintrag pro Tag nötig.

**Alternative (pro Conversion-Tag):** Den Parameter `user_data` = `{{SECRA OP – UserData – Automatic}}` direkt im jeweiligen Google Ads Conversion Tag unter „Ereignisparameter" eintragen. Nur sinnvoll, wenn nicht alle Tags Enhanced Conversions nutzen sollen.

**Verifikation:**

1. GTM-Vorschau starten, Testbuchung durchspielen
2. Browser-DevTools → Network-Tab → Filter auf `googleadservices.com` (für Google Ads) bzw. `google-analytics.com/g/collect` (für GA4)
3. Im Request-Payload müssen Hash-Parameter wie `em=` (E-Mail), `pn=` (Telefon), `fn=`/`ln=` (Vor-/Nachname) auftauchen – das sind die SHA-256-Hashes, die GTM automatisch erzeugt
4. Nach 24–48 h prüft Google Ads im Conversion-Eintrag den Status: „Erweiterte Conversions: aktiviert, X % mit erweiterten Daten" – Quote sollte mittelfristig > 50 % erreichen

**Falls Quote zu niedrig:** Variable von „Automatic collection" auf **Manual configuration** umstellen und gezielt CSS-Selektoren der OP-Buchungsbestätigungsseite eintragen (oft sind E-Mail/Telefon dort als Text sichtbar, nicht als Eingabefeld). Notfalls auf den **Code-Modus** wechseln und eine eigene JavaScript-Funktion bereitstellen.

> **Hinweis zur deprecated Option:** Im Google Ads Conversion Tag gibt es zusätzlich noch die Checkbox „Erweiterte Conversions manuell aktivieren". Diese ist seit 2024 deprecated und wird von GTM standardmäßig ausgeblendet (`ng-hide`). Verwenden Sie den oben beschriebenen Weg über `user_data` als Ereignisparameter – das ist die offizielle, zukunftssichere Methode.

## 9) Testen & Debugging

- GTM Vorschau (Preview) starten, Ihre Seite laden.
- Prüfen, ob die Custom Events aus Abschnitt 3 im Debug Panel erscheinen (mindestens `secra_op_search_load` bzw. `secra_op_object_view` sollten sofort beim Laden der jeweiligen Ansicht kommen; die `secra_op_booking_*` Events beim Durchklicken der Buchungsstrecke).
- Kontrollieren, ob die GA4 Event Tags korrekt auslösen und die Parameter gesetzt werden.
- In GA4: DebugView prüfen (entwicklerseitig) – Ereignisnamen und Parameter sollten sichtbar sein.
- Bei Google Ads Conversions: Tag Assistant und Conversion-Diagnose nutzen.

## 10) Häufige Stolperfallen und Tipps

- Nicht beide Skripte nutzen: op-gtm.js (GTM) ODER op-gtag.js (gtag). Doppeltracking vermeiden.
- SPA/Widget-Navigation: Die hier verwendeten Hooks werden durch SECRA OP ausgelöst. Zusätzliche Pageview-Logik ist i. d. R. nicht notwendig.
- Preisformat: OP liefert `price` als deutschen Anzeigestring (z. B. `"1.234,56 €"`). Das Skript parst diesen automatisch. Kein manueller Eingriff nötig.
- Consent Mode (optional): Falls Sie Consent Mode nutzen, konfigurieren Sie ihn vor dem Laden des GTM Containers und berücksichtigen Sie die Consent-Einstellungen in Ihren Tags/Triggern.
- Versionsverwaltung: Änderungen im GTM Container stets als Version veröffentlichen.

## 11) Erweiterungen (optional)

- Zusätzliche Parameter: Falls Ihr Reporting weitere Dimensionen benötigt (z. B. Region, Unterkunftstyp), können Sie diese in op-gtm.js ergänzen und als zusätzliche Data Layer-Variablen/GA4 Parameter mappen. Dabei immer auf Datenminimierung und Datenschutz achten.
- Ereignis-Alias: Vermeiden Sie parallele Alias-Namen. Arbeiten Sie konsistent mit den hier definierten Event- und Parameternamen.

## 12) Kurzübersicht: Was ist nach dieser Anleitung eingerichtet?

- 12 Events werden per GTM an GA4 gesendet: alle 9 OP-Hooks als `secra_op_*` Custom Events plus die GA4-Standard-Events `purchase`, `begin_checkout` und `generate_lead`.
- Der komplette Buchungs-Funnel ist abbildbar: `secra_op_booking_load` → `secra_op_booking_render_step` (mit `step`) → `secra_op_object_booking`/`secra_op_booking_submit_error`.
- `purchase` befüllt automatisch die Spalte "Gesamtumsatz" in GA4 → Engagement → Ereignisse.
- `secra_op_object_booking` und `generate_lead` können zusätzlich als Schlüsselereignis in GA4 markiert oder an Google Ads als Conversion gemeldet werden.
- Saubere Trennung zwischen Datenerhebung (Events) und Zieldetektion (Schlüsselereignisse in GA4, Conversions in Google Ads).


