import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {attachGuInventory} from '../src/systems/gu-inventory.mjs';

const data = JSON.parse(await readFile(process.argv[2] ?? new URL('../dist/data/game.json', import.meta.url), 'utf8'));
const START = 1_800_000_000_000, HOUR = 3_600_000, DAY = 24 * HOUR;
let clock = START;
const realNow = Date.now;
Date.now = () => clock;
process.on('exit', () => { Date.now = realNow; });
const gu = (uid, loai, extra = {}) => ({uid, loai, banMenh: false, luyenHoa: true, no: 100,
  xp: 0, thuanThuc: 0, buaToi: clock + DAY, nghi: null, ...extra});
const slot = g => ({uid: g?.uid ?? null, loai: g?.loai ?? null, cd: 0, cdMax: 0, cn: 0, cnGiay: false, bat: false});

function fixture(saved, extra = {}) {
  clock = START;
  const co = [gu('root', 'gu_nguyet_quang', {banMenh: true}), gu('shield', 'gu_thu_bi'),
    gu('heal', 'gu_sinh_tuc_thao'), gu('passive', 'gu_tieu_quang')];
  const h = saved ?? {chuyen: 1, tv: {chuyen: 1}, nam: 1, nguyenThach: 500, nt: 500, ch: 500,
    co, o: [slot(co[0]), slot(co[1]), slot(co[2]), slot()], obd: ['passive', null], opt: [null], tuiToiDa: 40,
    tui: {item_thit_thu: 10, item_thao_duoc: 10, item_canh_nguyet_lan: 10, item_cao_cam_mau: 5},
    vcl: {lh: []}, coPhuong: Object.keys(data.recipe), coPhuongTk: [],
    nghe: {ds: [{id: 'luyen_co', diem: 100, bac: 3, chinh: true}]}};
  const room = {data, profile: h, zoneId: 'inst_gia_vien', progress: {},
    player: {hp: h.hp ?? 100, hpMax: 200, cn: h.cn ?? 1000, cnMax: 1000},
    messages: [], notices: [], events: [], saves: 0, random: () => 0,
    label: (key, fallback) => fallback ?? key,
    emit(type, p) { this.messages.push({type, p: structuredClone(p)}); },
    notify(text) { this.notices.push(text); },
    save() { this.saves++; this.saved = structuredClone(this.profile); },
    refresh() { this.emit('ho_so', this.profile); },
    onInventoryEvent(event) { this.events.push(event); }, ...extra};
  const api = attachGuInventory(room);
  api.snapshot();
  return {room, api, h, p: room.player};
}
function unchanged(f, type, payload) {
  const before = f.api.snapshot(), saves = f.room.saves;
  assert.equal(f.api.handle(type, payload), true);
  assert.deepEqual(f.api.snapshot(), before, `${type} rejection is atomic`);
  assert.equal(f.room.saves, saves);
}
function setRank(f, n) { f.h.chuyen = n; f.h.tv.chuyen = n; }
function tick(f, at) { clock = at; f.api.tick(at); }
function addIngredient(f, id = 'ingredient', loai = 'gu_thiem_quang', extra = {}) {
  const g = gu(id, loai, extra); f.h.co.push(g); return g;
}

test('wire shapes, detached snapshots, scoped mini and progression boundaries', () => {
  const f = fixture();
  for (const [type, p] of [['dung', {o: 0}], ['sat_chieu', {o: 0}], ['cham_co', {}],
    ['co', {cham: 'root'}], ['co', {cuu: 'root'}], ['co', {tha: 'root'}], ['mini', {giu: true}],
    ['mini', {chon: 0}], ['nghe', {}], ['ho_cu', {}], ['unknown', {}]]) assert.equal(f.api.handle(type, p), false);
  f.api.handle('cua_hang');
  assert.equal(f.room.messages.at(-1).type, 'cua_hang');
  assert.equal(f.room.messages.at(-1).p.loai, 'kho_toc');
  f.api.handle('che_tao');
  const row = f.room.messages.at(-1).p.ds.find(r => r.ma === 'rc_tieu_quang');
  assert.equal(row.can.find(p => p.id === 'cn').n, data.recipe.rc_tieu_quang.cn);
  assert.equal(row.giay, data.recipe.rc_tieu_quang.thoi_gian_s);
  assert.equal(row.tiLe, data.recipe.rc_tieu_quang.ti_le_goc);
  const snap = f.api.snapshot(); snap.co[0].no = 0; snap.tui.item_thit_thu = 0;
  assert.equal(f.h.co[0].no, 100); assert.equal(f.h.tui.item_thit_thu, 10);
});

