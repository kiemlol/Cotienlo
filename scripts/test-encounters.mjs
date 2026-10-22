import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEncounters, describeEncounters, encounterCondition, ENCOUNTER_POLICY} from '../src/systems/encounters.mjs';
import {WIKI_BEASTS, WIKI_DUNGEONS} from '../src/systems/encounters-data.mjs';

// Actual shipped maps/catalog; no DOM, network, builds or runtime writes.
const data = JSON.parse(readFileSync(new URL('../dist/data/game.json', import.meta.url)));
const text = JSON.parse(readFileSync(new URL('../dist/data/text_vi.json', import.meta.url)));
let tests = 0;
const initial = Date.UTC(2026, 9, 22, 0, 0);
const living = r => [...r.state.actors.values()].filter(a => a.encounterSlot && a.hp > 0);
function room(id = 'zone_vu_linh_ha', saved) {
  const spawn = data.zones[id].spawn;
  const r = {
    data, text, zoneId: id, sessionId: 'hero', progress: structuredClone(saved?.progress || {}),
    profile: structuredClone(saved?.profile || {chuyen: 2, tv: {chuyen: 2, giai: 1, diem: 9, can: 9800}, hp: 300, hpMax: 300, cn: 100, cnMax: 100, nguyenThach: 1000, tui: {}, co: [], xong: [], flags: []}),
    player: {id: 'hero', ten: 'Test', hinh: 'player_nam', loai: 'nguoi', x: spawn.x, y: spawn.y, hp: 300, hpMax: 300, cn: 100, cnMax: 100, cong: 25, chuyen: 2},
    state: {zoneId: id, now: saved?.now ?? initial, actors: new Map(), players: new Map()},
    events: [], notices: [], travels: [], damage: [], progressionEvents: [], snapshots: [],
    label: (key, fallback) => text[key] || fallback || key,
    emit(type, payload) { this.events.push({type, payload: structuredClone(payload)}); },
    notify(message) { this.notices.push(message); },
    changed() {},
    addActor(a) { this.state.actors.set(a.id, a); },
    removeActor(id) { this.state.actors.delete(id); },
    teleport(x, y) { this.player.x = x; this.player.y = y; },
    refresh() {},
    save() { this.snapshots.push(this.snapshot()); return true; },
    travel(zone, opts) { this.travels.push({zone, opts}); },
    snapshot() { return structuredClone({profile: this.profile, progress: this.progress, now: this.state.now}); },
    onEncounterEvent(kind, payload) { this.progressionEvents.push({kind, ...payload}); },
  };
  r.combat = {receiveDamage(amount, actor, now) { r.damage.push({amount, actor, now}); r.player.hp = Math.max(0, r.player.hp - amount); }};
  r.state.players.set('hero', r.player);
  r.e = createEncounters(r);
  r.step = (ms = 250) => { r.state.now += ms; r.e.tick(r.state.now); };
  r.kill = a => { a.hp = 0; return r.e.onKill(a); };
  r.goto = id => { const n = data.zones[r.zoneId].noi.find(n => n.id === id); assert.ok(n, id); r.teleport(n.x, n.y); };
  return r;
}
function test(name, fn) { fn(); tests++; console.log('PASS', name); }
function clearDungeon(r) {
  for (let i = 0; i < 150; i++) {
    const list = living(r); if (!list.length) return;
    for (const a of list) r.kill(a);
  }
  assert.fail('dungeon did not terminate');
}
function bossRoom(id = 'inst_hang_heo') {
  const r = room(id); r.e.begin();
  for (let i = 0; i < 100 && !living(r).some(a => a.encounterBoss); i++) for (const a of living(r)) r.kill(a);
  const boss = living(r).find(a => a.encounterBoss); assert.ok(boss, id);
  return [r, boss];
}

