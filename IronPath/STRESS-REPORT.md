# Local stress test — 2026-11-04

Run with `node IronPath/stress-tests/run.mjs` (Node 22). The script is deterministic apart from elapsed wall-clock timings, uses no network or Firebase, and is also run in CI. These results are from one x86-64 sandbox, not device frame rates or network capacity. No gameplay or balance values were changed.

## Automated playthroughs

The harness uses actual simulation commands, wave approval and fixed-step combat. Its simple scripted strategy builds and upgrades when affordable, chooses the first perk, attempts airstrikes periodically, and does not move the heroes. Players use the same level-three profile. It is not intended to represent skilled human play. For solo, co-op and versus it uses generated maps; three/four-player modes use the fixed four-front map and vary build order instead. A wave has a 12,000-tick timeout. Finite health, enemy positions, nonnegative supplies, and unique tower pads are checked periodically.

Three scenarios per mode all completed eight waves without defeat (18 runs). One additional scenario per mode ran up to 30 completed waves:

| Mode | Completed waves | Result | Simulation ticks | Peak enemies per field |
| --- | ---: | --- | ---: | ---: |
| Solo Endless | 30 | stopped at limit | 42,595 | 21 |
| Two-player co-op | 14 | defeated during wave 15 | 21,243 | 28 |
| Two-player versus | 30 | stopped at limit | 42,595 | 21 |
| Three-player co-op | 14 | defeated during wave 15 | 29,205 | 31 |
| Four-player co-op | 30 | stopped at limit | 62,182 | 31 |
| Two-versus-two | 30 | stopped at limit | 57,864 | 30 |

The defeats are observations for this particular scripted strategy and map/build order, not proof of imbalance. Versus players used symmetric scripted behavior, so this does not test competitive strategies or establish a winner. The existing regression suite also exercised every story campaign mission with normal movement and combat; it is not a campaign balance test. The map sanity check generated 500 seeds and checked finite path points and ten distinct pads (99 forest, 101 urban, 101 arctic, 101 marsh, 98 scrub); it is not a full pathfinding or fairness audit.

## Artificial density and protocol

For a separate synthetic worst-density exercise, each field was populated with 16 level-six towers and 72 stationary, extremely high-health enemies at wave 100; bunker health was also increased. These are deliberately artificial conditions, **not** a playable or naturally observed wave. Each ran 1,800 ticks, with periodic state checks:

| Mode | Fields | Elapsed on this sandbox | Largest serialized host snapshot | Checkpoint |
| --- | ---: | ---: | ---: | ---: |
| Four-player co-op | 1 | 281 ms | 14,385 bytes | 14,455 bytes |
| Two-versus-two | 2 | 330 ms | 26,185 bytes | 26,255 bytes |

These snapshot measurements are raw host objects, not full Firebase envelopes, sustained bandwidth or a worst-case size guarantee. They are below the adapter's per-view 262,144-byte and recovery checkpoint 1,048,576-byte ceilings. Each synthetic state also survived 200 local presence toggle cycles.

The local party-host protocol was separately exercised in co-op, versus, four-player co-op and 2v2: fill the 128-command queue and verify overflow rejection, then send 1,000 rounds of one direction command per player with duplicate retries and 40 disconnect/reconnect cycles. Applied plus cancelled commands matched accepted commands; sequence numbers remained consistent. In 2v2, disconnecting one player intentionally cancels **all four** players' queued commands (160 cancellations versus 40 in the other modes). This tests host logic only, not the Firebase SDK, actual transport, latency or host recovery.

The full local Node regression suite passed: **215/215 tests**, including existing story, network-adapter and bandwidth mock tests. No invariant failures or packet-size ceiling failures occurred in the workloads above. No live data was touched.

## Still required

- Real desktop and mobile browser runs, including long sessions, rendering/frame times, heat, battery, focus loss and fullscreen.
- Two-, three- and four-account games on real connections, including lag, disconnects, host recovery, bandwidth/Firebase costs, invitations and friend stats. Local mocks are not evidence of live Firebase scalability.
- Human balance testing across different loadouts, maps and skill levels, particularly the wave 15 defeats above; extended versus/2v2 matches with different strategies and actual winners.
- Broader campaign playtesting, much longer Endless sessions and additional seeds. Keep the checklist open until these are evaluated.
