/**
 * Independent rules for the recovered first-party UI, not recovered server code.
 * Protocol evidence: latest cotienlo-expand/recovered-current/modules/bundle.js:
 * 143782 dung_do {id}; 143828 co {lap,o,biDong}; 144060 co {an};
 * 144076 co {luyen}; 168173 co {go,biDong|phuTro};
 * 144266 mua {id,so}; 144300 ban {id,so}; 144359 che {ma,so};
 * 49965/49970 receive cua_hang/che_tao; 144344 crafting row fields.
 *
 * Main owns hooks: attach after profile/player exist; call handle before generic
 * dispatch, tick(now) from the room clock. To open panels, main can call
 * handle('cua_hang', {}) / handle('che_tao', {}). These two calls are local
 * adapter entry points, not claims about outgoing first-party messages.
 * snapshot() returns detached profile fields and both current panel payloads.
 *
 * V3: original wire shapes; public recipe/diet/pricing data; documented timed
 * synthesis, primary survival on failure and automatic meals. See
 * reports/INVENTORY-V3.md for exact evidence versus local/server-unknown rules.
 * `mini` is claimed ONLY for this module's active luyen_hoa context.
 * Care/profession/equipment commands remain the progression module's domain.
 */

import {recipeContract} from './crafting.mjs';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const own = (o, k) => Object.hasOwn(o ?? {}, k);
const get = (o, k) => typeof k === 'string' && own(o, k) ? o[k] : undefined;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const positive = n => finite(n) && n > 0;
const count = n => Number.isSafeInteger(n) && n > 0;
const emptySlot = () => ({uid: null, loai: null, cd: 0, cdMax: 0, cn: 0, cnGiay: false, bat: false});

// Generated official wiki/vat pages, captured 21 October. These are resale
// prices, unlike economy.gia_mua_npc (the price a player pays an NPC).
const RESALE = Object.freeze({
  item_bom_hao_dien_lang: 10, item_ca_bang_tu: 2, item_ca_chep_bun: .2,
  item_ca_diec: .15, item_ca_hong_vi: 2, item_ca_mac_ngu: 2, item_ca_ngan_lan: 2,
  item_ca_tram_den: .4, item_canh_doi: .05, item_da_gau: 1.5, item_da_heo: .1,
  item_da_huou: .1, item_da_ran: .25, item_da_soi: .25, item_da_vun: .01,
  item_dat_hu_ne: .02, item_giay_rach: .02, item_hoang_ne: .1, item_huyet_thu: .03,
  item_loi_thach_giap: 50, item_long_tho: .03, item_long_ung: .08, item_luon_da: .4,
  item_mat_ong: .3, item_nanh_heo: .15, item_nanh_heo_vuong: 5, item_nanh_soi: .3,
  item_ngoc_vun: .4, item_quang_dong: .08, item_quang_sat: .12, item_tham_tu: 1.5,
  item_thit_lon: .3, item_thit_thu: .03, item_tim_cuong_dien_lang: 50,
  item_trang_sach: .2, item_tui_doc: .3, item_vay_da: .1, item_vay_thuy_mang: 10,
});
const shopAliases = {npc_ta_toan: 'kho_toc', npc_chu_quan_tro: 'quan_tro', npc_lao_khuyen: 'lao_khuyen', npc_thuong_ky: 'thuong_hoi',
  // Valid story service menus without exported medicine/wearable price tables.
  npc_ta_ninh: 'thuong_hoi', npc_ban_do_deo: 'thuong_hoi'};
const shopTypes = new Set(['kho_toc', 'thuong_hoi', 'quan_tro', 'lao_khuyen']);
const actions = new Set(['mua', 'ban', 'che', 'cua_hang', 'che_tao', 'hop_luyen', 'dung_do']);
const ownsCo = p => ['lap', 'go', 'an', 'luyen'].some(k => own(p, k));

export function attachGuInventory(room) {
  let attachedProfile, core;
  const temporary = () => room.intro?.active || room.zoneId === 'inst_mo_dau';
  function current() {
    if (attachedProfile !== room.profile) {
      attachedProfile = room.profile;
      core = attachProfile(room);
    }
    return core;
  }
  return {
    handle(type, p = {}) {
      if (temporary()) {
        // Never initialize care clocks, tick hunger or charge the dream profile.
        // In particular, the intro owns mini {giu} for tu_bao.
        if (actions.has(type) || type === 'co' && ownsCo(p)) {
          room.notify('Hoàn thành Giấc mơ trước khi dùng chức năng này.');
          return true;
        }
        return false;
      }
      return current().handle(type, p);
    },
    tick(now) { if (!temporary()) current().tick(now); },
    snapshot() {
      return temporary() ? structuredClone({co: room.profile.co ?? [], tui: room.profile.tui ?? {}, temporary: true}) : current().snapshot();
    },
  };
}

