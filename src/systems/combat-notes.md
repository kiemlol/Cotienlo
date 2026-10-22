# Combat V3 integration contract — 22 October 2026

Only combat.mjs, test-combat.mjs, this document and reports/COMBAT-V3.md belong
to this task. Runtime, story, actorstats, inventory, encounters and rewards are
host-owned. No builds, commits or publication.

## Stable API

```js
const combat = createCombat(room);
combat.attack(payload, type = 'dung');
combat.tick(nowMs);
combat.getDamageReduction(school); // optional school; returns fraction
combat.receiveDamage(rawAmount, source, nowMs = Date.now()); // returns HP damage
combat.receiveActorDamage(actor, rawAmount, source, nowMs = Date.now());
combat.getPassiveBonuses();
```

`attack` accepts zero-based `{o, muc?, x?, y?}` for `dung`, `o: 'tay'` for hand
attacks, `{o}` for `sat_chieu`, and `{hd:'goi'|'cat',uid}` for `thu_nha`.
Results contain `ok`, `reason` on failure, `unsupported`, and applicable
`gu`, `cn`, `cd`, `bat`, `targets` on success. Partial success can have omissions.
`source` is an actor ID or `{id, school?, damageType?: 'dot'}`. Pass raw damage
once; never pre-reduce or also subtract HP externally. `receiveActorDamage`
accepts the hero, owned companions and living hostile actors, protecting NPCs.

Required room fields: data, profile, player, state.actors (Map), state.now,
sessionId, emit, notify, changed, refresh, save, label. All timestamps are absolute
milliseconds; catalog durations/rates use seconds. Backwards time is ignored.
Construct once per room and keep calling tick even when host AI owns enemies.

Fresh mortal rank 0 / HP 300 / CN and CN-max 0 / no Gu or NT is valid. Combat
never initializes rank, money, inventory or realm stats. Public hand data has
no rank-zero value: supply `getCombatStats(player).attackDamage` or catalog
`don_tay.goc.chuyen_0`; otherwise a valid hand target yields explicit
`unsupported: ['don_tay.chuyen_0']`, without borrowing cultivator damage.

## Hooks and ownership

```js
room.onCombatAction = ({type, p, gu, ...result}) => {};
room.onKill = (actor, {source, now, gu, school, owner, companion}) => {};
```

onCombatAction runs once per accepted command (also held on/off and pet goi/cat),
**before the final refresh/save**. Live player/slots are updated; profile HP/CN
mirrors are synchronized by refresh. Story mutations made by the hook persist
in that save. Failed commands, timer pulses and autonomous attacks do not call
it. Do not also count practice/story actions in a second dispatcher hook.

onKill runs once per lethal direct hit, DOT or companion hit, after HP reaches
zero and status cleanup, before the final save. `source` is the damaging actor
ID. Spell `gu`/`school` and pet `owner`/`companion` are optional. This callback
owns ALL kill counts, story/quest progression and rewards. No duplicate loot or
counts are granted by combat. Without it, only progress.kills increments for
ordinary beasts; the old fixed +12 NT/+1 meat fallback was removed. Companion
death never calls onKill. Hooks are synchronous and should not throw.

Incoming successful hits call `room.progression?.onEvent('damage',
{amount: dealtHP, source, now})` to cancel absorption, including direct hits
fully absorbed by a shield. Dodged hits do not call it. A final save follows
this callback so a progression cancellation save cannot persist stale HP.
Story `storyDummy` actors stay at 1 HP, never chase/attack/respawn/reward, and
still accept training commands. Other noReward actors do not get fallback
rewards or engine respawn scheduling. introBoss alone is not treated as a dummy.

Set `room.combatOwnsBeasts = false` before combat when encounters owns AI.
It disables engine pursuit, retaliation AND respawn scheduling. Companion AI
is also disabled unless `combatOwnsCompanions = true`; false always disables it.
Host AI should call receiveDamage/receiveActorDamage for its incoming hits.

## Actorstats and movement

```js
room.getCombatStats = (actor, context /* optional {gu,spec} on Gu power */) => ({
  attackDamage, attackRange, attackCooldownMs, moveSpeed,
  damageMultiplier, healingMultiplier, damageReduction,
  schoolMultipliers, stealthDetectionRange,
});
```

