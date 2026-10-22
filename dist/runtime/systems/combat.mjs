/**
 * Bounded, independent single-player combat reconstruction, NOT server formulas.
 * Sources: 22 Oct 377-Gu public catalog, generated official wiki, and readable
 * recovered-current/modules/bundle.js: yt/bt (CN), xt (strength), FX/protocol.
 * Read room.data at cast time, merging guGiacMo in inst_mo* rooms.
 * Public contract and intentional limits: see combat-notes.md beside this file.
 */
const finite = Number.isFinite;
const positive = n => finite(n) && n > 0;
const nonnegative = n => finite(n) && n >= 0;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const position = a => a && finite(a.x) && finite(a.y);
const alive = a => a && !a.chet && !a.trongThuong && positive(a.hp) && positive(a.hpMax);
const hostile = a => alive(a) && !a.combatOwner && ['thu', 'doi_thu', 'vat'].includes(a.loai);
const DOTS = new Set(['doc', 'bong', 'chay_mau']);
const HARM = new Set(['sat_thuong', ...DOTS, 'choang', 'cham', 'troi', 'mu', 'bang', 'no_bang', 'khieu_khich_quanh']);
const SELF = new Set(['giam_sat_thuong', 'khien', 'tra_mau', 'hoi_mau_duy_tri', 'bay', 'tang_hinh', 'phan_sat_thuong', 'khang_luu_phai', 'tang_luc_tam', 'di_chung_ban_than', 'luot', 'lo_an', 'nghe_dat', 'bien_than']);
const MAX_SLOTS = 64;
const MAX_EFFECTS = 64;
const MAX_SECONDS = 600;
const EPS = 1e-8;

