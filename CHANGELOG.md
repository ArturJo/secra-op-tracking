# Changelog

All notable changes to the SECRA OP Tracking scripts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.8] - 2026-05-15

### Fixed
  - Doku-Empfehlung zur Einbindungs-Reihenfolge korrigiert: Tracking-Skript muss NACH dem OP-Boot-Script eingebunden werden (direkt vor `</body>`), nicht davor. v2.1.7-Anweisungen zur Einbindung im `<head>` vor dem Boot führten in der Praxis dazu, dass nachgeladene OP-Module
  (`op-frontend-object`, `op-frontend-booking` etc.) vorab gesetzte Hooks überschreiben oder ignorieren — folglich wurden keine Events gefeuert. Empirisch verifiziert

### Changed
  - `README.md`, `GA4-gtag-Anleitung.md`, `GTM-Events-Anleitung.md`: Code-Beispiele und Erklärungstext zur Hook-Registrierungs-Reihenfolge zeigen jetzt strikt die Body-Variante. Hinweis ergänzt, dass die offizielle OP-Doku abweichend „vor dem Boot" empfiehlt, dies aber mit aktuellen
  OP-Modulen nicht funktioniert
  - `wix/wix-op-integration.html`: Tracking-Embed (`op-gtm.js`/`op-gtag.js` via jsDelivr) aus dem `<head>` entfernt und direkt vor `</body>` platziert









---

## [2.1.7] - 2026-05-15

