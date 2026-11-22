# Prestige gear and campaign difficulty

Two connected systems: missions that demand the new equipment, and trophies that
only those missions can give.

## Mission contracts

Each campaign mission carries a `threat`. It decides everything about how hard the
operation is, and it is visible on the mission card before you launch.

| Threat | Waves | Enemy health | Surge (odd waves from 3) | Bunker |
| --- | --- | --- | --- | --- |
| Standard | 5 | 100% | none | 100% |
| Hardened | 6 | 115% | +1 unit | 85% |
| Elite | 7 | 130% | +2 units | 70% |
| Legendary | 8 | 145% | +3 units | 55% |

| Act | Missions | Threat |
| --- | --- | --- |
| I · The Silence | The Silent Signal, The Missing Patrol | Standard |
| I · The Silence | Blackout at the Outpost, The Relief Convoy | Hardened |
| II · The Flood | Orders in the Ashes | Hardened |
| II · The Flood | Hold the Bridge, Dead Air, White Noise | Elite |
| III · The Last Light | The Long Switch | Elite |
| III · The Last Light | A City Under Glass, Tidelock, The Last Transmission | Legendary |

Rules of thumb, from the numbers:

- A **Legendary** mission is roughly endless solo around wave 8 in unit strength,
  with three extra units every odd wave, on a bunker that starts at 55%. Standard
  kit is not enough; bunker upgrades, the Mechanic Kit and a Damage trophy are.
- The **bunker floor** is 20, so even a fragile account can start a mission.
- The pressure is applied only to campaign contracts (`state.campaignContract`).
  Endless solo and multiplayer keep their existing numbers exactly.

To re-tune, edit `campaign-pressure.mjs`; the missions only name a threat, so a
balance pass never touches mission content. To change which mission is how hard,
edit the `threat` on that mission in `campaign.mjs`.

## Prestige items

Twelve trophies, one per mission, in `prestige.mjs`.

| Mission | Trophy | Slot | Effect |
| --- | --- | --- | --- |
| The Silent Signal | Relay Key | gadget | ability recharges 4 s faster |
| The Missing Patrol | Patrol Oscillator | gadget | +12 range, +5 supplies |
| Blackout at the Outpost | Detonator Key | weapon | +3 damage |
| The Relief Convoy | Convoy Plate | gear | +20 bunker health, +10 supplies |
| Orders in the Ashes | Tidelock Seal | gear | +15 bunker health, +15 supplies |
| Hold the Bridge | Bridge Marker | gear | +25 movement |
| Dead Air | Field Receiver | gadget | +12 range, ability recharges 3 s faster |
| White Noise | Ice Station Key | weapon | +4 damage, +10 range |
| The Long Switch | Transformer Coil | gear | +30 bunker health |
| A City Under Glass | Reyes Badge | gadget | +4 damage, ability recharges 3 s faster |
| Tidelock | Broadcast Horn | gadget | +20 range, +20 supplies |
| The Last Transmission | Override Flag | weapon | +6 damage, +15 range |

Each trophy also has two modifications at the normal modification price (60
scrap), so a finished campaign still has something to spend scrap on.

### Why they are safe to add

- **No new database field and no new rules.** A trophy is an id inside the
  existing `workshop` string (`prestige-icekey`, …). All twelve equipped at once,
  with a modification, still encode in well under the 2048-character limit.
- **Never purchasable.** A trophy has no price, so `craftWorkshop` cannot produce
  one. `unlockPrestige` is the only path in, and it is idempotent.
- **Only from a finished mission.** `completeStoryWithPrestige` writes story
  progress and the trophy in one transaction, and returns `null` for a mission the
  profile has not reached — so a modified client cannot claim gear by naming a
  mission.
- **Backfilled, not lost.** `syncPrestige` runs once per sign-in and adds any
  trophy the stored story progress already proves. A player who finished missions
  before trophies existed keeps them.
- **Replay safe.** Re-running a completed mission returns the same profile: no
  duplicate unlocks, no repeated credit.

### In the game

`Armory → WORKSHOP → Prestige gear` lists all twelve. Locked trophies are dimmed
and name the mission that unlocks them; once earned they equip and take
modifications like any other item. Effects reach combat through the normal
workshop snapshot, so versus stays neutral.
