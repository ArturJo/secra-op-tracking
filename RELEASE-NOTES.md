# Release Notes – SECRA OP Tracking

Version: v2.1.1
Datum: 2026-02-04

Empfohlener GitHub Release‑Titel: SECRA OP Tracking v2.1.1 – Build Automation & Version Tracking

Diese Version führt automatisierte Versionierung ein und bietet produktionsfertige Build-Artefakte.

## Highlights v2.1.1
- **Automatische Versionierung**: Build-Script injiziert Git-Tag-Version in finale Dateien
- **Version Tracking**: Jede Datei enthält `@version` und `@buildDate` im Header-Kommentar
- **Production-Ready Files**: `dist/` Ordner mit versionierten, einsatzbereiten Dateien
- **Deployment-freundlich**: Einfache Identifikation der verwendeten Version auf Kundenseiten

## Was ist neu in v2.1.1?
- Build-Script `build.sh` für automatisierte Versionierung
- Version und Build-Datum werden aus Git-Tags extrahiert und in Dateien eingebettet
- `dist/op-gtag.js` und `dist/op-gtm.js` enthalten Version-Metadaten
- Source-Dateien (`src/`) mit Platzhaltern für Build-Prozess

## Build-Prozess
```bash
./build.sh  # Erzeugt dist/op-gtag.js und dist/op-gtm.js mit aktueller Version
```

---

## Vorherige Version: v2.1.0

### Highlights v2.1.0
- **Vollständige Dokumentation**: Alle Markdown-Dateien auf dem neuesten Stand
- **CHANGELOG.md**: Vollständige Versionshistorie mit Migration Guide
- **Klarere `value`-Dokumentation**: Explizit als "immer vorhanden" dokumentiert
- **Aktualisierte WIX-Docs**: Veraltete Eventnamen als deprecated markiert

---

## Breaking Changes in v2.0.0 (noch relevant!)

Wenn Sie von v1.x auf v2.x upgraden, beachten Sie bitte die folgenden Breaking Changes:

## Breaking Changes (v1.x → v2.0.0)

### Event-Namen geändert
- `secraOpObjectView` → `secra_op_object_view`
- `secraOpObjectBooking` → `secra_op_object_booking`

### Parameter vereinfacht
Entfernte Parameter (v1.x):
- ❌ `event_category`, `event_action`, `item_id`
- ❌ `eventCategory`, `eventAction`, `objectId`
- ❌ `secraObjectId`, `secraEventAction`, `secraEventCategory`, `secraVendor`

Aktuelle Parameter (v2.0.0):
- ✅ `object_id`, `transaction_id`, `value`, `currency`, `content_type`

### Verhalten geändert
- **v1.x**: `value` nur gesendet wenn Preis numerisch gültig
- **v2.0.0**: `value` wird IMMER gesendet (Fallback: `0`)

## Migration erforderlich

**GA4-Konfiguration anpassen:**
1. Custom Events auf neue Namen umstellen: `secra_op_object_view`, `secra_op_object_booking`
2. Conversions auf neue Event-Namen aktualisieren
3. Custom Dimensions/Metriken prüfen und ggf. anpassen

**GTM-Konfiguration anpassen:**
1. Trigger auf neue Event-Namen umstellen
2. Data Layer-Variablen auf neue Parameter anpassen (`object_id` statt `objectId`)
3. Tags entsprechend aktualisieren

## Upgrade‑Hinweise (kurz)
- Entscheiden Sie sich pro Seite für EINE Variante (Doppeltracking vermeiden):
  - GTM/dataLayer: Head → GTM‑Container einbinden; Footer → `src/op-gtm.js` laden.
  - GA4/gtag: Head → GA4 gtag‑Snippet einbinden; Footer → `src/op-gtag.js` laden.
- GA4 Conversions:
  - In GA4 Admin → Conversions → „New Conversion Event“: `secra_op_object_booking` (empfohlen). Optional auch `secra_op_object_view`.
- Google Ads (optional, via GTM):
  - Google Ads Conversion‑Tag auf `secra_op_object_booking` triggern; Werte/Währung/Transaction ID mappen (siehe GTM‑Anleitung).

## Events (Referenz)
- `secra_op_object_view`
  - Parameter: `object_id` (String), `content_type` = `"vacation_rental"`
- `secra_op_object_booking`
  - Parameter: `object_id` (String), `transaction_id` (String), `currency` = `"EUR"`, `content_type` = `"vacation_rental"`, `value` (Number, immer vorhanden, Fallback: `0`)

## Dateien in diesem Release
- `src/op-gtm.js`
- `src/op-gtag.js`
- `GTM-Events-Anleitung.md`
- `GA4-gtag-Anleitung.md`
- `README.md`

## Hinweise & Support
- Consent Mode: Wenn genutzt, bitte vor dem Laden von GTM bzw. vor dem ersten `gtag('config', ...)` konfigurieren.
- Debugging:
  - GA4/gtag: Optionales Debug‑Flag über `window.secra_op_client.tracking.debug = true` vor dem Laden von `src/op-gtag.js`.
  - GTM: Preview/Debug Mode verwenden, Data Layer Events prüfen.
- Fragen zur Implementierung oder Wunsch nach zusätzlichen Events/Parametern? Wir passen die Skripte gerne minimal‑invasiv an und aktualisieren die Doku entsprechend.
