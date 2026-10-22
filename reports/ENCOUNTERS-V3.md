# Encounters V3 — integration handoff

Ready for parent integration. Owned files only: `src/systems/encounters.mjs`,
`src/systems/encounters-data.mjs`, `scripts/test-encounters.mjs`, this report.
No runtime/build/publish/commit changes. Research downloads are namespaced
`/workspace/work/cotienlo-expand/v3/wiki/encounters-*.html`.

## Integration API

```js
import {createEncounters} from './systems/encounters.mjs';

// Construct after player, profile, state.actors and story/progression exist.
room.encounters = createEncounters(room);
// Exactly ONE event bridge is invoked, in this precedence order:
// encounters.onProgressionEvent setter > room.onEncounterEvent >
// room.onProgressionEvent. Methods receive `this === room`.
room.encounters.onProgressionEvent = (kind, payload) => {
  room.story?.onEvent(kind, payload);
};
room.encounters.begin(); // safe to call repeatedly; deferred during scenes

// send: story and progression get first refusal; encounter handles F/door
// dialogue/thap, otherwise returns false. Unclaimed commands reach fallback.
if (room.encounters.handle(type, payload)) return;

// Kill reward ownership. Both loot and its persistent claim live here.
room.onKill = actor => {
  const handled = room.encounters.onKill(actor);
  // A hard-mode resurrection returns true but actor.hp > 0: it is not a
  // completed kill yet. Forward real kills to story only after this check.
  if (actor.hp <= 0) room.story?.onKill(actor);
  if (!handled) defaultLoot(actor);
};

// Tick after combat, before generic death/nga handling. Tower/inheritance
// failures restore HP and return to the entrance without serious injury.
room.encounters.tick(now);
// Successful combat actions enable the documented Thuy Mang cast interrupt.
room.encounters.onAction(type, payload, result);

// Before parent travel, so both same-room and replacement-room transports can
// retain the entrance. Parent still owns actual zone replacement and physics.
room.encounters.onTravel(destination, opts);
```

Construct one encounter system per zone/Room. In-place transports must construct
a new system after replacing the zone. The module never clears foreign actors;
replace the old `spawnActors` beast loop with `begin()` to avoid duplicate rosters.
Existing NPC actors are reused. `onTravel` records state and cancels telegraphs;
parent persists before emitting travel. It does not itself move the character.
Encounter-originated travel calls `room.travel(zone, opts)` with named
`den_spawn`, `via` and `from` where declared. If no return entry was recorded,
reverse lookup searches `zone.noi.instance/dg`. Dungeon routes map only seven
verified `dg_*` IDs to `inst_*` IDs.

Required room fields: `data`, `profile`, `progress`, `player`, `zoneId`,
`state.actors` (Map), `state.now`. Normal host methods: `emit`, `notify`,
`changed`, `refresh`, `save`, `travel`, `teleport`, `addActor`, `removeActor`.
Actor insertion/removal has a Map fallback for tests. No network/timer/DOM is
created. `tick` expects a finite monotonically increasing epoch millisecond time.

Optional hooks: `room.encounterCondition(expression)` for the complete story
condition parser; `room.encountersPaused()` (or boolean) for additional scenes;
`room.encounterPolicy` for local timing/scaling overrides;
`room.onEncounterBossAction(actor, warning)` for additional visual/AI responses.
Boss hazards use `room.combat.receiveDamage(amount, actor, now)`, respecting the
combat owner's shields/reduction/death handling. Without that API warnings still
render, but this module never subtracts player HP directly for boss hazards.

Public methods additionally include `onInteract(id)`, `onDeath()`, `reset()`,
`enterDungeon(destination, {hard, seals, via})`, `describe()` and the read-only
`npcInteractions` getter. `reset` restarts owned encounters, retaining loot claims.
`onDeath` is safe to call from the parent death hook instead of waiting for tick.
`enterDungeon` is a trusted host method; client entry uses the actual nearby
`cua_pho_ban` point and original `thoai` choice protocol.

## Story and progression contract