Fields are optional. Multipliers default to 1, reduction to 0. A snapshot
replaces standalone equipment defaults. Supplying schoolMultipliers (even {})
also replaces combat's passive school calculation. Return final school factors
for context.spec; respect Tiểu Quang's den_chuyen. Without that property combat
derives school power from equipped, refined, non-resting, well-fed obd Gu:
strongest non-stacking factor times explicit stacking factors.

getPassiveBonuses returns detached `{attributes, speedBonus, schoolMultipliers,
effects}`. Attribute fractions apply to REALM BASE stats, per official wiki.
School aggregates contain unconditional effects; effects retains conditional
den_chuyen entries. speedBonus uses the strongest value as a conservative local
stacking policy. Actorstats owns HP/CN/strength/speed application, permanent
training and equipment totals. Combat never compounds these on refresh.
Temporary added strength is actor.combatStrength; damage conversion is unknown.

Without a snapshot, existing computed hoCu.tong.cong adds flat hand damage;
hoCu.da.cs.sat_thuong/giam provide damage/reduction fractions. No equipment
generation, armor conversion, crit multiplier or upgrade rate is invented.
Baseline reduction, strongest temporary guard and matching school resistance
combine multiplicatively, followed by shields. This is an explicit LOCAL
combination policy, not a recovered server formula.

Runtime movement needs no additional API. Combat already scales tocDo for
temporary slow/flight; use that field once in physics, not multiplied again by
combatSpeedMultiplier. Block walking AND dash for choang/troi (or future
combatStunUntil/combatRootUntil deadlines); phong_khieu blocks attacks, not
walking. Retain a base speed in actorstats rather than overwriting slowed speed.
Other published fields: combatBlindUntil, combatStrength, combatIceStacks,
combatRevealRadius, combatGuLocked, combatShield, combatReduction. Taunt sets
khieu_khich/nham and restores the old target. Blind prevents auto aim but allows
explicit aiming. `room.canCombatTarget(attacker,target)` may return false for
darkness/visibility; combat has no terrain/lighting model.

Dash uses public distance/duration, aim/facing, zone bounds and approximate
creature collision (0.7 m combined body radius; client body radius is 0.35 m).
`room.resolveCombatMove(actor,{from,to,effect})` supplies a terrain-valid endpoint
or null. Combat uses teleport when supplied, otherwise updates actor/physics
and emits dich; luot FX carries the actual Gu and duration ms. Without the
bridge dash resolves immediately and does not perform a terrain sweep.

## Companion bridge

Route only client thu_nha goi/cat to combat if combat owns companion lifecycle.
Host supplies profile.thuNha `{ds,theoToiDa}` and:

```js
room.createCompanion = (pet, {now, owner, x, y}) => detachedActor;
room.onCompanionDefeated = (pet, actor, {now}) => {};
```

Factory actor needs a new ID, finite position and positive HP/max HP. Combat
stamps loai dong_hanh, combatOwner and combatPetUid, and uses optional
addActor/removeActor room bridges. Fallback pet attacks require host-supplied
cong, tam, attackCooldownMs; movement uses supplied tocDo. No pet stat scaling
is invented. Ownership, follower cap, duplicate calls and injury/refusal are
validated. Recall clears ra/theo/aid. Death additionally sets combatDefeated;
host clears it after its recovery flow. Capture, feeding, leveling and mounts
remain host-owned. No recovery duration is guessed.

## Mechanics and persistence

Supported: direct damage/heal, leaf heal charges, shield/guard, poison/burn/bleed,
stun/root/slow/blind, cleanse, HP cost, lifesteal, HoT/sustained healing, flight,
stealth, reveal/marks/ground detection, reflection, school resistance, temporary
strength/self slow, dash, taunt, Mộc Mị, ice accumulation/detonation and passive
death prevention. Reflection uses received HP damage/range and excludes DOT,
self costs and recursion. Flight drops on attacks or incoming direct hits,
including shielded hits. Stealth breaks on damage caused by the hero.