test('equipment preserves cooldown, unique placement and accepts one-use support Gu', () => {
  const f = fixture();
  f.h.o[1].cd = START + 5000;
  f.api.handle('co', {lap: 'shield', o: 3});
  assert.equal(f.h.o[1].uid, null); assert.equal(f.h.o[3].cd, START + 5000);
  assert.equal(f.h.o[3].cn, data.gu.gu_thu_bi.cn); assert.equal(f.h.o[3].cnGiay, true);
  f.api.handle('co', {go: 3}); f.api.handle('co', {lap: 'shield', o: 1});
  assert.equal(f.h.o[1].cd, START + 5000);
  f.api.handle('co', {lap: 'passive', o: 1, biDong: true});
  assert.deepEqual(f.h.obd, [null, 'passive']);
  addIngredient(f, 'leaf', 'gu_sinh_co_diep');
  f.api.handle('co', {lap: 'leaf', o: 0, phuTro: true});
  assert.equal(f.h.opt[0], 'leaf');
  for (const o of [-1, 99, .5, '1', NaN]) unchanged(f, 'co', {lap: 'shield', o});
  for (const p of [{go: 0}, {lap: 'shield', o: 0}, {lap: 'root', o: 3}, {lap: 'passive', o: 1},
    {lap: 'shield', o: 1, biDong: 'false'}, {lap: 'shield', go: 1, o: 2}]) unchanged(f, 'co', p);
});

test('published diets, alternatives, rare meals and CN are charged exactly once', () => {
  const f = fixture(); f.h.co[0].no = 30;
  f.api.handle('co', {an: 'root'});
  assert.equal(f.h.tui.item_canh_nguyet_lan, 10 - data.gu.gu_nguyet_quang.an.luong);
  assert.equal(f.h.co[0].no, data.bal.gu_food.quy_tac.an_dua_ve);
  assert.deepEqual(f.room.messages.find(m => m.type === 'co_an_xong').p, {uid: 'root', no: 100});
  const cn = f.p.cn; f.api.handle('co', {an: 'heal'});
  assert.equal(f.p.cn, cn - data.gu.gu_sinh_tuc_thao.an.luong);
  delete f.h.tui.item_thit_thu; f.h.tui.item_ca_diec = 2;
  f.api.handle('co', {an: 'shield'}); assert.equal(f.h.tui.item_ca_diec, 1);
  for (const p of [{an: 'root', mon: 'item_thao_duoc'}, {an: 'heal', mon: 'item_thit_thu'}]) unchanged(f, 'co', p);
  f.p.cn = 0; unchanged(f, 'co', {an: 'heal'});
  f.h.co[1].nghi = {ly: 'xac', den: START + DAY}; unchanged(f, 'co', {an: 'shield'});
  const wine = Object.entries(data.gu).find(([, d]) => [d.an?.thuc_an].flat().includes('item_ruou_tram_ngay'));
  if (wine) {
    const g = addIngredient(f, 'wine', wine[0]);
    f.h.tui.item_ruou_tram_ngay = data.gu[g.loai].an.luong;
    f.api.handle('co', {an: g.uid, mon: 'item_ruou_tram_ngay'});
    assert.equal(g.buaToi, START + data.bal.gu_food.thuc_an_quy.item_ruou_tram_ngay.bua * data.gu[g.loai].an.chu_ky_gio * HOUR);
    assert.equal(g.xp, data.bal.gu_food.thuc_an_quy.item_ruou_tram_ngay.xp);
  }
});