* Completion: **`instance_complete`**, payload `{zone, id, ...details}`.
* Ceremony: **`awakening`**, payload
  `{zone:'inst_khai_khieu', id, steps:28, maximum:28, completed:true,
  promoted:boolean, chuyen}`. Also emits the regular instance completion.
* Optional observations: `gather` (`point,item,count`), `cellar-wall` (`point`),
  `location` (`point`), `kill` (`actor,beast,rewardHandled,summoned`),
  `boss-introduction` (`scene,group`), `dungeon-darkness`, `worldboss`.

The bridge setter and room callbacks do not double-call the same event. Quest
rewards belong to story, never to the encounter completion callback. On reload,
completed instances and ceremony do not emit their completion again.

Fresh awakening only promotes characters for whom **both** `profile.chuyen` and
`profile.tv.chuyen` are zero/absent. It sets rank 1, `tv.giai=0`, `tv.diem=0`,
`tv.can=300`, player `giai='so'`, CN maximum/current at least 100. HP maxima,
current HP, inventory, money and Gu remain intact. It calls
`room.progression.rebase({cnMax:100})` if available, otherwise
`room.progression.applyBonuses({cnMax:100})`. The rank/can/CN starting values
are local integration policy, aligned with the public Nhất sơ tu vi threshold.
Higher legacy ranks, tu vi, equipment and Gu are never overwritten by ceremony.
Parent story owns the return to town after `awakening`; the declared `ra_ve`
point also returns to `cua_hang_nguyen_tuyen` through normal travel.

`inst_dot_pha` has **no** encounter mini, damage, rank advancement, trial, or
`dot_pha`/`mini` handler. `bo_doan` returns false to Faraday's progression owner.
Only ordinary declared exit navigation and NPC metadata are available there.

Scene guards include `intro.active`, `room.canh`, `state.canh`, `inCutscene`,
`story.inScene`, `story.activeScene` and the optional pause hook. No actor clear,
spawn or profile migration occurs when the intro owns a scene. Combat itself
must also be paused by the parent during scenes; this module controls only its
own spawns, telegraphs, timers and rewards.

The built-in safe condition subset supports `false/true`, `xong:`, `dang:`,
`buoc:quest.bN-bM`, `tu_vi:rank.stage`, `flag_*`, AND and OR. It reads
`progress.quests`, `progress.story.quests`, `profile.nv`, `profile.xong` and
flag arrays/maps. The parent's reconstructed story uses a chapter/step model,
so parent should supply `room.encounterCondition` to map those states to the
original `mq_*.bN` conditions. In particular the wine point is gated by
**`buoc:mq_x08.b4`**; it will remain closed without that bridge.

NPC IDs are original `npc_goi_y` IDs (e.g. `npc_me`, `npc_ta_tram`,
`npc_ta_mac`), not invented quest IDs. `npcInteractions` includes the associated
map `point,x,y`; parent owns actual NPC story/service conversations.

## Coverage and playable mechanics

All 55 public maps have a descriptor exposing exact `noi`, `bai`, and `ext`.
There is no claim that all 55 original private scripts were recovered.

| Mode | Maps | Behavior |
|---|---:|---|
| World / public points | 27 | Declared species/counts and NPC hints, gated resources, named doors, public scheduled world bosses where their named POI exists. Hubs/arenas/garden have no filler beasts. |
| Mapped dungeon | 10 | Map groups become sequential waves; boss mechanics below; per-slot save/death/reentry/loot accounting. |
| Parent story scenes | 9 | Intro, replay dreams, collapse, dream battle, moonlit/trại đêm scenes reserved to parent; no encounter spawns. |
| Breakthrough | 1 | Reserved to progression. |
| Ceremony | 1 | Start at `vach_bien_hoa`; progress through actual `apLuc` bounds with `buocM=.7`, `toiDa=28`; emit awakening once. |
| Three gates | 1 | Four declared beasts; lantern proximity for eight local seconds; named `cua_2/cua_3` teleport across fixed dividing walls; run through original obstacle geometry to `dich_chay`. |
| Wine cellar | 1 | Original gated wine item once per quest step, wall discovery event, return stair. No invented cellar enemies or automatic Tửu Trùng grant. |
| Tower | 2 | `inst_thap_thi_luyen` and `inst_lau_chan_duong`: native `thap` panel, `thap_tang` HUD, escalating floors, boss every fifth floor, lifetime first-clear ledger and daily milestone gifts. |
| Inheritance | 3 | Existing `inst_tt_dau_bong`, `inst_tt_giu_den`, `inst_tt_do_thach`: three weekly floors, shadow opponents, three lamp waves, persistent stone interactions and stone beasts. |

