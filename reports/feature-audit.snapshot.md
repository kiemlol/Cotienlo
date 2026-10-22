# Cổ Tiên Lộ frontend feature audit

Audit date: 22 October 2026. Clone source snapshot: 2026-10-22T02:28:37.557Z. Read-only inventory; game sources were not edited by this task. Intro observation/implementation is owned by the main agent and excluded from parity assessment.

The captured frontend contains 78 grouped systems, 120 resolved outgoing gameplay command names and 179 incoming message types in the latest bundle. All 287 inventoried UI text prefixes map to feature groups. The [machine-readable matrix](feature-matrix.json) retains exact call expressions, source locations, partial incoming read shapes, HTTP routes, version deltas and unresolved dynamic sends. These counts describe captured static surfaces, not a complete private protocol or working game parity.

No original server or database was recovered. Most unavailable behavior is authoritative state/rules behind existing UI: quests, progression, guilds/parties, shared markets, events, rankings, accounts and entitlements. Local replacements remain independent designs.

## Evidence and boundaries

- Baseline: [211,664-line recovered client](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:1), SHA-256 `726f08bc5080492e8bdddb7927adfb65ec11af51a2203608024fa84370fa7b1f`; REA recovery `ev_fd9914667b9963c615ef32856c557bb3489a4dd1fd5203724b2f7ab625bd1fb3`.
- Latest: [213,430-line recovered client](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:1), SHA-256 `6cc81964eff4e9884508be0db4f44d5ffd6edc2e0b5d53943703419e4aa870b8`; complete recovery `ev_f575ceb894d2ec9eaf56cc01ef3b631348fbe1052903631c27dd9f03b65b2580`.
- Baseline semantic graph was partial because its worker exhausted the 1,536 MiB heap. Latest whole-program semantic analysis was not rerun. This audit used inert AST parsing, source inspection and JSON comparisons; it is not new REA runtime evidence.
- Vendor React/Phaser/Colyseus internals are excluded. First-party scene/control/graphics/audio code, local workers and preview entrypoints are included. Recovery-generated JSX is readable derived code, not original authored TSX.
- Support was refreshed after concurrent integration of the latest client/data and combat/Gu inventory modules. The matrix records exact clone file hashes. Later edits can supersede these findings.

Main reports combat accepts 226/377 Gu with partial effect support and explicitly rejects 151; inventory has 15 passing tests. Those results were supplied by main and were not rerun here. Main also reports the actual guest opening/initial narrative was observed; its clone end logic remains independent. No exact server/intro-ending recovery is claimed.

## Baseline → latest

| Catalog | Baseline | Latest | Change |
|---|---:|---:|---|

| zones | 52 | 55 | +3, −0, 4 changed existing entries |

| gu | 276 | 377 | +101, −0, 48 changed existing entries |

| guGiacMo | 0 | 10 | +10, −0, 0 changed existing entries |

| item | 333 | 379 | +46, −0, 24 changed existing entries |

| beast | 81 | 88 | +7, −0, 0 changed existing entries |

| killer | 18 | 23 | +5, −0, 0 changed existing entries |

| recipe | 62 | 70 | +8, −0, 0 changed existing entries |

| npcCn | 21 | 22 | +1, −0, 0 changed existing entries |

| lichThuVuong | 7 | 8 | +1, −0, 0 changed existing entries |

| lichTuan | 12 | 13 | +1, −0, 0 changed existing entries |


New regions: `inst_hang_dia_thu`, `inst_huyet_soi_tuyet`, `inst_mong_canh_loan_chien`. There are 101 additional Gu, 46 items, seven beasts, five killer moves and eight recipes; all added/changed IDs are retained in JSON. Four existing regions, 48 existing Gu and 24 existing items changed. Balance changes affect `giao_dien`, `cultivation`, and `economy`.

New resolved outgoing names: `dai_hoi`, `mong_canh`, `o_do`, `quan_chien`, `tranh_cho`. New incoming types: `cau_ca_len`, `dai_hoi`, `loi_moi_ung_ho`, `mong_canh`, `quan_chien`, `tranh_cho`. No enumerated baseline command was removed: latest `loan_chien` and `giai_dau` moved into parameterized components, alongside `mong_canh` and `dai_hoi` ([L:213239](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:213239)).

Dream Gu overrides are a separate ten-entry `guGiacMo` dictionary, merged over base Gu for specific contexts ([L:126849](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126849), [L:126860](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126860)). Other additions include item quick slots, rare armor-set activation/transfer/decomposition, live spectating, fishing-record notifications, angler services, faction market contest, supporter invitation and guild-building nameplates. New text/data-only service labels do not establish server implementation.

Installed clone data now contains the latest catalog; its `bal` differs through the build's contact sanitization. Build targets the latest `index-ChkNmBLw.js`. Asset/client availability does not itself implement the corresponding rules.

## Priority handoff

1. P0 — Stabilize the client contract outside intro: quest state/turn-in, dialogue service routing, `ho_so` synchronization, chat string/identity fields, death/`ve`, and `dot_pha` preview/trial actions. Match dream context selection and save behavior. Existing independent combat/shop/Gu rules are a foundation, not authoritative parity.
2. P1 — Fill the single-player loop: consumables and quick slots; Gu care/nursery/mastery/stars; equipment/sets/sockets; original synthesis state machine; schools/potential; professions/gather/fishing; daily/weekly rewards and achievements. Define explicit local policies for unrecovered formulas, RNG, timers and reward tables.
3. P2 — Shared authority: parties, friends/mail, direct trade, markets/auctions, guild permissions/treasury/storage/buildings, matchmaking, world bosses/waves, tournament/event state, contributions and rankings. Each requires a persistent local simulation or a newly implemented backend; the public frontend cannot supply the original service.
4. P3 — Account/cloud identity, moderation/admin, supporter/payment entitlements, gift-code redemption and push delivery. Public admin UI is not authorization or recovered privileged functionality.

## Concrete contract gaps

| Priority | Gap | Evidence |
|---|---|---|

| P0 | Outside intro, runtime still emits an empty quest list. Original turn-in, auto-route, unlock and quest book consumers have no authoritative definitions/counters/rewards. | [L:138981](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:138981); [clone:51](/workspace/sites/cotienlo-game/src/runtime.mjs:51) |

| P0 | Original xm sends a string; clone send('chat') reads p.noi/p.text/p.noiDung and emits ten rather than tu. Nonempty text and attribution will not preserve original contract. | [L:201267](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201267); [clone:96](/workspace/sites/cotienlo-game/src/runtime.mjs:96) |

| P0 | Original dot_pha has hd:'xem' preview and hd:'vao' trial. Clone ignores hd and immediately attempts its local 100-training breakthrough rule. | [L:202414](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:202414); [clone:95](/workspace/sites/cotienlo-game/src/runtime.mjs:95) |

| P0 | Death UI sends ve; audited core handles hoi_sinh (an adapter-only outgoing convenience) and has no ve branch. New combat leaves zero HP for host flow; outside-intro death/return integration remains missing. | [L:139808](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:139808); [clone:98](/workspace/sites/cotienlo-game/src/runtime.mjs:98) |

| P0 | Original tL is intro, inst_mo_lai_* or exact inst_mong_canh_loan_chien. Combat prefix startsWith('inst_mo') also activates overrides in inst_mo_cu_tang_sau; contexts should match the original predicate. | [L:126853](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126853); [clone:37](/workspace/sites/cotienlo-game/src/systems/combat.mjs:37) |

| P1 | Public killer catalog has components/FX/timing but no complete authoritative damage/CN effects. Clone explicitly rejects killer moves; deriving original formulas from component lists would be speculation. | [L:167585](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:167585); [clone:387](/workspace/sites/cotienlo-game/src/systems/combat.mjs:387) |

| P1 | Latest item HUD reads ho_so.oDo and sends o_do. Profile-defaults and core/module dispatch omit assignment state/handler. | [L:166706](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166706); [clone:71](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:71) |