test('automatic meals, shared pantry and hunger match across offline/reload ticks', () => {
  const online = fixture(), offline = fixture();
  for (const f of [online, offline]) { f.h.tui.item_thit_thu = 2; f.h.tui.item_canh_nguyet_lan = 2; f.p.cn = 0; }
  for (let hour = 1; hour <= 120; hour++) tick(online, START + hour * HOUR);
  tick(offline, START + 120 * HOUR);
  assert.deepEqual(online.h.tui, offline.h.tui);
  for (const g of online.h.co) {
    const other = offline.h.co.find(v => v.uid === g.uid);
    assert.ok(Math.abs(g.no - other.no) < 1e-8);
    assert.equal(g.buaToi, other.buaToi);
    assert.deepEqual(g.nghi, other.nghi);
  }
  const restored = fixture(structuredClone(offline.h));
  const before = restored.api.snapshot(); restored.api.tick(START); restored.api.tick(START + 120 * HOUR);
  assert.deepEqual(restored.api.snapshot(), before);
});

test('starvation retains corpse, unequips, expires; root protection and illness hook', () => {
  const f = fixture(); f.h.tui = {}; f.p.cn = 0;
  tick(f, START + 7 * DAY);
  assert.equal(f.h.co.find(g => g.uid === 'shield').nghi.ly, 'xac');
  assert.equal(f.h.o[1].uid, null);
  assert.equal(f.h.co[0].nghi, null, 'year-one root stays protected');
  assert.ok(f.room.events.some(e => e.type === 'gu-death' && e.uid === 'shield'));
  tick(f, START + 50 * DAY); assert.equal(f.h.co.length, 1);
  f.h.nam = 2; tick(f, START + 50 * DAY + HOUR);
  assert.equal(f.h.co.length, 0, 'long-expired root corpse is removed');
  assert.equal(f.h.guInventory.rootIllness, true);
  assert.ok(f.room.events.some(e => e.type === 'gu-death' && e.banMenh));
});

test('refinement needle/hold succeeds without invented NT charge', () => {
  const f = fixture(), g = addIngredient(f, 'wild', 'gu_sinh_co_diep', {luyenHoa: false});
  f.p.cn = 100; f.p.cnMax = 100;
  f.api.handle('co', {luyen: g.uid}); assert.equal(g.luyenHoa, false);
  const mini = f.room.messages.findLast(m => m.type === 'mini').p;
  for (const k of ['kim', 'c', 'w', 'tienDo', 'cn', 'cnMax', 'conLai']) assert.equal(typeof mini[k], 'number');
  assert.equal(mini.loai, 'luyen_hoa');
  assert.equal(f.api.handle('mini', {chon: 0}), false);
  unchanged(f, 'mini', {giu: 'yes'});
  for (let step = 0; step < 400 && f.h.guInventory.refining; step++) {
    const s = f.h.guInventory.refining;
    f.api.handle('mini', {giu: s.kim < s.c}); tick(f, clock + 100);
  }
  assert.equal(g.luyenHoa, true); assert.equal(f.h.nt, 500); assert.ok(f.p.cn < 100 && f.p.cn > 0);
  assert.ok(f.h.vcl.lh.includes(g.loai)); assert.equal(f.h.o.some(s => s.uid === g.uid), false);
  assert.equal(f.api.handle('mini', {giu: true}), false);
  assert.ok(f.room.events.some(e => e.type === 'gu-refine' && e.success));
});

