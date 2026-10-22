import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createCombat} from '../src/systems/combat.mjs';

let time = 100_000;
const originalNow = Date.now;
Date.now = () => time;
const catalogPaths = process.env.COMBAT_DATA ? [process.env.COMBAT_DATA] : [
  '/workspace/work/cotienlo-expand/live-game.json',
  fileURLToPath(new URL('../dist/data/game.json', import.meta.url)),
];
let actual, catalogPath;
for (const path of catalogPaths) {
  try { actual = JSON.parse(await readFile(path, 'utf8')); catalogPath = path; break; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
assert.ok(actual, 'an actual public catalog is required for coverage');
const actor = (id, x = 1, y = 0, extra = {}) => ({
  id, loai: 'thu', ten: id, x, y, sx: x, sy: y,
  hp: 1000, hpMax: 1000, tocDo: 1, hieuUng: '', ...extra,
});
const spec = (hu, vung = {hinh: 'muc_tieu', tam: 10}, extra = {}) => ({
  chuyen: 1, ten_key: 'test', kich_hoat: 'tuc_thoi', cn: 8,
  cn_theo: 'diem', hoi_chieu: 1, hu, vung, cong_huong: [], ...extra,
});
function setup(gu = actual.gu, bal = actual.bal) {
  time += 100_000;
  const r = {
    data: {gu: structuredClone(gu), bal: structuredClone(bal), killer: actual.killer},
    sessionId: 'hero', progress: {kills: 0}, meditating: true,
    player: actor('hero', 0, 0, {loai: 'nguoi', hp: 100, hpMax: 200, cn: 100, cnMax: 100, huong: 0}),
    profile: {chuyen: 1, tv: {chuyen: 1}, o: [], co: [], tui: {}, nguyenThach: 0, satChieuO: []},
    state: {now: time, actors: new Map()}, events: [], notices: [], changedActors: [], saves: [], refreshes: 0,
    label: (key, fallback) => fallback || key,
    emit(type, payload) { this.events.push({type, ...payload}); },
    notify(text) { this.notices.push(text); },
    changed(a) { this.changedActors.push(a); },
    refresh() { this.refreshes++; Object.assign(this.profile, {hp: this.player.hp, cn: this.player.cn}); },
    save() { this.saves.push(structuredClone(this.profile)); },
  };
  r.combat = createCombat(r);
  r.equip = (loai, cn, index = r.profile.o.length) => {
    const slot = {uid: `owned-${index}`, loai, cd: 0, bat: false};
    if (cn !== undefined) slot.cn = cn;
    r.profile.o[index] = slot;
    r.profile.co.push({uid: slot.uid, loai, thuanThuc: 0});
    return index;
  };
  r.add = a => { r.state.actors.set(a.id, a); return a; };
  r.step = ms => { time += ms; r.combat.tick(time); };
  return r;
}
let tests = 0;
function test(name, fn) { fn(); tests++; console.log('PASS', name); }
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

try {
  test('actual Gu damage, effect identity, absolute cooldowns, independent slots and refreshed saves', () => {
    const r = setup(), a = r.add(actor('a', 5));
    const first = r.equip('gu_nguyet_quang', 8), second = r.equip('gu_thuy_tien', 3);
    const hit = r.combat.attack({o: first, muc: 'a'});
    assert.equal(hit.ok, true); assert.equal(a.hp, 961); assert.equal(r.player.cn, 92);
    assert.equal(r.profile.o[first].cdMax, 1000); assert.equal(r.profile.o[first].cd, time + 1000);
    assert.equal(r.saves.at(-1).cn, r.player.cn);
    assert.equal(r.combat.attack({o: first, muc: 'a'}).reason, 'cooldown');
    assert.equal(r.combat.attack({o: second, muc: 'a'}).ok, true);
    assert.equal(r.player.cn, 89); assert.equal(r.profile.o[second].cn, 3);
    assert.ok(r.events.some(e => e.k === 'trung' && e.gu === 'gu_thuy_tien' && e.id === 'a'));
    assert.equal(r.meditating, false);
    r.step(1000); assert.equal(r.combat.attack({o: first, muc: 'a'}).ok, true);
  });

  test('invalid slots, NPC/dead/player/missing targets and invalid coordinates never damage or spend', () => {
    const r = setup(); const i = r.equip('gu_nguyet_quang', 8);
    r.add(actor('near')); r.add(actor('npc', 1, 0, {loai: 'npc'}));
    r.add(actor('dead', 1, 0, {hp: 0})); r.add(actor('marked-dead', 1, 0, {chet: true}));
    r.add(actor('invalid', NaN));
    for (const target of ['npc', 'dead', 'hero', 'missing', 'marked-dead', 'invalid']) {
      assert.equal(r.combat.attack({o: i, muc: target}).ok, false, target);
    }
    for (const o of [-1, 1.5, '0', NaN, Infinity, '__proto__', 64, undefined]) assert.equal(r.combat.attack({o}).ok, false);
    assert.equal(r.combat.attack(null).ok, false);
    assert.equal(r.combat.attack({o: i}, 'unknown').ok, false);
    assert.equal(r.player.cn, 100); assert.equal(r.state.actors.get('near').hp, 1000);
    assert.equal(r.profile.o[i].cd, 0);
  });

  test('Gu range is catalog reach; hand range/cooldown/base are bal.combat', () => {
    const r = setup(); const i = r.equip('gu_nguyet_quang', 8);
    const a = r.add(actor('a', 10.01));
    assert.equal(r.combat.attack({o: i, muc: 'a'}).reason, 'range');
    a.x = 10; assert.equal(r.combat.attack({o: i, muc: 'a'}).ok, true);
    a.x = 2; assert.equal(r.combat.attack({o: 'tay', muc: 'a'}).ok, false);
    a.x = 1.8; assert.equal(r.combat.attack({o: 'tay', muc: 'a'}).ok, true);
    near(a.hp, 1000 - 39 - actual.bal.combat.don_tay.goc.chuyen_1);
    assert.equal(r.combat.attack({o: 'tay', muc: 'a'}).reason, 'cooldown');
    assert.equal(r.player.cn, 92);
  });

  test('CN fallback follows rank, proficiency, maintained rates, ratios and host computed costs', () => {
    const gu = {
      hit: spec([{loai: 'sat_thuong', goc: 10}], undefined, {cn: 20}),
      guard: spec([{loai: 'giam_sat_thuong', gia_tri: .2}], null, {kich_hoat: 'duy_tri', cn: 10}),
      ratio: spec([{loai: 'giam_sat_thuong', gia_tri: .2}], null, {kich_hoat: 'duy_tri', cn: .02, cn_theo: 'ti_le_toi_da'}),
      high: spec([{loai: 'sat_thuong', goc: 10}], undefined, {chuyen: 5}),
    };
    const r = setup(gu); r.add(actor('a')); r.profile.tv.chuyen = 2;
    const i = r.equip('hit'); r.profile.co[0].thuanThuc = 2;
    near(r.combat.attack({o: i, muc: 'a'}).cn, 20 * .6 * .94);
    const j = r.equip('guard'); near(r.combat.attack({o: j}).cn, 6);
    const k = r.equip('ratio'); r.profile.co.at(-1).thuanThuc = 2;
    near(r.combat.attack({o: k}).cn, 1.88);
    assert.equal(r.profile.o[k].cnGiay, true);
    const high = r.equip('high'); assert.equal(r.combat.attack({o: high, muc: 'a'}).reason, 'cost');
    const override = r.equip('hit', 0); assert.equal(r.combat.attack({o: override, muc: 'a'}).cn, 0);
  });

  test('healing clamps HP, uses own cooldown, scales allies and rejects resurrection/NPC healing', () => {
    const r = setup(), i = r.equip('gu_sinh_tuc_thao', 6);
    const ally = r.add(actor('ally', 3, 0, {loai: 'dong_hanh', hp: 100, hpMax: 200}));
    r.add(actor('enemy', 2));
    r.add(actor('npc', 2, 0, {loai: 'npc'}));
    assert.equal(r.combat.attack({o: i, muc: 'npc'}).ok, false);
    assert.equal(r.combat.attack({o: i, muc: 'enemy'}).ok, true); assert.equal(r.player.hp, 145);
    assert.equal(r.state.actors.get('enemy').hp, 1000, 'auto-aim does not heal/damage a hostile');
    assert.equal(r.combat.attack({o: i}).reason, 'cooldown');
    r.step(5000); assert.equal(r.combat.attack({o: i, muc: 'ally'}).ok, true);
    near(ally.hp, 127); assert.ok(r.events.some(e => e.k === 'so' && e.loai === 'hoi' && e.id === 'ally'));
    r.step(5000); r.player.hp = 199; r.combat.attack({o: i}); assert.equal(r.player.hp, 200);
    r.step(5000); r.player.hp = 0; assert.equal(r.combat.attack({o: i}).reason, 'dead');
  });

  test('held guard costs elapsed seconds, mitigates actual incoming hits and depletes cleanly', () => {
    const r = setup(); const i = r.equip('gu_thu_bi', 2.2);
    const a = r.add(actor('a', 1, 0, {aggro: time + 10000}));
    assert.equal(r.combat.attack({o: i}).ok, true); assert.equal(r.player.cn, 100);
    r.step(250); near(r.player.cn, 99.45); near(r.player.hp, 100 - 8 * .88);
    assert.equal(r.guard, true); assert.equal(r.profile.o[i].bat, true);
    assert.equal(r.combat.attack({o: i}).bat, false, 'off bypasses cooldown');
    assert.equal(r.guard, false); assert.equal(r.player.combatReduction, 0);
    r.step(1000); r.player.cn = 2.2; r.combat.attack({o: i});
    r.step(1000); near(r.player.cn, 0); assert.equal(r.profile.o[i].bat, false);
    assert.ok(r.events.some(e => e.k === 'duy_tri' && e.bat === false && e.gu === 'gu_thu_bi'));
    assert.equal(a.hp, 1000);
  });

  test('multiple held rates do not gain free uptime; unequip/spec replacement/death cancels', () => {
    const r = setup(); const i = r.equip('gu_thu_bi', 2), j = r.equip('gu_ngoc_bi', 3);
    r.combat.attack({o: i}); r.step(500); r.combat.attack({o: j}); r.step(500);
    near(r.player.cn, 96.5); near(r.player.combatReduction, .25);
    r.profile.o[j].loai = 'gu_thuy_tien'; r.step(250); assert.equal(r.profile.o[j].bat, false);
    r.data.gu.gu_thu_bi = {...r.data.gu.gu_thu_bi}; r.step(250); assert.equal(r.guard, false);
    r.step(1000); r.combat.attack({o: i}); r.player.hp = 0; r.step(1);
    assert.equal(r.profile.o[i].bat, false);
  });

  test('timed shields absorb incoming damage and expire; timed reduction is not a held toggle', () => {
    const r = setup(); const i = r.equip('gu_ne', 8), j = r.equip('gu_ban_thach', 1);
    r.add(actor('a', 1, 0, {aggro: time + 20000}));
    r.combat.attack({o: i}); near(r.player.combatShield, 30);
    r.step(250); assert.equal(r.player.hp, 100); near(r.player.combatShield, 22);
    assert.equal(r.combat.attack({o: j}).ok, true); assert.equal(r.guard, false);
    assert.equal(r.profile.o[j].bat, false); near(r.player.combatReduction, .3);
    r.step(6000); assert.equal(r.player.combatShield, 0);
    r.step(3000); assert.equal(r.player.combatReduction, 0);
    assert.equal(r.player.hieuUng.includes('khien'), false);
  });

  test('DOT ticks include expiry, aggregate long pauses, award once and never cross respawns', () => {
    const r = setup({poison: spec([{loai: 'sat_thuong', goc: 10}, {loai: 'doc', moi_s: 10, s: 4}])});
    const i = r.equip('poison', 0); const a = r.add(actor('a', 5, 0, {hp: 45, hpMax: 45}));
    r.combat.attack({o: i, muc: 'a'}); assert.equal(a.hp, 35);
    r.step(999); assert.equal(a.hp, 35); r.step(1); assert.equal(a.hp, 25);
    r.step(3000); assert.equal(a.hp, 0); assert.equal(r.progress.kills, 1);
    assert.equal(r.profile.nguyenThach, 12); assert.equal(r.profile.tui.item_thit_thu, 1);
    assert.equal(r.saves.at(-1).hp, r.player.hp);
    r.step(18000); assert.equal(a.hp, 45); r.step(1000000); assert.equal(a.hp, 45);
    assert.equal(r.progress.kills, 1); assert.equal(a.hieuUng, '');
  });

  test('stun blocks beast attacks, slow scales motion/restores speed and unrelated tags survive', () => {
    const r = setup({control: spec([{loai: 'choang', s: 1}, {loai: 'cham', gia_tri: .5, s: 3}])});
    const i = r.equip('control', 0); const a = r.add(actor('a', 1, 0, {hieuUng: 'external'}));
    r.combat.attack({o: i, muc: 'a'}); a.aggro = time + 20000;
    r.step(500); assert.equal(r.player.hp, 100); near(a.tocDo, .5);
    a.x = 5; r.step(500); near(a.x, 4.65);
    a.tocDo = 1; // another system doubles base speed while slow is active
    r.step(2000); near(a.tocDo, 2); assert.equal(a.hieuUng, 'external');
    r.player.hieuUng = 'choang'; assert.equal(r.combat.attack({o: i, muc: 'a'}).reason, 'stun');
  });

  test('circle/cone/line/ground targeting obeys geometry and excludes NPC/dead actors', () => {
    const make = v => setup({area: spec([{loai: 'sat_thuong', goc: 10}], v)});
    for (const v of [{hinh: 'tron_quanh', r: 3}, {hinh: 'non', tam: 3, goc: 90}, {hinh: 'duong', tam: 3, rong: 1}, {hinh: 'tron_tai_diem', tam: 5, r: 1}]) {
      const r = make(v), i = r.equip('area', 0);
      const a = r.add(actor('front', 2)), b = r.add(actor('back', -2));
      const side = r.add(actor('side', 2, 2)), out = r.add(actor('out', 10));
      const npc = r.add(actor('npc', 2, 0, {loai: 'npc'})); r.add(actor('dead', 2, 0, {hp: 0}));
      assert.equal(r.combat.attack({o: i, x: 2, y: 0}).ok, true);
      assert.equal(a.hp, 990); assert.equal(out.hp, 1000); assert.equal(npc.hp, 1000);
      assert.equal(b.hp, v.hinh === 'tron_quanh' ? 990 : 1000);
      assert.equal(side.hp, ['tron_quanh', 'non'].includes(v.hinh) ? 990 : 1000);
      assert.ok(r.events.some(e => ['vung', 'vong'].includes(e.k)));
    }
    const r = make({hinh: 'tron_tai_diem', tam: 5, r: 1}), i = r.equip('area', 8);
    r.add(actor('a', 2));
    for (const p of [{x: 6, y: 0}, {x: NaN, y: 0}, {x: 0}, {x: 4, y: 4}, {x: 0, y: 0}, {muc: 'missing'}]) assert.equal(r.combat.attack({o: i, ...p}).ok, false);
    assert.equal(r.player.cn, 100); assert.equal(r.profile.o[i].cd, 0);
  });

  test('HoT, maintained healing, root, cleanse, lifesteal and cast HP cost use declared amounts', () => {
    const r = setup({
      hot: spec([{loai: 'hoi_mau_dan', ti_le_mau: .15, s: 6, nhip_s: 1}]),
      regen: spec([{loai: 'hoi_mau_duy_tri', ti_le_moi_s: .01}], null, {kich_hoat: 'duy_tri', cn: 2}),
      hit: spec([{loai: 'sat_thuong', goc: 40}, {loai: 'hut_mau', ti_le: .25}, {loai: 'tra_mau', ti_le: .03}, {loai: 'troi', s: 2}]),
    });
    const i = r.equip('hot', 0), j = r.equip('regen', 2), k = r.equip('hit', 0);
    r.combat.attack({o: i}); r.step(6000); assert.equal(r.player.hp, 130);
    r.combat.attack({o: j}); r.step(1000); near(r.player.hp, 132);
    const a = r.add(actor('a', 5)); r.combat.attack({o: k, muc: 'a'});
    near(r.player.hp, 136); assert.ok(a.hieuUng.includes('troi'));
    r.step(1000); assert.equal(a.x, 5);
    const clean = setup({bad: spec([{loai: 'cham', gia_tri: .2, s: 5}], {hinh: 'muc_tieu', tam: 10}), cleanse: spec([{loai: 'giai_hieu_ung', so: 1}], {hinh: 'ban_than'})});
    // A hostile debuff cannot be cast onto self, and external status ownership is preserved.
    const ci = clean.equip('cleanse', 0); clean.player.hieuUng = 'external'; clean.combat.attack({o: ci});
    assert.equal(clean.player.hieuUng, 'external');
  });

  test('unsupported-only, passive, leaf charges, consumables, channels and killer spend nothing', () => {
    const r = setup(); r.add(actor('a'));
    for (const gu of ['gu_an_lan', 'gu_tieu_quang', 'gu_hoa_du', 'gu_luu_tinh', 'gu_tieu_sinh_co_thao']) {
      const i = r.equip(gu, 1), result = r.combat.attack({o: i, muc: 'a', x: 1, y: 0});
      assert.equal(result.reason, 'unsupported', gu); assert.ok(result.unsupported.length);
      assert.equal(r.profile.o[i].cd, 0);
    }
    r.profile.satChieuO = [Object.keys(actual.killer)[0]];
    assert.equal(r.combat.attack({o: 0}, 'sat_chieu').reason, 'unsupported');
    assert.equal(r.player.cn, 100); assert.equal(r.state.actors.get('a').hp, 1000);
    assert.ok(r.notices.some(n => n.includes('thiếu công thức')));
  });

  test('mixed unsupported effects report their names and never synthesize extra damage', () => {
    const r = setup({mixed: spec([{loai: 'sat_thuong', goc: 11}, {loai: 'no_bang', moi_tang: 999}], undefined, {cong_huong: [{loai: 'future_synergy'}]})});
    const i = r.equip('mixed', 8), a = r.add(actor('a'));
    const result = r.combat.attack({o: i, muc: 'a'});
    assert.equal(result.ok, true); assert.equal(a.hp, 989);
    assert.deepEqual(result.unsupported, ['no_bang', 'cong_huong.future_synergy']);
    assert.ok(r.notices.some(n => n.includes('no_bang')));
  });

  test('deletion/object replacement, repeated ticks, backwards time and large gaps remain bounded', () => {
    const r = setup({dot: spec([{loai: 'doc', s: 6, moi_s: 10}])});
    const i = r.equip('dot', 0), a = r.add(actor('a', 5)); r.combat.attack({o: i, muc: 'a'});
    const replacement = actor('a', 5); r.state.actors.set('a', replacement); r.step(1000);
    assert.equal(replacement.hp, 1000); assert.equal(a.hieuUng, '');
    r.combat.tick(time - 1000); assert.equal(replacement.hp, 1000);
    replacement.x = 1; replacement.aggro = time + 100000;
    r.step(1); const hp = r.player.hp; r.combat.tick(time); assert.equal(r.player.hp, hp);
    replacement.nextHit = 0; r.step(10000); assert.equal(r.player.hp, hp - 8, 'no unbounded attack catch-up');
    assert.ok(r.events.length < 50);
  });

  test('latest catalog is resolved dynamically, including a host-provided scoped dream override', () => {
    const base = actual.gu.gu_hoa_long;
    const r = setup(); r.add(actor('a', 5)); const i = r.equip('gu_hoa_long', 26);
    r.data.gu.gu_hoa_long = {...base, ...(actual.guGiacMo?.gu_hoa_long || {}), cn: 7, hoi_chieu: .25};
    delete r.profile.o[i].cn; r.profile.ghiDe = true;
    const hit = r.combat.attack({o: i, muc: 'a'});
    assert.equal(hit.ok, true); assert.equal(hit.cn, 7); assert.equal(r.profile.o[i].cdMax, 250);
    assert.equal(r.state.actors.get('a').hp, 1000 - r.data.gu.gu_hoa_long.hu.find(e => e.loai === 'sat_thuong').goc);
  });

  test('intro Gu overrides resolve inside the engine, retain base metadata, and revert outside dreams', () => {
    const r = setup();
    r.zoneId = 'inst_mo_dau'; r.data.guGiacMo = structuredClone(actual.guGiacMo);
    r.profile.ghiDe = true; r.profile.chuyen = r.profile.tv.chuyen = 5;
    r.player.hp = r.player.hpMax = 5200; r.player.cn = r.player.cnMax = 2400;
    r.profile.satChieuO = ['km_hoa_giao_lieu_nguyen', null];
    const guIds = ['gu_ngu_khieu_hoa_thap', 'gu_hoa_long', 'gu_viem_tru', 'gu_lieu_quang', 'gu_dien_nhan', 'gu_viem_duc'];
    for (const gu of guIds) r.equip(gu);
    // A changed base makes the override test independent of equal base/live values.
    r.data.gu.gu_hoa_long.cn = 999; r.data.gu.gu_hoa_long.hu = [{loai: 'sat_thuong', goc: 1}];
    const a = r.add(actor('a', 5, 0, {hp: 10000, hpMax: 10000}));
    const result = r.combat.attack({o: 1, muc: 'a'});
    assert.equal(result.ok, true); assert.equal(result.cn, actual.guGiacMo.gu_hoa_long.cn);
    assert.equal(a.hp, 10000 - 360);
    assert.ok(r.events.some(e => e.k === 'trung' && e.fx === actual.gu.gu_hoa_long.fx));
    r.player.hp -= 200;
    assert.equal(r.combat.attack({o: 3, muc: 'a'}).ok, true, 'intro circle heal accepts normal client auto-aim context');
    assert.equal(r.player.hp, 5180);
    r.step(2500); r.zoneId = 'zone_ta_gia_trai'; delete r.profile.o[1].cn;
    const normal = r.combat.attack({o: 1, muc: 'a'});
    assert.equal(normal.cn, 999); assert.equal(a.hp, 10000 - 360 - 42 - 1);
    assert.equal(r.combat.attack({o: 0}, 'sat_chieu').reason, 'unsupported');
  });

  test('flight toggles wing Gu, speed and physics, charges percentage CN, and resets on depletion/dream exit', () => {
    const r = setup(); r.physics = {b: {quaHo: false}};
    r.zoneId = 'inst_mo_dau'; r.data.guGiacMo = actual.guGiacMo;
    r.player.cn = r.player.cnMax = 2400; r.profile.ghiDe = true;
    const i = r.equip('gu_viem_duc');
    assert.equal(r.combat.attack({o: i}).ok, true);
    assert.equal(r.player.canh, 'gu_viem_duc'); near(r.player.tocDo, 1.5);
    assert.equal(r.physics.b.quaHo, true); near(r.profile.o[i].cn, 28.8);
    r.step(500); near(r.player.cn, 2385.6);
    assert.equal(r.combat.attack({o: i}).bat, false);
    assert.equal(r.player.canh, ''); near(r.player.tocDo, 1); assert.equal(r.physics.b.quaHo, false);
    r.step(500); r.player.cn = 28.8; r.combat.attack({o: i}); r.step(1000);
    near(r.player.cn, 0); assert.equal(r.player.canh, ''); near(r.player.tocDo, 1);
    r.player.cn = 100; r.combat.attack({o: i}); r.zoneId = 'zone_ta_gia_trai'; r.step(250);
    assert.equal(r.profile.o[i].bat, false); assert.equal(r.player.canh, '');
  });

  test('host callbacks own progress/rewards once and combat actions fire only on accepted commands', () => {
    const r = setup({hit: spec([{loai: 'sat_thuong', goc: 100}])});
    const actions = [], kills = [];
    r.onCombatAction = action => actions.push(action);
    r.onKill = a => { kills.push(a); r.progress.kills++; };
    const i = r.equip('hit', 0), a = r.add(actor('a', 1, 0, {hp: 50, hpMax: 50}));
    assert.equal(r.combat.attack({o: i, muc: 'a'}).ok, true);
    assert.deepEqual(kills, [a]); assert.equal(r.progress.kills, 1);
    assert.equal(r.profile.nguyenThach, 0); assert.equal(r.profile.tui.item_thit_thu, undefined);
    assert.equal(actions.length, 1); assert.equal(actions[0].type, 'dung');
    assert.equal(actions[0].gu, 'hit'); assert.equal(actions[0].p.muc, 'a');
    r.combat.attack({o: i, muc: 'a'}); r.step(1000); assert.equal(actions.length, 1); assert.equal(kills.length, 1);
    const guard = r.equip('guard', 0); r.data.gu.guard = spec([{loai: 'giam_sat_thuong', gia_tri: .2}], null, {kich_hoat: 'duy_tri'});
    r.combat.attack({o: guard}); r.combat.attack({o: guard});
    assert.equal(actions.at(-1).bat, false); assert.equal(actions.at(-1).gu, 'guard');
  });

  test('external enemy tick can query reduction and apply damage through shields without double AI hits', () => {
    const r = setup(); r.combatOwnsBeasts = false;
    r.add(actor('a', 1, 0, {aggro: time + 10000}));
    const guard = r.equip('gu_thu_bi', 2.2), shield = r.equip('gu_ne', 8);
    r.combat.attack({o: guard}); near(r.combat.getDamageReduction(), .12);
    r.step(250); assert.equal(r.player.hp, 100);
    near(r.combat.receiveDamage(10, 'a'), 8.8); near(r.player.hp, 91.2);
    r.combat.attack({o: shield}); near(r.combat.receiveDamage(10, {id: 'a'}), 0);
    near(r.player.combatShield, 21.2); near(r.combat.getDamageReduction(), .12);
    r.combat.attack({o: guard}); assert.equal(r.combat.getDamageReduction(), 0);
    r.step(6000); assert.equal(r.player.combatShield, 0);
    assert.equal(r.combat.receiveDamage(NaN, 'a'), 0);
    assert.equal(r.combat.receiveDamage(-1, 'a'), 0);
  });

  test('every actual catalog Gu is handled without generic damage fallback or invalid numbers', () => {
    const supportedIds = [], unsupportedIds = [];
    for (const [gu, definition] of Object.entries(actual.gu)) {
      const r = setup(), i = r.equip(gu, definition.cn_theo === 'ti_le_toi_da' ? definition.cn * 100 : definition.cn);
      r.player.cn = r.player.cnMax = 100000;
      const a = r.add(actor('a', 1, 0, {hp: 100000, hpMax: 100000}));
      const npc = r.add(actor('npc', 1, 0, {loai: 'npc'}));
      const harms = definition.hu?.some(h => ['sat_thuong', 'doc', 'bong', 'chay_mau', 'choang', 'cham', 'troi'].includes(h.loai));
      const result = r.combat.attack({o: i, ...(harms ? {muc: 'a'} : {}), x: 1, y: 0});
      assert.equal(typeof result.ok, 'boolean', gu);
      assert.ok(Number.isFinite(a.hp) && Number.isFinite(r.player.hp) && Number.isFinite(r.player.cn), gu);
      assert.equal(npc.hp, 1000, gu);
      const hasDirectDamage = definition.hu?.some(h => h.loai === 'sat_thuong');
      if (!hasDirectDamage) assert.equal(a.hp, 100000, `${gu} must not turn another effect into damage`);
      if (!result.ok) {
        unsupportedIds.push(gu); assert.equal(a.hp, 100000, gu); assert.equal(r.player.cn, 100000, gu);
      } else supportedIds.push(gu);
      r.step(1000); assert.ok(Number.isFinite(r.player.cn), gu);
    }
    assert.equal(supportedIds.length + unsupportedIds.length, Object.keys(actual.gu).length);
    assert.ok(supportedIds.length > 100, 'substantial actual catalog subset');
    console.log(`Catalog sweep: ${supportedIds.length} accepted; ${unsupportedIds.length} explicitly unavailable; ${catalogPath}`);
  });
  console.log(`Combat tests PASS (${tests} groups).`);
} finally {
  Date.now = originalNow;
}