| P1 | New Gu/shop/craft/combat modules are integrated but only bounded subsets. Original care/nursery/star progression/equipment/hop_luyen/professions/daily/achievement systems remain incomplete. | [L:143786](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143786); [clone:73](/workspace/sites/cotienlo-game/src/runtime.mjs:73) |

| P2 | Build CSS hides several recovered system buttons (guild, friends/team finder, mail, achievements, rankings, notices/support where matching attributes exist). A hidden frontend does not make its authoritative feature implemented. | [L:213239](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:213239); [clone:23](/workspace/sites/cotienlo-game/scripts/build.mjs:23) |


## Feature matrix

Statuses: **partial local** = independent subset; **UI only** = view/defaults without working authority; **server dependent** = shared/privileged authority absent; **absent** = required state/handler missing; **local UI** = mostly local presentation/control code, not browser-verified by this audit. B/L are baseline/latest recovered source references. Source locations are static evidence, not proof of executed behavior.

| ID / system | Priority / status | Current support and remaining gap | References |
|---|---|---|---|

| `session` — Rooms, transfer, reconnect and connection health | P0; partial local | Room and callback facsimile; every join produces a local room. No channel population, network reconnect, transfer ticket or authoritative clock. | [B:49512](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:49512) [L:49566](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49566) [L:49606](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49606) [clone:26](/workspace/sites/cotienlo-game/src/runtime.mjs:26) |

| `accounts` — Accounts, guest linking and character roster | P2; server dependent | Guest key/name entry works locally; /api/tai-khoan/bat is forced false. Email login, refresh, roster and deletion are unavailable. | [B:49100](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:49100) [L:49175](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49175) [L:49292](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49292) [clone:8](/workspace/sites/cotienlo-game/src/runtime.mjs:8) |

| `world` — World maps, actor population and region transitions | P0; partial local | Recovered latest map rendering with local NPCs and limited beast population; extra travel menu now lists every zone_* entry. No original spawn tables, scripted region state or authoritative instance lifecycle. | [B:199110](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:199110) [L:200856](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:200856) [L:196930](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:196930) [clone:49](/workspace/sites/cotienlo-game/src/runtime.mjs:49) |

| `movement` — Movement, dash, collision and prediction | P0; partial local | Client prediction and local physics process in packets; runtime now scales physics speed from player.tocDo and flight. Remote reconciliation authority is absent; stun/root movement constraints still need end-to-end verification. | [B:199042](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:199042) [L:200785](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:200785) [L:200836](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:200836) [clone:74](/workspace/sites/cotienlo-game/src/runtime.mjs:74) |

| `navigation` — Map discovery, fog, target routes and auto travel | P1; UI only | Minimap/world-map UI remains; no kham_pha payload, original quest destinations, discovery persistence or server route offers. | [B:160756](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:160756) [L:162303](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:162303) [L:200700](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:200700) [clone:51](/workspace/sites/cotienlo-game/src/runtime.mjs:51) |

| `combat` — Combat targeting, Gu casting, AoE and combat FX | P0; partial local | Concurrent integration now routes dung/sat_chieu into createCombat. It implements catalog-based direct damage/heal, supported AoE, cooldowns/CN, held skills, selected status effects and flight. Killer moves, passives, advanced conditional effects/synergies, projectile/terrain collision and original scaling remain absent. | [B:197550](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:197550) [L:199252](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:199252) [L:198147](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:198147) [clone:380](/workspace/sites/cotienlo-game/src/systems/combat.mjs:380) |

| `status` — Health, stamina, buffs, wounds, death and revival | P0; partial local | New combat module supplies shields/reduction/DOT/HoT and selected debuffs; default beast AI is independently estimated. Death leaves HP zero; original nga/timer/ve revival flow remains unimplemented by this runtime outside intro. | [B:49848](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:49848) [L:49935](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49935) [L:139765](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:139765) [clone:461](/workspace/sites/cotienlo-game/src/systems/combat.mjs:461) |

| `cultivation` — Meditation, absorption and cultivation minigames | P0; partial local | Concurrent runtime now handles hap, mini cancellation/hold/auto and emits tu_luyen mini state. Uses local 1 stone/1.5s → 4 training and +20 CN; ngoi still grants training every 250ms. Original timing/grading and conversion formulas remain incomplete. | [B:197325](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:197325) [L:199017](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:199017) [L:202893](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:202893) [clone:92](/workspace/sites/cotienlo-game/src/runtime.mjs:92) |

| `breakthrough` — Realm breakthroughs and rebirth | P1; partial local | dot_pha ignores hd and uses 100 local training plus 30×rank stones; rank increment is an estimate. Challenge preview, realm trial, aptitude and trung_tu confirmation are absent. | [B:163254](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:163254) [L:164801](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164801) [L:202403](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:202403) [clone:115](/workspace/sites/cotienlo-game/src/runtime.mjs:115) |

| `offline` — Seclusion, leave summary and idle hunting | P1; UI only | Profile contains unopened beQuan/treo defaults; treo and ren_than_tu are unhandled. No elapsed-time settlement or offline reward accounting. | [B:149069](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:149069) [L:149729](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149729) [L:149788](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149788) [clone:152](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:152) |

| `profile` — Character sheet, stat sources and potential points | P1; UI only | Static starter stats can render; tiem_nang allocation/reset and derived source breakdowns are not implemented. | [B:128817](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:128817) [L:128056](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128056) [L:142354](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:142354) [clone:98](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:98) |

| `schools` — Schools, ranks, traits, manuals and body training | P1; UI only | A fixed nguyet school stub is seeded; choosing/switching school, reading manuals and rank/trait progression are absent. | [B:147660](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:147660) [L:143146](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143146) [L:138758](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:138758) [clone:117](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:117) |

| `gu` — Gu ownership, refining, slots, feeding and care | P0; partial local | New inventory module handles co {lap,go,luyen,an}, checks slots/rank/birth Gu, uses catalog food and hunger ticks. Refining is immediate at an invented 20 NT + 10 CN per rank. Care, death/resurrection, nursery, release and disenchantment remain unhandled. | [B:167257](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:167257) [L:168864](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:168864) [L:143786](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143786) [clone:192](/workspace/sites/cotienlo-game/src/systems/gu-inventory.mjs:192) |

| `gu_mastery` — Gu familiarity, training, star upgrades and rerolls | P1; UI only | Default familiarity/star fields render but do not advance; luyen_san, dan_thuan_thuc and tay_luyen have no implementation. | [B:136047](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:136047) [L:136092](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136092) [L:168648](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:168648) [clone:10](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:10) |

| `birth_gu` — Birth Gu swapping and fragment exchange | P1; UI only | Starter birth flag exists; swap, fragment conversion and recipe-fragment redemption are unhandled. | [B:148912](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:148912) [L:149572](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149572) [L:166389](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166389) [clone:23](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:23) |

| `killer_moves` — Killer moves, loadouts and combo requirements | P1; UI only | satChieu arrays are empty; slot installation is unhandled and casting explicitly rejected. | [B:138672](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:138672) [L:138758](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:138758) [L:167509](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:167509) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `recipes` — Gu synthesis, recipe learning and library | P1; partial local | New che handler consumes published recipe inputs/CN and immediately succeeds through che_tao. Separate original hop_luyen library/minigame/timers/probabilities, birth-Gu recipes and recipe learning remain absent. | [B:144629](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:144629) [L:140408](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:140408) [L:140438](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:140438) [clone:307](/workspace/sites/cotienlo-game/src/systems/gu-inventory.mjs:307) |

| `inventory` — Inventory, consumables, disposal and capacity | P0; partial local | New module processes purchases/sales and one consumable: cao_cam_mau heals 40/5s. Inventory capacity is checked on purchases. Other consumables, vut, mo_rong_tui and o_do remain absent. | [B:165656](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:165656) [L:167226](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:167226) [L:166825](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166825) [clone:334](/workspace/sites/cotienlo-game/src/systems/gu-inventory.mjs:334) |

| `quick_items` — Item quick slots (October 22) | P1; absent | Latest client quick-slot UI is available, but profile has no oDo and local dispatch has no o_do handler; Z/G assignment and persistence remain absent. | [L:130149](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:130149) [L:166706](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166706) [clone:71](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:71) |