export function createCombat(room) {
  const held = new Map();
  const statuses = new Map(); // object identity prevents effects leaking to respawns
  const dreamSpecs = new WeakMap();
  const leaves = new Map(); // Gu UID, never a movable hotbar position
  const companions = new Map();
  const passiveCooldowns = new Map();
  const computedCosts = new WeakMap();
  let clock = finite(room.state.now) ? room.state.now : Date.now();
  let lastTick = clock;
  let handCD = 0;
  let dirty = false;
  let mustSave = false;
  let zoneAt = room.zoneId ?? room.state.zoneId;
  let lastTarget = null;
  let profileAt = room.profile;
  const player = () => room.player;
  const profile = () => room.profile;
  const slots = () => profile().o || [];
  const balance = () => room.data.bal?.combat || {};
  const resolveGu = gu => {
    const base = room.data.gu?.[gu];
    const zone = room.zoneId ?? room.state.zoneId ?? '';
    const dream = zone === 'inst_mo_dau' || String(zone).startsWith('inst_mo_lai_') || zone === 'inst_mong_canh_loan_chien';
    const override = dream ? room.data.guGiacMo?.[gu] : null;
    if (!base || !override) return base;
    const cached = dreamSpecs.get(base);
    if (cached?.override === override) return cached.spec;
    const spec = {...base, ...override};
    dreamSpecs.set(base, {override, spec});
    return spec;
  };
  const id = a => a === player() ? room.sessionId || a.id : a.id;
  const fx = payload => room.emit('fx', payload);
  const touch = a => { dirty = true; room.changed(a); };
  const current = a => !!a && (a === player() || room.state.actors.get(a.id) === a);
  const friendly = a => alive(a) && (a === player() || a.loai === 'dong_hanh');
  const list = () => [player(), ...room.state.actors.values()];
  const seconds = n => positive(n) && n <= MAX_SECONDS;
  const tokens = a => new Set(String(a.hieuUng || '').split(',').filter(Boolean));
  const effects = a => statuses.get(a)?.effects || new Map();
  function restorePersistent() {
    leaves.clear(); passiveCooldowns.clear();
    const saved = profile().combatV3;
    if (saved?.version !== 3) return;
    for (const [uid, s] of Object.entries(saved.leaves || {}).slice(0, 4096)) {
      if (s && Number.isInteger(s.max) && s.max > 0 && s.max <= 64 && positive(s.interval) && Array.isArray(s.ready)) leaves.set(uid, {...s, ready: s.ready.filter(finite).slice(0, s.max)});
    }
    for (const [uid, deadline] of Object.entries(saved.deathPrevention || {}).slice(0, 4096)) if (finite(deadline)) passiveCooldowns.set(uid, deadline);
  }
  const ownedGu = slot => profile().co?.find(g => g.uid === slot?.uid && g.loai === slot?.loai);
  const resonances = () => Object.values(slots()).slice(0, MAX_SLOTS).flatMap(slot => {
    const g = ownedGu(slot);
    return g?.banMenh && g.luyenHoa !== false && !g.nghi && (!finite(g.no) || g.no > 0) ? (resolveGu(g.loai)?.cong_huong || []).map(e => ({...e, gu: g.loai})) : [];
  });
  const passives = () => [...new Set(profile().obd || [])].map(uid => profile().co?.find(g => g.uid === uid))
    .filter(g => g && g.luyenHoa !== false && !g.nghi && (!finite(g.no) || g.no >= (room.data.bal?.gu_food?.quy_tac?.doi_nguong ?? 30)))
    .flatMap(g => { const spec = resolveGu(g.loai); return spec?.kich_hoat === 'bi_dong' ? (spec.hu || []).map(e => ({...e, uid: g.uid, gu: g.loai})) : []; });
  // Actorstats owns final equipment/attribute totals. No armor-to-percent or
  // strength-to-damage formula is guessed here. A supplied snapshot replaces
  // the standalone school calculation, avoiding two applications of passives.
  const stats = (a, context) => room.getCombatStats?.(a, context) || (a === player() ? {
    damageMultiplier: 1 + (nonnegative(profile().hoCu?.da?.cs?.sat_thuong) ? profile().hoCu.da.cs.sat_thuong : 0),
    damageReduction: nonnegative(profile().hoCu?.da?.cs?.giam) ? profile().hoCu.da.cs.giam : 0,
  } : {});
  function getPassiveBonuses() {
    const attributes = {}, schoolMultipliers = {}, stacked = {};
    let speedBonus = 0;
    for (const e of passives()) {
      if (e.loai === 'doi_chi_so' && finite(e.gia_tri)) attributes[e.chi_so] = (attributes[e.chi_so] || 0) + e.gia_tri;
      if (e.loai === 'tang_toc_chay' && finite(e.gia_tri)) speedBonus = Math.max(speedBonus, e.gia_tri);
      if (e.loai === 'nhan_suc_luu_phai' && positive(e.he_so) && !e.den_chuyen) {
        if (e.cong_don) stacked[e.luu_phai] = (stacked[e.luu_phai] || 1) * e.he_so;
        else schoolMultipliers[e.luu_phai] = Math.max(schoolMultipliers[e.luu_phai] || 1, e.he_so);
      }
    }
    for (const [school, value] of Object.entries(stacked)) schoolMultipliers[school] = (schoolMultipliers[school] || 1) * value;
    // Attribute fractions are against realm BASE stats, not already-buffed HP.
    // The host owns application so refresh/actorstats cannot compound them.
    return {attributes, speedBonus, schoolMultipliers, effects: passives()};
  }
  function schoolPower(spec, slot) {
    const supplied = stats(player(), {gu: slot?.loai, spec}).schoolMultipliers;
    if (supplied) return positive(supplied[spec.luu_phai]) ? supplied[spec.luu_phai] : 1;
    let strongest = 1, stacked = 1;
    for (const e of passives()) if (e.loai === 'nhan_suc_luu_phai' && e.luu_phai === spec.luu_phai && positive(e.he_so) && (!e.den_chuyen || spec.chuyen <= e.den_chuyen)) {
      if (e.cong_don) stacked *= e.he_so;
      else strongest = Math.max(strongest, e.he_so);
    }
    return strongest * stacked;
  }
  function power(base, spec, slot, healing = false) {
    const g = ownedGu(slot);
    let value = base * (1 + (balance().thuan_thuc_moi_cap ?? .03) * clamp(g?.thuanThuc || 0, 0, 10));
    if (g?.banMenh) value *= 1 + (balance().ban_menh_tang_suc ?? .1);
    if (finite(g?.no) && g.no < (room.data.bal?.gu_food?.quy_tac?.doi_nguong ?? 30)) value *= 1 - (room.data.bal?.gu_food?.quy_tac?.doi_giam_suc ?? .2);
    const s = stats(player(), {gu: slot?.loai, spec});
    value *= schoolPower(spec, slot) * (healing ? s.healingMultiplier ?? 1 : s.damageMultiplier ?? 1);
    return nonnegative(value) ? value : 0;
  }
  const hidden = a => tokens(a).has('tang_hinh') && !tokens(a).has('danh_dau') && !tokens(a).has('lo_an');
  function breakConcealment(kinds = ['tang_hinh', 'bay']) {
    for (const [index, h] of [...held]) if (h.hu.some(e => kinds.includes(e.loai))) stop(index);
  }

  // Persisted toggles cannot restore ephemeral effects. The host should construct
  // one engine per room, rather than replacing it during ordinary refreshes.
  for (const slot of Object.values(slots())) if (slot && typeof slot === 'object') slot.bat = false;
  room.guard = false; // legacy indicator only; never use its old fixed 12% formula
  restorePersistent();

  function fail(reason, message, unsupported = []) {
    if (message) room.notify(message);
    return {ok: false, reason, unsupported};
  }

  function flush() {
    if (!dirty) return;
    if (leaves.size || passiveCooldowns.size || profile().combatV3) profile().combatV3 = {
      version: 3,
      leaves: Object.fromEntries([...leaves].map(([uid, s]) => [uid, {...s, ready: [...s.ready]}])),
      deathPrevention: Object.fromEntries(passiveCooldowns),
    };
    // refresh must precede save: Room.refresh copies HP/CN to the saved profile.
    room.refresh();
    if (mustSave) room.save();
    dirty = mustSave = false;
  }

  function publish(a) {
    const entry = statuses.get(a);
    if (!entry) return;
    const active = new Set([...entry.effects.values()].map(e => e.kind));
    const tags = tokens(a);
    for (const tag of entry.owned) if (!active.has(tag)) tags.delete(tag);
    for (const tag of active) {
      if (!tags.has(tag)) entry.owned.add(tag);
      tags.add(tag);
    }
    a.hieuUng = [...tags].join(',');
    // Scale speed while preserving speed changes made by another system.
    const slows = [...entry.effects.values()].filter(e => e.kind === 'cham');
    const flights = [...entry.effects.values()].filter(e => e.kind === 'bay');
    const factor = (1 - Math.max(0, ...slows.map(e => e.value))) * (1 + Math.max(0, ...flights.map(e => e.value)));
    if (entry.factor !== factor) {
      const speed = finite(a.tocDo) ? a.tocDo : 1;
      a.tocDo = speed / entry.factor * factor;
      entry.factor = factor;
    }
    if (a === player() && flights.length) {
      if (flights.length && !entry.flight) entry.flight = {canh: a.canh ?? '', physics: room.physics?.b, quaHo: room.physics?.b?.quaHo};
      a.canh = flights.sort((a, b) => b.value - a.value)[0].gu;
      if (room.physics?.b) room.physics.b.quaHo = true;
    } else if (!flights.length && entry.flight) {
      a.canh = entry.flight.canh;
      if (entry.flight.physics) entry.flight.physics.quaHo = entry.flight.quaHo;
      entry.flight = null;
    }
    a.combatStunUntil = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'choang').map(e => e.until));
    a.combatRootUntil = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'troi').map(e => e.until));
    a.combatShield = [...entry.effects.values()].filter(e => e.kind === 'khien').reduce((n, e) => n + e.value, 0);
    a.combatReduction = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'giam_sat_thuong').map(e => e.value));
    a.combatSpeedMultiplier = factor;
    a.combatStrength = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'tang_luc').map(e => e.value));
    a.combatIceStacks = [...entry.effects.values()].filter(e => e.kind === 'bang').reduce((n, e) => n + e.value, 0);
    a.combatBlindUntil = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'mu').map(e => e.until));
    a.combatRevealRadius = Math.max(0, ...[...entry.effects.values()].filter(e => ['lo_an', 'nghe_dat'].includes(e.kind)).map(e => e.value));
    const form = [...entry.effects.values()].find(e => e.kind === 'moc_mi');
    const hpFactor = 1 + (form?.spec.them_mau_ti_le || 0);
    if ((entry.hpFactor || 1) !== hpFactor) {
      const ratio = a.hp / a.hpMax;
      a.hpMax = a.hpMax / (entry.hpFactor || 1) * hpFactor;
      a.hp = Math.min(a.hpMax, a.hpMax * ratio);
      entry.hpFactor = hpFactor;
    }
    a.combatGuLocked = !!form?.spec.khoa_co_khac;
    if (!active.has('khieu_khich') && entry.taunt) { a.nham = entry.taunt.nham; entry.taunt = null; }
    touch(a);
    if (!entry.effects.size) statuses.delete(a);
  }

  function put(a, key, effect) {
    let entry = statuses.get(a);
    if (!entry) statuses.set(a, entry = {effects: new Map(), owned: new Set(), factor: 1});
    if (!entry.effects.has(key) && entry.effects.size >= MAX_EFFECTS) {
      room.notify('Đã đạt giới hạn hiệu ứng chiến đấu.');
      return;
    }
    if (effect.kind === 'khieu_khich' && !entry.taunt) entry.taunt = {nham: a.nham ?? ''};
    entry.effects.set(key, effect);
    publish(a);
  }

  function clear(a) {
    const entry = statuses.get(a);
    if (entry) { entry.effects.clear(); publish(a); }
  }

  function stop(index) {
    const h = held.get(index);
    if (!h) return;
    held.delete(index);
    h.slot.bat = false;
    for (const [a, entry] of statuses) {
      for (const [key, e] of entry.effects) if (e.held === h) entry.effects.delete(key);
      publish(a);
    }
    fx({k: 'duy_tri', id: id(player()), gu: h.gu, fx: h.spec.fx, bat: false});
    room.guard = [...held.values()].some(h => h.hu.some(e => e.loai === 'giam_sat_thuong'));
    dirty = mustSave = true;
  }

  function defeated(a, now, source, context = {}) {
    clear(a);
    if (a === player()) {
      for (const index of [...held.keys()]) stop(index);
      room.meditating = false;
      room.notify('Bị trọng thương. Dùng hồi sinh hoặc hồi phục để tiếp tục.');
    } else if (companions.has(a.combatPetUid)) {
      recall(a.combatPetUid, 'defeated');
    } else {
      a.aggro = 0;
      a.nextHit = 0;
      if (room.combatOwnsBeasts !== false && !a.noReward) a.respawn = now + (nonnegative(a.respawnMs) ? a.respawnMs : 18000);
      // A host callback owns progression AND rewards; never increment kills in
      // addition to that callback. The fallback preserves the standalone room.
      if (typeof room.onKill === 'function') room.onKill(a, {source, now, ...context});
      else if (a.loai === 'thu' && !a.noReward) {
        room.progress ||= {};
        room.progress.kills = (room.progress.kills || 0) + 1;
      }
    }
    fx({k: 'chet', id: id(a)});
    mustSave = true;
    touch(a);
  }

  function reduction(a, now, school) {
    const n = stats(a).damageReduction;
    const base = finite(n) ? clamp(n, 0, 1) : 0;
    const temporary = Math.max(0, ...[...effects(a).values()].filter(e => e.kind === 'giam_sat_thuong' && e.until > now).map(e => e.value));
    const resistance = Math.max(0, ...[...effects(a).values()].filter(e => e.kind === 'khang_luu_phai' && e.school === school && e.until > now).map(e => e.value));
    return 1 - (1 - base) * (1 - temporary) * (1 - resistance);
  }

  function damage(a, amount, now, source, loai = 'dmg', mitigation = true, context = {}) {
    if (!current(a) || !alive(a) || (a !== player() && !hostile(a) && !companions.has(a.combatPetUid)) || !positive(amount)) return 0;
    if (a === player() && mitigation && loai !== 'dot') {
      const dodge = Math.max(0, ...resonances().filter(e => e.loai === 'ne_don' && positive(e.ti_le) && e.ti_le <= 1).map(e => e.ti_le));
      if (dodge > 0 && (room.random?.() ?? Math.random()) < dodge) return 0;
    }
    if (a === player() && mitigation && loai !== 'dot') breakConcealment(['bay']);
    if (mitigation) {
      amount *= 1 - reduction(a, now, context.school);
      for (const [key, e] of effects(a)) {
        if (e.kind !== 'khien' || e.until <= now) continue;
        const absorbed = Math.min(e.value, amount);
        e.value -= absorbed;
        amount -= absorbed;
        if (e.value <= EPS) effects(a).delete(key);
        if (!amount) break;
      }
      publish(a);
    }
    // Published death-prevention values, without introducing a crit/dodge roll.
    if (a === player() && mitigation && amount >= a.hp) {
      const rescue = passives().find(e => e.loai === 'bao_mang' && positive(e.mau_con) && positive(e.hoi_s) && (passiveCooldowns.get(e.uid) || 0) <= now);
      if (rescue) {
        amount = Math.max(0, a.hp - Math.min(a.hpMax, rescue.mau_con));
        passiveCooldowns.set(rescue.uid, now + rescue.hoi_s * 1000);
      }
    }
    const floor = a.storyDummy ? Math.min(1, a.hp) : 0;
    const dealt = Math.max(0, Math.min(a.hp - floor, amount));
    a.hp = Math.max(0, a.hp - dealt);
    if (a !== player() && hostile(a) && !a.storyDummy) a.aggro = now + 6000;
    if (dealt > 0) fx({k: 'so', id: id(a), tu: source, v: dealt, loai});
    touch(a);
    if (a === player() && mitigation && (dealt > 0 || loai !== 'dot') && typeof room.progression?.onEvent === 'function') {
      room.progression.onEvent('damage', {amount: dealt, source, now});
      mustSave = true; // progression may save while cancelling absorption
    }
    // Snapshot reflection before lethal cleanup; it reflects received HP damage,
    // never shield absorption, DOT, self costs, or another reflection.
    const reflect = a === player() && mitigation && loai !== 'dot' && !context.reflected
      ? [...effects(a).values()].filter(e => e.kind === 'phan_sat_thuong' && e.until > now).map(e => e.spec).concat(passives().filter(e => e.loai === 'phan_sat_thuong')) : [];
    if (a.hp <= 0) defeated(a, now, source, context);
    if (dealt > 0 && source === id(player()) && a !== player()) breakConcealment();
    if (dealt > 0 && mitigation && loai !== 'dot') {
      const attacker = typeof source === 'string' ? room.state.actors.get(source) : null;
      if (a === player() && hostile(attacker)) for (const e of resonances()) if (e.loai === 'khieu_khich_khi_trung' && seconds(e.s)) {
        put(attacker, `resonance:${e.gu}:taunt`, {kind: 'khieu_khich', value: 0, until: now + e.s * 1000, source: id(player())});
        attacker.aggro = Math.max(attacker.aggro || 0, now + e.s * 1000);
        attacker.nham = id(player());
      }
      const ratios = reflect.filter(e => positive(e.ti_le) && position(attacker) && distance(a, attacker) <= e.tam).map(e => e.ti_le);
      if (ratios.length && hostile(attacker)) damage(attacker, dealt * Math.max(...ratios), now, id(a), 'dmg', true, {reflected: true});
    }
    return dealt;
  }

  function heal(a, amount, source) {
    if (!current(a) || !friendly(a) || !positive(amount)) return;
    const value = Math.max(0, Math.min(amount, a.hpMax - a.hp));
    a.hp += value;
    if (value > 0) fx({k: 'so', id: id(a), tu: source, v: value, loai: 'hoi'});
    touch(a);
  }

  function supported(e, mode) {
    if (!e || typeof e.loai !== 'string') return false;
    switch (e.loai) {
      case 'sat_thuong': return mode !== 'duy_tri' && positive(e.goc);
      case 'hoi_mau': return mode !== 'duy_tri' && positive(e.goc) && (!e.so_la || (Number.isInteger(e.so_la) && e.so_la > 0 && e.so_la <= 64 && seconds(e.hoi_la_s)));
      case 'khien': return mode !== 'duy_tri' && positive(e.ti_le_mau) && e.ti_le_mau <= 1 && seconds(e.s);
      case 'giam_sat_thuong': return nonnegative(e.gia_tri) && e.gia_tri <= 1 && (mode === 'duy_tri' || seconds(e.s));
      case 'choang': case 'troi': case 'mu': return mode !== 'duy_tri' && seconds(e.s);
      case 'cham': return mode !== 'duy_tri' && seconds(e.s) && positive(e.gia_tri) && e.gia_tri < 1;
      case 'doc': case 'bong': case 'chay_mau': return mode !== 'duy_tri' && seconds(e.s) && positive(e.moi_s);
      case 'giai_hieu_ung': return mode !== 'duy_tri' && Number.isInteger(e.so) && e.so > 0;
      case 'tra_mau': case 'hut_mau': return mode !== 'duy_tri' && positive(e.ti_le) && e.ti_le <= 1;
      case 'hoi_mau_dan': return mode !== 'duy_tri' && seconds(e.s) && seconds(e.nhip_s) && e.nhip_s <= e.s && positive(e.ti_le_mau) && e.ti_le_mau <= 1;
      case 'hoi_mau_duy_tri': return mode === 'duy_tri' && positive(e.ti_le_moi_s) && e.ti_le_moi_s <= 1;
      case 'bay': return mode === 'duy_tri' && nonnegative(e.toc);
      case 'tang_hinh': return mode === 'duy_tri' && ['than', 'toan_than'].includes(e.muc);
      case 'phan_sat_thuong': return mode === 'duy_tri' && positive(e.ti_le) && e.ti_le <= 1 && positive(e.tam);
      case 'khang_luu_phai': return mode === 'duy_tri' && typeof e.luu_phai === 'string' && nonnegative(e.gia_tri) && e.gia_tri <= 1;
      case 'tang_luc_tam': return mode !== 'duy_tri' && positive(e.luc) && seconds(e.s);
      case 'di_chung_ban_than': return mode !== 'duy_tri' && e.hieu_ung === 'cham' && positive(e.gia_tri) && e.gia_tri < 1 && seconds(e.s);
      case 'luot': return mode !== 'duy_tri' && positive(e.m) && e.m <= 100 && seconds(e.thoi_gian_s);
      case 'lo_an': return (mode === 'duy_tri' || seconds(e.s)) && positive(e.ban_kinh);
      case 'nghe_dat': return mode === 'duy_tri' && positive(e.ban_kinh);
      case 'danh_dau': return seconds(e.s) && Number.isInteger(e.so_muc_tieu) && e.so_muc_tieu > 0 && e.so_muc_tieu <= 64;
      case 'khieu_khich_quanh': return mode !== 'duy_tri' && positive(e.r) && seconds(e.s);
      case 'bang': return mode !== 'duy_tri' && Number.isInteger(e.tang) && e.tang > 0 && e.tang <= 64;
      case 'no_bang': return mode !== 'duy_tri' && positive(e.moi_tang);
      case 'bien_than': return mode !== 'duy_tri' && seconds(e.s) && nonnegative(e.them_mau_ti_le) && e.them_mau_ti_le <= 1 && positive(e.sat_thuong_can_chien) && positive(e.tam_m) && seconds(e.hoi_chieu_don_s);
      default: return false;
    }
  }

  function cost(spec, slot) {
    // Slot cost is the host's computed actual amount, including rank modifiers.
    if (nonnegative(slot.cn) && computedCosts.get(slot) !== slot.cn) return slot.cn;
    const value = computeCost(spec, slot);
    computedCosts.set(slot, value);
    return value;
  }

  function computeCost(spec, slot) {
    if (!nonnegative(spec.cn) || !['diem', 'ti_le_toi_da'].includes(spec.cn_theo)) return null;
    const owned = ownedGu(slot);
    const proficiency = clamp(owned?.thuanThuc || 0, 0, 10);
    const reduction = profile().ghiDe ? 1 : Math.max(0, 1 - (room.data.bal?.cultivation?.thuan_thuc?.giam_cn_moi_cap ?? .03) * proficiency);
    if (spec.cn_theo === 'ti_le_toi_da') return spec.cn * player().cnMax * reduction;
    if (profile().ghiDe) return spec.cn;
    const rank = Math.max(1, profile().tv?.chuyen ?? profile().chuyen ?? player().chuyen ?? 1);
    const delta = rank - (spec.chuyen || 1);
    const b = balance();
    if (-delta > (b.co_cao_chuyen?.toi_da_vuot ?? 1)) return null;
    const factor = delta < 0 ? b.co_cao_chuyen?.cn_he_so ?? 2 : delta === 0 ? 1 : delta === 1 ? b.co_thap_chuyen_cn?.thap_1 ?? .6 : b.co_thap_chuyen_cn?.thap_2 ?? .35;
    return spec.cn * factor * (spec.kich_hoat === 'duy_tri' ? 1 : reduction);
  }

  function select(p, spec, harmful) {
    const me = player(), v = spec.vung || {hinh: 'ban_than'};
    const valid = harmful ? hostile : friendly;
    const candidates = list().filter(a => current(a) && valid(a) && position(a) && (!harmful || !hidden(a)) && room.canCombatTarget?.(me, a) !== false);
    const explicit = p.muc !== undefined && p.muc !== null && p.muc !== '';
    let chosen = explicit ? (p.muc === id(me) ? me : room.state.actors.get(p.muc)) : null;
    const shape = v.hinh;
    // Self buffs are deliberately independent of whichever monster is selected.
    if (shape === 'ban_than') return harmful ? {error: 'vung.ban_than'} : {targets: [me], v};
    // The recovered client includes its selected/auto-aimed monster even when
    // casting a heal. Self-centred healing ignores that aiming context; targeted
    // healing interprets a living hostile selection as self, never as an ally.
    if (!harmful && ['tron_quanh', 'tieu_to'].includes(shape)) {
      if (!positive(v.r)) return {error: 'vung.r'};
      return {targets: candidates.filter(a => distance(me, a) <= v.r + EPS), v, center: me};
    }
    if (!harmful && shape === 'muc_tieu' && chosen && current(chosen) && hostile(chosen)) chosen = me;
    if (explicit && (!chosen || !current(chosen) || !valid(chosen) || !position(chosen))) return {error: 'target'};
    if (shape === 'muc_tieu' || shape === 'dan') {
      if (!positive(v.tam)) return {error: 'vung.tam'};
      if (harmful && chosen && (!candidates.includes(chosen))) return {error: 'target'};
      if (harmful && !chosen && tokens(me).has('mu')) return {error: 'blind'};
      const angle = (finite(me.huong) ? me.huong : 2) * Math.PI / 4;
      const target = chosen || (harmful ? candidates.filter(a => (a.x - me.x) * Math.cos(angle) + (a.y - me.y) * Math.sin(angle) >= -EPS).sort((a, b) => distance(me, a) - distance(me, b))[0] : me);
      if (!target || distance(me, target) > v.tam + EPS) return {error: 'range'};
      return {targets: [target], v};
    }
    if (['tron_quanh', 'tieu_to'].includes(shape)) {
      if (!positive(v.r)) return {error: 'vung.r'};
      return {targets: candidates.filter(a => distance(me, a) <= v.r + EPS), v, center: me};
    }
    if (!['tron_tai_diem', 'non', 'duong'].includes(shape) || !positive(v.tam)) return {error: 'vung.' + shape};
    const suppliedPoint = p.x !== undefined || p.y !== undefined;
    if (suppliedPoint && (!finite(p.x) || !finite(p.y))) return {error: 'point'};
    let aim = suppliedPoint ? {x: p.x, y: p.y} : chosen;
    if (!aim && shape === 'tron_tai_diem') return {error: 'point'};
    if (!aim) {
      const angle = (finite(me.huong) ? me.huong : 2) * Math.PI / 4;
      aim = {x: me.x + Math.cos(angle), y: me.y + Math.sin(angle)};
    }
    const length = distance(me, aim);
    if (shape === 'tron_tai_diem') {
      if (!positive(v.r)) return {error: 'vung.r'};
      if (length > v.tam + EPS) return {error: 'range'};
      return {targets: candidates.filter(a => distance(aim, a) <= v.r + EPS), v, center: aim};
    }
    // A far cursor supplies direction, not extra reach, for cones and lines.
    if (length <= EPS) return {error: 'direction'};
    const dx = (aim.x - me.x) / length, dy = (aim.y - me.y) / length;
    if (shape === 'non' && !(positive(v.goc) && v.goc <= 360)) return {error: 'vung.goc'};
    // The recovered renderer defaults omitted line widths to one metre.
    const width = v.rong ?? 1;
    if (shape === 'duong' && !positive(width)) return {error: 'vung.rong'};
    const targets = candidates.filter(a => {
      const x = a.x - me.x, y = a.y - me.y, d = Math.hypot(x, y);
      if (shape === 'non') return d <= v.tam + EPS && (d <= EPS || (x * dx + y * dy) / d >= Math.cos(v.goc * Math.PI / 360) - EPS);
      const along = x * dx + y * dy;
      return along >= -EPS && along <= v.tam + EPS && Math.abs(x * dy - y * dx) <= width / 2 + EPS;
    });
    return {targets, v: {...v, rong: width}, center: me, dx, dy};
  }

  function leafState(slot, e, now) {
    const uid = slot.uid;
    if (!uid) return null;
    let state = leaves.get(uid);
    if (!state || state.gu !== slot.loai || state.max !== e.so_la || state.interval !== e.hoi_la_s * 1000) {
      leaves.set(uid, state = {gu: slot.loai, max: e.so_la, interval: e.hoi_la_s * 1000, ready: []});
    }
    state.ready = state.ready.filter(t => t > now);
    const count = state.max - state.ready.length;
    if (slot.la !== count) dirty = true;
    slot.la = count;
    return state;
  }

  function destination(p, e) {
    const me = player(), target = room.state.actors.get(p.muc);
    const aim = finite(p.x) && finite(p.y) ? p : position(target) ? target : null;
    const angle = aim ? Math.atan2(aim.y - me.y, aim.x - me.x) : (finite(me.huong) ? me.huong : 2) * Math.PI / 4;
    const length = aim ? Math.min(e.m, distance(me, aim)) : e.m;
    if (!positive(length)) return null;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let travel = length;
    if (!e.xuyen_thu) for (const a of room.state.actors.values()) {
      if (!hostile(a) || !position(a)) continue;
      const x = a.x - me.x, y = a.y - me.y, along = x * dx + y * dy, across = x * dy - y * dx;
      if (along > 0 && Math.abs(across) < .7) travel = Math.min(travel, Math.max(0, along - Math.sqrt(.49 - across * across)));
    }
    const zone = room.data.zones?.[room.zoneId ?? room.state.zoneId];
    let to = {x: me.x + dx * travel, y: me.y + dy * travel};
    if (positive(zone?.rong)) to.x = clamp(to.x, .35, zone.rong - .35);
    if (positive(zone?.cao)) to.y = clamp(to.y, .35, zone.cao - .35);
    if (room.resolveCombatMove) to = room.resolveCombatMove(me, {from: {x: me.x, y: me.y}, to, effect: e});
    return position(to) && distance(me, to) > EPS && distance(me, to) <= e.m + EPS ? {x: to.x, y: to.y} : null;
  }

  function scan(gu, spec, hu, index, now, hold) {
    const me = player();
    const radius = Math.max(0, ...hu.filter(e => ['lo_an', 'nghe_dat'].includes(e.loai)).map(e => e.ban_kinh));
    const warmOnly = hu.some(e => e.loai === 'lo_an' && e.chi_sinh_vat_nong);
    const candidates = [...room.state.actors.values()].filter(a => current(a) && hostile(a) && position(a) && distance(me, a) <= (radius || spec.vung?.r || spec.vung?.tam || 0) && (!warmOnly || room.isWarmCreature?.(a) === true));
    candidates.sort((a, b) => distance(me, a) - distance(me, b));
    for (const [i, e] of hu.entries()) {
      if (e.loai === 'lo_an') for (const a of candidates.filter(a => distance(me, a) <= e.ban_kinh)) {
        // Reveal lasts only while the detector is present/in range. Do not
        // remove another system's stealth; target validation observes the tag.
        put(a, `${index}:${gu}:reveal:${i}`, {kind: 'lo_an', value: 0, until: now + (hold ? 1000 : e.s * 1000), held: hold});
      }
      if (e.loai === 'danh_dau') for (const a of candidates.slice(0, e.so_muc_tieu)) {
        put(a, `${index}:${gu}:mark:${i}`, {kind: 'danh_dau', value: 0, until: now + e.s * 1000});
      }
    }
  }

  function recall(uid, reason = 'recalled') {
    const entry = companions.get(uid);
    if (!entry) return false;
    companions.delete(uid);
    clear(entry.actor);
    if (current(entry.actor)) {
      if (room.removeActor) room.removeActor(entry.actor.id);
      else room.state.actors.delete(entry.actor.id);
    }
    entry.pet.ra = entry.pet.theo = false;
    if (entry.pet.aid === entry.actor.id) entry.pet.aid = null;
    if (reason === 'defeated') {
      entry.pet.combatDefeated = true;
      room.onCompanionDefeated?.(entry.pet, entry.actor, {now: clock});
    }
    dirty = mustSave = true;
    return true;
  }

  function companionCommand(p, now) {
    if (typeof p.uid !== 'string' || !['goi', 'cat'].includes(p.hd)) return fail('payload', 'Lệnh thú nhà không hợp lệ.');
    const roster = profile().thuNha;
    const pet = roster?.ds?.find(a => a.uid === p.uid);
    if (!pet) return fail('companion', 'Không có thú nhà này.');
    if (p.hd === 'cat') return recall(p.uid) ? {ok: true, gu: null, uid: p.uid, summoned: false, unsupported: []} : fail('companion', 'Thú chưa được gọi.');
    if (!alive(player()) || pet.nghiLenh || pet.hoiMs > 0 || pet.combatDefeated) return fail('unavailable', 'Thú đang dưỡng thương hoặc không nghe lệnh.');
    if (companions.has(p.uid) || pet.ra || pet.theo) return fail('summoned', 'Thú đã đi theo.');
    // The roster cap and actor stats must be supplied, never inferred from rank.
    const active = roster.ds.filter(a => a.ra || a.theo).length;
    if (!Number.isInteger(roster.theoToiDa) || active >= Math.min(64, roster.theoToiDa)) return fail('limit', 'Đã đủ thú đi theo.');
    if (!room.createCompanion) return fail('unsupported', 'Cần dữ liệu chiến đấu thú nhà từ phòng.', ['companion.stats']);
    const a = room.createCompanion(pet, {now, owner: id(player()), x: player().x, y: player().y});
    if (!a || typeof a.id !== 'string' || room.state.actors.has(a.id) || a.id === id(player()) || !position(a) || !positive(a.hp) || !positive(a.hpMax) || a.hp > a.hpMax) return fail('data', 'Dữ liệu thú nhà không hợp lệ.');
    Object.assign(a, {loai: 'dong_hanh', combatOwner: id(player()), combatPetUid: pet.uid});
    companions.set(p.uid, {pet, actor: a});
    pet.ra = pet.theo = true; pet.aid = a.id;
    if (room.addActor) room.addActor(a);
    else room.state.actors.set(a.id, a);
    dirty = mustSave = true;
    return {ok: true, gu: null, uid: p.uid, summoned: true, targets: [a.id], unsupported: []};
  }

  function tickCompanions(now, elapsed, canAct) {
    for (const [uid, {pet, actor: a}] of [...companions]) {
      if (!current(a) || !alive(player()) || !profile().thuNha?.ds?.includes(pet) || !pet.ra || pet.nghiLenh) { recall(uid); continue; }
      if (!alive(a)) { recall(uid, 'defeated'); continue; }
      if (!canAct || room.combatOwnsCompanions === false || (room.combatOwnsCompanions !== true && room.combatOwnsBeasts === false) || tokens(a).has('choang')) continue;
      const target = current(lastTarget) && hostile(lastTarget) && !hidden(lastTarget) ? lastTarget : null;
      const aim = target || player(), d = distance(a, aim), s = stats(a);
      const range = s.attackRange ?? a.tam;
      const speed = s.moveSpeed ?? a.tocDo;
      if (d > (target && positive(range) ? range : 2)) {
        if (!tokens(a).has('troi') && positive(speed)) {
          const step = Math.min(d - (target && positive(range) ? range : 2), speed * elapsed);
          a.x += (aim.x - a.x) / d * step; a.y += (aim.y - a.y) / d * step; touch(a);
        }
      } else if (target && positive(range) && !tokens(a).has('phong_khieu') && now >= (a.nextHit || 0)) {
        const amount = s.attackDamage ?? a.cong, cooldown = s.attackCooldownMs ?? a.attackCooldownMs;
        if (positive(amount) && positive(cooldown)) {
          a.nextHit = now + cooldown;
          damage(target, amount, now, a.id, 'dmg', true, {owner: id(player()), companion: uid});
        }
      }
    }
  }

  function castFX(gu, spec, selection, harmful) {
    const common = {tu: id(player()), gu, fx: spec.fx};
    const {v, center, dx, dy, targets} = selection;
    if (['tron_quanh', 'tieu_to'].includes(v.hinh)) fx({...common, k: 'vong', x: center.x, y: center.y, r: v.r});
    else if (['tron_tai_diem', 'non', 'duong'].includes(v.hinh)) fx({...common, k: 'vung', ...v, x: center.x, y: center.y, dx: dx ?? 0, dy: dy ?? 0});
    else for (const a of targets) fx({...common, k: harmful ? 'trung' : 'buff', id: id(a)});
  }

  function apply(gu, spec, hu, selection, index, now, hold) {
    const source = id(player());
    const slot = slots()[index];
    const dealt = new Map();
    for (const [i, e] of hu.entries()) {
      const kind = e.loai;
      const targets = SELF.has(kind) ? [player()] : kind === 'danh_dau' ? selection.targets.slice(0, e.so_muc_tieu) : selection.targets;
      for (const a of targets) {
        if (!alive(a)) continue;
        const key = `${index}:${gu}:${i}`;
        const until = hold ? Infinity : now + (e.s || 0) * 1000;
        if (kind === 'sat_thuong') dealt.set(a, (dealt.get(a) || 0) + damage(a, power(e.goc, spec, slot), now, source, 'dmg', true, {gu, school: spec.luu_phai}));
        else if (kind === 'hoi_mau') {
          const bonus = ownedGu(slot)?.banMenh && a === player() ? Math.max(0, ...(spec.cong_huong || []).filter(e => e.loai === 'hoi_them_ban_than' && nonnegative(e.ti_le)).map(e => e.ti_le)) : 0;
          heal(a, power(e.goc, spec, slot, true) * (a === player() ? 1 + bonus : e.hoi_dong_minh ?? 1), source);
        }
        else if (['khien', 'giam_sat_thuong', 'choang', 'troi', 'cham', 'bay', 'tang_hinh', 'phan_sat_thuong', 'khang_luu_phai', 'mu', 'tang_luc_tam', 'di_chung_ban_than', 'bien_than', 'danh_dau', 'lo_an', 'nghe_dat'].includes(kind)) {
          if (kind === 'danh_dau' && !hostile(a)) continue;
          const value = kind === 'khien' ? a.hpMax * e.ti_le_mau : kind === 'bay' ? e.toc : kind === 'tang_luc_tam' ? e.luc : ['lo_an', 'nghe_dat'].includes(kind) ? e.ban_kinh : e.gia_tri || 0;
          const tag = kind === 'tang_luc_tam' ? 'tang_luc' : kind === 'di_chung_ban_than' ? e.hieu_ung : kind === 'bien_than' ? 'moc_mi' : kind;
          put(a, key, {kind: tag, value, until: kind === 'danh_dau' ? now + e.s * 1000 : until, held: kind === 'danh_dau' ? undefined : hold, gu, spec: e, school: e.luu_phai});
          fx({k: 'buff', id: id(a), tu: source, gu, fx: spec.fx, s: e.s || 0, ma: kind});
          if (kind === 'khien') fx({k: 'so', id: id(a), tu: source, v: value, loai: 'khien'});
        } else if (kind === 'bang') {
          const stacks = Math.min(64, a.combatIceStacks || 0);
          // No observed stack lifetime, slow-per-stack or freeze duration:
          // retain bounded stacks for detonation/cleanse, never fabricate rates.
          for (const [k, status] of effects(a)) if (status.kind === 'bang') effects(a).delete(k);
          put(a, key, {kind: 'bang', value: Math.min(64, stacks + e.tang), until: Infinity});
        } else if (kind === 'no_bang') {
          const count = a.combatIceStacks || 0;
          for (const [k, status] of effects(a)) if (status.kind === 'bang') effects(a).delete(k);
          publish(a);
          damage(a, power(e.moi_tang * count, spec, slot), now, source, 'dmg', true, {gu, school: spec.luu_phai});
        } else if (kind === 'luot') {
          const to = selection.destination;
          fx({k: 'luot', id: source, gu, x: a.x, y: a.y, ms: e.thoi_gian_s * 1000});
          if (typeof room.teleport === 'function') room.teleport(to.x, to.y);
          else {
            a.x = to.x; a.y = to.y;
            if (room.physics?.state) Object.assign(room.physics.state, to);
            room.emit('dich', {...to, mo: true});
          }
          touch(a);
        } else if (kind === 'khieu_khich_quanh') {
          a.aggro = Math.max(a.aggro || 0, until);
          put(a, key, {kind: 'khieu_khich', value: 0, until, source});
          a.nham = source;
        } else if (DOTS.has(kind) || kind === 'hoi_mau_dan') {
          const interval = (e.nhip_s || 1) * 1000;
          const value = DOTS.has(kind) ? power(e.moi_s, spec, slot) : a.hpMax * e.ti_le_mau / Math.floor(e.s / (interval / 1000));
          put(a, key, {kind: kind === 'hoi_mau_dan' ? 'hoi' : kind, value, until, next: now + interval, interval, source, gu, school: spec.luu_phai});
          if (DOTS.has(kind)) a.aggro = now + 6000;
        } else if (kind === 'giai_hieu_ung') {
          let left = e.so;
          for (const [key, status] of effects(a)) {
            if ((HARM.has(status.kind) || ['khieu_khich', 'phong_khieu', 'hoang', 'ngu'].includes(status.kind)) && left-- > 0) effects(a).delete(key);
          }
          publish(a);
        }
      }
    }
    // Side costs and lifesteal happen once per cast, irrespective of AoE count.
    for (const e of hu) {
      if (e.loai === 'tra_mau') damage(player(), player().hpMax * e.ti_le, now, source, 'dot', false);
      if (e.loai === 'hut_mau') heal(player(), [...dealt.values()].reduce((a, b) => a + b, 0) * e.ti_le, source);
    }
    if (hu.some(e => ['lo_an', 'nghe_dat'].includes(e.loai))) scan(gu, spec, hu, index, now, hold);
  }

  function advance(now) {
    if (!finite(now) || now < clock) return false;
    const elapsedSeconds = (now - clock) / 1000;
    clock = now;
    if (profile() !== profileAt) {
      for (const index of [...held.keys()]) stop(index);
      for (const a of [...statuses.keys()]) clear(a);
      for (const uid of [...companions.keys()]) recall(uid);
      profileAt = profile(); restorePersistent(); lastTarget = null;
    }
    const zone = room.zoneId ?? room.state.zoneId;
    if (zone !== zoneAt) {
      for (const index of [...held.keys()]) stop(index);
      for (const a of [...statuses.keys()]) clear(a);
      for (const uid of [...companions.keys()]) recall(uid);
      zoneAt = zone;
    }
    for (const [index, h] of [...held]) {
      const g = ownedGu(h.slot);
      if (slots()[index] !== h.slot || h.slot.loai !== h.gu || h.slot.uid !== h.uid || !h.slot.bat || !alive(player()) || resolveGu(h.gu) !== h.spec || g?.nghi || (finite(g?.no) && g.no <= 0)) stop(index);
    }
    // Charge elapsed CN rather than charging once per timer callback. Process
    // all held costs together so the strongest first entry gets no free uptime.
    const active = [...held.values()];
    const total = active.reduce((n, h) => n + h.cost, 0);
    const since = active.length ? Math.min(...active.map(h => h.last)) : now;
    const elapsed = Math.max(0, now - since) / 1000;
    const paidSeconds = total > 0 ? Math.min(elapsed, Math.max(0, player().cn) / total) : elapsed;
    if (active.length) {
      player().cn = Math.max(0, player().cn - total * paidSeconds);
      for (const h of active) {
        for (const e of h.hu) if (e.loai === 'hoi_mau_duy_tri') heal(player(), player().hpMax * e.ti_le_moi_s * paidSeconds, id(player()));
        h.last = now;
      }
      if (elapsed > 0) dirty = true;
      if (total > 0 && player().cn <= EPS) for (const index of [...held.keys()]) stop(index);
    }
    for (const [index, h] of held) {
      if (h.hu.some(e => ['lo_an', 'nghe_dat'].includes(e.loai))) scan(h.gu, h.spec, h.hu, index, now, h);
    }
    const regen = Math.max(0, ...resonances().filter(e => e.loai === 'hoi_trong_tran' && positive(e.ti_le) && e.ti_le <= 1).map(e => e.ti_le));
    if (alive(player()) && regen && elapsedSeconds > 0) heal(player(), player().hpMax * regen * elapsedSeconds, id(player()));
    for (const [uid] of leaves) if (!profile().co?.some(g => g.uid === uid)) leaves.delete(uid);
    for (const [uid] of passiveCooldowns) if (!profile().co?.some(g => g.uid === uid)) passiveCooldowns.delete(uid);
    for (const slot of Object.values(slots())) {
      const e = resolveGu(slot?.loai)?.hu?.find(e => e.loai === 'hoi_mau' && e.so_la);
      if (e && supported(e, 'tuc_thoi') && leaves.has(slot.uid)) leafState(slot, e, now);
    }
    for (const [a, entry] of [...statuses]) {
      if (!current(a) || !alive(a)) { clear(a); continue; }
      for (const [key, e] of [...entry.effects]) {
        // Aggregate missed DOT/HoT pulses into one bounded operation per effect.
        if (e.next && e.next <= Math.min(now, e.until)) {
          const count = Math.floor((Math.min(now, e.until) - e.next) / e.interval) + 1;
          e.next += count * e.interval;
          if (e.kind === 'hoi') heal(a, e.value * count, e.source);
          else damage(a, e.value * count, now, e.source, 'dot', true, {gu: e.gu, school: e.school});
          if (!alive(a)) break;
        }
        if (e.until <= now) entry.effects.delete(key);
      }
      if (statuses.has(a)) publish(a);
    }
    return true;
  }

  function attack(p = {}, type = 'dung') {
    if (!advance(Math.max(clock, Date.now()))) return fail('clock');
    const now = clock;
    const finish = result => {
      if (result.ok) {
        room.onCombatAction?.({type, p, gu: result.gu ?? null, ...result});
        dirty = mustSave = true;
      }
      flush();
      return result;
    };
    if (!p || typeof p !== 'object') return finish(fail('payload', 'Lệnh chiến đấu không hợp lệ.'));
    if (type === 'thu_nha') return finish(companionCommand(p, now));
    if (type === 'sat_chieu') {
      const km = Number.isInteger(p.o) ? profile().satChieuO?.[p.o] : null;
      const spec = room.data.killer?.[km];
      if (spec && !profile().ghiDe) {
        const equipped = new Set([...Object.values(slots()).map(s => s?.uid), ...(profile().obd || []), ...(profile().opt || [])].filter(Boolean));
        const gu = (profile().co || []).filter(g => equipped.has(g.uid) && g.luyenHoa !== false && !g.nghi && (!finite(g.no) || g.no > 0));
        const has = part => typeof part === 'string' ? part === 'thu_danh_cung' ? [...room.state.actors.values()].some(a => alive(a) && (a.combatOwner === id(player()) || a.loai === 'dong_hanh')) : part.startsWith('ban_menh_') ? gu.some(g => g.banMenh && [...(resolveGu(g.loai)?.nhan || []), ...(resolveGu(g.loai)?.nhom || [])].includes(part.slice(9))) : gu.some(g => g.loai === part) : part?.mot_trong?.some(has);
        if (!(spec.thanh_phan || []).every(has)) return finish(fail('components', 'Cần lắp đủ cổ thành phần sát chiêu.'));
        if (profile().satChieuKhoa?.[km]) return finish(fail('locked', String(profile().satChieuKhoa[km])));
      }
      return finish(fail('unsupported', spec ? `${room.label(spec.ten_key, km)}: chưa hỗ trợ sát chiêu; dữ liệu công khai thiếu công thức hiệu ứng/CN.` : 'Ô sát chiêu chưa có kỹ năng hợp lệ.', ['killer.' + (km || 'empty')]));
    }
    if (type !== 'dung') return finish(fail('type', 'Lệnh chiến đấu không hợp lệ.'));
    const index = p.o;
    // Turning a held skill off must work even while stunned or on cooldown.
    if (Number.isInteger(index) && held.has(index)) { const gu = held.get(index).gu; stop(index); return finish({ok: true, gu, bat: false, unsupported: []}); }
    if ((p.x !== undefined || p.y !== undefined) && (!finite(p.x) || !finite(p.y))) return finish(fail('point', 'Tọa độ chiến đấu không hợp lệ.'));
    if (!alive(player()) || !position(player())) return finish(fail('dead', 'Không thể chiến đấu khi trọng thương.'));
    if (tokens(player()).has('choang')) return finish(fail('stun', 'Đang choáng, không thể dùng kỹ năng.'));
    if (tokens(player()).has('phong_khieu')) return finish(fail('sealed', 'Đang phong khiếu.'));
    if (index === 'tay') {
      const b = balance().don_tay || {};
      if (b.bat === false) return finish(fail('unsupported', 'Đòn tay chưa được bật.'));
      if (now < handCD) return finish(fail('cooldown'));
      const form = [...effects(player()).values()].find(e => e.kind === 'moc_mi')?.spec;
      const s = stats(player());
      const range = form?.tam_m ?? s.attackRange ?? (b.tam_m ?? 1.5) + (b.noi_tam_m ?? .3);
      const selection = select(p, {vung: {hinh: 'muc_tieu', tam: range}}, true);
      if (selection.error) return finish(fail(selection.error, 'Mục tiêu đòn tay không hợp lệ hoặc ngoài tầm.'));
      const rank = clamp(Math.floor(profile().tv?.chuyen ?? profile().chuyen ?? player().chuyen ?? 1), 0, 5);
      if (rank === 0 && !form && !nonnegative(s.attackDamage) && !nonnegative(b.goc?.chuyen_0)) return finish(fail('unsupported', 'Chưa có chỉ số đòn tay phàm nhân từ phòng.', ['don_tay.chuyen_0']));
      const handBase = (b.goc?.['chuyen_' + rank] ?? 6.5) + (!room.getCombatStats && nonnegative(profile().hoCu?.tong?.cong) ? profile().hoCu.tong.cong : 0);
      const amount = (form?.sat_thuong_can_chien ?? s.attackDamage ?? handBase) * (s.damageMultiplier ?? 1);
      handCD = now + (form ? form.hoi_chieu_don_s * 1000 : s.attackCooldownMs ?? (b.hoi_chieu_s ?? 1.2) * 1000);
      room.meditating = false;
      player().dong = 'melee'; player().dongSeq = (player().dongSeq || 0) + 1;
      touch(player());
      castFX('tay', {}, selection, true);
      breakConcealment(['bay']);
      lastTarget = selection.targets[0];
      damage(selection.targets[0], amount, now, id(player()));
      if (alive(selection.targets[0])) for (const e of resonances()) if (e.loai === 'tay_danh_dau' && seconds(e.s)) put(selection.targets[0], `resonance:${e.gu}:mark`, {kind: 'danh_dau', value: 0, until: now + e.s * 1000});
      return finish({ok: true, gu: 'tay', cd: handCD, targets: selection.targets.map(id), unsupported: []});
    }
    if (!Number.isInteger(index) || index < 0 || index >= MAX_SLOTS || !Object.hasOwn(slots(), index)) return finish(fail('slot', 'Ô cổ không hợp lệ.'));
    const slot = slots()[index], gu = slot?.loai, spec = resolveGu(gu);
    if (!spec) return finish(fail('slot', 'Ô này chưa lắp cổ trùng hợp lệ.'));
    const owned = ownedGu(slot);
    if (owned && (owned.luyenHoa === false || owned.nghi || (finite(owned.no) && owned.no <= 0))) return finish(fail('unavailable', 'Cổ chưa luyện hóa, đang nghỉ hoặc kiệt sức.'));
    if (player().combatGuLocked && !spec.hu?.some(e => ['hoi_mau', 'hoi_mau_dan', 'hoi_mau_duy_tri', 'giai_hieu_ung'].includes(e.loai))) return finish(fail('transformed', 'Đang biến thân, chỉ dùng được cổ trị.'));
    const unsupported = [];
    const synergy = owned?.banMenh ? spec.cong_huong || [] : [];
    const implementedSynergies = new Set(['hoi_them_ban_than', 'hoi_trong_tran', 'khieu_khich_khi_trung', 'ne_don', 'tay_danh_dau', 'bong_keo_dai', 'danh_dau_keo_dai']);
    const hu = (Array.isArray(spec.hu) ? spec.hu : []).slice(0, MAX_EFFECTS).map(e => {
      if (!e || typeof e !== 'object') return e;
      const extension = synergy.filter(s => (e.loai === 'bong' && s.loai === 'bong_keo_dai') || (e.loai === 'danh_dau' && s.loai === 'danh_dau_keo_dai')).reduce((n, s) => n + (seconds(s.s) ? s.s : 0), 0);
      return extension ? {...e, s: e.s + extension} : e;
    }).filter(e => {
      if (supported(e, spec.kich_hoat)) return true;
      unsupported.push(e?.loai || 'hu'); return false;
    });
    for (const e of hu) {
      if (e.theo_luc) unsupported.push(e.loai + '.theo_luc');
      if (e.xuyen && spec.vung?.hinh !== 'duong') unsupported.push(e.loai + '.xuyen');
      if (e.chi_sinh_vat_nong && !room.isWarmCreature) unsupported.push(e.loai + '.chi_sinh_vat_nong');
    }
    // Resonances apply only to the actual bản mệnh, never every equipped Gu.
    for (const e of synergy) if (!implementedSynergies.has(e.loai)) unsupported.push('cong_huong.' + e.loai);
    if (hu.some(e => e.loai === 'bang')) unsupported.push('bang.slow_freeze_duration');
    if (!['tuc_thoi', 'duy_tri'].includes(spec.kich_hoat)) unsupported.push('kich_hoat.' + spec.kich_hoat);
    if (spec.hu?.length > MAX_EFFECTS) unsupported.push('hu.limit');
    if (!hu.length || !['tuc_thoi', 'duy_tri'].includes(spec.kich_hoat)) return finish(fail('unsupported', `${room.label(spec.ten_key, gu)}: chưa hỗ trợ ${unsupported.join(', ') || 'hiệu ứng'}.`, unsupported));
    if (!nonnegative(spec.hoi_chieu)) return finish(fail('data', 'Dữ liệu hồi chiêu không hợp lệ.'));
    const cn = cost(spec, slot);
    if (!nonnegative(cn)) return finish(fail('cost', 'Không có chi phí chân nguyên hợp lệ hoặc cổ vượt quá chuyển cho phép.'));
    slot.cn = cn; slot.cnGiay = spec.kich_hoat === 'duy_tri'; slot.cdMax = spec.hoi_chieu * 1000;
    dirty = true;
    if (finite(slot.cd) && now < slot.cd) return finish(fail('cooldown'));
    if (!finite(player().cn) || player().cn + EPS < cn) return finish(fail('cn', 'Không đủ chân nguyên: cần ' + cn + (slot.cnGiay ? '/giây.' : '.')));
    const leaf = hu.find(e => e.loai === 'hoi_mau' && e.so_la);
    const charges = leaf ? leafState(slot, leaf, now) : null;
    if (leaf && !charges) return finish(fail('data', 'Thiếu định danh cổ có lá.'));
    if (charges && charges.ready.length >= charges.max) return finish(fail('charges', 'Cổ chưa mọc lại lá.'));
    const dash = hu.find(e => e.loai === 'luot');
    if (dash && tokens(player()).has('troi')) return finish(fail('root', 'Đang bị trói.'));
    const to = dash ? destination(p, dash) : null;
    if (dash && !to) return finish(fail('movement', 'Không thể lướt tới vị trí này.'));
    const harmful = hu.some(e => HARM.has(e.loai));
    const taunt = hu.find(e => e.loai === 'khieu_khich_quanh');
    const scouting = !harmful && hu.some(e => ['lo_an', 'nghe_dat'].includes(e.loai));
    const selection = select(p, taunt ? {...spec, vung: {hinh: 'tron_quanh', r: taunt.r}} : scouting ? {vung: {hinh: 'ban_than'}} : spec, harmful);
    selection.destination = to;
    if (selection.error || !selection.targets.length) return finish(fail(selection.error || 'target', 'Mục tiêu hoặc vị trí không hợp lệ / ngoài tầm.'));
    if (harmful) lastTarget = selection.targets[0];
    if (harmful) breakConcealment(['bay']);
    slot.cd = now + slot.cdMax;
    if (charges) { charges.ready.push(now + charges.interval); slot.la = charges.max - charges.ready.length; }
    room.meditating = false;
    if (unsupported.length) room.notify(`${room.label(spec.ten_key, gu)}: chưa hỗ trợ ${unsupported.join(', ')}; chỉ áp dụng hiệu ứng đã hỗ trợ.`);
    if (slot.cnGiay) {
      const h = {gu, uid: slot.uid, spec, hu, slot, cost: cn, last: now};
      held.set(index, h); slot.bat = true;
      apply(gu, spec, hu, selection, index, now, h);
      room.guard = [...held.values()].some(h => h.hu.some(e => e.loai === 'giam_sat_thuong'));
      fx({k: 'duy_tri', id: id(player()), gu, fx: spec.fx, bat: true});
    } else {
      player().cn = Math.max(0, player().cn - cn);
      slot.bat = false;
      castFX(gu, spec, selection, harmful);
      apply(gu, spec, hu, selection, index, now);
    }
    touch(player());
    mustSave = true;
    return finish({ok: true, gu, cd: slot.cd, cn, bat: slot.bat, targets: selection.targets.map(id), unsupported});
  }

  function tick(now) {
    if (!advance(now)) return;
    const elapsed = clamp(now - lastTick, 0, 1000) / 1000;
    const canAct = now > lastTick;
    lastTick = now;
    tickCompanions(now, elapsed, canAct);
    if (room.combatOwnsBeasts === false) { flush(); return; }
    for (const a of room.state.actors.values()) {
      if (a.loai !== 'thu' || a.storyDummy) continue;
      if (a.hp <= 0 && positive(a.respawn) && now >= a.respawn) {
        clear(a); a.hp = a.hpMax; a.respawn = 0; a.aggro = 0; a.nextHit = 0;
        if (finite(a.sx)) a.x = a.sx;
        if (finite(a.sy)) a.y = a.sy;
        touch(a);
        continue;
      }
      if (!canAct || !hostile(a) || !alive(player()) || !position(a) || !position(player()) || !(a.aggro > now) || tokens(a).has('choang') || tokens(a).has('ngu')) continue;
      // The wiki establishes very-close detection, but does not give its range.
      // A host may supply that range; absent it, stealth suppresses acquisition.
      const s = stats(a);
      if (hidden(player()) && !(nonnegative(s.stealthDetectionRange) && distance(a, player()) <= s.stealthDetectionRange)) continue;
      const d = distance(a, player());
      const reach = positive(s.attackRange) ? s.attackRange : positive(a.tam) ? a.tam : 1.4;
      if (d > reach) {
        if (tokens(a).has('troi')) continue;
        if (tokens(a).has('mu')) continue; // no automatic target acquisition
        const speed = nonnegative(s.moveSpeed) ? s.moveSpeed : 1.4 * (nonnegative(a.tocDo) ? a.tocDo : 1);
        const step = Math.min(d - reach, speed * elapsed);
        a.x += (player().x - a.x) / d * step;
        a.y += (player().y - a.y) / d * step;
        a.dong = 'walk'; touch(a);
      } else if (!tokens(a).has('phong_khieu') && now >= (a.nextHit || 0)) {
        a.nextHit = now + (positive(s.attackCooldownMs) ? s.attackCooldownMs : positive(a.attackCooldownMs) ? a.attackCooldownMs : 1400);
        damage(player(), positive(s.attackDamage) ? s.attackDamage : nonnegative(a.cong) ? a.cong : 8, now, a.id, 'nhan');
      }
    }
    flush();
  }

  function getDamageReduction(school) {
    const now = Math.max(clock, Date.now());
    return reduction(player(), now, school);
  }

  // Hosts with their own enemy loop should use this so shields, lethal cleanup,
  // FX and profile updates share the same path. Do not also subtract HP outside.
  function receiveDamage(amount, source, now = Date.now()) {
    if (!nonnegative(amount) || !advance(now)) return 0;
    const dealt = damage(player(), amount, now, typeof source === 'object' ? source?.id : source, source?.damageType === 'dot' ? 'dot' : 'nhan', true, {school: typeof source === 'object' ? source?.school : undefined});
    flush();
    return dealt;
  }

  function receiveActorDamage(actor, amount, source, now = Date.now()) {
    if (!nonnegative(amount) || !current(actor) || !advance(now)) return 0;
    const dealt = damage(actor, amount, now, typeof source === 'object' ? source?.id : source, source?.damageType === 'dot' ? 'dot' : 'nhan', true, {school: typeof source === 'object' ? source?.school : undefined});
    flush();
    return dealt;
  }

  return {attack, tick, getDamageReduction, receiveDamage, receiveActorDamage, getPassiveBonuses};
}
