import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {attachGuInventory} from '../src/systems/gu-inventory.mjs';

// No browser/runtime/server required. Optional argument checks another captured
// first-party game.json, e.g. cotienlo-expand/live-game.json, without copying it.
const data = JSON.parse(await readFile(process.argv[2] ?? new URL('../dist/data/game.json', import.meta.url), 'utf8'));
const START = 1_800_000_000_000;
const DAY = 86_400_000;
const realNow = Date.now;
let clock = START;
Date.now = () => clock;
process.on('exit', () => { Date.now = realNow; });

function gu(uid, loai, extra = {}) {
  assert.ok(data.gu[loai], `real Gu ID: ${loai}`);
  return {uid, loai, banMenh: false, luyenHoa: true, no: 100, xp: 0, thuanThuc: 0, buaToi: clock + DAY, nghi: null, ...extra};
}

const slot = g => ({uid: g?.uid ?? null, loai: g?.loai ?? null, cd: 0, cdMax: 0, cn: 0, cnGiay: false, bat: false});

function fixture(saved) {
  clock = START;
  const root = gu('root', 'gu_nguyet_quang', {banMenh: true});
  const shield = gu('shield', 'gu_thu_bi');
  const heal = gu('heal', 'gu_sinh_tuc_thao');
  const passive = gu('passive', 'gu_tieu_quang');
  const profile = saved ?? {chuyen: 1, tv: {chuyen: 1}, nguyenThach: 500, nt: 500, ch: 500,
    co: [root, shield, heal, passive], o: [slot(root), slot(shield), slot(heal), slot()],
    obd: [passive.uid, null], opt: [null], tuiToiDa: 40,
    tui: {item_thit_thu: 10, item_thao_duoc: 10, item_canh_nguyet_lan: 10, item_cao_cam_mau: 5}, vcl: {lh: []}};
  const room = {data, profile, player: {hp: profile.hp ?? 100, hpMax: 200, cn: profile.cn ?? 1000, cnMax: 1000},
    messages: [], notices: [], saves: 0, refreshes: 0,
    label: (key, fallback) => fallback ?? key,
    emit(type, p) { this.messages.push({type, p: structuredClone(p)}); },
    notify(text) { this.notices.push(text); },
    save() { this.saves++; this.saved = structuredClone(this.profile); },
    refresh() { this.refreshes++; this.emit('ho_so', this.profile); }};
  const api = attachGuInventory(room);
  return {room, api, h: profile, p: room.player};
}

function unchanged(f, type, payload) {
  const before = f.api.snapshot();
  const saves = f.room.saves;
  assert.equal(f.api.handle(type, payload), true);
  assert.deepEqual(f.api.snapshot(), before, `${type} rejects without partial mutations`);
  assert.equal(f.room.saves, saves);
}

test('original UI protocol and detached snapshots; combat dispatch stays main-owned', () => {
  const {api, room, h} = fixture();
  assert.equal(api.handle('dung', {o: 0, muc: 'enemy'}), false);
  assert.equal(api.handle('sat_chieu', {o: 0}), false);
  assert.equal(api.handle('co', {cham: 'root'}), false);
  assert.equal(api.handle('co', {tha: 'root'}), false, 'latest UI release action is explicitly unsupported');
  assert.equal(api.handle('unknown', {}), false);
  api.handle('cua_hang');
  const shop = room.messages.at(-1);
  assert.equal(shop.type, 'cua_hang');
  assert.equal(typeof shop.p.ten, 'string');
  for (const row of shop.p.mua) {
    assert.ok(data.gu[row.id] || data.item[row.id]);
    assert.ok(row.gia > 0 && ['nt', 'ch'].includes(row.tien));
    assert.equal(typeof row.ten, 'string');
  }
  assert.ok(shop.p.ban.every(row => row.co > 0 && row.gia > 0));
  assert.ok(shop.p.khongThu.some(row => row.id === 'item_cao_cam_mau'));
  api.handle('che_tao');
  const panel = room.messages.at(-1);
  assert.equal(panel.type, 'che_tao');
  const r = panel.p.ds.find(r => r.ma === 'rc_tieu_quang');
  assert.ok(r && r.can.every(row => typeof row.ten === 'string' && row.n > 0 && typeof row.co === 'number'));
  assert.equal(r.ra[0].id, data.recipe.rc_tieu_quang.ra);
  assert.equal(r.can.find(row => row.id === 'cn').n, data.recipe.rc_tieu_quang.cn);
  const snap = api.snapshot();
  snap.co[0].no = 0;
  snap.tui.item_thit_thu = 0;
  assert.equal(h.co[0].no, 100);
  assert.equal(h.tui.item_thit_thu, 10);
});

