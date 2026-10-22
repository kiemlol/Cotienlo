# Inventory V3 — integration and evidence

22 October 2026. Changes are confined to `src/systems/gu-inventory.mjs`, the new `src/systems/crafting.mjs`, `scripts/test-gu-inventory.mjs`, and this report. No commits, build, or publication. Other workers' changes in this shared checkout are outside this report.

## Stable parent integration

```js
const inventory = attachGuInventory(room);
inventory.handle(type, payload = {}); // boolean: claimed, including rejected commands
inventory.tick(nowMs);               // finite absolute epoch milliseconds
inventory.snapshot();                // structuredClone; cannot mutate live state
```

Route intro first, then commands claimed by `progression.owns(type,payload)`, then inventory, then progression/generic fallback. This keeps care/occupation/equipment Gu subcommands with progression. For minis, progression claims only its own active context; otherwise inventory receives the shared route first. Inventory `mini` returns false unless it has its own active refinement context; even then unrelated keys such as `chon` or `tuTu` return false. Recognized refinement input is `mini {giu:boolean}` or `{huy:boolean}`. There is no recovered interactive crafting mini in the supplied client: `che` is the simple panel command, `hop_luyen` is an independent timed-job panel, and `luyen_hoa` is the needle mini. No invented crafting-mini wire type is emitted.

Owned commands:

| Command | Payload |
| --- | --- |
| `co` | Exactly one of `lap:uid` with `o`, `go:index`, `an:uid` with optional `mon`, or `luyen:uid`; equip/remove also accept `biDong` / `phuTro` booleans |
| `mua`, `ban` | `{id, so?}`; quantity is an integer 1–999; client prices/currency are ignored |
| `dung_do` | `{id:'item_cao_cam_mau'}`; existing local `dung {id}` alias retained, combat `dung {o}` falls through |
| `che` | `{ma, so?}`; Gu synthesis here, profession recipes through the explicit parent bridge |
| `hop_luyen` | `{hd:'xem'}`, `{hd:'bat_dau',id:recipeId,uid?:primaryUid}`, `{hd:'dong'}` |
| `mini` | Only recognized input for an active inventory-owned refinement |

`co {cham}`, `co {cuu}`, release, nursery, star/tẩy luyện, occupations, wearable/equipment commands remain parent/progression-owned. Unsupported `hop_luyen` actions such as exchanging or assembling fragments return false.

Local panel entry points: `handle('cua_hang',{npc})`, `handle('che_tao',{})`. Supported NPC selectors: `npc_ta_toan`, `npc_chu_quan_tro`, `npc_lao_khuyen`, `npc_thuong_ky`, `npc_ta_ninh`, `npc_ban_do_deo`; equivalent `loai` values are `kho_toc`, `quan_tro`, `lao_khuyen`, `thuong_hoi`. Default shop is Kho tộc. The last two NPCs use the evidenced **general Thương hội materials catalog**, a requested compatibility fallback: they do not pretend to expose an original pharmacy or cosmetic catalog. Published `bal.do_deo` contains starter appearance choices, not sale prices. Tạ Ninh's specific herb orders remain story/progression-owned. These entry points do not claim to be original outgoing service-open messages. Service proximity and quest gating must be supplied by the caller; selecting a local panel does not establish original NPC reachability.

Optional profession bridges, installed by parent:

```js
room.inventoryCraft = payload => progression.handle('che', payload);
room.inventoryCraftPanel = payload => progression.openCraftPanel(payload); // illustrative parent adapter
// Each bridge returns true only when it owns the request.
```

`inventoryCraft` is called only for a `ma` absent from `data.recipe`. `inventoryCraftPanel` may emit the parent profession panel and return true. The illustration above does not assert progression exports a method named `openCraftPanel`; parent supplies the appropriate adapter. When no bridge exists, captured `data.bal.nghe.che_tao` definitions can be processed with an explicit `room.canInventoryCraft(ma, recipe)` location check. That table is absent from the supplied game.json, so no profession server IDs are fabricated here. The parent owns its wiki-derived profession catalog and profession advancement.

`room.onInventoryEvent(event)` receives **one detached object**, not `(kind,payload)`. Events occur after the mutation commits in memory and before the enclosing refresh/save; callbacks may update quest counters for the same save. Callback exceptions are contained so a successful inventory transaction does not become a retry. A bridge accepting both signatures can forward the object directly.

| `event.type` | Other fields |
| --- | --- |
| `gu-refine` | `uid,id,success:true`; only successful refinement, safe for first-Gu/occupation hooks |
| `gu-refine-failed` | `uid,id,success:false`; does not count as successful refinement |
| `craft-start` | `recipe,quantity,cn` |
| `craft` | Gu: `recipe,uid,id,quantity:1,success`; profession fallback: `recipe,quantity,success,profession` |
| `feed` | `uid,id,food` (item ID or `cn`), `automatic` |
| `buy` | `id,quantity,currency` (`nt`/`ch`), `cost,shop` |
| `sell` | `id,quantity,proceeds` (whole NT), `remainder,shop` |
| `equip` | `uid,id,slot,mode` (`active`/`passive`/`support`) |
| `consume` | `id,quantity:1` |
| `gu-hungry` | `uid,id` |
| `gu-death` | `uid,id,banMenh,at` |
| `gu-expire`, `gu-revive` | `uid,id,banMenh` |