### Added
  - Empfohlene Einbindung der Tracking-Skripte via jsDelivr-CDN, gepinnt auf konkrete Release-Tags (`https://cdn.jsdelivr.net/gh/ArturJo/secra-op-tracking@vX.Y.Z/dist/...`)
  - Neuer Abschnitt zur Einbindungs-Reihenfolge in `README.md`, `GA4-gtag-Anleitung.md` und `GTM-Events-Anleitung.md`: Tracking-Skript synchron im `<head>` vor dem OP-Boot-Script — race-frei gegenüber dem dynamischen Modul-Loading durch OP
  - Verweis auf die offizielle OP-Doku (https://docs.optimale-praesentation.de/1-Client-Einbindung/3-Tracking.html) im `README.md` als Quelle für Tracking-API und Hook-Verhalten
  - `release.sh`: One-shot Release-Skript mit Pre-Flight-Checks, automatischer CHANGELOG-Skelett-Vorlage, jsDelivr-Pin-Update in der Doku und sauberer Commit-/Tag-Reihenfolge

### Changed
  - Code-Beispiele in `README.md`, `GA4-gtag-Anleitung.md` und `GTM-Events-Anleitung.md` zeigen die Head-Variante als Default. Die `</body>`-Einbindung bleibt als Alternative dokumentiert (in der Praxis ausreichend, theoretisch nicht garantiert race-frei)
  - Eingebunden werden jetzt die gebauten Dateien aus `dist/` (mit eingebetteter Version und Build-Datum) statt Platzhalter `/path/to/src/`
  - `wix/wix-op-integration.html`: Tracking-Embed (`op-gtm.js` via jsDelivr) im `<head>` ergänzt, Reihenfolge zu OP-Boot-Script dokumentiert
  - `release.sh` aktualisiert beim nächsten Release automatisch alle jsDelivr-Tag-Pins in Doku und `wix/`-Snippet, damit die Versionsnummer nicht über die Dateien driftet

### Removed
  - `wix/wix.html` — legacy WIX-Beispiel mit inline kopiertem Tracking-Code und veralteten camelCase-Event-Namen (`objectView`, `objectBooking`). Ersetzt durch `wix/wix-op-integration.html` + Einbindung von `op-gtm.js` bzw. `op-gtag.js` via CDN
  - `RELEASE-NOTES.md` — inhaltlich duplikativ zu `CHANGELOG.md` und nicht vom Release-Workflow gepflegt; GitHub-Releases übernehmen diese Rolle


---

## [2.1.6] - 2026-03-02

### Added
- Standard GA4 `purchase` event now fires alongside `secra_op_object_booking` on every Buchungserfolg
  - Befüllt die Spalte "Gesamtumsatz" in GA4 → Engagement → Ereignisse
  - Pflichtfelder: `transaction_id`, `value`, `currency`, `items[]`
- `VERSION`-Datei für manuelle Versionspflege (löst `git describe` als Standard ab)

### Fixed
- `data.price` von der OP-API ist ein deutscher Anzeigestring (z. B. `"1.234,56 €"`), kein numerischer Wert
  - `parseFloat()` interpretierte den Tausenderpunkt als Dezimalzeichen (`"1.234,56 €"` → `1.234` statt `1234.56`)
  - Korrekte Normalisierung: Nicht-numerische Zeichen entfernen, Tausenderpunkt entfernen, Dezimalkomma → Punkt

### Changed
- `build.sh` liest Version standardmäßig aus `VERSION`-Datei (statt `git describe`)
- `build.sh` akzeptiert weiterhin optionales erstes Argument zur manuellen Versionsübergabe

---

## [2.1.1] - 2026-02-04

### Added
- Automated version injection via build script (`build.sh`)
- Version and build date now embedded in compiled files (`dist/op-gtag.js`, `dist/op-gtm.js`)
- Production-ready files available in `dist/` directory with version metadata

### Changed
- Build process now injects git tag version into JavaScript files
- Source files (`src/`) now contain version placeholders for automated builds

---

## [2.1.0] - 2026-02-04

### Changed
- Improved documentation for `value` parameter - now explicitly documented as always present (Fallback: `0`)
- Updated all markdown documentation files for consistency with current implementation

### Added
- Comprehensive CHANGELOG.md with full version history and migration guide
- Updated RELEASE-NOTES.md with detailed breaking changes documentation
- Enhanced README.md with clearer `value` parameter documentation

### Fixed
- Documentation now accurately reflects that `value` is always sent (not optional)
- Updated experimental WIX documentation with current event names and deprecation warnings

---

## [2.0.0] - 2026-02-04

### Changed
- **BREAKING:** Event names updated to GA4 standard (snake_case)
  - `secraOpObjectView` → `secra_op_object_view`
  - `secraOpObjectBooking` → `secra_op_object_booking`
- **BREAKING:** Simplified event parameters - removed legacy/redundant parameters
  - Removed: `event_category`, `event_action`, `item_id`, `eventCategory`, `eventAction`, `objectId`, `secra*` aliases
  - Kept minimal GA4-standard parameters: `object_id`, `transaction_id`, `value`, `currency`, `content_type`

### Added
- Robust price validation with fallback to `0` for invalid/missing prices
- Debug warning when booking price is missing or invalid (requires `window.secra_op_client.tracking.debug = true`)

### Fixed
- Booking events now always include `value` parameter (previously omitted when price was invalid)

---

## [1.2.0] - 2025-11-11

### Added
- Expanded GA4 parameters for enhanced event reporting
- Additional SECRA-specific aliases (`secraObjectId`, `secraEventAction`, etc.)

---

## [1.1.0] - 2025-11-10

### Added
- GA4-specific parameters (`event_category`, `event_action`, `item_id`, etc.)

---

## [1.0.1] - 2025-11-05

### Changed
- Removed redundant 'event' keys from tracking parameters
- Improved indentation and parameter structure

---

## [1.0.0] - 2025-11-05

### Added
- Initial release of SECRA OP tracking integration for GA4 via gtag.js
- Object view tracking (`secraOpObjectView`)
- Booking success tracking (`secraOpObjectBooking`)
- Safe gtag call utility with error handling
- Early global namespace initialization (no DOMContentLoaded dependency)

---

## Migration Guide: v1.x → v2.0.0

### Breaking Changes

**1. Event Names Changed**
Your GA4 reports and conversions configured for the old event names will need to be updated:

| Old Event Name (v1.x) | New Event Name (v2.0) |
|-----------------------|----------------------|
| `secraOpObjectView` | `secra_op_object_view` |
| `secraOpObjectBooking` | `secra_op_object_booking` |

**Action Required:**
- Update GA4 custom events, conversions, and reports to use the new event names
- Check GA4 audiences that filter on these events

**2. Event Parameters Simplified**
Many redundant parameters have been removed. Only minimal GA4-standard parameters are sent:

**Object View Event:**
- ✅ Kept: `object_id`, `content_type`
- ❌ Removed: `event_category`, `event_action`, `item_id`, `eventCategory`, `eventAction`, `objectId`, `secra*` aliases

**Booking Event:**
- ✅ Kept: `object_id`, `transaction_id`, `value`, `currency`, `content_type`
- ❌ Removed: `event_category`, `event_action`, `item_id`, `eventCategory`, `eventAction`, `objectId`, `objectName`, `objectBookingNumber`, `objectBookingPrice`, `secra*` aliases

**Action Required:**
- If your GA4 reports filter/segment by removed parameters, update them to use `object_id` or `transaction_id`
- Custom dimensions based on removed parameters will need to be reconfigured

### Recommended Upgrade Path

1. **Test in staging environment first**
2. **Update GA4 configuration** (events, conversions, reports) to recognize new event names
3. **Deploy updated script** to production
4. **Monitor GA4** for 24-48 hours to ensure data is flowing correctly
5. **Archive old custom events** (optional - keep for historical data)

### Need Help?

If you need assistance with the migration or have questions, please contact support.
