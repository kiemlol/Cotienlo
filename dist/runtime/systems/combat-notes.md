Combat integration (22 Oct live catalog)
=======================================

`createCombat(room)` exports `{attack(payload, type = 'dung'), tick(now),
getDamageReduction(), receiveDamage(amount, source, now = Date.now())}`. Create
one instance after state/player/profile initialization, route `dung` and
`sat_chieu` to `attack`, and call `tick(Date.now())` from the room timer. All
timestamps are milliseconds; `gu.hoi_chieu`, effect durations, and CN rates in
the catalog use seconds. Returns include `ok`, `reason` on failure, and an
`unsupported` list. Slot indices are zero based, as in the recovered client.

Remove the old hardcoded attack and guard drain when integrating. For the old
room implementation, also replace its beast combat/respawn loop with engine
`tick`. If the host has a new enemy loop, set `room.combatOwnsBeasts = false` to
disable engine pursuit/retaliation/respawns; continue calling `tick` for effects
and held CN. Have the host enemy loop call `receiveDamage(rawAmount, actor.id,
now)` instead of subtracting HP: this applies reduction, absorbs shields, emits
FX, handles lethal cleanup, and refreshes profile state. Do not pre-reduce that
amount or also subtract HP. `getDamageReduction()` returns the strongest active
fraction (e.g. `.5`), for UI or other damage calculations; it does not consume
shields. Keep meditation, world events, periodic saving, and state broadcast
in the host. The engine does not run a multiplayer server or
damage NPCs, players other than the room hero, companions, or dead entities.
Host input/movement must respect `player.hieuUng` (`choang`/`troi`) and the
`tocDo` multiplier. Attack already respects stun; beast AI respects stun/root
and slow. Integrators must apply these constraints to movement prediction too.

`room.onCombatAction?.({type, p, gu, ...result})` runs once after each successful
command (including held on/off) and after refresh/save. Failed commands do not
advance intro stages through this hook. `room.onKill?.(actor)` runs once per
lethal hit/DOT before the combat save. When supplied, that callback owns **all
kill counts, quest/intro progression, and rewards**; the engine never also
increments `progress.kills` or grants loot. Without a callback the standalone
fallback increments kills and grants the original local adapter's rewards.

Required room members: `data`, `player`, `profile`, `state` (`now`, actors Map),
`sessionId`, `progress`, `label`, `emit`, `notify`, `changed`, `save`, `refresh`.
`refresh` runs before combat saves, keeping profile HP/CN consistent. Supported
casts save once; timer updates use the host's periodic save. `room.guard` is only
a compatibility boolean; the engine uses actual reduction values. Reconstructed
beast AI uses the existing local adapter's 8 damage/1.4 seconds, 1.4 m/s pursuit,
18 second respawn and fallback +12 stones/+1 meat rewards. Death leaves the player at zero
HP for the host resurrection flow. No automatic heal/revive loop is included.

Data and overrides
------------------

The primary source is `/workspace/work/cotienlo-expand/live-game.json`: 377 Gu,
55 zones, 23 killer moves, plus `guGiacMo`. The older
`/workspace/cotienlo-recovered/public/data/game.json` has only 276 Gu. There is no
embedded Gu ID whitelist; all effects/shapes resolve from **current `room.data`**.
In a zone starting with `inst_mo` (using `room.zoneId`, falling back to
`room.state.zoneId`), the engine resolves `{...gu[id], ...guGiacMo[id]}` locally,
retaining rank, FX and labels from the base. Base data is never mutated. Merged
spec identity is cached per base/override pair; replace entries when changing
their definitions rather than mutating definitions in place. Exiting a dream,
replacing a held Gu spec, or replacing its override cancels its toggle at the
next combat operation. A host-provided merged catalog is also accepted.

Intro integration is tested with Ngũ chuyển, 5200 HP / 2400 CN and slots
`ngu_khieu_hoa_thap`, `hoa_long`, `viem_tru`, `lieu_quang`, `dien_nhan`, `viem_duc`,
plus `satChieuO: ['km_hoa_giao_lieu_nguyen', null]`. Prefix slot Gu IDs with
`gu_`. `dien_nhan` reconnaissance and killer moves remain explicit unsupported
features; the other four instant/held combat Gu and flight use their overrides.