Mộc Mị uses public melee damage/range/cooldown and permits healing Gu, per wiki.
Max-HP changes preserve HP fraction as an explicit local restoration policy.
Death/removal/profile replacement/zone changes clean engine-owned statuses,
wings and captured physics even after the dream player object is replaced.
Dream specs merge only in recovered dream scopes; base catalogs stay unchanged.

Client xt strength helper supplies proficiency, bản mệnh and hungry-Gu modifiers.
Exhausted/resting/unrefined Gu cannot cast. Only equipped bản mệnh gets its
resonances: extended burn/marks, extra self heal, combat regeneration, taunt
on hit, public dodge rate excluding DOT, and hand marks. room.random() can
inject deterministic randomness for that published dodge chance.

Finite nonnegative host slot.cn is authoritative. Otherwise recovered yt/bt
rank/proficiency/percentage/ghiDe cost rules apply. Engine-computed costs refresh
on subsequent casts; host costs remain authoritative. Held rates are fixed at
activation and charge elapsed time without an upfront drain. Depletion,
unequip, exhaustion, death and spec/profile/zone replacement stop them.
Slots publish absolute cd, cdMax, cnGiay, bat and leaf la. Saved bat resets on
construction. profile.combatV3 persists UID-based leaf deadlines and death-
prevention cooldowns; temporary statuses are not persisted.

## Exact unknowns and limits

No public exact values establish killer CN/damage/niệm-resource formulas;
armor/strength/crit conversion; poison healing penalty; ice decay/slow/freeze
duration; very-close stealth detection distance; pet combat/recovery numbers.
No such rates are fabricated. Ice caps at 64 stacks until detonation, cleanse,
death or zone cleanup and reports bang.slow_freeze_duration. Warm-only reveal
requires room.isWarmCreature(actor); otherwise it reports the omitted rule and
does not reveal unclassified creatures. Ground hearing exposes a radius; it
does not synthesize unrecovered map-discovery objects. Mark crit rate is unknown.
Host may supply stealthDetectionRange; otherwise internal AI cannot acquire a
hidden hero. External AI must enforce its own stealth/taunt/visibility behavior.

All 23 killer recipes validate equipped active/passive/support Gu, alternatives,
bản mệnh role and active companion requirements, respecting satChieuKhoa.
Inventory-only Gu do not count. Even a complete recipe returns unsupported
without CN/CD spending: adding component damage is not a killer formula.
Dream ghiDe bypasses recipe checks, not missing effect formulas.

Consumable consumption, capture, training/permanent strength, production,
utility effects, walls, traps, channelled niem and exact crit effects are
outside combat. Mixed casts report omitted parts; unsupported-only casts spend
nothing. Projectiles resolve at cast time. Strongest guard/reflection wins.
DOT/HoT pulses aggregate missed intervals including expiry; long-gap ordering
against expiring shields is approximate. Legacy beast fallback values remain
8 damage / 1.4 s, 1.4 m/s and 18 s respawn only without host values: these are
old local-adapter defaults, not server rates. AI moves at most one second and
attacks once per tick after pauses. Status/cast/slot caps are 64 and ordinary
timed statuses are capped at 600 seconds.

## Tests and evidence

Run `node scripts/test-combat.mjs`; COMBAT_DATA selects another actual catalog.
Default dist/data/game.json has 377 Gu and identical Gu definitions to the
recovered live-game snapshot. The 42 groups cover latest Gu, regressions,
host integration, rank zero, dream isolation, dummy practice and absorption.
The sweep accepts 266 Gu (248 without reported omissions, 18 partial), and
explicitly rejects 111 manual activations, including 44 passive Gu whose
automatic effects must not be counted as failed passive behavior.

Evidence and complete 50-family schema review are in reports/COMBAT-V3.md.
Primary sources: recovered-current/modules/bundle.js; dist/data/game.json and
text_vi.json; official generated 22 October wiki:
https://cotienlo.com/wiki/tn/chien_dau.html,
https://cotienlo.com/wiki/tn/sat_chieu.html,
https://cotienlo.com/wiki/tn/nuoi_co.html,
https://cotienlo.com/wiki/tn/co_doi_chi_so.html,
https://cotienlo.com/wiki/tn/thu_nha.html,
https://cotienlo.com/wiki/tn/ho_cu.html.