function attachProfile(room) {
  const {data, profile: h, player} = room;
  h.co ??= [];
  h.o ??= [];
  h.obd ??= [];
  h.opt ??= [];
  h.tui ??= {};
  // Stored inside the existing profile so save/restore needs no runtime changes.
  const local = h.guInventory ??= {version: 3, nextUid: 1, foodAt: {}, heal: null};
  local.version = 3;
  local.foodAt ??= {};
  local.exhaustedAt ??= {};
  local.trades ??= {};
  local.jobs ??= [];
  // Key release is not recoverable across reload. Never hold R while offline.
  if (local.refining) local.refining.held = false;
  let shopOpen = false;
  let craftOpen = false;
  let synthesisOpen = false;
  let shopType = 'kho_toc';
  const spec = id => get(data.gu, id) ?? get(data.item, id);
  const guByUid = uid => typeof uid === 'string' ? h.co.find(g => g.uid === uid) : undefined;
  const name = id => room.label(spec(id)?.ten_key ?? id, id);
  const fail = text => { room.notify(text); return true; };
  const amount = p => p.so === undefined ? 1 : p.so;
  const validAmount = n => count(n) && n <= 999;
  const money = key => h[key] ?? (key === 'nguyenThach' ? h.nt ?? 0 : 0);
  const rank = () => Math.max(0, h.tv?.chuyen ?? h.chuyen ?? 0);
  const allowedRank = g => (get(data.gu, g.loai)?.chuyen ?? Infinity) <= rank() + (data.bal?.combat?.co_cao_chuyen?.toi_da_vuot ?? 0);
  const foodRule = data.bal?.gu_food?.quy_tac ?? {};
  const period = g => Math.max(1, get(data.gu, g.loai)?.an?.chu_ky_gio ?? 24) * HOUR;
  const nowAtAttach = Date.now();
  const event = (type, detail = {}) => {
    // A quest callback must not turn a committed transaction into a retry.
    try { room.onInventoryEvent?.({type, ...structuredClone(detail)}); }
    catch { room.notify('Thao tác đã lưu; chưa cập nhật được nhiệm vụ.'); }
  };
  for (const g of h.co) {
    if (!finite(get(local.foodAt, g.uid))) {
      local.foodAt[g.uid] = finite(g.buaToi) ? Math.min(nowAtAttach, g.buaToi - period(g)) : nowAtAttach;
    }
  }

  function sync() {
    h.nguyenThach = money('nguyenThach');
    h.nt = h.nguyenThach;
    h.hp = player.hp;
    h.hpMax = player.hpMax;
    h.cn = player.cn;
    h.cnMax = player.cnMax;
  }

  function equipped(uid) {
    return h.o.some(s => s?.uid === uid) || h.obd.includes(uid) || h.opt.includes(uid);
  }

  function available(g) {
    return !g.banMenh && !g.thuongNv && !g.nghi && !equipped(g.uid) && local.refining?.uid !== g.uid;
  }

  function addGu(id, refined = false) {
    let uid;
    do {
      if (!count(local.nextUid)) local.nextUid = 1;
      uid = `local-gu-${local.nextUid++}`;
    } while (guByUid(uid));
    const g = {uid, loai: id, banMenh: false, luyenHoa: refined, no: foodRule.no_bung_toi_da ?? 100,
      thuanThuc: 0, xp: 0, xpCan: data.bal?.cultivation?.thuan_thuc?.xp_len_cap?.[0] ?? 20,
      xpNgay: 0, sao: 0, buaToi: 0, nghi: null, thuongNv: false};
    g.buaToi = Date.now() + period(g);
    local.foodAt[uid] = Date.now();
    h.co.push(g);
    return g;
  }

  function removeGu(uids) {
    const removing = new Set(uids);
    h.co = h.co.filter(g => !removing.has(g.uid));
    for (const uid of uids) delete local.foodAt[uid];
    for (const uid of uids) delete local.exhaustedAt[uid];
  }

  function setItem(id, n) {
    if (n === 0) delete h.tui[id];
    else h.tui[id] = n;
  }

  function fits(items) {
    return Object.values(items).filter(n => n > 0).length <= (h.tuiToiDa ?? data.bal?.economy?.tui?.o_goc ?? 40);
  }

  function stock() {
    const rows = new Map();
    for (const [id, price] of Object.entries(data.bal?.economy?.gia_mua_npc ?? {})) {
      const d = spec(id);
      const gu = get(data.gu, id);
      const offered = shopType === 'quan_tro' ? id === 'item_ruou_trang' :
        shopType === 'lao_khuyen' ? gu?.nguon?.some(s => s.ma === 'lao_khuyen') :
        !gu || shopType === 'thuong_hoi' && gu.nguon?.some(s => s.ma === 'thuong_hoi');
      if (offered && d && !d.khoa && positive(price)) rows.set(id, {id, ten: name(id), gia: price, tien: 'nt'});
    }
    for (const [id, price] of Object.entries(data.bal?.economy?.kho_toc?.gia ?? {})) {
      if (shopType === 'kho_toc' && get(data.gu, id) && !data.gu[id].khoa && positive(price)) {
        const max = get(data.bal.economy.kho_toc.tran_tuan, id);
        const used = tradeCount('week', id);
        rows.set(id, {id, ten: name(id), gia: price, tien: 'ch', chuyen: data.gu[id].chuyen,
          ...(positive(max) ? {conTuan: Math.max(0, max - used), tranTuan: max} : {})});
      }
    }
    return rows;
  }

  function shop() {
    const prices = resale();
    const sellable = new Map(Object.entries(h.tui).filter(([id, n]) => get(data.item, id) && count(n)));
    for (const g of h.co.filter(available)) sellable.set(g.loai, (sellable.get(g.loai) ?? 0) + 1);
    const ban = [], khongThu = [];
    for (const [id, co] of sellable) {
      const gia = get(prices, id);
      (positive(gia) ? ban : khongThu).push({id, ten: name(id), co, ...(positive(gia) ? {gia} : {})});
    }
    const cap = saleCap();
    const sold = tradeCount('day', 'sales');
    return {ten: {kho_toc: 'Kho tộc · Tạ Toàn', thuong_hoi: 'Thương hội', quan_tro: 'Quán trọ', lao_khuyen: 'Lão Khuyển'}[shopType],
      loai: shopType, mua: [...stock().values()], ban: ['kho_toc', 'thuong_hoi'].includes(shopType) ? ban : [], khongThu,
      ...(positive(cap) ? {tranBan: {da: sold, tran: cap, du: local.saleRemainder ?? 0}} : {})};
  }

  function resale() { return data.bal?.economy?.gia_ban_npc ?? RESALE; }
  // Exact reset documented by the client: Monday 05:00 Vietnam (UTC+7).
  function tradeKey(kind, now = Date.now()) {
    const day = Math.floor((now + 2 * HOUR) / DAY);
    return kind === 'week' ? Math.floor((day + 3) / 7) : day;
  }
  function tradeCount(kind, id) {
    const ledger = local.trades[kind];
    return ledger?.key === tradeKey(kind) ? ledger.counts[id] ?? 0 : 0;
  }
  function recordTrade(kind, id, n) {
    if (local.trades[kind]?.key !== tradeKey(kind)) local.trades[kind] = {key: tradeKey(kind), counts: {}};
    const ledger = local.trades[kind].counts;
    ledger[id] = (ledger[id] ?? 0) + n;
  }
  function saleCap() { return data.bal?.economy?.tran_ban_npc_ngay ?? room.inventoryRules?.saleCap ?? 100; }

  function recipe(id) {
    const contract = recipeContract(data, h, id, room.inventoryRules?.synthesis);
    if (!contract) return null;
    const r = contract.r;
    const can = new Map([[r.chinh, 1]]);
    for (const p of r.phu) {
      if (!spec(p.id) || !count(p.so)) return null;
      can.set(p.id, (can.get(p.id) ?? 0) + p.so);
    }
    return {r, can, contract};
  }

  function ingredientCount(id) {
    return get(data.gu, id) ? h.co.filter(g => g.loai === id && available(g)).length : h.tui[id] ?? 0;
  }

  function craftPanel() {
    const ds = [];
    for (const id of Object.keys(data.recipe ?? {})) {
      const def = recipe(id);
      if (!def) continue;
      const {r, can} = def;
      // CN is shown as a requirement too; it is never an inventory item ID.
      const need = [...can].map(([id, n]) => ({id, ten: name(id), n, co: ingredientCount(id)}));
      if (r.cn) need.push({id: 'cn', ten: 'Chân nguyên', n: r.cn, co: player.cn});
      ds.push({ma: id, ten: name(r.ra), can: need, ra: [{id: r.ra, ten: name(r.ra), n: 1}],
        giay: r.thoi_gian_s, tiLe: def.contract.chance,
        khoa: recipeError(id, def) ?? ''});
    }
    return {ds};
  }

  function finish(message, panel) {
    sync();
    room.refresh();
    room.save();
    // UI closes panels locally without sending a message. Refresh only the
    // panel whose button triggered this transaction; ticks must not reopen it.
    if (panel === 'shop' && shopOpen) room.emit('cua_hang', shop());
    if (panel === 'craft' && craftOpen) room.emit('che_tao', craftPanel());
    if (panel === 'synthesis' && synthesisOpen) room.emit('hop_luyen', synthesisPanel());
    if (message) room.notify(message);
    return true;
  }

  function slotCost(g) {
    const d = data.gu[g.loai], combat = data.bal?.combat ?? {};
    const difference = rank() - (d.chuyen ?? 1);
    const factor = difference < 0 ? combat.co_cao_chuyen?.cn_he_so ?? 2 : difference === 0 ? 1 :
      difference === 1 ? combat.co_thap_chuyen_cn?.thap_1 ?? 0.6 : combat.co_thap_chuyen_cn?.thap_2 ?? 0.35;
    const mastery = d.kich_hoat === 'duy_tri' ? 1 : Math.max(0, 1 - (data.bal?.cultivation?.thuan_thuc?.giam_cn_moi_cap ?? 0.03) * (g.thuanThuc ?? 0));
    return (d.cn ?? 0) * (d.cn_theo === 'ti_le_toi_da' ? player.cnMax : factor) * mastery;
  }

  function unequipUid(uid) {
    h.o.forEach((s, i) => { if (s?.uid === uid) h.o[i] = emptySlot(); });
    h.obd.forEach((v, i) => { if (v === uid) h.obd[i] = null; });
    h.opt.forEach((v, i) => { if (v === uid) h.opt[i] = null; });
  }

  function guCommand(p) {
    const keys = ['lap', 'go', 'an', 'luyen'].filter(k => own(p, k));
    if (!keys.length) return false; // Advanced actions remain available to main.
    if (keys.length !== 1) return fail('Mỗi lần chỉ thực hiện một thao tác cổ.');
    const action = keys[0];
    if (['biDong', 'phuTro'].some(k => own(p, k) && typeof p[k] !== 'boolean') || p.biDong && p.phuTro) return fail('Loại ô cổ không hợp lệ.');
    const target = p.phuTro ? h.opt : p.biDong ? h.obd : h.o;
    if (action === 'go' || action === 'lap') {
      const i = action === 'go' ? p.go : p.o;
      if (!Number.isInteger(i) || i < 0 || i >= target.length) return fail('Ô cổ không hợp lệ.');
      const oldUid = p.biDong || p.phuTro ? target[i] : target[i]?.uid;
      const old = guByUid(oldUid);
      if (action === 'go') {
        if (!oldUid) return true;
        if (!old || old.banMenh) return fail('Không thể tháo cổ bản mệnh.');
        old.inventoryCd = Math.max(old.inventoryCd ?? 0, target[i]?.cd ?? 0);
        unequipUid(oldUid);
        return finish('Đã tháo cổ.');
      }
      const g = guByUid(p.lap), d = g && get(data.gu, g.loai);
      if (!g || !d) return fail('Không tìm thấy cổ.');
      if (!g.luyenHoa || g.nghi || local.refining?.uid === g.uid || !allowedRank(g) || g.no <= 0) return fail('Cổ chưa sẵn sàng: hãy luyện hóa, cho ăn hoặc kiểm tra cảnh giới.');
      if ((old?.banMenh && old.uid !== g.uid) || (g.banMenh && (p.biDong || p.phuTro || i !== 0))) return fail('Ô bản mệnh được giữ ở ô chính.');
      if (!p.phuTro && !!p.biDong !== (d.kich_hoat === 'bi_dong')) return fail('Cổ không phù hợp ô hoạt động/bị động.');
      if (p.phuTro && g.banMenh) return fail('Cổ không phù hợp ô phụ trợ.');
      if (!p.biDong && !p.phuTro) {
        const limits = data.bal?.combat?.tran_cung_vai;
        const role = limits?.vai?.find(v => d.nhan?.includes(v) || d.nhom?.includes(v));
        const cap = limits?.theo_chuyen?.[rank()];
        const used = h.o.filter((s, j) => j !== i && s?.uid !== g.uid &&
          limits?.vai?.find(v => data.gu[s?.loai]?.nhan?.includes(v) || data.gu[s?.loai]?.nhom?.includes(v)) === role).length;
        if (role && positive(cap) && used >= cap) return fail('Đã đủ cổ cùng vai trong các ô hoạt động.');
      }
      const previous = h.o.find(s => s?.uid === g.uid);
      const cd = Math.max(previous?.cd ?? 0, g.inventoryCd ?? 0);
      if (old) old.inventoryCd = Math.max(old.inventoryCd ?? 0, target[i]?.cd ?? 0);
      unequipUid(g.uid);
      if (p.biDong || p.phuTro) target[i] = g.uid;
      else target[i] = {uid: g.uid, loai: g.loai, cd, cdMax: (d.hoi_chieu ?? 0) * 1000,
        cn: slotCost(g), cnGiay: d.kich_hoat === 'duy_tri', bat: false};
      event('equip', {uid: g.uid, id: g.loai, slot: i, mode: p.phuTro ? 'support' : p.biDong ? 'passive' : 'active'});
      return finish('Đã lắp ' + name(g.loai) + '.');
    }
    const g = guByUid(p[action]), d = g && get(data.gu, g.loai);
    if (!g || !d) return fail('Không tìm thấy cổ.');
    if (g.nghi && (action === 'luyen' || ['xac', 'hoi_sinh', 'hop_luyen'].includes(g.nghi.ly))) return fail('Cổ đang nghỉ hoặc bị thương.');
    if (action === 'luyen') {
      if (g.luyenHoa) return true;
      if (rank() < 1) return fail('Cần khai khiếu trước khi luyện hóa cổ.');
      if (!allowedRank(g)) return fail('Cảnh giới chưa đủ để luyện hóa cổ.');
      if (local.refining || local.craftMini || player.hp <= 0) return fail('Đang có thao tác luyện hoặc chưa thể luyện hóa.');
      const costPerSecond = room.inventoryRules?.refining?.cnPerSecond ?? Math.max(1, d.chuyen ?? 1);
      if (player.cn < costPerSecond) return fail('Không đủ chân nguyên để bắt đầu luyện hóa.');
      local.refining = {uid: g.uid, loai: 'luyen_hoa', started: Date.now(), last: Date.now(),
        kim: .5, c: .5, w: Math.max(.12, .42 - .04 * ((d.chuyen ?? 1) - 1)), tienDo: 0,
        held: false, timeout: room.inventoryRules?.refining?.seconds ?? 45, costPerSecond};
      emitRefining();
      return finish('Đang luyện hóa: giữ R để kim nằm trong vùng sáng.');
    }
    if (!g.luyenHoa || !d.an) return fail('Cổ chưa luyện hóa hoặc không có chế độ cho ăn.');
    const food = d.an.thuc_an;
    const choices = Array.isArray(food) ? food : food ? [food] : [];
    const n = d.an.luong;
    if (!positive(n)) return fail('Dữ liệu khẩu phần không hợp lệ.');
    let mon;
    if (choices.length) {
      mon = p.mon === undefined ? choices.find(id => (h.tui[id] ?? 0) >= n) : p.mon;
      if (!choices.includes(mon) || !get(data.item, mon) || (h.tui[mon] ?? 0) < n) return fail('Không đủ đúng thức ăn của cổ.');
      setItem(mon, h.tui[mon] - n);
    } else {
      if (p.mon !== undefined || !finite(player.cn) || player.cn < n) return fail(`Cổ cần ${n} chân nguyên để ăn.`);
      player.cn -= n;
    }
    fed(g, mon, Date.now());
    return finish(name(g.loai) + ' đã ăn no.');
  }

  function fed(g, mon, now, automatic = false) {
    const rare = get(data.bal?.gu_food?.thuc_an_quy, mon);
    const meals = Math.max(1, rare?.bua ?? 1);
    g.no = foodRule.an_dua_ve ?? 100;
    // Keep continuous hunger decay separate from the next scheduled meal.
    local.foodAt[g.uid] = now + (meals - 1) * period(g);
    g.buaToi = now + meals * period(g);
    delete local.exhaustedAt[g.uid];
    if (rare?.xp) g.xp = (g.xp ?? 0) + rare.xp;
    room.emit('co_an_xong', {uid: g.uid, no: g.no});
    event('feed', {uid: g.uid, id: g.loai, food: mon ?? 'cn', automatic});
  }

  function emitRefining() {
    const s = local.refining;
    if (s) room.emit('mini', {loai: 'luyen_hoa', ten: name(guByUid(s.uid)?.loai),
      kim: s.kim, c: s.c, w: s.w, tienDo: s.tienDo, cn: player.cn, cnMax: player.cnMax,
      conLai: Math.max(0, s.timeout - (s.last - s.started) / 1000)});
  }

  function mini(p) {
    if (!local.refining && !local.craftMini) return false;
    if (Object.keys(p).some(k => !['giu', 'huy'].includes(k)) || !Object.keys(p).length) return false;
    if (own(p, 'giu') && typeof p.giu !== 'boolean' || own(p, 'huy') && typeof p.huy !== 'boolean') return fail('Lệnh luyện không hợp lệ.');
    if (p.huy) {
      local.refining = null;
      local.craftMini = null;
      room.emit('mini', null);
      return finish('Đã dừng luyện.');
    }
    if (local.refining && own(p, 'giu')) {
      // Account under the previous input before accepting the next hold state.
      tickRefining(Date.now());
      if (local.refining) local.refining.held = p.giu;
    }
    return true;
  }

  function tickRefining(now) {
    const s = local.refining;
    if (!s || now <= s.last) return false;
    const g = guByUid(s.uid);
    if (!g || g.luyenHoa || g.nghi || player.hp <= 0) {
      local.refining = null;
      room.emit('mini', null);
      return true;
    }
    // Input is never replayed over offline gaps. Bounded integration prevents a
    // delayed frame from manufacturing a win while nobody controls the needle.
    if (now - s.last > 2000) s.held = false;
    const end = Math.min(now, s.started + s.timeout * 1000);
    while (s.last < end && s.tienDo < 1) {
      const dt = Math.min(50, end - s.last) / 1000;
      const cost = s.held ? s.costPerSecond * dt : 0;
      if (player.cn < cost) { s.last = end; break; }
      player.cn = Math.max(0, player.cn - cost);
      const t = (s.last - s.started) / 1000;
      s.c = .5 + .12 * Math.sin(t * .8);
      s.kim = Math.max(0, Math.min(1, s.kim + (s.held ? .38 : -.32) * dt + Math.sin(t * 3.1) * .04 * dt));
      s.tienDo = Math.max(0, Math.min(1, s.tienDo + (Math.abs(s.kim - s.c) <= s.w / 2 ? .12 : -.08) * dt));
      s.last += dt * 1000;
    }
    if (s.tienDo >= 1) {
      g.luyenHoa = true;
      g.no = foodRule.an_dua_ve ?? 100;
      local.foodAt[g.uid] = now;
      g.buaToi = now + period(g);
      delete local.exhaustedAt[g.uid];
      h.vcl ??= {lh: []}; h.vcl.lh ??= [];
      if (!h.vcl.lh.includes(g.loai)) h.vcl.lh.push(g.loai);
      local.refining = null;
      room.emit('mini', null);
      event('gu-refine', {uid: g.uid, id: g.loai, success: true});
      room.notify('Luyện hóa xong ' + name(g.loai) + '.');
    } else if (now >= s.started + s.timeout * 1000 || player.cn <= 0) {
      // Original text distinguishes a fleeing wild Gu and an injured retained
      // quest/root Gu. The exact server selection is unavailable; preserve both.
      g.nghi = {ly: 'bi_thuong', den: now + 60_000};
      local.refining = null;
      room.emit('mini', null);
      event('gu-refine-failed', {uid: g.uid, id: g.loai, success: false});
      room.notify('Ý chí cổ còn mạnh. Cổ bị thương, chờ một phút rồi luyện lại.');
    } else emitRefining();
    return true;
  }

  function buy(p) {
    const n = amount(p), row = stock().get(p.id);
    if (!validAmount(n) || !row) return fail('Mặt hàng hoặc số lượng mua không hợp lệ.');
    const key = row.tien === 'ch' ? 'ch' : 'nguyenThach', cost = row.gia * n;
    if (!positive(cost) || !finite(money(key)) || money(key) < cost) return fail('Không đủ tiền mua hàng.');
    if (row.tien === 'ch' && (data.gu[p.id]?.chuyen ?? Infinity) > rank()) return fail('Chưa đủ chuyển để đổi cổ này.');
    if (finite(row.conTuan) && n > row.conTuan) return fail('Đã chạm giới hạn đổi cổ trong tuần.');
    if (!get(data.gu, p.id)) {
      const result = (h.tui[p.id] ?? 0) + n;
      if (!Number.isSafeInteger(result) || !fits({...h.tui, [p.id]: result})) return fail('Túi đã đầy.');
      setItem(p.id, result);
    } else {
      if (h.co.length + n > (h.coToiDa ?? 200)) return fail('Chỗ chứa cổ đã đầy.');
      for (let i = 0; i < n; i++) addGu(p.id);
    }
    h[key] = money(key) - cost;
    if (row.tien === 'ch') recordTrade('week', p.id, n);
    event('buy', {id: p.id, quantity: n, currency: row.tien, cost, shop: shopType});
    return finish(`Đã mua ${name(p.id)} ×${n}.`, 'shop');
  }

  function sell(p) {
    const n = amount(p), price = get(resale(), p.id);
    if (!validAmount(n) || !spec(p.id) || !positive(price)) return fail('Mặt hàng hoặc số lượng bán không hợp lệ.');
    if (!['kho_toc', 'thuong_hoi'].includes(shopType)) return fail('Quầy này không thu mua vật phẩm.');
    const cents = Math.round(price * 100) * n;
    const remainder = Math.round((local.saleRemainder ?? 0) * 100);
    const earned = Math.floor((cents + remainder) / 100);
    if (tradeCount('day', 'sales') + earned > saleCap()) return fail('Vượt trần bán vật liệu trong ngày.');
    if (!finite(money('nguyenThach')) || !Number.isSafeInteger(cents) || !finite(money('nguyenThach') + earned)) return fail('Số tiền không hợp lệ.');
    if (get(data.gu, p.id)) {
      const candidates = h.co.filter(g => g.loai === p.id && available(g)).sort((a, b) => Number(a.luyenHoa) - Number(b.luyenHoa));
      if (candidates.length < n) return fail('Không đủ cổ có thể bán; hãy tháo cổ và giữ lại bản mệnh.');
      removeGu(candidates.slice(0, n).map(g => g.uid));
    } else {
      if ((h.tui[p.id] ?? 0) < n) return fail('Không đủ vật phẩm để bán.');
      setItem(p.id, h.tui[p.id] - n);
    }
    h.nguyenThach = money('nguyenThach') + earned;
    local.saleRemainder = (cents + remainder - earned * 100) / 100;
    recordTrade('day', 'sales', earned);
    event('sell', {id: p.id, quantity: n, proceeds: earned, remainder: local.saleRemainder, shop: shopType});
    return finish(`Đã bán ${name(p.id)} ×${n}.`, 'shop');
  }

  function craft(p) {
    // Parent progression can publish its wiki-derived profession definitions
    // through a single explicit adapter. Gu synthesis stays owned here.
    if (!get(data.recipe, p.ma) && room.inventoryCraft?.(p) === true) return true;
    if (get(data.bal?.nghe?.che_tao, p.ma)) return professionCraft(p);
    const n = amount(p), def = recipe(p.ma);
    if (!validAmount(n) || !def) return fail('Cổ phương hoặc số lượng không hợp lệ.');
    const {r, can, contract} = def;
    const error = recipeError(p.ma, def);
    if (error) return fail(error);
    if (local.refining || local.jobs.length + n > contract.slots) return fail('Phòng luyện hóa đã đủ lượt.');
    if (!finite(player.cn) || !finite(r.cn * n) || player.cn < r.cn * n) return fail('Không đủ chân nguyên để chế cổ.');
    const consumed = [], items = {...h.tui}, primary = [];
    const candidates = h.co.filter(g => g.loai === r.chinh && g.luyenHoa && !g.nghi &&
      (!r.ban_menh || g.banMenh) && (!g.banMenh || r.ban_menh) && local.refining?.uid !== g.uid &&
      (!g.thuongNv || r.ban_menh));
    if (p.uid !== undefined) {
      const chosen = candidates.findIndex(g => g.uid === p.uid);
      if (chosen < 0 || n !== 1) return fail('Cổ chính đã chọn không hợp lệ.');
      candidates.unshift(...candidates.splice(chosen, 1));
    }
    if (candidates.length < n) return fail('Thiếu cổ chính đã luyện hóa.');
    primary.push(...candidates.slice(0, n));
    const primaryIds = new Set(primary.map(g => g.uid));
    for (const [id, each] of can) {
      // The primary survives failure. Reserve it separately, including recipes
      // whose auxiliaries use more copies of exactly the same Gu type.
      const needed = (each - (id === r.chinh ? 1 : 0)) * n;
      if (needed === 0) continue;
      if (!count(needed)) return fail('Số lượng nguyên liệu không hợp lệ.');
      if (get(data.gu, id)) {
        const auxiliaries = h.co.filter(g => g.loai === id && available(g) && !primaryIds.has(g.uid));
        if (auxiliaries.length < needed) return fail('Thiếu cổ phụ: ' + name(id) + '.');
        consumed.push(...auxiliaries.slice(0, needed).map(g => g.uid));
      } else {
        if (!count(items[id]) || items[id] < needed) return fail('Thiếu nguyên liệu: ' + name(id) + '.');
        items[id] -= needed;
        if (items[id] === 0) delete items[id];
      }
    }
    // Commit only after every cost has been checked, including repeated Gu IDs.
    h.tui = items;
    player.cn -= r.cn * n;
    removeGu(consumed);
    for (const g of primary) {
      unequipUid(g.uid);
      const now = Date.now(), den = now + r.thoi_gian_s * 1000;
      g.nghi = {ly: 'hop_luyen', den};
      local.jobs.push({uid: g.uid, rc: p.ma, ra: r.ra, bd: now, den,
        chance: contract.chance, injuryMs: contract.injuryMs});
    }
    event('craft-start', {recipe: p.ma, quantity: n, cn: r.cn * n});
    return finish(`Bắt đầu hợp luyện ${name(r.ra)} ×${n}.`, synthesisOpen ? 'synthesis' : 'craft');
  }

  function recipeError(id, def) {
    const {r, contract} = def;
    if (!h.coPhuong?.includes(id) && !h.coPhuongTk?.includes(id)) return 'Chưa có cổ phương này.';
    if (room.zoneId !== 'inst_gia_vien') return 'Hợp luyện ở phòng luyện hóa trong gia viên.';
    if (!allowedRank({loai: r.ra}) || r.ban_menh && data.gu[r.ra].chuyen > rank()) return 'Cảnh giới chưa đủ.';
    if (!r.ban_menh && !contract.profession) return 'Phải học nghề Luyện cổ.';
    if (!r.ban_menh && contract.requiredProfessionRank > 0 &&
      (!contract.profession.chinh || (contract.profession.bac ?? 0) < contract.requiredProfessionRank)) return 'Cần nghề chính Luyện cổ đủ bậc.';
    return null;
  }

  function synthesisPanel() {
    const ds = [];
    for (const id of new Set([...(h.coPhuong ?? []), ...(h.coPhuongTk ?? [])])) {
      const def = recipe(id);
      if (!def) continue;
      const {r, contract: c} = def;
      ds.push({id, ra: r.ra, chinh: r.chinh, chuyen: data.gu[r.ra].chuyen,
        phu: r.phu.map(p => ({...p, co: ingredientCount(p.id)})),
        cn: r.cn, giay: r.thoi_gian_s, banMenh: !!r.ban_menh, luonThanh: !!r.luon_thanh_cong,
        tk: c.torn, tl: {goc: r.ti_le_goc, nghe: c.craftBonus, luuPhai: c.schoolBonus, tanKhuyet: c.penalty, tran: c.cap, ti: c.chance},
        ungVien: h.co.filter(g => g.loai === r.chinh && g.luyenHoa && !g.nghi && !!g.banMenh === !!r.ban_menh)
          .map(g => ({uid: g.uid, sao: g.sao ?? 0, banMenh: !!g.banMenh})),
        saoPhu: {}, loi: recipeError(id, def) ?? ''});
    }
    const profession = h.nghe?.ds?.find(n => n.id === 'luyen_co');
    return {mo: true, o: room.zoneId === 'inst_gia_vien', cn: player.cn, ds,
      soLuot: room.inventoryRules?.synthesis?.slots ?? 1,
      luot: local.jobs.map(j => ({...j, conMs: Math.max(0, j.den - Date.now())})),
      nghe: {hoc: !!profession, diem: profession?.diem ?? 0, chinh: !!profession?.chinh, thanh: 4, thu: 2},
      manh: 0, manhCan: data.bal?.hop_luyen?.doi_manh_cp ?? 4, tanKhuyet: 0,
      manhCp: [], tangKinh: null};
  }

  function tickJobs(now) {
    let changed = false;
    for (const job of [...local.jobs]) {
      if (now < job.den) continue;
      local.jobs.splice(local.jobs.indexOf(job), 1);
      const g = guByUid(job.uid);
      if (!g || g.nghi?.ly !== 'hop_luyen') { changed = true; continue; }
      const random = room.random ?? Math.random;
      const success = job.chance >= 1 || random() < job.chance;
      if (success) {
        const before = g.loai;
        // Preserve primary identity, root status, mastery, XP and stars.
        g.loai = job.ra;
        g.nghi = null;
        g.buaToi = job.den + period(g);
        local.foodAt[g.uid] = job.den;
        h.vcl ??= {lh: []}; h.vcl.lh ??= [];
        if (!h.vcl.lh.includes(g.loai)) h.vcl.lh.push(g.loai);
        room.notify(`Hợp luyện thành công: ${name(before)} đã thành ${name(g.loai)}!`);
      } else {
        g.nghi = {ly: 'bi_thuong', den: job.den + job.injuryMs};
        room.notify('Hợp luyện thất bại: mất nguyên liệu phụ. Cổ chính bị thương.');
      }
      event('craft', {recipe: job.rc, uid: g.uid, id: g.loai, quantity: 1, success});
      changed = true;
    }
    return changed;
  }

  function professionCraft(p) {
    const r = get(data.bal?.nghe?.che_tao, p.ma), n = amount(p);
    if (!r || !validAmount(n) || !r.can || !r.ra) return fail('Công thức không hợp lệ.');
    const profession = h.nghe?.ds?.find(v => v.id === r.nghe);
    if (!profession || (profession.chinh ? profession.bac ?? 0 : 0) < (r.bac ?? 0)) return fail('Chưa đủ nghề để chế món này.');
    // Missing location data does not authorize crafting anywhere.
    if (!room.canInventoryCraft?.(p.ma, r)) return fail('Hãy tới đúng nơi chế tạo.');
    const items = {...h.tui};
    let nt = money('nguyenThach'), cn = player.cn;
    for (const [id, each] of Object.entries(r.can)) {
      if (!count(each) || !count(each * n)) return fail('Nguyên liệu không hợp lệ.');
      if (id === 'nt') nt -= each * n;
      else if (id === 'cn') cn -= each * n;
      else if (get(data.item, id) && count(items[id]) && items[id] >= each * n) {
        items[id] -= each * n; if (!items[id]) delete items[id];
      } else return fail('Thiếu nguyên liệu.');
    }
    if (nt < 0 || cn < 0) return fail('Thiếu nguyên thạch hoặc chân nguyên.');
    for (const [id, each] of Object.entries(r.ra)) {
      if (!count(each) || !count(each * n) || !get(data.item, id)) return fail('Đầu ra cần hệ thống nghề hoặc hộ cụ.');
      items[id] = (items[id] ?? 0) + each * n;
      if (!count(items[id])) return fail('Số lượng đầu ra không hợp lệ.');
    }
    if (!fits(items)) return fail('Túi đã đầy.');
    h.tui = items; h.nguyenThach = nt; player.cn = cn;
    event('craft', {recipe: p.ma, quantity: n, success: true, profession: r.nghe});
    return finish('Đã chế tạo.', 'craft');
  }

  function consume(p) {
    if (p.id !== 'item_cao_cam_mau' || !get(data.item, p.id)) return fail('Vật phẩm này chưa có tác dụng dùng trong bản độc lập.');
    if (own(p, 'so') && p.so !== 1 || !count(h.tui[p.id]) || player.hp <= 0 || player.hp >= player.hpMax || local.heal) return fail('Chưa thể dùng cao cầm máu lúc này.');
    setItem(p.id, h.tui[p.id] - 1);
    local.heal = {next: Date.now() + 1000, left: 5};
    event('consume', {id: p.id, quantity: 1});
    return finish('Đã dùng cao cầm máu: hồi 40 sinh lực trong 5 giây.');
  }

  function handle(type, p = {}) {
    const isItemUse = type === 'dung_do' || type === 'dung' && own(p, 'id') && !own(p, 'o');
    if (!['co', 'mua', 'ban', 'che', 'cua_hang', 'che_tao', 'mini', 'hop_luyen'].includes(type) && !isItemUse) return false;
    if (type === 'mini' && !local.refining && !local.craftMini) return false;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return fail('Lệnh không hợp lệ.');
    if (type === 'co') return guCommand(p);
    if (type === 'mini') return mini(p);
    if (isItemUse) return consume(p);
    if (type === 'mua') return buy(p);
    if (type === 'ban') return sell(p);
    if (type === 'che') return craft(p);
    if (type === 'cua_hang') {
      const requested = p.loai ?? p.npc ?? p.id;
      if (requested !== undefined) {
        const selected = get(shopAliases, requested) ?? requested;
        if (!shopTypes.has(selected)) return fail('Không có quầy hàng này.');
        shopType = selected;
      }
      shopOpen = true; room.emit(type, shop());
    }
    if (type === 'che_tao') {
      if (room.inventoryCraftPanel?.(p) === true) return true;
      craftOpen = true; room.emit(type, craftPanel());
    }
    if (type === 'hop_luyen') {
      if (p.hd === 'bat_dau') return craft({ma: p.id, uid: p.uid, so: 1});
      if (p.hd === 'dong') { synthesisOpen = false; return true; }
      if (p.hd !== undefined && p.hd !== 'xem') return false;
      synthesisOpen = true; room.emit(type, synthesisPanel());
    }
    return true;
  }

  function tick(now) {
    if (!finite(now)) return;
    let changed = tickRefining(now);
    changed = tickJobs(now) || changed;
    if (local.heal && now >= local.heal.next) {
      const steps = Math.min(local.heal.left, 1 + Math.floor((now - local.heal.next) / 1000));
      if (player.hp > 0) player.hp = Math.min(player.hpMax, player.hp + steps * 8);
      local.heal.left -= steps;
      local.heal.next += steps * 1000;
      if (!local.heal.left) local.heal = null;
      changed = true;
    }
    for (const g of [...h.co]) {
      if (['bi_thuong', 'hoi_sinh'].includes(g.nghi?.ly) && finite(g.nghi.den) && now >= g.nghi.den) {
        const recoveryAt = g.nghi.den;
        if (g.nghi.ly === 'hoi_sinh') {
          g.no = foodRule.an_dua_ve ?? 100;
          local.foodAt[g.uid] = recoveryAt;
          g.buaToi = recoveryAt + period(g);
          delete local.exhaustedAt[g.uid];
          if (g.banMenh) local.rootIllness = false;
          event('gu-revive', {uid: g.uid, id: g.loai, banMenh: !!g.banMenh});
        }
        g.nghi = null;
        changed = true;
      }
      if (g.nghi?.ly === 'xac' && now >= g.nghi.den) {
        unequipUid(g.uid); removeGu([g.uid]);
        event('gu-expire', {uid: g.uid, id: g.loai, banMenh: !!g.banMenh});
        room.notify('Xác ' + name(g.loai) + ' quá hạn, đã tan.');
        changed = true;
      }
    }
    changed = tickFood(now) || changed;
    if (changed) finish();
  }

  function living(g) {
    return g.luyenHoa && get(data.gu, g.loai)?.an && !['xac', 'hoi_sinh', 'hop_luyen', 'giai_luyen'].includes(g.nghi?.ly);
  }

  function decay(g, until) {
    const last = get(local.foodAt, g.uid) ?? until;
    if (until <= last || !living(g)) return false;
    const before = g.no ?? 100;
    const rate = (foodRule.giam_moi_chu_ky ?? 35) / period(g);
    g.no = Math.max(0, Math.min(foodRule.no_bung_toi_da ?? 100, before - (until - last) * rate));
    local.foodAt[g.uid] = until;
    if (before >= (foodRule.doi_nguong ?? 30) && g.no < (foodRule.doi_nguong ?? 30)) {
      room.notify(name(g.loai) + ' đói. Sức giảm.');
      event('gu-hungry', {uid: g.uid, id: g.loai});
    }
    if (g.no <= 0 && !finite(local.exhaustedAt[g.uid])) local.exhaustedAt[g.uid] = before > 0 && rate > 0 ? last + before / rate : last;
    const exhausted = get(local.exhaustedAt, g.uid);
    const protectedRoot = g.banMenh && (h.nam ?? room.progress?.year ?? 1) <= (foodRule.bao_ho_ban_menh_den_het_nam ?? 1);
    if (finite(exhausted) && until >= exhausted + (foodRule.kiet_suc_chet_sau_gio ?? 72) * HOUR && !protectedRoot) {
      const deadAt = exhausted + (foodRule.kiet_suc_chet_sau_gio ?? 72) * HOUR;
      g.nghi = {ly: 'xac', den: deadAt + (g.banMenh ? 7 : foodRule.xac_co_giu_ngay ?? 30) * DAY};
      unequipUid(g.uid);
      if (g.banMenh) local.rootIllness = true;
      room.notify(name(g.loai) + ' chết đói. Xác cổ tự phong, mang tới Cửu bà để cứu.');
      event('gu-death', {uid: g.uid, id: g.loai, banMenh: !!g.banMenh, at: deadAt});
      if (until >= g.nghi.den) {
        removeGu([g.uid]);
        event('gu-expire', {uid: g.uid, id: g.loai, banMenh: !!g.banMenh});
      }
    }
    return true;
  }

  function tickFood(now) {
    let changed = false;
    for (const g of h.co) {
      if (!living(g) || finite(get(local.foodAt, g.uid))) continue;
      local.foodAt[g.uid] = positive(g.buaToi) ? Math.min(now, g.buaToi - period(g)) : now;
      if (!positive(g.buaToi)) g.buaToi = now + period(g);
      changed = true;
    }
    // Process meals in time order across ALL Gu, so a large offline tick and
    // small online ticks compete for the same finite pantry in the same order.
    let turns = 0;
    while (turns++ < 10_000) {
      const due = h.co.filter(g => living(g) && finite(g.buaToi) && g.buaToi <= now)
        .sort((a, b) => a.buaToi - b.buaToi || Number(b.banMenh) - Number(a.banMenh) || a.uid.localeCompare(b.uid))[0];
      if (!due) break;
      const at = Math.max(due.buaToi, get(local.foodAt, due.uid) ?? due.buaToi);
      changed = decay(due, at) || changed;
      if (!living(due)) continue;
      const d = data.gu[due.loai], n = d.an.luong;
      const choices = Array.isArray(d.an.thuc_an) ? d.an.thuc_an : d.an.thuc_an ? [d.an.thuc_an] : [];
      const mon = choices.find(id => get(data.item, id) && (h.tui[id] ?? 0) >= n);
      if (positive(n) && foodRule.tu_lay_tu_kho !== false &&
        (choices.length ? mon : finite(player.cn) && player.cn >= n)) {
        if (mon) setItem(mon, h.tui[mon] - n);
        else player.cn -= n;
        fed(due, mon, at, true);
      } else due.buaToi = at + period(due);
      changed = true;
    }
    // If an extraordinary gap exceeds the bounded meal pass, keep the exact
    // unprocessed deadlines for the next tick; do not skip costs or cause death
    // past a meal that still has food waiting in the bag.
    for (const g of [...h.co]) {
      if (!living(g) || g.buaToi <= now || now - (get(local.foodAt, g.uid) ?? now) < 60_000) continue;
      changed = decay(g, now) || changed;
    }
    return changed;
  }

  function snapshot() {
    return structuredClone({co: h.co, o: h.o, obd: h.obd, opt: h.opt, tui: h.tui,
      nt: money('nguyenThach'), nguyenThach: money('nguyenThach'), ch: money('ch'),
      cn: player.cn, hp: player.hp, guInventory: local, cuaHang: shop(), cheTao: craftPanel(), hopLuyen: synthesisPanel()});
  }

  return {handle, tick, snapshot};
}