Slot `cn` is authoritative when finite and nonnegative. If omitted, the engine
uses the recovered client CN calculation: rank discounts/surcharge in
`bal.combat`, proficiency discount in `bal.cultivation.thuan_thuc`, percentage
of `cnMax` for `ti_le_toi_da`, and `ghiDe`. A fallback result is published back
to the slot; the host must recompute/remove `slot.cn` after rank, proficiency,
max-CN, or dream changes. `cdMax = spec.hoi_chieu * 1000`, `cd` is an absolute
deadline, `cnGiay` identifies held rates, and `bat` identifies live toggles.
Held skills require one second's CN to activate, charge elapsed time with no
upfront charge, can be switched off during cooldown/stun, and stop at depletion,
death, unequip or spec replacement. Existing saved `bat` values reset on engine
creation because transient effects are not saved. Cooldowns remain in slots.

Supported subset and limits
---------------------------

Numeric `hu` entries support direct `sat_thuong.goc`, `hoi_mau.goc`, shields
(`khien.ti_le_mau`), damage reduction, poison/burn/bleed (`moi_s`), stun, root,
slow, bounded dispel of engine-owned debuffs, healing over time, sustained
healing, cast HP costs, direct-hit lifesteal and held flight (`bay`). Flight sets
`player.canh` to the actual Gu ID, multiplies `tocDo` by `1 + effect.toc`, and
sets `room.physics.b.quaHo = true` when that bridge exists. Toggle-off, depletion,
unequip, death, or dream exit restores previous wings, speed and water-crossing
flag. The host must scale its server-side physics speed from `player.tocDo`,
matching the recovered client's prediction (about line 200826). Targets follow the catalog's
single target/projectile, self, circle, ground circle, cone and line shapes.
Missing line width defaults to 1 metre, matching the recovered FX renderer.
Projectiles resolve immediately at cast time; there is no projectile simulation,
collision/line-of-sight or terrain geometry. Healing targets self or living
`dong_hanh` actors. The client sends its auto-aimed monster even for healing:
a living hostile selection on a targeted heal means self-heal, and self-centred
healing circles ignore `muc`. This never heals or damages the selected hostile.
Omitting `muc` also self-heals. Explicit invalid/NPC/dead IDs for targeted spells
are rejected. Harmful AoE targets are validated individually, and invalid
offensive IDs never silently fall back. Empty harmful AoE is rejected free.

Base effect amounts are used directly: no claim of original server scaling,
armor, crit, strength, hunger, higher-rank HP backlash, passive school multipliers
or synergy formulas.
Multiple reductions use the strongest value; shields stack per cast source;
recasting the same slot/effect replaces that status. DOTs/HoTs pulse after their
first interval, include the final pulse at expiry, and aggregate missed pulses.
Status duration is capped at 600 seconds, 64 effects per entity, 64 slots, and
64 effects per cast. AI moves at most one second and attacks at most once per
tick after a long pause. Time cannot move backwards. Removed/dead actors lose
statuses, preventing DOTs from crossing respawns. Timer frequency does not change
sustained CN drain. All temporary state is in memory and bounded by room actors.

Every unsupported effect/synergy is returned and reported through `notify`;
mixed skills apply only supported entries. Unsupported-only skills spend no CN
and deal no damage. Passive activation, consumable activation (inventory agent
owns consumption), channelled `niem`, leaf-charge healing, stealth,
movement, traps, walls, summons, capture, ice stacks and advanced conditional
effects are intentionally unsupported. Strength-scaled healing and armor-pierce
modifiers are explicitly reported while their declared base effect can apply.
All killer moves are rejected explicitly: public `killer` supplies components,
FX, area tags, cooldown/cast durations, but no numerical effects or CN formula.
Component Gu are not composed into invented killer damage.

Readable client reference: `/workspace/work/cotienlo-expand/recovered-current/modules/bundle.js`.
Search `function yt` / `function bt` for the cost helper (about line 19552),
`guGiacMo` for dream merging (about line 126862), `cnGiay` for slot cost display
(about line 132381), and `cdSatChieu` for absolute cooldown display. Hand reach is
`combat.don_tay.tam_m + noi_tam_m` (about line 195770). The FX handlers at lines
188762 (`trung`), 188903 (`buff`), 188958 (`duy_tri`), 189005 (`so`), and 189884
(held aura implementation) supply the field evidence. The FX
`trung`/`vung`/`vong`/`buff`/`so`/`duy_tri` cases consume `gu`, optional `fx`,
`tu`, `id`, geometry, duration and toggle fields. Numbers use `loai: dmg`,
`nhan`, `dot`, `hoi`, `khien`; unknown spell IDs are never emitted as a fake
Nguyet Quang hit. Original server implementation was not recovered.

Run `node scripts/test-combat.mjs`. The tests use a mocked room and can sweep
an actual catalog with `COMBAT_DATA=/path/to/game.json`; by default they prefer
the 22 Oct live file, then the repository's built data. No runtime, build,
profile-defaults or Gu inventory files are changed by this module.