| `equipment` — Armor, sets, enhancement, sockets and rare gear | P1; UI only | Empty hoCu profile shell; equip/upgrade/socket/reforge are unhandled. Latest adds rare-set bonuses, decomposition/sale and level transfer. | [B:147077](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:147077) [L:141400](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:141400) [L:141432](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:141432) [clone:80](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:80) |

| `appearance` — Cosmetics, titles, portraits and privacy | P2; UI only | Gender/color starter avatar renders; titles, outfits, accessories, frames, birth display and profile privacy updates are unhandled. | [B:209246](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:209246) [L:211018](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:211018) [L:142213](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:142213) [clone:85](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:85) |

| `npc_shop` — NPC shop, clan stock, medicines and reputation shops | P1; partial local | Generic local shop now emits cua_hang and supports mua/ban using reconstructed stock/prices; NPC dialogue offers custom shop/craft/train/heal choices. Original NPC-specific stock/rotation, reputation, weekly limits and services are absent. | [B:148660](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:148660) [L:144146](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144146) [L:140913](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:140913) [clone:111](/workspace/sites/cotienlo-game/src/systems/gu-inventory.mjs:111) |

| `market` — Marketplace, listings, purchase orders and merchant guild | P2; server dependent | Recovered multi-tab UI exists but no cho state, listing IDs, order fills, companion transfer or transaction processing. | [B:133703](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:133703) [L:133719](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:133719) [L:134160](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:134160) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `market_watch` — Market search, watchlists and price notifications | P2; server dependent | cho_tim and cho_theo_doi have no local implementation or incoming data. | [B:134665](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:134665) [L:134683](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:134683) [L:134721](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:134721) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `auction` — Live auctions, bids and rare lots | P2; server dependent | dau_gia is unhandled; auction view/timer never supplied. | [B:149360](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:149360) [L:150146](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:150146) [L:150366](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:150366) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `trade` — Direct trade, revisions, locks and blood contracts | P2; server dependent | giao_dich and khe_uoc absent; no parties, revisions, offers, locking or confirmation. | [B:158580](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:158580) [L:160116](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:160116) [L:209877](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:209877) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `storage` — Personal chest and guild storage | P1; UI only | hom_do is unhandled and guild storage unavailable; inventory is the only persistence container. | [B:158342](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:158342) [L:159878](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159878) [L:166722](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166722) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `professions` — Professions, crafting and production | P1; partial local | Local generic che_tao recipe crafting is now available; profession learning/switching, XP and profession-specific production remain unimplemented. | [B:144196](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:144196) [L:141518](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:141518) [L:143437](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143437) [clone:149](/workspace/sites/cotienlo-game/src/systems/gu-inventory.mjs:149) |

| `gathering` — Gather nodes, hold/release and resource depletion | P0; partial local | F on a nearby nguon_hai now calls instant local herb gathering; extra button still grants herbs anywhere on 3-second cooldown. Original hai duration/release, depletion and node-specific drops remain absent. | [B:207958](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:207958) [L:209730](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:209730) [clone:114](/workspace/sites/cotienlo-game/src/runtime.mjs:114) |

| `garden` — Home, gardening, helping visitors and home beasts | P2; UI only | Empty vuon state and soTuoi placeholders; no crop growth, sow/water/harvest, visiting, breeding or visitor contracts. Some latest additions are data/text only. | [B:137656](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:137656) [L:137704](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:137704) [clone:137](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:137) |

| `fishing` — Fishing, bait, pull minigame and records | P1; UI only | No fishing state or cau_ca/mini rules; latest adds angler NPC, rod/bait content, records and catch-size notices. | [B:139739](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:139739) [L:144402](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144402) [L:144440](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144440) [clone:135](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:135) |

| `companions` — Taming, pets, mounts and companion equipment | P1; UI only | thuNha/thuPho empty; no capture/summon/ride/rename/feed/release or tb_thu support. | [B:162135](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:162135) [L:163682](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:163682) [L:134160](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:134160) [clone:132](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:132) |

| `quests` — Main/side quests, memory book and quest turn-in | P0; absent | nv is always {ds:[],xong:0,kyUc:[]}; nv_xong is unhandled. Extra 3-kill/3-herb chapter reward is invented and unrelated to original quest state. | [B:167568](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:167568) [L:169175](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:169175) [L:138981](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:138981) [clone:51](/workspace/sites/cotienlo-game/src/runtime.mjs:51) |

| `dialogue` — NPC services, dialogue choices, stories and cutscenes | P0; partial local | NPC F now emits a custom lua_chon panel with shop/craft/train/heal/close options and local transitions. Original service/story choice trees, non-intro cutscenes and story acknowledgements are still absent. Intro is excluded. | [B:200131](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:200131) [L:201877](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201877) [L:128548](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128548) [clone:104](/workspace/sites/cotienlo-game/src/runtime.mjs:104) |

| `help` — Handbook, help, strength advice and unlock gates | P1; UI only | Seeded mo IDs force core panels visible. huong_dan/manh_len_xem are silently ignored, so server help/strength data never arrives. | [B:139437](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:139437) [L:139524](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:139524) [L:169663](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:169663) [clone:146](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:146) |

| `daily` — Daily activities, login rewards, activity chests and weekly goals | P1; UI only | homNay/activity/week/login fields are empty defaults; reward commands unhandled. Calendar is recovered display data only. | [B:202261](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:202261) [L:204007](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:204007) [L:137739](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:137739) [clone:139](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:139) |

| `achievements` — Achievement book, Gu encyclopedia and title unlock trees | P1; UI only | Starter VCL records four Gu; no point/milestone/achievement claims or encounter ledger. | [B:209246](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:209246) [L:211018](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:211018) [L:136601](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136601) [clone:123](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:123) |

| `encounters` — Exploration, random encounters and dream replays | P1; UI only | No ky_ngo/kham_pha/replay messages or event sequencing. Dream-context content exists in the original client, with new overrides in October 22. | [B:136491](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:136491) [L:136539](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136539) [L:136601](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136601) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `dream_rules` — Dream-specific Gu definitions (October 22) | P0; partial local | New combat module merges current guGiacMo when zone startsWith('inst_mo'). Latest original uses exact intro/replay/dream-battle predicates: local prefix also wrongly includes inst_mo_cu_tang_sau. Unsupported dream effects and killer moves remain. | [B:128953](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:128953) [L:126849](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126849) [L:126860](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126860) [clone:37](/workspace/sites/cotienlo-game/src/systems/combat.mjs:37) |

