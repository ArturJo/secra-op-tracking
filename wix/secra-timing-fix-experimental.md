# SECRA-Modul Integration mit Tracking

> **⚠️ Status: Experimentell**  
> Diese Lösung wurde entwickelt, um Timing-Probleme bei der SECRA-Integration zu beheben, insbesondere im Kontext von WIX-Seiten. Die Implementierung befindet sich in der Testphase und sollte vor dem produktiven Einsatz gründlich getestet werden.

## Übersicht

Diese Dokumentation beschreibt die Integration des SECRA-Moduls (`op-frontend-suche`) und die Initialisierung des dazugehörigen Trackings. Die Implementierung stellt sicher, dass das Tracking erst nach dem SECRA-Modul geladen wird, um Timing-Probleme zu vermeiden.

## Problem

Bei paralleler Ausführung von zwei unabhängigen Scripts können Race Conditions auftreten:

```
Script 1: SECRA-Modul laden (async)
Script 2: Tracking initialisieren (async)
```

Wenn Script 2 vor Script 1 fertig ist, versucht das Tracking sich an ein noch nicht vorhandenes SECRA-Objekt anzuhängen, was zu fehlgeschlagenen Event-Registrierungen führt.

## Lösung: Sequenzielle Ausführung

Die Lösung nutzt eine Callback-Funktion, um die sequenzielle Ausführung zu garantieren:

```javascript
function loadSecraModule() {
    // 1. SECRA-Modul laden
    if (window.secra_op_client && window.secra_op_client.loadModule) {
        window.secra_op_client.loadModule(/* ... */);
    } else {
        // Zur Warteschlange hinzufügen
        window.secra_op_client.loadQueue.push(/* ... */);
    }
    
    // 2. Tracking initialisieren (wird immer nach Schritt 1 ausgeführt)
    initTracking();
}

setTimeout(loadSecraModule, 2000);
```

## Ablauf

1. Nach 2000ms wird `loadSecraModule()` ausgeführt
2. Das SECRA-Modul wird geladen oder zur Warteschlange hinzugefügt
3. Direkt danach wird `initTracking()` aufgerufen
4. Das Tracking registriert seine Event-Handler am SECRA-Client

## Vorteile

- **Deterministisch**: Die Ausführungsreihenfolge ist garantiert
- **Einfach**: Keine zusätzlichen Events oder Promise-Ketten erforderlich
- **Wartbar**: Klare Abhängigkeiten zwischen den Komponenten
- **Konsolidiert**: Ein einzelnes `<script>`-Tag statt mehrerer separater Scripts

## Tracking-Events

Das Tracking registriert folgende Event-Handler:

### Objektaufruf
```javascript
secra_op_client.tracking.object.load = function (mod, event, data) {
    dataLayer.push({
        event: 'objectView',
        eventCategory: 'OP Ferienunterkunft',
        eventAction: 'Objektaufruf Ferienunterkunft',
        objectId: data.ObjMetaNr
    });
}
```

### Buchung
```javascript
secra_op_client.tracking.booking['submit-success'] = function (mod, event, data) {
    dataLayer.push({
        event: 'objectBooking',
        eventCategory: 'OP Ferienunterkunft',
        eventAction: 'Buchung Ferienunterkunft',
        objectId: data.ObjMetaNr,
        objectName: data.name || '',
        objectBookingNumber: data.BuchungNr,
        objectBookingPrice: data.price || ''
    });
}
```

## Konfiguration

Die Modul-Optionen können über das `loadOptions`-Objekt angepasst werden:

```javascript
var loadOptions = {
    module: 'op-frontend-suche',
    content_id: 'op_content_box',
    options: {
        hasOwnCookieInfo: false,
        alwaysShowExtendedFilters: true,
        enableShare: true,
        scrollToTop: false,
        limit: {GaGeNr: [29735]}
    }
};
```

## Debugging

Zur Fehlersuche können folgende Console-Befehle verwendet werden:

```javascript
// SECRA-Client prüfen
console.log(window.secra_op_client);

// Tracking-Objekte prüfen
console.log(window.secra_op_client.tracking.object);
console.log(window.secra_op_client.tracking.booking);

// DataLayer prüfen
console.log(window.dataLayer);
```

## Implementierung

Das vollständige Script befindet sich im HTML-Template `wix/wix.html` und wird als einzelnes `<script>`-Tag eingebunden. Die Verzögerung von 2000ms stellt sicher, dass andere Abhängigkeiten (wie das SECRA-Basis-Script) bereits geladen sind.

## Testing

Vor dem produktiven Einsatz sollten folgende Szenarien getestet werden:

- [ ] Objektaufruf-Events werden korrekt in den dataLayer gepusht
- [ ] Buchungs-Events werden korrekt in den dataLayer gepusht
- [ ] Das Script funktioniert nach mehrfachen Seitenreloads
- [ ] Das Script funktioniert in verschiedenen Browsern (Chrome, Firefox, Safari, Edge)
- [ ] Die 2000ms Verzögerung ist ausreichend für das Laden der SECRA-Abhängigkeiten
- [ ] Keine JavaScript-Fehler in der Browser-Console

## Bekannte Einschränkungen

- Die feste Verzögerung von 2000ms ist eine Annahme und könnte bei langsamen Verbindungen zu kurz sein
- Die Lösung wurde primär für WIX-Umgebungen konzipiert und ist möglicherweise in anderen Kontexten nicht erforderlich