test('refinement rejects shortages, cancels; reload never holds the key offline', () => {
  const f = fixture(), g = addIngredient(f, 'wild', 'gu_sinh_co_diep', {luyenHoa: false});
  f.p.cn = 0; unchanged(f, 'co', {luyen: g.uid});
  f.p.cn = 100; f.h.nguyenThach = 0; f.api.handle('co', {luyen: g.uid});
  f.api.handle('mini', {giu: true}); f.api.handle('mini', {huy: true});
  assert.equal(f.h.guInventory.refining, null); assert.equal(g.luyenHoa, false);
  f.api.handle('co', {luyen: g.uid}); f.api.handle('mini', {giu: true});
  const restored = fixture(structuredClone(f.h)); assert.equal(restored.h.guInventory.refining.held, false);
  tick(restored, START + 60_000);
  assert.equal(restored.h.co.find(v => v.uid === g.uid).luyenHoa, false);
  assert.equal(restored.h.co.find(v => v.uid === g.uid).nghi.ly, 'bi_thuong');
});

test('medicine persists bounded healing, never revives or reopens panels', () => {
  const f = fixture(); f.api.handle('cua_hang'); f.api.handle('che_tao');
  f.api.handle('dung_do', {id: 'item_cao_cam_mau'});
  assert.equal(f.h.tui.item_cao_cam_mau, 4); assert.equal(f.p.hp, 100);
  unchanged(f, 'dung_do', {id: 'item_cao_cam_mau'});
  tick(f, START + 2000); assert.equal(f.p.hp, 116);
  const restored = fixture(structuredClone(f.h)); restored.room.messages.length = 0;
  tick(restored, START + 5000); assert.equal(restored.p.hp, 140);
  assert.ok(restored.room.messages.every(m => !['che_tao', 'cua_hang'].includes(m.type)));
  restored.p.hp = 0; unchanged(restored, 'dung_do', {id: 'item_cao_cam_mau'});
});

test('NPC catalog uses public buy/separate resale prices with fractional carry', () => {
  const f = fixture(); f.api.handle('cua_hang', {npc: 'npc_ta_toan'});
  f.api.handle('mua', {id: 'item_thit_thu', so: 5, gia: 0});
  assert.equal(f.h.nt, 495); assert.equal(f.h.tui.item_thit_thu, 15);
  f.api.handle('ban', {id: 'item_thit_thu', so: 15});
  assert.equal(f.h.tui.item_thit_thu, undefined); assert.equal(f.h.nt, 495);
  assert.equal(f.h.guInventory.saleRemainder, .45);
  f.h.tui.item_thit_thu = 19; f.api.handle('ban', {id: 'item_thit_thu', so: 19});
  assert.equal(f.h.nt, 496); assert.equal(f.h.guInventory.saleRemainder, .02);
  f.api.handle('mua', {id: 'gu_thu_bi'}); assert.equal(f.h.ch, 350);
  assert.equal(f.h.co.at(-1).luyenHoa, false);
  f.api.handle('cua_hang', {npc: 'npc_lao_khuyen'});
  const rows = f.room.messages.at(-1).p.mua;
  assert.ok(rows.length && rows.every(r => data.gu[r.id].nguon.some(s => s.ma === 'lao_khuyen')));
  unchanged(f, 'mua', {id: 'gu_thu_bi'}); unchanged(f, 'ban', {id: 'item_thao_duoc'});
});

test('weekly clan reset Monday 05:00 Vietnam; failed trades are atomic', () => {
  const f = fixture(); setRank(f, 3); f.h.ch = 100_000;
  const reset = Date.UTC(2026, 9, 25, 22);
  clock = reset - 1; f.api.handle('mua', {id: 'gu_kim_cuong'});
  assert.equal(f.h.co.at(-1).loai, 'gu_kim_cuong'); unchanged(f, 'mua', {id: 'gu_kim_cuong'});
  clock = reset; f.api.handle('mua', {id: 'gu_kim_cuong'});
  assert.equal(f.h.co.filter(g => g.loai === 'gu_kim_cuong').length, 2);
  for (const so of [0, -1, '5', 1.5, 1000, Infinity, NaN, null]) unchanged(f, 'mua', {id: 'item_thit_thu', so});
  for (const id of ['__proto__', 'constructor', 'item_fake']) unchanged(f, 'mua', {id});
  f.h.nguyenThach = 0; unchanged(f, 'mua', {id: 'item_thit_thu'});
  f.h.nguyenThach = 500; f.h.tuiToiDa = Object.keys(f.h.tui).length;
  unchanged(f, 'mua', {id: 'item_ruou_trang'});
  f.h.tui.item_tim_cuong_dien_lang = 3; unchanged(f, 'ban', {id: 'item_tim_cuong_dien_lang', so: 3});
});