| `dungeons` — Party instances, difficulty, invitations and entry gates | P2; UI only | Door instance travel creates an ordinary local room; no party checks, difficulty, tickets, shared room or dungeon progress. | [B:132213](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:132213) [L:131438](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131438) [L:131474](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131474) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `trial_tower` — Trial tower, floors and rewards | P2; UI only | No thap/thap_tang messages or tower progression. | [B:154212](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:154212) [L:155300](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155300) [L:155371](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155371) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `heritage_tower` — Heritage, secret floors, books and exchanges | P2; UI only | lau/truyen_thua/doc_sach/quan_nhu are unhandled. | [B:154348](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:154348) [L:155436](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155436) [L:159983](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159983) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `arena` — Arena duels, NPC practice, shadows and 3v3 | P2; server dependent | Arena HUDs exist, but queue/matches/shadows, ratings and 3v3 rules absent. | [B:156587](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:156587) [L:157825](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:157825) [L:164434](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164434) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `tournaments` — Tournament brackets and Đại Hội (October 22 extension) | P2; server dependent | giai_dau ignored; no brackets, registration, progression or results. Latest reuses a parameterized panel for dai_hoi and supports spectating. | [B:157658](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:157658) [L:158999](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158999) [L:159300](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159300) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `spectating` — Live match spectating (October 22) | P2; absent | No quan_chien protocol or actor aggregation. Latest tournament row sends xem_tran; spectator HUD reads live players/actors. | [L:158827](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158827) [L:159687](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159687) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `battlefield` — Battlefield queue, factions, score and results | P2; server dependent | No chien_truong state or matchmaking; recovered map alone does not implement rules. | [B:156872](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:156872) [L:158110](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158110) [L:158240](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158240) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `battle_royale` — Battle royale and dream battle event | P2; server dependent | loan_chien ignored; no shrinking circle, elimination, registration or dream boss/participation state. Latest adds mong_canh channel. | [B:157220](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:157220) [L:158424](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158424) [L:213239](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:213239) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `world_boss` — World bosses, rare leaders and contribution settlement | P2; UI only | Local beasts use 80 HP defaults and generic chase/damage. Boss schedules render from data but no global spawn/contribution/rare-leader contract. | [B:158247](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:158247) [L:159783](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159783) [L:139647](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:139647) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `world_events` — Beast/wolf waves, mine contest and moon-night events | P2; server dependent | thu_trieu/tranh_mo/dem_trang have HUDs but no simulated phases, objectives or settlement. | [B:154598](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:154598) [L:155686](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155686) [L:155845](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155845) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `market_battle` — Faction market contest (October 22) | P2; absent | No tranh_cho handling, faction selection or fort state. | [L:155756](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155756) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `season` — Seasonal milestones, cultivation race and community targets | P2; server dependent | mua_su_kien has no response/state; race/community progress is unavailable. | [B:154122](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:154122) [L:155210](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155210) [L:150476](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:150476) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `puzzles` — Formation, recipe-combination and Gu quiz games | P2; UI only | tran_do/phoi_phuong/luan_co have recovered UI only. | [B:152896](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:152896) [L:153989](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:153989) [L:151054](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151054) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `stone_games` — Stone gambling, appraisal and lucky chests | P2; UI only | do_thach/ruong_may/chon_qua absent; no appraisal progress, RNG or chest selection. | [B:144196](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:144196) [L:148723](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:148723) [L:151498](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151498) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `caravan` — Caravans, relay transport and escort jobs | P2; UI only | xe_tram/thuong_doi missing; no relay fare/loading, escort waypoint or caravan phases. | [B:144068](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:144068) [L:148594](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:148594) [L:147699](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147699) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `procurement` — Procurement, bounty boards and work contracts | P2; UI only | thu_mua/cao_thi_bang unhandled; no inventory reservation or quest contracts. | [B:156339](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:156339) [L:157577](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:157577) [L:157660](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:157660) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `treasure` — Treasure hunt, incense and travel fund | P2; server dependent | san_kho_bau ignored; huong_hoa/quy_chuyen_di unhandled. | [B:153997](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:153997) [L:155085](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155085) [L:154555](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154555) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `dark_zone` — Dark-zone entrance and mutation instance | P2; UI only | bien_di payload/ward options and dynamic entrance ID processing absent. | [B:150870](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:150870) [L:151656](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151656) [L:151675](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151675) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `party` — Parties, roles, invites, team finder and matchmaking | P2; server dependent | ghep_to silently ignored; tim_to/to_lenh unhandled. Every local room has one hero. | [B:132090](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:132090) [L:131323](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131323) [L:204983](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:204983) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `friends` — Friends, block list, reports and inspect player | P2; server dependent | ban_be ignored; xem_nguoi/to_cao unhandled; no remote player identity or social storage. | [B:203237](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:203237) [L:204983](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:204983) [L:132152](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:132152) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `chat` — Chat channels, whisper, megaphone and emotes | P2; partial local | chat only echoes locally with kenh=vung and ten; original UI expects tu/noi and server channel metadata. chat_kenh/chat_to/chat_bang/loa/bieu_cam unhandled. | [B:199489](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:199489) [L:201235](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201235) [L:201170](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201170) [clone:96](/workspace/sites/cotienlo-game/src/runtime.mjs:96) |

| `mail` — Mail, attachments, claim/delete and compose | P2; server dependent | thu ignored; no thu_ds, item/Gu/stones attachment transfer, unread state or send receipt. | [B:202629](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:202629) [L:204375](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:204375) [L:204540](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:204540) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `mentors` — Mentor/apprentice, transmission and sworn bonds | P2; server dependent | su_do/truyen_dao/ket_nghia absent; no invitations, relationships or weekly benefits. | [B:132527](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:132527) [L:131752](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131752) [L:131680](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131680) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `guild` — Guild creation, search, members, ranks and treasury | P2; server dependent | bang_lenh absent; guild/profile and actor tags remain defaults. | [B:135606](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:135606) [L:135647](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:135647) [L:147816](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147816) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `guild_progress` — Guild buildings, formation, shops and daily/weekly work | P2; server dependent | No shared guild progression. Latest adds in-world building nameplates and periodic building refresh. | [B:204400](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:204400) [L:206163](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:206163) [L:154863](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154863) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `guild_events` — Guild duels, banquets, elder challenges and headquarters battles | P2; server dependent | bang_ud/bang_yen/bang_sh/gia_lao unhandled; no duel roster/schedule, feast quiz or HQ match state. | [B:204700](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:204700) [L:206467](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:206467) [L:154673](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154673) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `leaderboards` — Leaderboards, weekly rankings and combat record | P2; server dependent | xep_hang unhandled; no population or ranking source. | [B:143581](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:143581) [L:148107](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:148107) [L:155012](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155012) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `notices` — News, bulletin, schedule and announcement badges | P1; UI only | tin_moi/bang_tb silently ignored. Local toast works; no unread/bulletin state or claim-related announcement payloads. | [B:210781](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:210781) [L:212553](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:212553) [L:212789](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:212789) [clone:97](/workspace/sites/cotienlo-game/src/runtime.mjs:97) |

| `support` — Supporter packages, VIP/club and gift codes | P3; server dependent | ung_ho/giftcode unhandled; latest adds contextual supporter invitation. No entitlement/payment/claim authority. | [B:151135](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:151135) [L:152391](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:152391) [L:151969](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151969) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `admin` — Administrative panels and developer diagnostics | P3; server dependent | Public client includes admin panel and debug hooks; no local admin handlers or privilege authority. /gm is text sent on chat, not evidence of server command implementation. | [B:203422](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:203422) [L:205168](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:205168) [L:205342](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:205342) [clone:44](/workspace/sites/cotienlo-game/src/profile-defaults.mjs:44) |

| `settings` — HUD, keyboard/touch, accessibility and display preferences | P1; local UI | Recovered local preferences, layouts, controls and latest UI are targeted by current build; several system menu buttons are CSS-hidden by build.mjs:23. No browser execution verification was done for this audit; server privacy flags remain absent. | [B:206566](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:206566) [L:208338](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:208338) [L:208090](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:208090) [clone:17](/workspace/sites/cotienlo-game/src/runtime.mjs:17) |

| `presentation` — World art, effects, weather, lighting, audio and performance | P1; partial local | Recovered first-party scene/render/audio systems remain; adapter fixes gio=12 and thoiTiet=nang and emits only simple FX. No original weather changes, environmental hazards or full effect events. | [B:208970](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:208970) [L:210742](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:210742) [L:137552](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:137552) [clone:46](/workspace/sites/cotienlo-game/src/runtime.mjs:46) |

| `pwa` — App install, push notifications and update notices | P3; partial local | Install/update UI is recovered; push requests are ignored, and no delivery backend exists. No browser notification prompt was triggered during audit. | [B:206443](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:206443) [L:208215](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:208215) [L:213368](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:213368) [clone:97](/workspace/sites/cotienlo-game/src/runtime.mjs:97) |

| `save` — Local save, export and persistence limits | P0; partial local | Concurrent runtime writes version:2 under existing ctl.playable.v1.* key and saves profile/progress/position every 4s, leave/pagehide, plus export. Gu inventory adds its own versioned profile state. No general schema migration or cloud/account sync is established. |  [clone:67](/workspace/sites/cotienlo-game/src/runtime.mjs:67) |

| `catalog` — Public content and latest balance migration | P0; partial local | Installed dist catalog now has 55 zones, 377 Gu, 379 items, 88 beasts, 23 killer moves, 70 recipes and 10 dream overrides. Build targets latest index-ChkNmBLw.js; installed game data differs from live only in bal (contact sanitization). Catalog presence does not implement server gameplay. | [B:37131](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:37131) [L:37189](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:37189) [L:126860](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126860) [clone:4](/workspace/sites/cotienlo-game/scripts/build.mjs:4) |