Root death records `profile.guInventory.rootIllness=true`. Parent consumes `gu-death` with `banMenh:true` to implement its care/illness presentation and penalties. No unverified original illness field or player damage amount is invented. Parent care may set `g.nghi={ly:'hoi_sinh',den:epochMs}` after validating rescue costs; inventory completes that recovery on tick, clears exhaustion and root illness, and emits `gu-revive`. Rescue initiation/costs are not claimed implemented here.

State is stored in `profile.guInventory` version 3: per-UID food/exhaustion clocks, pending medicine, synthesis jobs, refinement state, trade ledgers, resale remainder, root illness, UID sequence. Existing version-1 fields survive migration. Callers need not persist another object.

During `room.intro.active` **or** `zoneId==='inst_mo_dau'`, no profile initialization, hunger, healing, crafting, or trade mutation runs. Inventory leaves intro minis to intro and never accesses/mutates `intro.baseProfile`. Profile object replacement causes a fresh binding on the next non-intro call. Fresh mortal profiles with rank 0, HP 300, CN 0, no Gu, and no NT are tolerated without adding starter Gu/resources or slots. Rank 0 cannot refine before awakening.

## Evidence: what is exact

Recovered source: `/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js`. Current mechanism documentation: `/workspace/work/cotienlo-expand/v3/wiki/{luyen_hoa,nuoi_co,hop_luyen}.html`, official generated **22 October** build, main text read. Additional generated **21 October** item/NPC/economy pages: `/workspace/cotienlo-recovered/public/wiki/{vat,co,tn}`. Clone definitions remain `dist/data/game.json`; no newer live recipes/IDs overwrite the clone's captured data.

- Protocol: `co` and `co_an_xong` around lines 143798–144082 and 168142–168185; shop `mua`/`ban` and row schema around 144180–144310; simple `che {ma,so}` around 144340–144375. Synthesis UI and `hop_luyen {hd:'bat_dau',id,uid?}` around 140440–140855. Needle `mini` UI around 202880–203145 reads `loai,ten,kim,c,w,tienDo,cn,cnMax,conLai` and sends `giu`.
- Recipe inputs, CN, time, base chance, `ban_menh`, `luon_thanh_cong` come from each `data.recipe` row, not an immediate guaranteed-success rule. For example `rc_tieu_quang` costs one `gu_thiem_quang`, three `item_canh_nguyet_lan`, 80 CN, 900 seconds, base probability 0.6.
- Official `hop_luyen` text: “Cổ ra giữ thuần thục của cổ chính.” Failure loses auxiliaries and injures the surviving primary. Recovered `ui.hop_luyen.gioi_thieu` specifies **24 hours**; the local job preserves the primary UID and mastery. Always-success/root flags are honored; root output cannot outrank its owner. Ordinary recipes require known recipe and Luyện cổ profession; auxiliary Gu exclude roots, equipped Gu, busy Gu and quest-protected Gu. Repeated ingredient IDs are aggregated before spending anything.
- Diet IDs, portions, periods, alternate foods, rare food meal/XP values and numeric hunger/death rules use `bal.gu_food` and `gu[id].an`. Its published defaults include fullness 100, 35 loss/period, hungry below 30, death after 72 exhausted hours, ordinary corpse retention 30 days, and first-year root protection. Recovered `ui.xac_co.tan_ban_menh` supplies the seven-day root-corpse lifetime. Scheduled food consumption is chronological across Gu and persists through reload; CN diets debit actual CN.
- Wiki `luyen_hoa`: support slots accept one-use Gu. Support placement does not activate them or award mastery.
- `bal.economy.gia_mua_npc` is **the player's buy price**, not resale. Generated `wiki/vat` pages confirm this. The old 2× markup was removed. Clan prices and weekly per-ID limits use `bal.economy.kho_toc.{gia,tran_tuan}`. Weekly reset is Monday **05:00 Vietnam**, stated by the recovered `ui.kho_toc.het_tran_tuan` / rotation text. CH purchase also checks Gu rank.
- Separate resale values for 38 ordinary materials are transcribed from generated official `wiki/vat/<id>.html` text “Bán cho Thương hội (…)”. Examples: beast meat 0.03, herb root/tham tu 1.5, boar skin 0.1, stone shard 0.01, lightning-wolf heart 50. IDs without a recovered resale price are not bought back; the public NPC buy table is never substituted. Override table `data.bal.economy.gia_ban_npc`, if supplied by the trusted host, supersedes the captured resale subset.