test('valid medicine/wearable story NPC menus open documented material-catalog fallback', () => {
  const f = fixture();
  for (const npc of ['npc_ta_ninh', 'npc_ban_do_deo']) {
    const before = structuredClone(f.h), messages = f.room.messages.length;
    assert.equal(f.api.handle('cua_hang', {npc}), true);
    const panel = f.room.messages.at(-1);
    assert.ok(f.room.messages.length > messages);
    assert.equal(panel.type, 'cua_hang'); assert.equal(panel.p.loai, 'thuong_hoi');
    assert.ok(panel.p.mua.some(r => r.id === 'item_thit_thu' && r.gia === 1));
    assert.deepEqual(f.h, before, 'opening a service does not charge or grant goods');
  }
});

test('timed synthesis consumes exact inputs/CN, persists primary/mastery and emits quest hook', () => {
  const f = fixture(), r = data.recipe.rc_tieu_quang;
  const g = addIngredient(f, 'ingredient', r.chinh, {thuanThuc: 4, xp: 9, sao: 2});
  f.api.handle('hop_luyen', {hd: 'xem'});
  assert.equal(f.room.messages.at(-1).p.ds.find(x => x.id === 'rc_tieu_quang').giay, r.thoi_gian_s);
  f.api.handle('hop_luyen', {hd: 'bat_dau', id: 'rc_tieu_quang', uid: g.uid});
  assert.equal(g.loai, r.chinh); assert.equal(g.nghi.ly, 'hop_luyen');
  assert.equal(f.h.tui.item_canh_nguyet_lan, 10 - r.phu[0].so); assert.equal(f.p.cn, 1000 - r.cn);
  unchanged(f, 'che', {ma: 'rc_tieu_quang'});
  const restored = fixture(structuredClone(f.h)); tick(restored, START + r.thoi_gian_s * 1000);
  const result = restored.h.co.find(v => v.uid === g.uid);
  assert.equal(result.loai, r.ra); assert.equal(result.thuanThuc, 4); assert.equal(result.xp, 9); assert.equal(result.sao, 2);
  assert.equal(restored.h.guInventory.jobs.length, 0);
  assert.ok(restored.room.events.some(e => e.type === 'craft' && e.success));
});

test('failed synthesis loses auxiliaries but retains primary with 24-hour injury', () => {
  const f = fixture(undefined, {random: () => .999}), r = data.recipe.rc_tieu_quang;
  const g = addIngredient(f); f.api.handle('che', {ma: 'rc_tieu_quang'});
  tick(f, START + r.thoi_gian_s * 1000);
  assert.equal(g.loai, r.chinh); assert.equal(g.nghi.ly, 'bi_thuong');
  assert.equal(g.nghi.den, START + r.thoi_gian_s * 1000 + DAY);
  assert.equal(f.h.tui.item_canh_nguyet_lan, 7); unchanged(f, 'che', {ma: 'rc_tieu_quang'});
  tick(f, g.nghi.den); assert.equal(g.nghi, null);
});

test('batch recipes aggregate repeated Gu IDs before spending anything', () => {
  const f = fixture(undefined, {inventoryRules: {synthesis: {slots: 5}}}), r = data.recipe.rc_tieu_loi_tho_dau_mau;
  setRank(f, data.gu[r.ra].chuyen); f.p.cn = r.cn * 5;
  for (const p of r.phu.filter(p => data.item[p.id])) f.h.tui[p.id] = p.so * 5;
  for (let i = 0; i < 14; i++) addIngredient(f, 'copy-' + i, r.chinh);
  unchanged(f, 'che', {ma: 'rc_tieu_loi_tho_dau_mau', so: 5}); addIngredient(f, 'copy-14', r.chinh);
  f.api.handle('che', {ma: 'rc_tieu_loi_tho_dau_mau', so: 5});
  assert.equal(f.h.co.filter(g => g.loai === r.chinh).length, 5); assert.equal(f.p.cn, 0);
  tick(f, START + r.thoi_gian_s * 1000); assert.equal(f.h.co.filter(g => g.loai === r.ra).length, 5);
});