| `content_only` — Dialogue/content-only services with no dedicated wire command | P2; UI only | Labels/data imply brewing, garden/home visitors, home beasts, inn services, NPC encounters, lucky fish and supply/medicine actions. No dedicated handler is proved for a label alone; generic f/thoai/mini route these if the server supplies them. | [B:129294](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:129294) [L:128548](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128548) [L:128681](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128681) [clone:101](/workspace/sites/cotienlo-game/src/runtime.mjs:101) |

| `justice` — Combat flag, justice, reputation and wanted-state | P2; UI only | co_chien is unhandled; coChien=false and theDao.thanPhan=tan_tu are seeded. No conflict flag toggling, reputation/justice consequences or bounty authority. | [B:143104](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:143104) [L:147629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147629) [L:137351](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:137351) [clone:44](/workspace/sites/cotienlo-game/src/runtime.mjs:44) |

| `workers` — Procedural world/tree workers, caches and render fallbacks | P1; local UI | Latest client has first-party scene-generation workers and procedural tree worker with MessageChannel, OffscreenCanvas/bitmap and IndexedDB paths plus main-thread fallbacks. Installed auxiliary scripts parse; no worker execution was performed. | [B:142700](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:142700) [L:147152](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147152) [L:147285](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147285) [clone:4](/workspace/sites/cotienlo-game/scripts/build.mjs:4) |

| `preview` — Beast animation/asset preview and developer scene tools | P3; local UI | ?xem=thu loads first-party preview scene; debug window.__game includes inspection, FX and local GUI hooks. These are developer utilities, not implemented gameplay systems. | [B:211649](/workspace/cotienlo-recovered/recovered/main/modules/bundle.js:211649) [L:213421](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:213421) [L:197674](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:197674) [clone:4](/workspace/sites/cotienlo-game/scripts/build.mjs:4) |


## Original outgoing command catalog

This enumerates 120 resolved latest command names; all 115 baseline names remain. `W(type, payload={})` forwards application messages to the room. Payloads below are compact source-derived summaries; exact baseline/latest call expressions and every indexed call site are in `network.outgoing` in JSON. Source variables stand for values supplied by the enclosing UI/scene. Unknown spreads and dynamic values are preserved, not guessed into server schemas. Requests through generic `f`/`thoai` may open many additional services.

Latest client throttles `f` at six/second and the `dung`/`sat_chieu`/`sat_chieu_lap` group at twelve/second; `hai_tha` explicitly bypasses that wrapper throttle. These are client rules, not evidence of server enforcement.

| Command | Payload/call variants (bounded summary) | Clone | Latest reference |
|---|---|---|---|