test('active/passive/support equip, unique placement, cooldown and slot metadata', () => {
  const f = fixture(), {api, h} = f;
  h.o[1].cd = START + 5000;
  api.handle('co', {lap: 'shield', o: 3, biDong: false});
  assert.equal(h.o[1].uid, null);
  assert.equal(h.o[3].uid, 'shield');
  assert.equal(h.o[3].cn, data.gu.gu_thu_bi.cn);
  assert.equal(h.o[3].cdMax, data.gu.gu_thu_bi.hoi_chieu * 1000);
  assert.equal(h.o[3].cnGiay, true);
  assert.equal(h.o[3].cd, START + 5000);
  api.handle('co', {go: 3, biDong: false});
  api.handle('co', {lap: 'shield', o: 1});
  assert.equal(h.o[1].cd, START + 5000, 'unequip does not reset cooldown');
  api.handle('co', {lap: 'passive', o: 1, biDong: true});
  assert.deepEqual(h.obd, [null, 'passive']);
  api.handle('co', {go: 1, biDong: true});
  assert.equal(h.obd[1], null);
  api.handle('co', {lap: 'shield', o: 0, phuTro: true});
  assert.equal(h.opt[0], 'shield');
  assert.equal(h.o[1].uid, null);
  api.handle('co', {go: 0, phuTro: true});
  assert.equal(h.opt[0], null);
  assert.ok(f.room.saves > 0 && f.room.refreshes === f.room.saves);
});

test('equipment rejects invalid indexes, wrong modes, rank, root replacement and unrefined Gu', () => {
  const f = fixture();
  for (const o of [-1, 99, 0.5, '1', NaN, Infinity]) unchanged(f, 'co', {lap: 'shield', o});
  for (const p of [{go: 0}, {lap: 'shield', o: 0}, {lap: 'root', o: 3}, {lap: 'passive', o: 1},
    {lap: 'shield', o: 0, biDong: true}, {lap: 'shield', o: 1, biDong: 'false'},
    {lap: 'shield', o: 0, biDong: true, phuTro: true}, {lap: 'missing', o: 1},
    {lap: 'shield', go: 1, o: 2}]) unchanged(f, 'co', p);
  f.h.co.find(g => g.uid === 'shield').luyenHoa = false;
  unchanged(f, 'co', {lap: 'shield', o: 3});
  f.h.co.push(gu('high', 'gu_kim_cuong'));
  unchanged(f, 'co', {lap: 'high', o: 3});
});

test('feeding uses published diet alternatives or CN and sends co_an_xong', () => {
  const {api, h, p, room} = fixture();
  h.co[0].no = 30;
  api.handle('co', {an: 'root'});
  assert.equal(h.tui.item_canh_nguyet_lan, 10 - data.gu.gu_nguyet_quang.an.luong);
  assert.equal(h.co[0].no, data.bal.gu_food.quy_tac.an_dua_ve);
  assert.equal(h.co[0].buaToi, START + data.gu.gu_nguyet_quang.an.chu_ky_gio * 3_600_000);
  assert.deepEqual(room.messages.find(m => m.type === 'co_an_xong').p, {uid: 'root', no: 100});
  const cn = p.cn;
  api.handle('co', {an: 'heal'});
  assert.equal(p.cn, cn - data.gu.gu_sinh_tuc_thao.an.luong);
  delete h.tui.item_thit_thu;
  h.tui.item_ca_diec = 2;
  api.handle('co', {an: 'shield'});
  assert.equal(h.tui.item_ca_diec, 1, 'fallback diet is a real fish ID');
});

test('feeding rejects wrong/missing food and CN shortages atomically', () => {
  const f = fixture();
  unchanged(f, 'co', {an: 'root', mon: 'item_thao_duoc'});
  delete f.h.tui.item_canh_nguyet_lan;
  unchanged(f, 'co', {an: 'root'});
  f.p.cn = 0;
  unchanged(f, 'co', {an: 'heal'});
  unchanged(f, 'co', {an: 'heal', mon: 'item_thit_thu'});
  f.h.co[1].nghi = {ly: 'xac'};
  unchanged(f, 'co', {an: 'shield'});
});

test('hunger is elapsed-time based, persists through reload and ignores repeated/reversed ticks', () => {
  const f = fixture();
  clock = START + DAY;
  f.api.tick(clock);
  const drop = data.bal.gu_food.quy_tac.giam_moi_chu_ky;
  assert.equal(f.h.co[0].no, 100 - drop);
  const snap = f.api.snapshot();
  f.api.tick(clock);
  f.api.tick(START);
  assert.deepEqual(f.api.snapshot(), snap);
  const restored = fixture(structuredClone(f.h));
  restored.api.tick(START + DAY * 2);
  assert.equal(restored.h.co[0].no, 100 - drop * 2);
  restored.api.tick(START + DAY * 100);
  assert.equal(restored.h.co[0].no, 0);
  assert.equal(restored.h.co.length, 4, 'death/rescue is outside this module');
});

