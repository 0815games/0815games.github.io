# INKFALL: Freundesliste (RTDB-only)

## Aktueller Stand

Die Freundesliste verwendet keine Cloud Functions. Sämtliche Social-Aktionen schreiben direkt in die Firebase Realtime Database.

Unterstützte Aktionen:

- `getCode`
- `requestByCode`
- `accept`
- `decline`
- `cancel`
- `remove`
- `block`
- `unblock`
- `setPrivacy`

## Datenpfade

```text
social/ownCodes/{uid}
social/codeLookup/{friendCode}
social/relationships/{uidA}/{uidB}
social/friends/{uid}/{friendUid}
social/requests/{recipientUid}/{senderUid}
social/sentRequests/{senderUid}/{recipientUid}
social/blocks/{uid}/{blockedUid}
social/privacy/{uid}
social/profiles/{uid}
social/characterViews/{uid}/{classId}
```

Private Spielstände bleiben weiterhin unter `users/{uid}` und werden nicht über die Freundesliste freigegeben.

## Regeln und Deployment

Der `social`-Zweig befindet sich in `database.rules.json`. Die bestehenden Bereiche `users` und `rooms` bleiben unverändert.

Deployment im Codespace:

```bash
git checkout feature/social-rtdb-only
git pull
firebase deploy --only database
```

Vor dem Produktiv-Deployment sollten die Regeln im Emulator mit zwei Testaccounts geprüft werden.

## Aktivierung

Der Client ist standardmäßig deaktiviert. Für die Aktivierung muss vor `social-bootstrap.js` gelten:

```js
window.INKFALL_SOCIAL_CONFIG = {
  enabled: true
};
```

Presence bleibt separat und wird nur bei zusätzlich gesetztem `presenceEnabled: true` gestartet.

## Tests

```bash
node --test inkfall/src/social/social-components.test.cjs
```

Die Tests decken Code-Reservierung, Anfrage, Annahme, Ablehnen, Zurückziehen, Entfernen, blockieren und Datenschutz auf Adapterebene ab. Firebase-Emulator-, Browser-, Fokus- und Zwei-Account-Tests sind vor dem Merge zusätzlich erforderlich.

## Bekannte Grenzen

- Profil- und Charakteransichten werden derzeit gelesen, aber vom RTDB-only-Adapter noch nicht automatisch veröffentlicht.
- Einladungen und Wartezimmer sind noch nicht Teil dieses Social-Kerns.
- Die Regeln erzwingen Anfrageablauf, Blockierungen und Revisionsänderungen; die Client-Prüfungen sind lediglich Bedienungsprüfungen.