| `admin` | { hd: `ung_ho_goi`, goi: r }; p === `luu` ? { hd: `ung_ho_sua`, goi: r, nt: Number(s) \|\| 0, do: l } : { hd: `ung_ho_sua`, goi: r, dat_lai: true }; { hd: `mo` }; { hd: `thong_bao`, noi: w }; { hd: `goi_thu_vuong`, id: A … | unhandled | [L:205210](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:205210) |

| `ban` | { id: e.id, so: t } | partial local | [L:141072](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:141072) |

| `ban_be` | { viec: t ? `nhan` : `tu_choi`, tu: e.tu }; { viec: `xem` }; { viec: `xoa`, id: e.id }; { viec: `bo_chan`, id: e.id }; { viec: `moi`, session: e.id }; t ? { viec: `bo_chan`, id: t.id } : { viec: `chan`, session: e.id } | silently ignored | [L:132184](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:132184) |

| `bang_lenh` | {viec:'viec_nhan',id,ngay?:true}; {viec:'viec_nop',id:undefined,ngay?:true}; {viec:'viec_huy',id:undefined,ngay?:true}; {viec:'nhuong'\|'duoi',dich}; {viec:'roi',dich:undefined} | unhandled | [L:147979](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147979) |

| `bang_sh` | { hd: `ao` }; { hd: `xem` }; { hd: `huong`, bac: n }; { hd: `tuan` } | unhandled | [L:154889](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154889) |

| `bang_tb` | { hd: `da_xem`, ...capNhat ? { capNhat } : {} }; { hd: `xem` } | silently ignored | [L:153630](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:153630) |

| `bang_ud` | { hd: e, ...t }; {hd: `nhan`, ...({ id: r.id })}; {hd: `tu_choi`, ...({ id: r.id })}; {hd: `rut`, ...({ id: r.id })}; {hd: `doi_hinh`, ...({ id: r.id, ds: d })}; {hd: `xem`, ...({})}; {hd: `gui`, ...({ den: r, gio: b })} | unhandled | [L:206457](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:206457) |

| `bang_yen` | { hd: `xem` }; { hd: `mo`, muc: n }; { hd: `tl`, cau: n_cau.i, chon: e } | unhandled | [L:154693](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154693) |

| `bieu_cam` | { ma: e } | unhandled | [L:201451](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201451) |

| `canh_dung_xong` | { id: r, bo: boQua, ...n && !boQua ? { loi: true } : {} } | unhandled | [L:195058](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:195058) |

| `cao_thi_bang` | { hd: `nhan`, id: n.id }; { hd: `doi` } | unhandled | [L:157736](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:157736) |

| `cau_ca` | { hd: `giat` }; { hd: `thoi` } | unhandled | [L:144496](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144496) |

| `chat` | text:string | partial local | [L:194690](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:194690) |

| `chat_bang` | a | unhandled | [L:201257](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201257) |

| `chat_kenh` | { kenh, noi: a, toi: s.trim() } | unhandled | [L:201261](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201261) |

| `chat_to` | a | unhandled | [L:201259](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201259) |

| `che` | { ma: e.ma, so: 1 }; { ma: e.ma, so: 5 } | partial local | [L:144359](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144359) |

| `chien_truong_hang` | { hd: `roi` } | unhandled | [L:158403](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158403) |

| `cho` | {ma: ime(), ...({ hd: `mon`, mon: e.mon })}; { ma: ime(), ...e }; {ma: ime(), ...({ hd: `mua`, id: r.id, mon: m.mon, xacNhan: true })}; {ma: ime(), ...({ hd: `mua`, id: r.id, mon: m.mon })}; {ma: ime(), ...({ hd: `treo`… | unhandled | [L:133784](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:133784) |

| `cho_theo_doi` | { hd: `xem` }; { hd: n ? `bo` : `them`, mon }; { hd: `bo`, mon: n.mon }; { hd: `them`, mon: e } | unhandled | [L:134687](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:134687) |

| `cho_tim` | { mon: t } | unhandled | [L:134765](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:134765) |

| `chon_qua` | { id: e.id, gu: gu_1 } | unhandled | [L:149515](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149515) |

| `co` | { luyen_san: g.uid }; { giai_luyen: g.uid }; { lap: f.uid, o: t, biDong: e }; { cham: `het` }; { hoi_sinh: r.uid }; { cham: r.uid }; { an: r.uid }; { luyen: r.uid }; { an: u.uid, mon: e.id }; { lap: cRef.current, o: sRe… | partial local | [L:136177](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136177) |

| `co_chien` | { bat: !t } | unhandled | [L:147673](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147673) |

| `dai_dien` | { a: e }; { k: e } | unhandled | [L:133527](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:133527) |

| `dai_hoi` | { hd: `xem_tran`, bang, i: c.qc }; { hd: `xem`, bang: t }; { hd: `xem` }; { hd: `xem`, bang: g?.bang ?? 0 }; { hd: i.daDangKy ? `roi` : `vao` } | unhandled | [L:158859](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158859) |

| `dan_thuan_thuc` | { hd: `dung`, uid: t.uid } | unhandled | [L:151906](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151906) |

| `danh_hieu` | { bat: e.bat ? null : e.key } | unhandled | [L:164627](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164627) |

| `danh_vong` | { hd: `xem` }; { hd: `mua`, phe: o.phe, id: e.id, so: 1 } | unhandled | [L:164214](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164214) |

| `dau_gia` | { hd: `xem` }; { hd: `dong` }; { hd: `tra`, lo: c(e), gia } | unhandled | [L:150119](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:150119) |

| `do_deo` | { hd: `thao`, o: i }; { hd: `deo`, id: t.id }; { hd: `deo`, id } | unhandled | [L:142299](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:142299) |

| `do_thach` | { hd: `mo_da`, ...e }; { hd: `giam`, muc: n } | unhandled | [L:148817](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:148817) |

| `doi_ban_menh` | { uid: o.uid } | unhandled | [L:149645](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149645) |

| `doi_manh` | { hd: `xem`, id }; { hd: `doi`, vao: i, ...i.length === 3 ? { ra: o } : {} } | unhandled | [L:166420](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166420) |

| `dot_pha` | { hd: `xem` }; { hd: `vao` } | partial local | [L:126623](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126623) |

| `dung` | {o:'tay'\|slotIndex,x,y,muc?:actorId,dat?:true} | partial local | [L:199291](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:199291) |

| `dung_do` | { id: r }; { id }; { id: n }; { id: e } | partial local | [L:143782](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143782) |

| `f` | { id: `cua_kho:${e.noi}`, vao: true, an: n }; { id: e.xep }; { id: t.id }; { id: a.id }; { id: ganNhat.id }; { id: t_ganNhat.id }; { id: e.id }; { id: u.id } | partial local | [L:151712](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151712) |

| `ghep_to` | { hd: `xem` }; { hd: `vao_ngay` }; { hd: `roi` }; { hd: `vao`, dg: dg_1, doKho: `thuong` }; { hd: `vao`, dg: dg_1, doKho: `kho` } | silently ignored | [L:130521](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:130521) |

| `gia_lao` | { hd: `nhan` }; { hd: `khieu_chien`, id: t.id }; { hd: t ? `dong_y` : `tu_choi`, tu: e.tu } | unhandled | [L:149219](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149219) |

| `gia_mon` | { mon } | unhandled | [L:143325](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143325) |

| `giai_dau` | { hd: `xem`, bang: t }; { hd: `xem` }; { hd: `xem_tran`, bang, i: c.qc }; { hd: `xem`, bang: g?.bang ?? 0 }; { hd: i.daDangKy ? `roi` : `vao` } | silently ignored | [L:159183](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159183) |

| `giao_dich` | {hd:'huy'\|'nhan'\|'khoa'\|'dong_y'\|'khe_uoc'\|'khe_uoc_ok',id,rev}; {hd:'sua',id,rev,nt,co:uid[],do:[{id,so}]} | unhandled | [L:160168](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:160168) |

| `giftcode` | { ma: e } | unhandled | [L:208708](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:208708) |

| `hai_tha` | {} | unhandled | [L:209766](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:209766) |

| `hap` | {giu: this.rGiu} | partial local | [L:199027](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:199027) |

| `hien_ban_menh` | { bat: true }; { bat: false } | unhandled | [L:208511](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:208511) |

| `ho_cu` | {hd:'phan_giai',i}; {hd:'ban',i}; {hd:'chuyen_cap',i} | unhandled | [L:142698](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:142698) |

| `hom_do` | { hd: n.ben === `tui` ? `gui` : `rut`, id: n.id, so: d }; { hd: `nang` } | unhandled | [L:159907](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159907) |

| `hop_luyen` | { hd: `dong` }; { hd: `ghep` }; { hd: `doc` }; { hd: `ghep`, id: t.id }; { hd: `hoc`, id: t.id }; { hd: `bat_dau`, id: r_1.id, ...uid ? { uid } : {} }; { hd: `doi_manh_cp`, id, so: 1 }; { hd: `doi_manh_cp`, id, so: i } | unhandled | [L:140484](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:140484) |

| `huong_dan` | { hd: `doc`, id: e }; { hd: `di`, id: e.id }; { hd: `xem` }; { hd: `di`, id: di }; { hd: `doc`, id: e.id } | silently ignored | [L:152844](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:152844) |

| `huong_hoa` | { hd: `dang`, so: n } | unhandled | [L:154619](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154619) |

| `in` | {seq:number,dx:number,dy:number,luot:boolean,ax:number,ay:number} | partial local | [L:200836](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:200836) |

| `inst_to_nhan` | { room: i.room, moi: true }; { room: e.room } | unhandled | [L:160447](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:160447) |

| `ket_nghia` | { hd: `xem` }; { hd: `ten`, ten: t }; { hd: `an_dh` }; { hd: `roi` } | unhandled | [L:131956](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131956) |

| `khe_uoc` | { hd: `giao`, id: e.id } | unhandled | [L:143705](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143705) |

| `ky_ngo` | { hd: `so` } | unhandled | [L:136610](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136610) |

| `lau` | { hd: `vao` }; { hd: `chon`, i: t, j: n }; { hd: `doi`, ma: t.ma } | unhandled | [L:155529](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155529) |

| `loa` | { noi: n.trim() } | unhandled | [L:149421](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149421) |

| `loan_chien` | { hd: `hoi` }; { hd: _.daGhi ? `roi` : `vao` } | silently ignored | [L:158459](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158459) |

| `loi_dai_bong` | { hd: `thach`, id: t.id } | unhandled | [L:154391](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154391) |

| `loi_dai_hang` | { hd: `npc` }; t.baBa ? { hd: `roi`, baBa: true } : { hd: `roi` }; { hd: `vao` } | unhandled | [L:157988](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:157988) |

| `lore_doc` | { id: t.id } | unhandled | [L:128765](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128765) |

| `lore_ds` | {} | unhandled | [L:128721](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128721) |

| `luan_co` | { hd: `tl`, cau: t.cau, chon: e } | unhandled | [L:154453](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154453) |

| `luu_phai` | { hd: `huy_doi` }; { hd: `sach`, lp: r.lp }; { hd: `chon`, lp: r.lp }; { hd: `doi`, lp: r.lp } | unhandled | [L:143203](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:143203) |

| `manh_len_di` | { id: e.viecId }; { id: e }; { id: e.id } | unhandled | [L:126613](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126613) |

| `manh_len_xem` | {} | silently ignored | [L:126558](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:126558) |

| `mini` | { huy: true }; { giu: e }; { giu: true }; { giu: false }; { chon: t }; { tuTu: mini.tuTu !== 1 } | partial local | [L:198892](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:198892) |

| `mo_rong_tui` | {} | unhandled | [L:166650](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166650) |

| `mong_canh` | { hd: `hoi` }; { hd: _.daGhi ? `roi` : `vao` } | unhandled | [L:158459](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158459) |

| `mua` | { id: v.id, so: 1, ...v.xoay ? { xoay: true } : {} }; { id: v.id, so: 5 }; { id: t.id, so: 1 }; { id: t.id, so: 5 } | partial local | [L:141244](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:141244) |

| `mua_su_kien` | { hd: `dong` }; { hd: `nhan`, moc: e.diem } | unhandled | [L:150501](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:150501) |

| `muc_tieu_tuan` | { hd: `mo` } | unhandled | [L:138175](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:138175) |

| `nang_dong` | { moc: e.moc }; { moc: t.moc } | unhandled | [L:130039](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:130039) |

| `nghe` | { hd: `bo`, id: t.id }; { hd: `chinh`, id: t.id }; { hd: `doi`, id: o, bo: c } | unhandled | [L:211870](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:211870) |

| `nghe_ngong` | {} | unhandled | [L:144234](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144234) |

| `ngoi` | {} | partial local | [L:198866](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:198866) |

| `nv_xong` | {} | unhandled | [L:162332](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:162332) |

| `o_do` | { o: n, id: null }; { o: n, id } | unhandled | [L:166706](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166706) |

| `phoi_phuong` | { hd: `thu`, cap: m.n, thu: g } | unhandled | [L:151156](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151156) |

| `push` | { sub: r.toJSON() }; { tat: true } | silently ignored | [L:207496](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:207496) |

| `quan_chien` | { hd: `xem` } | unhandled | [L:159695](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159695) |

| `quan_nhu` | { hd: `doi`, ma: t.ma } | unhandled | [L:155672](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155672) |

| `quy_chuyen_di` | { hd: `gop`, so: e } | unhandled | [L:151418](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151418) |

| `ren_than_tu` | { bat: !t.tu } | unhandled | [L:149702](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149702) |

| `rieng_tu` | { co: true }; { co: false }; { chiSo: true }; { chiSo: false } | unhandled | [L:208527](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:208527) |

| `roi` | {} | partial local | [L:159774](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159774) |

| `ruong_may` | { hd: `quay`, loai: c.id, so: e } | unhandled | [L:151541](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151541) |

| `san_kho_bau` | { hd: `xem`, im: true } | unhandled | [L:155094](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155094) |

| `sat_chieu` | { o: t, x: p.x, y: p.y, muc }; { o: e, x: p.x, y: p.y, muc, ...n ? { dat: true } : {} } | partial local | [L:198790](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:198790) |

| `sat_chieu_lap` | { o: e, km: l === e ? `` : a.id } | unhandled | [L:167703](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:167703) |

| `su_do` | { hd: `xem` }; { hd: t ? `nhan` : `tu_choi`, tu: e.tu }; { hd: `thoi`, id: i.id }; { hd: `moi`, session: e.id } | unhandled | [L:131701](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131701) |

| `tay_luyen` | {...detail,hd:'nang_sao'}; {...detail,hd:'tay',dong:index}; {...detail,hd:'tay',khoa:index[]}; {...detail,hd:'chon',giu:'moi'\|'cu'} | unhandled | [L:140171](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:140171) |

| `tb_thu` | { hd: `coi`, uid: x.uid, o }; { hd: `mac`, uid: x.uid, i: o }; { hd: `bo`, i: o } | unhandled | [L:163537](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:163537) |

| `thanh_tuu` | { hd: `xem` }; { hd: `dong` }; { hd: `nhan`, moc: t.diem } | unhandled | [L:150743](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:150743) |

| `thap` | { hd: `vao` } | unhandled | [L:155367](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155367) |

| `thoai` | {}; { chon: n.i }; { chon: e.i } | partial local | [L:201945](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:201945) |

| `thu` | { hd: `doc`, id: e.id }; { hd: `nhan`, id: m.id }; { hd: `gui`, ten: s.trim(), noiDung: l, do: e ? Object.entries(d).filter(([, e])=>e > 0).map(([e, t])=>({ id: e, so: t })) : [], co: e ? p : [], nt: e ? h : 0 }; { hd: … | silently ignored | [L:204420](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:204420) |

| `thu_mua` | { hd: `ban`, so: s }; { hd: `ban`, so: o }; { hd: `giao` } | unhandled | [L:157622](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:157622) |

| `thu_nha` | { hd: `cuoi`, uid: e.uid }; { hd: `cat`, uid: e.uid }; { hd: `xuong`, uid: o.uid }; { hd: `goi`, uid: s.uid }; { hd: `ten`, uid: e.uid, ten: a.ten }; { hd: `tha`, uid: e.uid }; { hd: `goi`, uid: e.uid }; { hd: `xuong`, … | unhandled | [L:136369](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:136369) |

| `tiem_nang` | { hd: `cong`, d: r }; { hd: `tay`, gia: tn.giaTay } | unhandled | [L:164134](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164134) |

| `tim_to` | { viec: `xem` }; { viec: `xin`, chu: x.chu }; { viec: `dang`, noiDung }; { viec: `go` }; { viec: `nhan_xin`, xin: n.id }; { viec: `tu_choi_xin`, xin: n.id } | unhandled | [L:130652](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:130652) |

| `tin_moi` | { hd: `xem` }; { hd: `doc`, id: e.id }; { hd: `doc_het` } | silently ignored | [L:153310](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:153310) |

| `to_cao` | { session: e.id, lyDo: r, ghi: a.trim() } | unhandled | [L:210308](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:210308) |

| `to_lenh` | { viec: `moi`, dich: x.chu }; i ? { viec: `nhan`, moi: i.id } : { viec: `moi`, session: goiY.session }; { viec: `tu_choi`, moi: i.id }; { viec: `nhuong`, dich: r.id }; { viec: `duoi`, dich: r.id }; { viec: `roi` }; { vi… | unhandled | [L:130749](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:130749) |

| `tran_do` | { hd: `bat_dau` }; { hd: `nop`, xoay: n } | unhandled | [L:154070](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:154070) |

| `trang_phuc` | { mac: r ? null : e.id } | unhandled | [L:164701](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164701) |

| `tranh_cho` | { hd: `chon`, phe: t } | unhandled | [L:155833](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155833) |

| `treo` | { ch: { o: { [e.i]: t.currentTarget.checked } } }; { ch: { hoi: t } }; { bat: false }; { bat: true } | unhandled | [L:149752](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149752) |

| `trung_tu` | { hd: `xem` }; { hd: `hoi` }; { hd: `xac_nhan`, ma: e.ma } | unhandled | [L:164900](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:164900) |

| `truyen_dao` | { hd: `xem` }; { hd: `doi`, id: e.id } | unhandled | [L:131856](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:131856) |

| `truyen_ke_xong` | { id: th.id } | unhandled | [L:128562](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:128562) |

| `tuoi_ho` | { id: e.id } | unhandled | [L:149119](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:149119) |

| `ung_ho` | { hd: `xem` }; { hd: `nhan_the` }; { hd: `nhan_quy` }; { hd: `nhan_tat_ca` }; { hd: `nhan_goi`, goi: e.id } | unhandled | [L:151965](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:151965) |

| `ve` | {} | unhandled | [L:139807](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:139807) |

| `vut` | { id, so: c } | unhandled | [L:166772](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:166772) |

| `xe_tram` | { hd: `huy` }; { hd: `di`, nguon: e.nguon, den: t.id } | unhandled | [L:148600](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:148600) |

| `xem_nguoi` | { id: e.id } | unhandled | [L:210065](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:210065) |

| `xep_hang` | { bang: n } | unhandled | [L:148142](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:148142) |


Important payload details: `in` carries `{seq,dx,dy,luot,ax,ay}`; `dung` carries `{o:'tay'|slotIndex,x,y,muc?,dat?}`; `sat_chieu` carries slot/target geometry; `chat`, `chat_to`, and `chat_bang` use string text, while `chat_kenh` wraps `{kenh,noi,toi}`. Marketplace requests include generated `ma` plus the selected operation; guild commands use `viec`, most service commands use `hd`. `co` uses action keys (`lap`, `go`, `an`, `luyen`, `cham`, `duong`, `lay_duong`, `giai_luyen`, `luyen_san`, `hoi_sinh`, and latest `tha`) rather than an `hd` tag.

Nested operations also matter: armor `ho_cu` includes `phan_giai`, `ban`, `chuyen_cap`; reforge includes `nang_sao`, `tay`, `chon` with `giu:'moi'|'cu'`; guild work includes `viec_nhan`, `viec_nop`, `viec_huy`; direct trade requires `id`/`rev` and supports `sua`, `khoa`, `dong_y`, `khe_uoc`, `khe_uoc_ok`, `nhan`, `huy`. JSON preserves their helper evidence. Several source UI operations use dynamic `moBang` values; arbitrary `window.__game.gui(type,payload)` is also open-ended. Those domains remain unknown.


## Incoming payloads and state

The JSON inventories all 179 message names with their baseline/latest consumers and read-shape subsets. Shapes describe fields the client reads; omitted/defaulted fields are not necessarily required, and a forwarded object is not a recovered server schema. Selected integration contracts:

| Message/state | Statically visible shape/read subset | Source |
|---|---|---|

| `vao` | {zone, ten, now, kenhSo?, noiLai?, x, y}; enters/rebinds room and aligns server clock | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `chuyen` | {zone, inst, room?, ve?, bang?}; transfer ticket/room values are forwarded into the next join | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `ho_so` | Object snapshot, not a patch: {ten, tv:{chuyen,giai,diem,can}, hp,hpMax,cn,cnMax,theLuc,nt,co:Gu[],o:Slot[],obd,opt,tui:{[itemId]:count},hoCu,doDeo,luuPhai,tiemNang,thu,thuNha,vcl,homNay,nangDong,mucTieuTuan,mo,xong,...}; October 22 additionally reads oDo | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `nv` | {ds:Quest[],xong,kyUc?,tiep?,...}; Quest consumers read {id,ten,chinh?,dich?:{zone?,x,y},npc?,cho?,...}; absent definitions/counters must not be invented | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `thoai` | null \| {loai,ten?,text?,chon?:Array<{i,...}>,...}; specialized lore/story/service consumers add fields | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `mini` | null \| discriminated object by loai: luyen_hoa/cau_ca reads {giu,c,w,kim,tienDo,ten?,cn?,cnMax?,conLai}; xung_kich reads {tien,giu,coS,a,b,aGoc,bGoc,nhip,...}; tu_bao reads {thanh}; day_chu reads {tieuDe,hoi,cac}; tu_luyen has its own timer/resource fields | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `fx` | Discriminated union by k; examples: trung {id,tu,gu?,fx?}; so {id,v,tu?,loai?,crit?}; dan {id,tu,gu?,fx?,x,y,tx,ty}; canh_bao {id,ms?,s?,x?,y?,loai?,phe?,ky?,chieu?,km?}; other k branches include vung/vong/buff/tuong/duy_tri/vung_doc/vung_doc_het and taming/synthesis events | [L:135861](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:135861) |

| `hieu_ung_toi` | {ds?,bat?,niem?,bangTran?}; defaults [],[],null and adds client receipt time | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `kham_pha` | {zone,o,hex,kho?}; merges prior region discovery map and stores current region cells | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `hai` | {id,nhan?,ms,het?:false} \| {id,het:true,ok}; starts/progresses or finishes/cancels gather UI | [L:198147](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:198147) |

| `cau_ca_len` | {id,dai?,cu?,kyLuc?,co?,...}; last catches and personal record notice; co==='hiem' changes display color | [L:144384](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:144384) |

| `giao_dich` | {dong?} \| {id,rev,toi,mo,moi?,nt,tui:Array<{id,ten,so}>,co:Array<{uid,ten}>,ben:Array<{ten,khoa,ok,de:{nt,do:Array<{id,ten,so}>,co:Array<{uid,ten}>}}>,toiDa,conTran,coDocThe?,kheUoc?:{boi,ok},...} | [L:160124](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:160124) |

| `hom_do` | {hom:Array<{id,so}>,dung,toiDa,giaNang:number\|null,them,...}; inventory column comes from ho_so.tui, not this payload | [L:159884](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159884) |

| `tranh_cho` | {dang,dot?,tongDot?,conLaiS?,dai?:Array<{noi,ten,chu?,hp,max}>,phe?,phan?,cacPhe?:string[]} | [L:155759](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:155759) |

| `quan_chien` | {pha:'vao',a?,b?} \| {pha:'ket',thang?}; HUD also computes live health from replicated players/actors | [L:159310](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159310) |

| `giai_dau` | {pha,con?,batDau,daDangKy?,bang?,cay?:{bang,vongNay,nghi,vong,hangBa?},cacBang?,top3?,...}; phase strings include dang_ky,boc_tham,dau,xong | [L:159309](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:159309) |

| `mong_canh` | Registration view accepted via component kenh='mong_canh'; same shape family as loan_chien. Battle details use shared loan_chien_tran stream in the cited latest callback only when kenh==='loan_chien', so routing of dream match details must be verified; do not assume a separate mong_canh_tran command. | [L:158438](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:158438) |

| `thu_ds` | Array<Mail>; Mail display reads {id,daDoc,heThong?,noiDung,do:Array<{id,so,ten?}>,co:Array<...>,nt,km?,dh?,thuNha?,...} | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |

| `bang` | Guild view {ten,toi,vien,congTrinh?,viecNgay?,viecTuan?,cuaHang?,tran?,...} | [L:147923](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:147923) |

| `tb` | {text,loai,khoa?:string} | [L:49629](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:49629) |


Replicated room state includes `players` and `actors` maps, region/time/weather fields, player position/sequence/stamina/HP/CN/animation/appearance/combat flags, and actor definition/type/position/HP/animation/effect fields. The original server's Colyseus schema declarations, serialization field IDs and authoritative models are not recovered. Latest scene consumers: [L:197768](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:197768) and [L:197918](/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js:197918).


## HTTP/account surface

All these first-party routes are prefixed with `/ws` by the account helper. JSON requests use `content-type: application/json` when a body is present and a bearer access token when a session exists. Failure reads `{error:string}`; login/refresh consumers read `{access,refresh,hetHan,account}`. Nothing here establishes a live endpoint or recovered backend.

| Method | Route under /ws | Request body | Response read subset |
|---|---|---|---|

| GET | `/api/tai-khoan/bat` | none | {bat:boolean} |

| POST | `/api/tai-khoan/thong-tin` | {} | Only status/content-type used as feature probe; no full body shape established |

| POST | `/api/tai-khoan/lam-moi` | {refresh} | {access,refresh,hetHan,account:{khach?,email?,...},...}; only client reads established |

| POST | `/api/tai-khoan/dang-nhap` | {email,matKhau} | {access,refresh,hetHan,account:{khach?,email?,...},...}; only client reads established |

| POST | `/api/tai-khoan/dang-ky` | {email,matKhau,key?} | {access,refresh,hetHan,account:{khach?,email?,...},...}; only client reads established |

| POST | `/api/tai-khoan/gan-email` | {key,email,matKhau} | {access,refresh,hetHan,account:{khach?,email?,...},...}; only client reads established |

| POST | `/api/tai-khoan/khach` | {key} | {access,refresh,hetHan,account:{khach?,email?,...},...}; only client reads established |

| GET | `/auth/nhan-vat` | none | Array<{id,ten?,zone?,gioiTinh?,...}> |

| POST | `/api/tai-khoan/nhan-vat-moi` | {} \| {ten} | {key,...}; key used for next guest/character entry |

| POST | `/auth/nhan-vat/${encodeURIComponent(id)}/xac-nhan-xoa` | {} | {challenge,choDen,...} |

| DELETE | `/auth/nhan-vat/${encodeURIComponent(id)}` | {challenge,ten?} | Success body not inspected by caller |

| POST | `/api/tai-khoan/dang-xuat` | {} | Success body ignored |


Join selection: `joinById(room,opts)`, guild `joinOrCreate('bang',opts)`, instance `create('inst',opts)`, otherwise `joinOrCreate('zone',opts)`. Options: `{zoneId,inst,pid? or key?,access?,ten,gioiTinh,mauAo?,doDeo?,ve?,bang?,cham?:true}`. Original reconnect logic and transfer tickets are visible; clone room transport remains a local facsimile.


## First-party auxiliary clients and unresolved scope

Scene workers accept `dungTruoc`/`dung` setup models, chunk/render jobs and `nghi`; replies include `san`, `manh`, `bong`, `toan`, `loi`, with dimensions/pixel buffers/session and timing fields. Tree worker accepts `{ids,uu}` and replies `{id,w,h,px}` or `{id,loi}`. JSON records exact `postMessage` expressions and UTF-16 offsets in latest minified auxiliary files. These local worker messages are separate from the 120 gameplay commands. `?xem=thu` selects a first-party beast animation preview. No workers or preview were executed in this audit.

Remaining unknowns: private quests/dialogue/service scripts, server-only defaults and validation, exact combat/scaling/RNG/reward formulas, database/permissions, runtime-created IDs/payload variants, dynamic `moBang`, and unreferenced/private content. New text prefixes such as home visitors, home beasts, lucky fish, medicine shop and blessed dungeons are indexed as content signals; they are not invented standalone commands or proven services.

Validation: both recovered main bundles and installed auxiliary scripts parsed with Babel; catalog changes were compared as JSON; every enumerated command/message/text group maps to a feature row. The audit artifacts are checked for JSON validity, count consistency and reference existence. No original API traffic, game execution, deployment or tests of concurrent gameplay changes were performed by this worker.