test('local refinement charges both costs once, persists and does not auto-equip', () => {
  const f = fixture();
  f.h.co.push(gu('wild', 'gu_sinh_co_diep', {luyenHoa: false}));
  f.api.handle('co', {luyen: 'wild'});
  const g = f.h.co.find(g => g.uid === 'wild');
  assert.equal(g.luyenHoa, true);
  assert.equal(f.h.nguyenThach, 480);
  assert.equal(f.h.nt, 480);
  assert.equal(f.p.cn, 990);
  assert.ok(f.h.vcl.lh.includes(g.loai));
  assert.equal(f.h.o.some(s => s.uid === 'wild'), false);
  unchanged(f, 'co', {luyen: 'wild'});
  assert.equal(f.room.saved.co.find(g => g.uid === 'wild').luyenHoa, true);
});

test('refinement shortages do not consume either resource', () => {
  const f = fixture();
  f.h.co.push(gu('wild', 'gu_sinh_co_diep', {luyenHoa: false}));
  f.p.cn = 0;
  unchanged(f, 'co', {luyen: 'wild'});
  f.p.cn = 100;
  f.h.nguyenThach = 0;
  unchanged(f, 'co', {luyen: 'wild'});
});

test('medicine consumes one, heals over ticks, clamps HP and restores pending effect', () => {
  const f = fixture();
  f.api.handle('dung_do', {id: 'item_cao_cam_mau'});
  assert.equal(f.h.tui.item_cao_cam_mau, 4);
  assert.equal(f.p.hp, 100, 'not instant healing');
  unchanged(f, 'dung_do', {id: 'item_cao_cam_mau'});
  clock += 2000;
  f.api.tick(clock);
  assert.equal(f.p.hp, 116);
  const restored = fixture(structuredClone(f.h));
  restored.api.tick(START + 5000);
  assert.equal(restored.p.hp, 140);
  assert.equal(restored.h.guInventory.heal, null);
  restored.p.hp = 198;
  clock = START + 5000;
  restored.api.handle('dung', {id: 'item_cao_cam_mau'});
  restored.api.tick(clock + 10000);
  assert.equal(restored.p.hp, 200);
  unchanged(restored, 'dung_do', {id: 'item_cao_cam_mau'});
  unchanged(restored, 'dung_do', {id: 'item_thao_duoc'});
});

test('shop buys/sells exact quantities and currencies with refreshed UI rows', () => {
  const f = fixture();
  f.api.handle('cua_hang');
  const price = data.bal.economy.gia_mua_npc.item_thit_thu;
  f.api.handle('mua', {id: 'item_thit_thu', so: 5, gia: 0});
  assert.equal(f.h.tui.item_thit_thu, 15);
  assert.equal(f.h.nt, 500 - 10 * price, 'client prices are ignored');
  f.api.handle('ban', {id: 'item_thit_thu', so: 15});
  assert.equal(f.h.tui.item_thit_thu, undefined, 'empty stacks are removed');
  assert.equal(f.h.nt, 500 + 5 * price);
  assert.equal(f.room.messages.at(-1).type, 'cua_hang');
  const ch = f.h.ch;
  f.api.handle('mua', {id: 'gu_thu_bi', so: 1});
  assert.equal(f.h.ch, ch - data.bal.economy.kho_toc.gia.gu_thu_bi);
  const bought = f.h.co.at(-1);
  assert.equal(bought.loai, 'gu_thu_bi');
  assert.equal(bought.luyenHoa, false);
  assert.equal(typeof bought.uid, 'string');
  f.api.handle('mua', {id: 'gu_sinh_co_diep', so: 2});
  const uids = f.h.co.map(g => g.uid);
  assert.equal(new Set(uids).size, uids.length);
  const nt = f.h.nt;
  f.api.handle('ban', {id: 'gu_sinh_co_diep', so: 2});
  assert.equal(f.h.nt, nt + 2 * data.bal.economy.gia_mua_npc.gu_sinh_co_diep);
  assert.equal(f.h.co.filter(g => g.loai === 'gu_sinh_co_diep').length, 0);
});