Ten wave dungeons: `inst_hang_heo`, `inst_o_soi`, `inst_ham_mo`,
`inst_dam_hac_thuy`, `inst_sao_lang_phu`, `inst_hang_dia_thu`,
`inst_huyet_soi_tuyet`, `inst_hang_thach_khieu`, `inst_mo_cu_tang_sau`,
`inst_lang_coc`. Group-to-wave ordering is a local rule, not an exact server
script. Numeric `bai.so` is the total group count; object `so` is per species.
All species are checked against `data.beast`. Placement stays in the declared
group radius and avoids public rectangles/holes; impossible positions are skipped.

Documented boss behavior implemented:

* Lợn Rừng Vương: telegraphed charge; adds at 70%; rage at 40%.
* Tam Nha: phase-two handler and slave wolves. Killing handler removes summoned
  wolves. Exact original phase threshold is unknown; local trigger is 70%.
* Thạch giáp già: falling-rock warning, dark phase at 70%, breakable HP carapace
  at 40% with 15-second deadline. Carapace is a local extra-HP representation;
  successful break restores original max HP, failure adds local rage.
* Thủy mãng: interruptible poison cast, lingering poison, original stone-island
  safe spots. Successful player hit interrupts the cast via `onAction`.
* Bóng Lang Phu: accompanying Cuồng Điện Lang flees after handler defeat.
* Hang chủ Địa Thứ: slam/falling-rock warning and summoned rats.
* Sói Tuyết vương: telegraphed charge/slam, summoned wolves. The exact original
  pounce/leap animation sequencing is not reconstructed.
* Three living players enable the documented back ambush in Hang Địa Thứ and
  Huyệt sói Tuyết; these extra species do not appear in solo play.

Warnings use original `fx:{k:'canh_bao',hinh,x,y,dx,dy,dai,rong,r,ms,phe,ma}`
and `huy_canh_bao`; bosses use the native `boss` HUD. Loot uses the original
**array** `nhat:[{id,so,ten}]` shape. No custom panel or external resources.

Khó entry applies local HP/attack/reward multipliers. Weekly 1–2 modifiers and
up to three seal modifiers are deterministic per dungeon/week: stronger attack,
HP, speed, poison, one resurrection, extra adds. Seal prices 0/50/150/400 and
the Trinh 5% currency increment are from official wiki. Extra mutation currency
is once per saved dungeon epoch; its base/scale are local policy. Poison is
implemented through boss poison behavior; a global dungeon-wide mist subsystem
is not claimed. Multiplayer fee sharing, matching, server-wide draws and the
original accrued Khó/reward-attempt economy are not simulated.

Tower exact public milestone rewards: 5 → 20 NT + Tiểu Thành Phù;
10 → 40 NT + Rượu trăm ngày; 15 → 60 NT + Mảnh cổ phương;
20 → 90 NT + Mảnh cổ phương + Rượu trăm ngày;
30 → 150 NT + Đại Thành Phù. Named item quantities of one are local where
the page lists no count. Default three attempts/day, 90 seconds/floor,
floor rosters, scaling and first-clear `5+floor` NT are local policy.

Inheritance defaults to 120 seconds/floor, a deterministic UTC-week theme,
local roster/timing, `20*floor*rank` NT + one recipe fragment per floor.
Weekly completed floors persist; failed floors can be retried. The official
fourth theme is mê cung, but **no maze instance exists in these 55 public maps**;
that week's missing map is not fabricated. The checkpoint helper is present
for a future declared maze template. Original shadow Gu loadouts, puzzle
layouts, nighttime mobs and exact inheritance reward/rare-Gu tables are unknown.

## Persistence and migration