The helper reads recipe success/cost values actually available in publicdata; **it cannot reconstruct absent `bal.hop_luyen` server tables**. Both the clone's game.json and a read-only check of current `https://cotienlo.com/data/game.json` on 22 October expose only `bal.hop_luyen={doi_manh_cp:4}`. Current publicdata also omits `bal.nghe.che_tao` and resale/cap tables. That absence is verified, not a reason to label fallback coefficients exact.

## Local policy and server unknowns

These values/behaviors are playable adapter choices, not recovered server parity:

- Refinement physics: 45-second timeout, width `max(.12,.42-.04*(rank-1))`, moving target, needle speeds, progress gain/loss, CN debit while held at `max(1,Gu rank)` per second. The source/wiki establish the hold/needle mechanism, **not** its numeric dynamics, drain, escape probability, or NT fee. No invented upfront NT fee remains. Failure conservatively keeps the Gu injured for one minute rather than gambling away it. Cancellation spends only CN already consumed. A gap over two seconds releases hold; reload cannot auto-win by replaying held input. Trusted overrides: `room.inventoryRules.refining.{seconds,cnPerSecond}`.
- Synthesis cap 0.95, torn-recipe penalty 0.15, one concurrent job, and required ordinary profession tier `output rank - 1`. Actual bonus coefficients and exact profession/garden slot thresholds are absent. Profession/school bonus coefficients default to zero rather than presenting invented bonuses. Trusted overrides: `room.inventoryRules.synthesis.{cap,tornPenalty,perProfessionPoint,perSchoolRank,slots,injuryHours}`. A full recipe overrides the torn form when both are owned. Job chance is fixed when starting; recipe duration/CN are not compressed. Root and primary-slot reassignment after completion is left to the player; synthesis unequips its primary. XP/star preservation beyond documented mastery is conservative local behavior.
- Generated item pages establish common NT items at Thương hội/Kho tộc; Gu catalog separation uses `nguon` metadata and clan price tables. Quán trọ presently exposes only white wine with an exact known price, not its documented four flavored wines whose NPC prices are missing. Weekly rotating clan shelves, service proximity, special shops, inventory display ordering and NPC dialogue gates remain parent/server unknown. Lão Khuyển uses `nguon.ma==='lao_khuyen'`; no arbitrary priced Gu becomes clan or pet-shop stock.
- Sales carry fractional NT until a whole stone can be paid, as the recovered panel text describes. Integer hundredths avoid floating-point drift; exact server rounding behavior is unknown. A local 100 NT daily resale cap is used because the docs establish a cap but omit its number. Trusted overrides: `data.bal.economy.tran_ban_npc_ngay` or `room.inventoryRules.saleCap`. The local daily ledger resets at 05:00 Vietnam; only the weekly reset is proven. Gu capacity defaults to 200 unless `profile.coToiDa` exists; bag slots use published capacity.
- Automatic meals come from the carried `tui` pantry. Exact treatment of separate remote food storage, CN regeneration while offline, shared-nursery reductions, injury hunger pauses and timestamp ties is unavailable. Rare food delays the next meal and hunger clock for its extra meals. Meal processing is bounded at 10,000 events/tick; remaining deadlines are retained for the next tick, not silently skipped. Root protection reads `profile.nam`, otherwise `room.progress.year`, otherwise conservatively assumes year one. Exact game-calendar mapping is parent-owned.
- Hunger illness is represented by the persisted root illness flag plus event; original numerical aperture penalties and rescue recipe costs are unknown/delegated. No generic disease RNG was fabricated. Expired corpses are removed only after the published retention period; inventory emits `gu-expire`. Parent rescue initiation/occupation/care commands are not intercepted.
- Cao cầm máu remains the prior local 40 HP over five seconds; documentation confirms gradual healing but gives no numeric amount. Other consumable effects remain unsupported here. No profession/care command is silently consumed as a guessed medicine effect.

## Verification

`node scripts/test-gu-inventory.mjs`: **18/18 passing**. Syntax checks for both source modules and `git diff --check` on owned source/test files pass. Tests use the real captured Gu/recipe/diet data, deterministic time and deterministic synthesis random values. They cover contracts and delegation, cooldown-safe equip/support, diet rejection atomicity, shared-pantry online/offline equivalence, reload, starvation/root protection/corpse expiry, refinement control/cancellation/failure (success verified with only 100 maximum CN), pending healing, NPC catalog/pricing and fractional carry, valid medicine/wearable NPC aliases, weekly reset boundary, trade shortages/capacity/caps, timed synthesis success/failure and repeated-Gu batch aggregation, root guarantees, event-hook failure containment, dream/base-save isolation, profile replacement and empty rank-zero profiles.

Browser QA and runtime wiring are parent-owned and were not run by this worker. Passing adapter tests do not establish parity for undisclosed server coefficients or service locations.