test('root recipe always succeeds; knowledge, location, rank, costs checked first', () => {
  const f = fixture(undefined, {random: () => .999}), r = data.recipe.rc_ban_menh_thu_2;
  setRank(f, 2); const g = f.h.co.find(g => g.uid === 'shield'); g.banMenh = true;
  for (const p of r.phu) f.h.tui[p.id] = p.so;
  f.h.coPhuong = []; unchanged(f, 'che', {ma: 'rc_ban_menh_thu_2'});
  f.h.coPhuong = ['rc_ban_menh_thu_2']; f.room.zoneId = 'zone_ta_gia_trai';
  unchanged(f, 'che', {ma: 'rc_ban_menh_thu_2'}); f.room.zoneId = 'inst_gia_vien';
  f.p.cn = 0; unchanged(f, 'che', {ma: 'rc_ban_menh_thu_2'}); f.p.cn = 1000;
  f.api.handle('che', {ma: 'rc_ban_menh_thu_2'}); tick(f, START + r.thoi_gian_s * 1000);
  assert.equal(g.loai, r.ra); assert.equal(g.banMenh, true);
});

test('intro and profile replacement cannot damage base save or retain stale pointers', () => {
  const f = fixture(), base = structuredClone(f.h);
  f.room.intro = {active: true, baseProfile: base}; f.room.zoneId = 'inst_mo_dau';
  const before = structuredClone(f.h);
  f.api.handle('mua', {id: 'item_thit_thu'}); f.api.handle('co', {an: 'root'});
  assert.equal(f.api.handle('mini', {giu: true}), false); tick(f, START + 100 * DAY);
  assert.deepEqual(f.h, before); assert.deepEqual(f.room.intro.baseProfile, base);
  f.room.intro.active = false; f.room.zoneId = 'zone_ta_gia_trai'; f.room.profile = structuredClone(base);
  f.api.handle('mua', {id: 'item_thit_thu'});
  assert.equal(f.room.profile.tui.item_thit_thu, 11); assert.equal(f.h.tui.item_thit_thu, 10);
});

test('explicit profession bridge, hook errors, malformed messages and room isolation', () => {
  const a = fixture(), b = fixture();
  for (const p of [null, [], 0, 'bad']) unchanged(a, 'mua', p);
  a.room.inventoryCraft = p => p.ma === 'wiki:medicine';
  assert.equal(a.api.handle('che', {ma: 'wiki:medicine'}), true);
  a.room.onInventoryEvent = () => { throw Error('quest hook'); };
  a.api.handle('mua', {id: 'gu_sinh_co_diep'});
  assert.equal(a.h.co.length, 5); assert.equal(b.h.co.length, 4);
  assert.ok(a.room.saved); assert.ok(a.room.notices.some(s => s.includes('nhiệm vụ')));
});

test('fresh mortal rank zero stays empty and cannot refine or buy clan Gu before awakening', () => {
  const f = fixture({chuyen: 0, tv: {chuyen: 0}, hp: 300, hpMax: 300, cn: 0, cnMax: 0,
    nt: 0, nguyenThach: 0, ch: 0, co: [], o: [], obd: [], opt: [], tui: {}});
  const before = structuredClone(f.h);
  tick(f, START + DAY);
  assert.deepEqual(f.h, before);
  assert.equal(f.api.handle('mini', {giu: true}), false);
  unchanged(f, 'mua', {id: 'gu_thu_bi'});
  addIngredient(f, 'first', 'gu_thu_bi', {luyenHoa: false});
  f.p.cn = 100;
  unchanged(f, 'co', {luyen: 'first'});
  assert.equal(f.h.nt, 0); assert.equal(f.h.o.length, 0);
});