State lives only in `progress.encounters` version 3. Existing profiles and old
progress fields are retained. Per-slot deaths/lives, paid tokens, reward claims,
return entry, dungeon wave, ceremony, tower records and inheritance run are JSON
serializable. Actor object identity additionally suppresses repeat callbacks.
Combat's 18-second default respawn is disabled on owned corpses; this module
owns their timer, preserving life IDs across reload. Dungeon summons pay no loot.

Normal dungeon slots pay once per saved date epoch, including after death or
explicit reset; `reset` on a later date permits another local reward epoch.
World slots pay once per life; recorded death prevents reload farming. Timer
respawns increment the life. Scheduled bosses pay once per scheduled date slot
and never respawn within that slot. Every reward mutation and claim is saved
together. A failed browser save leaves both in memory; durability still depends
on the parent's `save` implementation. No offline kill/reward settlement.

## Sources and limits

1. `dist/data/game.json`, `dist/data/text_vi.json`: all 55 maps, 88 beast
   visuals/tiers/behavior names, `bai.so`, `noi` gates/routes/items/NPC hints,
   `apLuc`, declared spawn anchors, world-boss cron rows and balance fields.
2. `/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js`:
   native messages around 49626–50050; `nhat` array at 49905; `boss` at 50047;
   tower consumers 155300–155450; inheritance HUD 159989; mini consumers
   202895–203100; warning renderer 188967–189005; map template metadata
   28122–28416; map labels around 176550. Line numbers refer to this recovered
   client capture, not authored backend code.
3. Official pages downloaded 22 Oct 2026: [dungeons](https://cotienlo.com/wiki/tn/thu_huyet.html),
   [mutations](https://cotienlo.com/wiki/tn/bien_di.html),
   [tower](https://cotienlo.com/wiki/tn/thap.html),
   [inheritance](https://cotienlo.com/wiki/tn/truyen_thua.html),
   [map catalog](https://cotienlo.com/wiki/ban-do.html),
   [world bosses](https://cotienlo.com/wiki/tn/thu_vuong.html),
   [roaming leaders](https://cotienlo.com/wiki/tn/boss_da_ngoai.html),
   [beast catalog](https://cotienlo.com/wiki/thu.html), and all seven linked
   `/wiki/pb/dg_*.html` pages. Namespaced download files above retain the pages.
4. Recovered `/workspace/cotienlo-recovered/public/wiki/thu/*.html`, generated
   21 Oct: 65 beast drop-range tables; current official beast index supplies 72
   rank records. Dungeon drop rows are deduplicated by first item ID because
   wiki combines several server tables without identifying the roll pools.

**No HP/attack or numeric drop probability tables are in shipped `beast` or
`bal.beasts`.** Fallback HP/attack per rank: 90/8, 320/18, 900/38,
2200/85, 5200/180. Tier HP factors: 1/2.4/7/12/20; attack uses square root
of factor. Declared `stats`, `chi_so`, or direct `hp/hpMax/cong/tocDo/chuyen`
override these local fallbacks. Rarity roll policy: guaranteed 1, common .65,
rare .15, very rare .04. These probabilities, deterministic seed, movement
spacing, delays and phase stat multipliers are **not original server formulas**.
The module labels actors with `encounterSource` accordingly.

`zone.ext` in this capture is renderer decoration/atmosphere/template data;
it contains no recoverable private event functions. It is exposed unchanged,
not converted into fabricated exact encounter scripts. Named `canh_ra_mat`
is surfaced as a story hook; parent must run/pause its actual introduction.
No original generic exact-script claim, multiplayer mechanics, worldwide
leader rotation or server-owned reward tables are inferred from UI presence.

## Verification

Run: `node scripts/test-encounters.mjs`.
Initial handoff: **39 passing focused tests**, inspecting all 55 actual maps,
all ten dungeon clears, named travel, conditions, scene suspension, loot array
schema, reload/death/reset, ceremony fresh/legacy/setter bridge, three gates,
cellar once-only wine, progression room exclusion, boss phases/warnings/dodge/
interrupt/islands/car apace, handler retreat, party ambush, cron, tower milestones,
weekly inheritance floors and legacy profile preservation. Additional edge tests
may be added below before final handoff. No build, publish or runtime edits run.
