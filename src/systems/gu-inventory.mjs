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
 * Local policy where no rule was recovered: refinement succeeds immediately
 * for 20 NT + 10 CN per Gu rank; NPC resale prices are economy.gia_mua_npc,
 * local purchase prices are twice those prices. Clan Gu use published CH prices
 * in the same generic shop, without weekly limits. Cao cầm máu heals 40 over 5s.
 * Recipes use data.recipe inputs/CN, complete immediately and always succeed;
 * they are exposed through the simple che_tao UI, not the separate hop_luyen
 * minigame. No profession recipes are fabricated when their definitions are
 * absent. Ban-menh recipes, Gu death/rescue, automatic feeding, advanced Gu
 * actions and medicine effects other than cao_cam_mau remain unimplemented.
 */

const HOUR = 3_600_000;
const own = (o, k) => Object.hasOwn(o ?? {}, k);
const get = (o, k) => typeof k === 'string' && own(o, k) ? o[k] : undefined;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const positive = n => finite(n) && n > 0;
const count = n => Number.isSafeInteger(n) && n > 0;
const emptySlot = () => ({uid: null, loai: null, cd: 0, cdMax: 0, cn: 0, cnGiay: false, bat: false});

export function attachGuInventory(room) {
  const {data, profile: h, player} = room;
  h.co ??= [];
  h.o ??= [];
  h.obd ??= [];
  h.opt ??= [];
  h.tui ??= {};
  // Stored inside the existing profile so save/restore needs no runtime changes.
  const local = h.guInventory ??= {version: 1, nextUid: 1, foodAt: {}, heal: null};
  local.foodAt ??= {};
  let shopOpen = false;
  let craftOpen = false;
  const spec = id => get(data.gu, id) ?? get(data.item, id);
  const guByUid = uid => typeof uid === 'string' ? h.co.find(g => g.uid === uid) : undefined;
  const name = id => room.label(spec(id)?.ten_key ?? id, id);
  const fail = text => { room.notify(text); return true; };
  const amount = p => p.so === undefined ? 1 : p.so;
  const validAmount = n => count(n) && n <= 999;
  const money = key => h[key] ?? (key === 'nguyenThach' ? h.nt ?? 0 : 0);
  const rank = () => Math.max(1, h.chuyen ?? h.tv?.chuyen ?? 1);
  const allowedRank = g => (get(data.gu, g.loai)?.chuyen ?? Infinity) <= rank() + (data.bal?.combat?.co_cao_chuyen?.toi_da_vuot ?? 0);
  const foodRule = data.bal?.gu_food?.quy_tac ?? {};
  const period = g => Math.max(1, get(data.gu, g.loai)?.an?.chu_ky_gio ?? 24) * HOUR;
  const nowAtAttach = Date.now();
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
    return !g.banMenh && !g.thuongNv && !g.nghi && !equipped(g.uid);
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
      if (spec(id) && !spec(id).khoa && positive(price)) rows.set(id, {id, ten: name(id), gia: price * 2, tien: 'nt'});
    }
    for (const [id, price] of Object.entries(data.bal?.economy?.kho_toc?.gia ?? {})) {
      if (get(data.gu, id) && !data.gu[id].khoa && positive(price) && !rows.has(id)) rows.set(id, {id, ten: name(id), gia: price, tien: 'ch'});
    }
    return rows;
  }

  function shop() {
    const prices = data.bal?.economy?.gia_mua_npc ?? {};
    const sellable = new Map(Object.entries(h.tui).filter(([id, n]) => get(data.item, id) && count(n)));
    for (const g of h.co.filter(available)) sellable.set(g.loai, (sellable.get(g.loai) ?? 0) + 1);
    const ban = [], khongThu = [];
    for (const [id, co] of sellable) {
      const gia = get(prices, id);
      (positive(gia) ? ban : khongThu).push({id, ten: name(id), co, ...(positive(gia) ? {gia} : {})});
    }
    return {ten: 'Chợ độc hành', loai: 'doc_hanh', mua: [...stock().values()], ban, khongThu};
  }

  function recipe(id) {
    const r = get(data.recipe, id);
    if (!r || !get(data.gu, r.chinh) || !get(data.gu, r.ra) || !Array.isArray(r.phu) || !finite(r.cn) || r.cn < 0) return null;
    const can = new Map([[r.chinh, 1]]);
    for (const p of r.phu) {
      if (!spec(p.id) || !count(p.so)) return null;
      can.set(p.id, (can.get(p.id) ?? 0) + p.so);
    }
    return {r, can};
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
        khoa: r.ban_menh ? 'Cổ phương bản mệnh cần hệ thống hợp luyện riêng.' :
          !allowedRank({loai: r.ra}) ? 'Cảnh giới chưa đủ để chế cổ này.' : ''});
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
      if (!g.luyenHoa || g.nghi || !allowedRank(g) || g.no <= 0) return fail('Cổ chưa sẵn sàng: hãy luyện hóa, cho ăn hoặc kiểm tra cảnh giới.');
      if ((old?.banMenh && old.uid !== g.uid) || (g.banMenh && (p.biDong || p.phuTro || i !== 0))) return fail('Ô bản mệnh được giữ ở ô chính.');
      if (!p.phuTro && !!p.biDong !== (d.kich_hoat === 'bi_dong')) return fail('Cổ không phù hợp ô hoạt động/bị động.');
      if (p.phuTro && (g.banMenh || d.kich_hoat === 'bi_dong' || d.kich_hoat === 'dung_mot_lan')) return fail('Cổ không phù hợp ô phụ trợ.');
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
      return finish('Đã lắp ' + name(g.loai) + '.');
    }
    const g = guByUid(p[action]), d = g && get(data.gu, g.loai);
    if (!g || !d) return fail('Không tìm thấy cổ.');
    if (g.nghi) return fail('Cổ đang nghỉ hoặc bị thương.');
    if (action === 'luyen') {
      if (g.luyenHoa) return true;
      if (!allowedRank(g)) return fail('Cảnh giới chưa đủ để luyện hóa cổ.');
      const nt = 20 * (d.chuyen ?? 1), cn = 10 * (d.chuyen ?? 1);
      if (money('nguyenThach') < nt || player.cn < cn) return fail(`Luyện hóa cần ${nt} nguyên thạch và ${cn} chân nguyên.`);
      h.nguyenThach = money('nguyenThach') - nt;
      player.cn -= cn;
      g.luyenHoa = true;
      local.foodAt[g.uid] = Date.now();
      g.buaToi = Date.now() + period(g);
      if (h.vcl?.lh && !h.vcl.lh.includes(g.loai)) h.vcl.lh.push(g.loai);
      return finish('Luyện hóa thành công ' + name(g.loai) + ' (quy tắc chơi đơn).');
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
      if (p.mon !== undefined || player.cn < n) return fail(`Cổ cần ${n} chân nguyên để ăn.`);
      player.cn -= n;
    }
    const rare = get(data.bal?.gu_food?.thuc_an_quy, mon);
    g.no = foodRule.an_dua_ve ?? 100;
    const meals = rare?.bua ?? 1;
    local.foodAt[g.uid] = Date.now() + (meals - 1) * period(g);
    g.buaToi = Date.now() + meals * period(g);
    // Rare food XP follows published values; full mastery progression is main's.
    if (rare?.xp) g.xp = (g.xp ?? 0) + rare.xp;
    room.emit('co_an_xong', {uid: g.uid, no: g.no});
    return finish(name(g.loai) + ' đã ăn no.');
  }

  function buy(p) {
    const n = amount(p), row = stock().get(p.id);
    if (!validAmount(n) || !row) return fail('Mặt hàng hoặc số lượng mua không hợp lệ.');
    const key = row.tien === 'ch' ? 'ch' : 'nguyenThach', cost = row.gia * n;
    if (!positive(cost) || money(key) < cost) return fail('Không đủ tiền mua hàng.');
    if (!get(data.gu, p.id)) {
      const result = (h.tui[p.id] ?? 0) + n;
      if (!Number.isSafeInteger(result) || !fits({...h.tui, [p.id]: result})) return fail('Túi đã đầy.');
      setItem(p.id, result);
    } else {
      for (let i = 0; i < n; i++) addGu(p.id);
    }
    h[key] = money(key) - cost;
    return finish(`Đã mua ${name(p.id)} ×${n}.`, 'shop');
  }

  function sell(p) {
    const n = amount(p), price = get(data.bal?.economy?.gia_mua_npc, p.id);
    if (!validAmount(n) || !spec(p.id) || !positive(price)) return fail('Mặt hàng hoặc số lượng bán không hợp lệ.');
    if (!finite(money('nguyenThach') + n * price)) return fail('Số tiền không hợp lệ.');
    if (get(data.gu, p.id)) {
      const candidates = h.co.filter(g => g.loai === p.id && available(g)).sort((a, b) => Number(a.luyenHoa) - Number(b.luyenHoa));
      if (candidates.length < n) return fail('Không đủ cổ có thể bán; hãy tháo cổ và giữ lại bản mệnh.');
      removeGu(candidates.slice(0, n).map(g => g.uid));
    } else {
      if ((h.tui[p.id] ?? 0) < n) return fail('Không đủ vật phẩm để bán.');
      setItem(p.id, h.tui[p.id] - n);
    }
    h.nguyenThach = money('nguyenThach') + n * price;
    return finish(`Đã bán ${name(p.id)} ×${n}.`, 'shop');
  }

  function craft(p) {
    const n = amount(p), def = recipe(p.ma);
    if (!validAmount(n) || !def) return fail('Cổ phương hoặc số lượng không hợp lệ.');
    const {r, can} = def;
    if (r.ban_menh || !allowedRank({loai: r.ra})) return fail('Chưa thể dùng cổ phương này trong bản độc lập.');
    if (player.cn < r.cn * n) return fail('Không đủ chân nguyên để chế cổ.');
    const consumed = [], items = {...h.tui}, primary = [];
    for (const [id, each] of can) {
      const needed = each * n;
      if (!count(needed) || ingredientCount(id) < needed) return fail('Thiếu nguyên liệu: ' + name(id) + '.');
      if (get(data.gu, id)) {
        const candidates = h.co.filter(g => g.loai === id && available(g));
        consumed.push(...candidates.slice(0, needed).map(g => g.uid));
        if (id === r.chinh) primary.push(...candidates.slice(0, n));
      } else {
        items[id] -= needed;
        if (items[id] === 0) delete items[id];
      }
    }
    // Commit only after every cost has been checked, including repeated Gu IDs.
    h.tui = items;
    player.cn -= r.cn * n;
    removeGu(consumed);
    for (let i = 0; i < n; i++) addGu(r.ra, primary[i]?.luyenHoa ?? false);
    return finish(`Chế thành công ${name(r.ra)} ×${n} (quy tắc chơi đơn).`, 'craft');
  }

  function consume(p) {
    if (p.id !== 'item_cao_cam_mau' || !get(data.item, p.id)) return fail('Vật phẩm này chưa có tác dụng dùng trong bản độc lập.');
    if (own(p, 'so') && p.so !== 1 || !count(h.tui[p.id]) || player.hp <= 0 || player.hp >= player.hpMax || local.heal) return fail('Chưa thể dùng cao cầm máu lúc này.');
    setItem(p.id, h.tui[p.id] - 1);
    local.heal = {next: Date.now() + 1000, left: 5};
    return finish('Đã dùng cao cầm máu: hồi 40 sinh lực trong 5 giây.');
  }

  function handle(type, p = {}) {
    const isItemUse = type === 'dung_do' || type === 'dung' && own(p, 'id') && !own(p, 'o');
    if (!['co', 'mua', 'ban', 'che', 'cua_hang', 'che_tao'].includes(type) && !isItemUse) return false;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return fail('Lệnh không hợp lệ.');
    if (type === 'co') return guCommand(p);
    if (isItemUse) return consume(p);
    if (type === 'mua') return buy(p);
    if (type === 'ban') return sell(p);
    if (type === 'che') return craft(p);
    if (type === 'cua_hang') { shopOpen = true; room.emit(type, shop()); }
    if (type === 'che_tao') { craftOpen = true; room.emit(type, craftPanel()); }
    return true;
  }

  function tick(now) {
    if (!finite(now)) return;
    let changed = false;
    if (local.heal && now >= local.heal.next) {
      const steps = Math.min(local.heal.left, 1 + Math.floor((now - local.heal.next) / 1000));
      if (player.hp > 0) player.hp = Math.min(player.hpMax, player.hp + steps * 8);
      local.heal.left -= steps;
      local.heal.next += steps * 1000;
      if (!local.heal.left) local.heal = null;
      changed = true;
    }
    for (const g of h.co) {
      if (!g.luyenHoa || !get(data.gu, g.loai)?.an || g.nghi) continue;
      const last = get(local.foodAt, g.uid) ?? now;
      if (now - last < 60_000) continue;
      const drop = foodRule.giam_moi_chu_ky ?? 35;
      g.no = Math.max(0, Math.min(foodRule.no_bung_toi_da ?? 100, (g.no ?? 100) - (now - last) / period(g) * drop));
      local.foodAt[g.uid] = now;
      changed = true;
    }
    if (changed) finish();
  }

  function snapshot() {
    return structuredClone({co: h.co, o: h.o, obd: h.obd, opt: h.opt, tui: h.tui,
      nt: money('nguyenThach'), nguyenThach: money('nguyenThach'), ch: money('ch'),
      cn: player.cn, hp: player.hp, guInventory: local, cuaHang: shop(), cheTao: craftPanel()});
  }

  return {handle, tick, snapshot};
}