test('all 55 actual maps have descriptors, declared routes/POIs/ext and explicit scope', () => {
  assert.equal(Object.keys(data.zones).length, 55);
  for (const [id, z] of Object.entries(data.zones)) {
    const d = describeEncounters(data, id);
    assert.equal(d.points, z.noi); assert.equal(d.groups, z.bai); assert.equal(d.ext, z.ext);
    assert.equal(d.privateScriptKnown, false);
    const r = room(id); assert.doesNotThrow(() => r.e.begin()); assert.doesNotThrow(() => r.step());
    for (const a of living(r)) {
      assert.ok(data.beast[a.def]); assert.ok(a.hpMax > 0 && a.cong > 0);
      assert.ok(a.x >= 0 && a.x <= z.rong && a.y >= 0 && a.y <= z.cao);
      assert.ok(![...z.chan, ...z.ho].some(b => a.x > b.x && a.x < b.x + b.w && a.y > b.y && a.y < b.y + b.h), id + ':' + a.id);
    }
  }
  assert.equal(describeEncounters(data, 'missing'), null);
});
test('world rosters use every declared numeric/map count rather than two of each', () => {
  const r = room('zone_thao_nguyen_tuyet'); r.e.begin();
  const expected = data.zones[r.zoneId].bai.reduce((sum, b) => sum + (typeof b.so === 'number' ? b.so : Object.values(b.so).reduce((a, b) => a + b, 0)), 0);
  assert.equal(living(r).length, expected); assert.ok(expected > 40);
  const before = r.state.actors.size; r.e.begin(); r.step(); assert.equal(r.state.actors.size, before);
});
test('explicit beast stat fields override labeled local numeric fallback', () => {
  const r = room(); r.data = {...data, beast: {...data.beast, beast_lon_rung: {...data.beast.beast_lon_rung, hp: 123, cong: 17, tocDo: 1.4, chuyen: 1}}};
  r.e = createEncounters(r); r.e.begin(); const a = living(r).find(a => a.def === 'beast_lon_rung');
  assert.equal(a.hpMax, 123); assert.equal(a.cong, 17); assert.equal(a.tocDo, 1.4); assert.equal(a.hinh, data.beast[a.def].visual);
  assert.equal(a.encounterSource, 'public-roster/declared-stats');
});
test('conditions handle quest steps, rank stages, flags, AND/OR and unknowns safely', () => {
  const r = room(); r.progress.quests = {mq_h02: {step: 'b4'}, sq_active: {step: 'b1'}}; r.profile.flags = ['flag_open']; r.profile.xong = ['q_done'];
  assert.ok(encounterCondition(r, 'buoc:mq_h02.b4-b5 & flag_open'));
  assert.ok(encounterCondition(r, 'false | xong:q_done')); assert.ok(encounterCondition(r, 'dang:sq_active'));
  assert.ok(encounterCondition(r, 'tu_vi:2.trung')); assert.equal(encounterCondition(r, 'tu_vi:3.so'), false);
  assert.equal(encounterCondition(r, 'false'), false); assert.equal(encounterCondition(r, 'arbitrary:unknown'), false);
  assert.equal(encounterCondition(r, 'buoc:mq_h02.b5'), false);
});
test('quest-gated private groups appear only when unlocked and disappear again', () => {
  const r = room('zone_bac_linh'); r.e.begin();
  assert.ok(!living(r).some(a => a.encounterSlot.startsWith('bai:bai_soi_dau_dan:')));
  r.progress.quests = {mq_h02: {step: 'b4'}}; r.step();
  assert.equal(living(r).filter(a => a.encounterSlot.startsWith('bai:bai_soi_dau_dan:')).length, 1);
  r.progress.quests.mq_h02.step = 'b6'; r.step();
  assert.equal(living(r).filter(a => a.encounterSlot.startsWith('bai:bai_soi_dau_dan:')).length, 0);
});
test('dream/cutscene construction never clears, spawns, rewards or migrates intro state', () => {
  for (const id of ['inst_mo_dau', 'inst_mo_lai_x02', 'inst_dem_trang']) {
    const r = room(id), sentinel = {id: 'intro', hp: 9}; r.state.actors.set('intro', sentinel);
    const before = r.snapshot(); assert.equal(r.e.begin(), false); r.step();
    assert.equal(r.state.actors.size, 1); assert.equal(r.state.actors.get('intro'), sentinel);
    assert.deepEqual(r.profile, before.profile); assert.deepEqual(r.progress, before.progress);
  }
  const r = room(); r.story = {activeScene: true}; assert.equal(r.e.begin(), false); r.step(); assert.equal(r.state.actors.size, 0);
  assert.equal(r.e.handle('f', {id: 'cua_hang_heo'}), false);
  r.story.activeScene = false; r.step(); assert.ok(living(r).length > 0);
});
test('world kill callback returns ownership, pays once, and emits client-compatible loot arrays', () => {
  const r = room(); r.e.begin(); const a = living(r)[0];
  assert.equal(r.e.onKill({id: 'foreign', loai: 'thu', hp: 0}), false);
  assert.equal(r.kill(a), true); const saved = r.snapshot();
  assert.equal(r.e.onKill(a), true); assert.deepEqual(r.snapshot(), saved);
  assert.equal(r.progress.kills, 1); assert.equal(a.respawn, 0);
  for (const e of r.events.filter(e => e.type === 'nhat')) assert.ok(Array.isArray(e.payload) && e.payload.every(v => v.id && finitePositive(v.so) && v.ten));
  const boar = WIKI_BEASTS.beast_lon_rung.drops; assert.ok(boar.some(d => d.id === 'item_da_heo'));
});
function finitePositive(n) { return Number.isFinite(n) && n > 0; }
test('world death timer persists through reload and next life can pay exactly once', () => {
  let r = room(); r.e.begin(); const a = living(r).find(a => a.def === 'beast_lon_rung'); r.kill(a);
  const slot = a.encounterSlot; r = room(r.zoneId, r.snapshot()); r.e.begin();
  assert.ok(!living(r).some(a => a.encounterSlot === slot));
  r.step(ENCOUNTER_POLICY.worldRespawnMs + 1); const next = living(r).find(a => a.encounterSlot === slot);
  assert.equal(next.encounterLife, 1); r.kill(next); assert.equal(r.progress.kills, 2);
});
test('all ten mapped dungeons clear through declared waves with one completion', () => {
  for (const id of Object.keys(data.zones).filter(id => describeEncounters(data, id).mode === 'dungeon')) {
    const r = room(id); r.e.begin(); clearDungeon(r);
    const done = r.progressionEvents.filter(e => e.kind === 'instance_complete');
    assert.equal(done.length, 1, id); assert.equal(done[0].zone, id);
    r.step(); r.e.begin(); assert.equal(r.progressionEvents.filter(e => e.kind === 'instance_complete').length, 1);
  }
});
test('partial dungeon reload restores the same wave and never replays paid kills', () => {
  let r = room('inst_hang_heo'); r.e.begin(); const a = living(r)[0]; r.kill(a); const money = r.profile.nguyenThach;
  r = room(r.zoneId, r.snapshot()); r.e.begin(); assert.equal(living(r).length, 2);
  assert.equal(r.profile.nguyenThach, money); clearDungeon(r); assert.equal(r.progress.encounters.zones[r.zoneId].done, true);
  const after = r.snapshot(); r = room(r.zoneId, after); r.e.begin(); assert.equal(living(r).length, 0); assert.equal(r.profile.nguyenThach, after.profile.nguyenThach);
});
test('death/reset removes only owned actors; replay cannot farm prior rewards', () => {
  const r = room('inst_hang_heo'); r.e.begin(); const foreign = {id: 'story-npc', hp: 3}; r.state.actors.set(foreign.id, foreign);
  const a = living(r)[0]; r.kill(a); const money = r.profile.nguyenThach, slot = a.encounterSlot;
  r.player.hp = 0; r.step(); assert.equal(r.state.actors.get(foreign.id), foreign); assert.equal(living(r).length, 0);
  r.player.hp = 300; r.player.trongThuong = false; r.step(); assert.equal(living(r).length, 3);
  r.kill(living(r).find(a => a.encounterSlot === slot)); assert.equal(r.profile.nguyenThach, money); assert.equal(r.progress.kills, 1);
});
test('normal doors preserve den_spawn and actual instance return entry', () => {
  const r = room('zone_khe_coc'); r.e.begin(); r.goto('cua_bac'); assert.equal(r.e.onInteract('cua_bac'), true);
  assert.equal(r.travels[0].zone, 'zone_vu_linh_ha'); assert.equal(r.travels[0].opts.den_spawn, 'cua_nam');
  r.goto('cua_dong'); r.e.onInteract('cua_dong'); assert.equal(r.travels[1].opts.den_spawn, 'cong_trai');
  const town = room('zone_ta_gia_trai'); town.e.begin(); town.goto('cua_ham_ruou'); town.e.onInteract('cua_ham_ruou');
  const cellar = room('inst_ham_ruou', town.snapshot()); cellar.e.begin(); cellar.goto('bac_thang'); cellar.e.onInteract('bac_thang');
  assert.equal(cellar.travels[0].zone, 'zone_ta_gia_trai'); assert.equal(cellar.travels[0].opts.den_spawn, 'cua_ham_ruou');
});
test('far-away and gated door requests cannot travel or spend currency', () => {
  const r = room(); r.e.begin(); const before = r.profile.nguyenThach;
  r.e.onInteract('cua_hang_heo'); assert.equal(r.travels.length, 0);
  r.profile.chuyen = 0; r.profile.tv.chuyen = 0; r.goto('cua_bac'); r.e.onInteract('cua_bac');
  assert.equal(r.travels.length, 0); assert.equal(r.profile.nguyenThach, before);
  r.e.handle('thoai', {chon: 'encounter:hard'}); assert.equal(r.travels.length, 0);
});
test('dungeon door choice uses original dialogue contract and normal difficulty', () => {
  const r = room(); r.e.begin(); r.goto('cua_hang_heo'); r.e.onInteract('cua_hang_heo');
  const menu = r.events.at(-1); assert.equal(menu.type, 'thoai'); assert.equal(menu.payload.loai, 'lua_chon');
  assert.ok(menu.payload.cac.some(c => c.i === 'encounter:hard'));
  assert.equal(r.e.handle('thoai', {chon: 'encounter:normal'}), true);
  assert.equal(r.travels[0].zone, 'inst_hang_heo'); assert.equal(r.travels[0].opts.hard, false);
});
test('hard mutations are weekly deterministic and seals charge once per saved entry', () => {
  const r = room(); r.e.begin(); r.e.enterDungeon('inst_hang_heo', {hard: true, seals: 2});
  assert.equal(r.profile.nguyenThach, 850); r.e.enterDungeon('inst_hang_heo', {hard: true, seals: 2}); assert.equal(r.profile.nguyenThach, 850);
  const a = room('inst_hang_heo', r.snapshot()), b = room('inst_hang_heo', r.snapshot()); a.e.begin(); b.e.begin();
  assert.deepEqual(living(a).map(a => [a.hpMax, a.cong, a.tocDo]), living(b).map(a => [a.hpMax, a.cong, a.tocDo]));
  assert.ok(living(a)[0].hpMax >= 90 * 1.5);
});
test('Khai Khieu promotes fresh rank zero, preserves HP/Gu and emits each bridge once', () => {
  const r = room('inst_khai_khieu'); r.profile.chuyen = 0; r.profile.tv = {chuyen: 0, giai: 0, diem: 0, can: 0}; r.profile.cn = r.profile.cnMax = r.player.cn = r.player.cnMax = 0;
  const rebases = []; r.progression = {rebase: b => rebases.push(b)};
  const co = r.profile.co; r.e.begin(); r.goto('vach_bien_hoa'); r.e.onInteract('vach_bien_hoa'); r.teleport(20, 27.3); r.step();
  assert.equal(r.profile.chuyen, 1); assert.equal(r.profile.tv.chuyen, 1); assert.equal(r.profile.tv.can, 300);
  assert.equal(r.player.chuyen, 1); assert.equal(r.player.cnMax, 100); assert.equal(r.player.cn, 100); assert.equal(r.player.hpMax, 300); assert.equal(r.profile.co, co);
  assert.deepEqual(rebases, [{cnMax: 100}]);
  assert.equal(r.progressionEvents.filter(e => e.kind === 'awakening').length, 1); assert.equal(r.progressionEvents.filter(e => e.kind === 'instance_complete').length, 1);
  r.step(); r.e.onInteract('vach_bien_hoa'); assert.equal(r.progressionEvents.filter(e => e.kind === 'awakening').length, 1);
});
test('ceremony setter has precedence over room callback; legacy rank/stats/Gu survive', () => {
  const r = room('inst_khai_khieu'), before = structuredClone(r.profile), calls = [];
  r.e.onProgressionEvent = (kind, p) => calls.push({kind, ...p}); r.e.begin(); r.goto('vach_bien_hoa'); r.e.onInteract('vach_bien_hoa'); r.teleport(20, 27.3); r.step();
  assert.deepEqual(r.profile, before); assert.equal(calls.filter(e => e.kind === 'awakening').length, 1); assert.equal(r.progressionEvents.length, 0);
  const reloaded = room(r.zoneId, r.snapshot()); reloaded.e.begin(); reloaded.step(); assert.equal(reloaded.progressionEvents.length, 0);
});
test('ceremony rejects movement outside the pressure corridor or before starting', () => {
  const r = room('inst_khai_khieu'); r.e.begin(); r.teleport(20, 26); r.step(); assert.equal(r.progressionEvents.length, 0);
  r.goto('vach_bien_hoa'); r.e.onInteract('vach_bien_hoa'); r.teleport(2, 26); r.step(); assert.equal(r.progressionEvents.length, 0);
});
test('three gates require actual kills, sustained lantern proximity and obstacle destination', () => {
  const r = room('inst_thi_luyen_ba_cua'); r.e.begin(); r.goto('cong_ra'); r.e.onInteract('cong_ra'); assert.equal(r.travels.length, 0); assert.equal(r.progressionEvents.length, 0);
  for (const a of living(r)) r.kill(a); assert.equal(r.progress.encounters.zones[r.zoneId].stage, 1);
  assert.deepEqual({x: r.player.x, y: r.player.y}, data.zones[r.zoneId].spawns.cua_2);
  r.goto('den_giu'); for (let i = 0; i < 4; i++) r.step(1000);
  r.teleport(36, 15); r.step(); assert.equal(r.progress.encounters.zones[r.zoneId].holdMs, 0);
  r.goto('den_giu'); for (let i = 0; i < 8; i++) r.step(1000);
  assert.equal(r.progress.encounters.zones[r.zoneId].stage, 2); r.goto('dich_chay'); r.step();
  assert.equal(r.progressionEvents.filter(e => e.kind === 'instance_complete').length, 1);
});
test('cutscene time cannot instantly complete lantern hold', () => {
  const r = room('inst_thi_luyen_ba_cua'); r.e.begin(); for (const a of living(r)) r.kill(a); r.goto('den_giu'); r.step(1000);
  r.canh = {}; r.step(60000); r.canh = null; r.step();
  assert.equal(r.progress.encounters.zones[r.zoneId].stage, 1); assert.equal(r.progress.encounters.zones[r.zoneId].holdMs, 1000);
});
test('wine source is quest gated, produces declared wine once and survives reentry', () => {
  let r = room('inst_ham_ruou'); r.e.begin(); r.goto('vo_ruou_trang'); r.e.onInteract('vo_ruou_trang'); assert.equal(r.profile.tui.item_ruou_trang, undefined);
  r.progress.quests = {mq_x08: {step: 'b4'}}; r.e.onInteract('vo_ruou_trang'); assert.equal(r.profile.tui.item_ruou_trang, 1);
  r.e.onInteract('vo_ruou_trang'); assert.equal(r.profile.tui.item_ruou_trang, 1);
  r = room(r.zoneId, r.snapshot()); r.e.begin(); r.goto('vo_ruou_trang'); r.e.onInteract('vo_ruou_trang'); assert.equal(r.profile.tui.item_ruou_trang, 1);
  assert.equal(living(r).length, 0); assert.equal(r.profile.co.length, 0);
});
test('wine wall discovery and declared NPC IDs leave story/services to host', () => {
  const r = room('inst_ham_ruou'); r.e.begin(); r.goto('vach_da_cu'); r.e.onInteract('vach_da_cu'); r.e.onInteract('vach_da_cu');
  assert.equal(r.progressionEvents.filter(e => e.kind === 'cellar-wall').length, 1);
  const town = room('zone_ta_gia_trai'); town.e.begin(); const npc = town.e.npcInteractions.find(n => n.id === 'npc_me'); assert.ok(npc);
  town.teleport(npc.x, npc.y); assert.equal(town.e.onInteract(npc.id), false);
});
test('inst_dot_pha remains exclusively owned by progression', () => {
  const r = room('inst_dot_pha'); const before = r.snapshot(); r.e.begin(); r.goto('bo_doan');
  assert.equal(r.e.onInteract('bo_doan'), false); assert.equal(r.e.handle('dot_pha', {}), false); assert.equal(r.e.handle('mini', {giu: true}), false);
  r.step(); assert.deepEqual(r.profile, before.profile); assert.equal(living(r).length, 0);
});
test('boar boss summons at 70%, enrages at 40%, warns then damages only through combat', () => {
  const [r, a] = bossRoom(); a.hp = a.hpMax * .69; r.step();
  assert.equal(living(r).filter(a => a.encounterNoLoot).length, 2); const attack = a.cong; a.hp = a.hpMax * .39; r.step(); assert.ok(a.cong > attack);
  r.teleport(a.x + 1, a.y); r.step(2000); const warning = r.events.filter(e => e.type === 'fx' && e.payload.k === 'canh_bao').at(-1); assert.ok(warning);
  const before = r.damage.length; r.step(1100); assert.ok(r.damage.length > before); assert.ok(r.damage.at(-1).amount > a.cong);
});
test('boss telegraph can be dodged and is cancelled when a cutscene starts', () => {
  const [r, a] = bossRoom(); r.teleport(a.x + 1, a.y); r.step(2200);
  r.teleport(4, 40); r.step(1200); assert.equal(r.damage.length, 0);
  r.teleport(a.x + 1, a.y); r.step(7000); r.canh = {}; r.step(1100); assert.equal(r.damage.length, 0);
  assert.ok(r.events.some(e => e.type === 'fx' && e.payload.k === 'huy_canh_bao'));
});
test('Thuy Mang poison cast can be interrupted by actual successful combat action', () => {
  const [r, a] = bossRoom('inst_dam_hac_thuy'); r.teleport(a.x + 1, a.y); r.step(2200);
  r.e.onAction('dung', {}, {ok: true, targets: [a.id]}); r.step(1200);
  assert.equal(r.damage.length, 0); assert.ok(r.notices.some(n => n.includes('ngắt niệm')));
});
test('poison islands are actual declared safe points', () => {
  const [r, a] = bossRoom('inst_dam_hac_thuy'); const island = data.zones[r.zoneId].noi.find(n => n.kieu === 'dao_da');
  a.aggro = r.state.now + 20000; r.teleport(island.x, island.y); r.step(2200); r.step(1200);
  assert.equal(r.damage.length, 0); assert.ok(a.encounterPoisonUntil > r.state.now);
});
test('mine boss darkness and 15-second breakable carapace preserve boss HP bounds', () => {
  const [r, a] = bossRoom('inst_ham_mo'), max = a.hpMax; a.hp = max * .69; r.step(); assert.equal(r.state.gio, 0);
  a.hp = max * .39; r.step(); assert.ok(a.hpMax > max); assert.ok(a.encounterShieldUntil > r.state.now);
  a.hp = max * .38; r.step(); assert.equal(a.hpMax, max); assert.equal(a.encounterShieldUntil, 0); assert.ok(a.hp <= max);
});
test('Lang Phu brings a leashed wolf that flees on handler defeat with no extra loot', () => {
  const [r, a] = bossRoom('inst_sao_lang_phu'); assert.equal(a.def, 'beast_bong_lang_phu');
  const wolf = living(r).find(a => a.encounterLeashed); assert.ok(wolf); assert.equal(wolf.encounterNoLoot, true);
  r.kill(a); assert.equal(r.state.actors.has(wolf.id), false); assert.equal(r.progressionEvents.filter(e => e.kind === 'instance_complete').length, 1);
});
test('three-player hidden ambush uses the documented species and never spawns in solo', () => {
  const [solo] = bossRoom('inst_hang_dia_thu'); assert.ok(!living(solo).some(a => a.encounterSlot.endsWith(':ambush')));
  const r = room('inst_hang_dia_thu'); r.state.players.set('two', {hp: 1}); r.state.players.set('three', {hp: 1}); r.e.begin();
  for (let i = 0; i < 50 && !living(r).some(a => a.encounterBoss); i++) for (const a of living(r)) r.kill(a);
  assert.ok(living(r).some(a => a.def === 'beast_chuot_dia_thu_chua' && a.encounterSlot.endsWith(':ambush')));
});
test('scheduled world bosses honor declared weekday/time/point and never respawn in one window', () => {
  let r = room(); r.state.now = Date.UTC(2026, 9, 22, 5, 31); r.e = createEncounters(r); r.e.begin();
  const a = living(r).find(a => a.encounterScheduled); assert.ok(a); assert.equal(a.def, 'beast_lon_rung_vuong');
  r.kill(a); r.step(19000); assert.ok(!living(r).some(a => a.encounterScheduled));
  const s = r.snapshot(); r = room(r.zoneId, s); r.e.begin(); assert.ok(!living(r).some(a => a.encounterScheduled));
});
test('tower uses original panel commands, increasing floors and fifth-floor bosses', () => {
  const r = room('inst_thap_thi_luyen'); r.e.begin(); assert.ok(r.events.some(e => e.type === 'thap' && e.payload.moc.length === 5));
  r.e.handle('thap', {hd: 'vao'}); assert.equal(living(r).length, 3);
  for (let f = 1; f <= 5; f++) {
    assert.equal(r.progress.encounters.zones[r.zoneId].run.floor, f);
    if (f === 5) assert.ok(living(r).some(a => a.encounterBoss));
    for (const a of living(r)) r.kill(a);
    if (f < 5) r.step(3100);
  }
  assert.equal(r.profile.tui.item_bua_cuong_hoa_nho, 1); assert.equal(r.progress.encounters.tower.best, 5);
  const before = r.profile.nguyenThach; r.e.onKill([...r.state.actors.values()][0]); assert.equal(r.profile.nguyenThach, before);
});
test('tower reload during rest advances once and re-clearing milestone cannot duplicate daily gifts', () => {
  let r = room('inst_thap_thi_luyen'); r.e.begin(); r.e.handle('thap', {hd: 'vao'});
  for (const a of living(r)) r.kill(a); const s = r.snapshot();
  r = room(r.zoneId, s); r.e.begin(); assert.equal(living(r).length, 0); r.step(3100); assert.equal(living(r).length, 3);
  assert.equal(r.progress.encounters.zones[r.zoneId].run.floor, 2);
});
test('tower failure is not a serious injury; it consumes one local daily attempt', () => {
  const r = room('inst_thap_thi_luyen'); r.e.begin(); r.e.handle('thap', {hd: 'vao'}); assert.equal(r.progress.encounters.tower.used, 1);
  r.player.hp = 0; r.player.trongThuong = true; r.step(); assert.equal(r.player.hp, r.player.hpMax); assert.equal(r.player.trongThuong, false);
  assert.equal(r.progress.encounters.zones[r.zoneId].run.active, false); assert.equal(r.progress.encounters.tower.used, 1); assert.equal(r.travels.length, 1);
});
test('weekly inheritance shadow gives each of three floor rewards once, preserving completed floors', () => {
  let r = room('inst_tt_dau_bong'); r.e.begin(); assert.equal(living(r).length, 1); assert.equal(living(r)[0].hinh, r.player.hinh);
  r.kill(living(r)[0]); assert.equal(r.profile.tui.item_manh_co_phuong, 1); const s = r.snapshot();
  r = room(r.zoneId, s); r.e.begin(); r.step(3100); assert.equal(r.progress.encounters.zones[r.zoneId].run.floor, 2);
  r.kill(living(r)[0]); r.step(3100); r.kill(living(r)[0]);
  assert.equal(r.progress.encounters.inheritance.cleared, 3); assert.equal(r.profile.tui.item_manh_co_phuong, 3);
  const done = r.snapshot(); r = room(r.zoneId, done); r.e.begin(); assert.equal(living(r).length, 0); assert.equal(r.profile.tui.item_manh_co_phuong, 3);
});
test('inheritance unopened theme has no filler hostiles; rank zero cannot enter', () => {
  const r = room('inst_tt_giu_den'); r.e.begin(); assert.equal(living(r).length, 0);
  const fresh = room('inst_tt_dau_bong'); fresh.profile.chuyen = 0; fresh.profile.tv.chuyen = 0; fresh.e.begin(); assert.equal(living(fresh).length, 0);
});
test('legacy profile is preserved by attaching, beginning, saving and unknown commands', () => {
  const r = room('zone_ta_gia_trai'); r.profile.co = [{uid: 'legacy', loai: 'gu_nguyet_quang', sao: 4}]; r.profile.nguyenThach = 12345;
  r.profile.custom = {keep: true}; r.progress.old = {training: 77}; const before = structuredClone(r.profile);
  r.e.begin(); assert.equal(r.e.handle('unrelated', {}), false); assert.equal(r.e.handle('mini', {giu: true}), false); r.step();
  assert.deepEqual(r.profile, before); assert.deepEqual(r.progress.old, {training: 77});
  assert.equal(r.progress.encounters.version, 3);
});
test('no ambient filler is introduced in hubs, arenas, garden or progression room', () => {
  for (const id of ['zone_ta_gia_trai', 'zone_ben_thuong', 'zone_cho_giao_hoi', 'inst_gia_vien', 'inst_loi_dai', 'inst_dot_pha']) {
    const r = room(id); r.e.begin(); r.step(); assert.equal(living(r).length, 0, id);
  }
});
test('all seven official dungeon entries have bounded cited reward tables', () => {
  assert.equal(Object.keys(WIKI_DUNGEONS).length, 7);
  for (const [id, d] of Object.entries(WIKI_DUNGEONS)) {
    assert.ok(d.note.length > 10, id); assert.ok(d.drops.some(d => d.id === 'item_nguyen_thach'), id);
    for (const drop of d.drops) assert.ok(data.item[drop.id] || data.gu[drop.id], `${id}: ${drop.id}`);
  }
});

console.log(`${tests} encounter tests passed; ${Object.keys(data.zones).length} actual maps inspected.`);