test('shop validates quantity, money, inventory capacity, stock and protected Gu', () => {
  const f = fixture();
  for (const so of [0, -1, '5', 1.5, 1000, Infinity, NaN, null]) {
    unchanged(f, 'mua', {id: 'item_thit_thu', so});
    unchanged(f, 'ban', {id: 'item_thit_thu', so});
  }
  for (const id of ['__proto__', 'constructor', 'item_fake', 'item_thao_duoc']) unchanged(f, 'mua', {id});
  unchanged(f, 'ban', {id: 'item_thit_thu', so: 11});
  unchanged(f, 'ban', {id: 'gu_thu_bi'});
  f.h.nguyenThach = 0;
  unchanged(f, 'mua', {id: 'item_thit_thu'});
  f.h.ch = 0;
  unchanged(f, 'mua', {id: 'gu_thu_bi'});
  f.h.nguyenThach = 500;
  f.h.tuiToiDa = Object.keys(f.h.tui).length;
  unchanged(f, 'mua', {id: 'item_ruou_trang'});
  f.api.handle('mua', {id: 'item_thit_thu'});
  assert.equal(f.h.tui.item_thit_thu, 11, 'existing stack can grow in a full bag');
});

test('recipe uses actual IDs, requires all Gu/items/CN and never charges partial costs', () => {
  const f = fixture();
  f.h.co.push(gu('ingredient', 'gu_thiem_quang'));
  const r = data.recipe.rc_tieu_quang;
  f.api.handle('che_tao');
  const nt = f.h.nguyenThach, cn = f.p.cn;
  f.api.handle('che', {ma: 'rc_tieu_quang', so: 1});
  assert.equal(f.h.co.some(g => g.uid === 'ingredient'), false);
  assert.equal(f.h.co.at(-1).loai, r.ra);
  assert.equal(f.h.co.at(-1).luyenHoa, true);
  assert.equal(f.h.tui.item_canh_nguyet_lan, 10 - r.phu[0].so);
  assert.equal(f.p.cn, cn - r.cn);
  assert.equal(f.h.nguyenThach, nt);
  assert.equal(f.room.messages.at(-1).type, 'che_tao');
  for (const so of [0, -1, '1', Infinity]) unchanged(f, 'che', {ma: 'rc_tieu_quang', so});
  unchanged(f, 'che', {ma: 'constructor'});
  unchanged(f, 'che', {ma: 'rc_ban_menh_cong_2'});
  unchanged(f, 'che', {ma: 'rc_tieu_quang'});
  f.h.co.push(gu('ingredient2', 'gu_thiem_quang'));
  delete f.h.tui.item_canh_nguyet_lan;
  unchanged(f, 'che', {ma: 'rc_tieu_quang'});
  f.h.tui.item_canh_nguyet_lan = 100;
  f.p.cn = 0;
  unchanged(f, 'che', {ma: 'rc_tieu_quang'});
});

test('batch recipe aggregates primary and auxiliary copies of the same Gu', () => {
  const f = fixture();
  const r = data.recipe.rc_tieu_loi_tho_dau_mau;
  f.h.chuyen = data.gu[r.ra].chuyen;
  f.p.cn = r.cn * 5;
  for (const ingredient of r.phu.filter(p => data.item[p.id])) f.h.tui[ingredient.id] = ingredient.so * 5;
  for (let i = 0; i < 14; i++) f.h.co.push(gu('copy-' + i, r.chinh));
  unchanged(f, 'che', {ma: 'rc_tieu_loi_tho_dau_mau', so: 5});
  f.h.co.push(gu('copy-14', r.chinh));
  f.api.handle('che', {ma: 'rc_tieu_loi_tho_dau_mau', so: 5});
  assert.equal(f.h.co.filter(g => g.loai === r.chinh).length, 0);
  assert.equal(f.h.co.filter(g => g.loai === r.ra).length, 5);
  assert.equal(f.p.cn, 0);
  for (const ingredient of r.phu.filter(p => data.item[p.id])) assert.equal(f.h.tui[ingredient.id], undefined);
});

test('pending healing/hunger never reopens panels closed locally by the client', () => {
  const f = fixture();
  f.api.handle('cua_hang');
  f.api.handle('che_tao');
  f.api.handle('dung_do', {id: 'item_cao_cam_mau'});
  f.room.messages.length = 0;
  f.api.tick(START + 60_000);
  assert.ok(f.room.messages.every(m => m.type !== 'cua_hang' && m.type !== 'che_tao'));
});

test('malformed messages and separate rooms cannot mutate each other', () => {
  const a = fixture(), b = fixture();
  for (const p of [null, [], 0, 'bad']) unchanged(a, 'mua', p);
  a.api.handle('mua', {id: 'gu_sinh_co_diep'});
  assert.equal(a.h.co.length, 5);
  assert.equal(b.h.co.length, 4);
  const c = fixture(structuredClone(a.h));
  c.api.handle('mua', {id: 'gu_sinh_co_diep'});
  assert.equal(new Set(c.h.co.map(g => g.uid)).size, c.h.co.length, 'UID sequence survives reload');
});
