/**
 * Bounded, independent single-player combat reconstruction, NOT server formulas.
 * Sources: 22 Oct live-game.json (gu.hu/vung, killer, bal.combat) and the readable
 * recovered-current/modules/bundle.js: yt/bt (CN), hand reach, fx handlers.
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
const hostile = a => alive(a) && ['thu', 'doi_thu', 'vat'].includes(a.loai);
const DOTS = new Set(['doc', 'bong', 'chay_mau']);
const HARM = new Set(['sat_thuong', ...DOTS, 'choang', 'cham', 'troi']);
const SELF = new Set(['giam_sat_thuong', 'khien', 'tra_mau', 'hoi_mau_duy_tri', 'bay']);
const MAX_SLOTS = 64;
const MAX_EFFECTS = 64;
const MAX_SECONDS = 600;
const EPS = 1e-8;

export function createCombat(room) {
  const held = new Map();
  const statuses = new Map(); // object identity prevents effects leaking to respawns
  const dreamSpecs = new WeakMap();
  let clock = finite(room.state.now) ? room.state.now : Date.now();
  let lastTick = clock;
  let handCD = 0;
  let dirty = false;
  let mustSave = false;
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
  const current = a => a === player() || room.state.actors.get(a.id) === a;
  const friendly = a => alive(a) && (a === player() || a.loai === 'dong_hanh');
  const list = () => [player(), ...room.state.actors.values()];
  const seconds = n => positive(n) && n <= MAX_SECONDS;
  const tokens = a => new Set(String(a.hieuUng || '').split(',').filter(Boolean));
  const effects = a => statuses.get(a)?.effects || new Map();

  // Persisted toggles cannot restore ephemeral effects. The host should construct
  // one engine per room, rather than replacing it during ordinary refreshes.
  for (const slot of Object.values(slots())) if (slot && typeof slot === 'object') slot.bat = false;
  room.guard = false; // legacy indicator only; never use its old fixed 12% formula

  function fail(reason, message, unsupported = []) {
    if (message) room.notify(message);
    return {ok: false, reason, unsupported};
  }

  function flush() {
    if (!dirty) return;
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
    if (a === player()) {
      if (flights.length && !entry.flight) entry.flight = {canh: a.canh ?? '', physics: room.physics?.b, quaHo: room.physics?.b?.quaHo};
      if (flights.length) {
        a.canh = flights.sort((a, b) => b.value - a.value)[0].gu;
        if (room.physics?.b) room.physics.b.quaHo = true;
      } else if (entry.flight) {
        a.canh = entry.flight.canh;
        if (entry.flight.physics) entry.flight.physics.quaHo = entry.flight.quaHo;
        entry.flight = null;
      }
    }
    a.combatStunUntil = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'choang').map(e => e.until));
    a.combatRootUntil = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'troi').map(e => e.until));
    a.combatShield = [...entry.effects.values()].filter(e => e.kind === 'khien').reduce((n, e) => n + e.value, 0);
    a.combatReduction = Math.max(0, ...[...entry.effects.values()].filter(e => e.kind === 'giam_sat_thuong').map(e => e.value));
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

  function defeated(a, now) {
    clear(a);
    if (a === player()) {
      for (const index of [...held.keys()]) stop(index);
      room.meditating = false;
      room.notify('Bị trọng thương. Dùng hồi sinh hoặc hồi phục để tiếp tục.');
    } else {
      a.aggro = 0;
      a.nextHit = 0;
      a.respawn = now + 18000;
      // A host callback owns progression AND rewards; never increment kills in
      // addition to that callback. The fallback preserves the standalone room.
      if (typeof room.onKill === 'function') room.onKill(a);
      else if (a.loai === 'thu') {
        room.progress.kills = (room.progress.kills || 0) + 1;
        profile().nguyenThach = (profile().nguyenThach || 0) + 12;
        profile().tui ||= {};
        profile().tui.item_thit_thu = (profile().tui.item_thit_thu || 0) + 1;
        room.notify('Hạ ' + (a.ten || a.id) + ' · +12 nguyên thạch · +1 thịt thú');
      }
    }
    fx({k: 'chet', id: id(a)});
    mustSave = true;
    touch(a);
  }

  function damage(a, amount, now, source, loai = 'dmg', mitigation = true) {
    if (!current(a) || !alive(a) || (a !== player() && !hostile(a)) || !positive(amount)) return 0;
    if (mitigation) {
      const reduction = Math.max(0, ...[...effects(a).values()].filter(e => e.kind === 'giam_sat_thuong' && e.until > now).map(e => e.value));
      amount *= 1 - reduction;
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
    const dealt = Math.min(a.hp, amount);
    a.hp = Math.max(0, a.hp - dealt);
    if (a !== player()) a.aggro = now + 6000;
    if (dealt > 0) fx({k: 'so', id: id(a), tu: source, v: dealt, loai});
    touch(a);
    if (a.hp <= 0) defeated(a, now);
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
      case 'hoi_mau': return mode !== 'duy_tri' && positive(e.goc) && !e.so_la;
      case 'khien': return mode !== 'duy_tri' && positive(e.ti_le_mau) && e.ti_le_mau <= 1 && seconds(e.s);
      case 'giam_sat_thuong': return nonnegative(e.gia_tri) && e.gia_tri <= 1 && (mode === 'duy_tri' || seconds(e.s));
      case 'choang': case 'troi': return mode !== 'duy_tri' && seconds(e.s);
      case 'cham': return mode !== 'duy_tri' && seconds(e.s) && positive(e.gia_tri) && e.gia_tri < 1;
      case 'doc': case 'bong': case 'chay_mau': return mode !== 'duy_tri' && seconds(e.s) && positive(e.moi_s);
      case 'giai_hieu_ung': return mode !== 'duy_tri' && Number.isInteger(e.so) && e.so > 0;
      case 'tra_mau': case 'hut_mau': return mode !== 'duy_tri' && positive(e.ti_le) && e.ti_le <= 1;
      case 'hoi_mau_dan': return mode !== 'duy_tri' && seconds(e.s) && seconds(e.nhip_s) && e.nhip_s <= e.s && positive(e.ti_le_mau) && e.ti_le_mau <= 1;
      case 'hoi_mau_duy_tri': return mode === 'duy_tri' && positive(e.ti_le_moi_s) && e.ti_le_moi_s <= 1;
      case 'bay': return mode === 'duy_tri' && nonnegative(e.toc);
      default: return false;
    }
  }

  function cost(spec, slot) {
    // Slot cost is the host's computed actual amount, including rank modifiers.
    if (nonnegative(slot.cn)) return slot.cn;
    if (!nonnegative(spec.cn) || !['diem', 'ti_le_toi_da'].includes(spec.cn_theo)) return null;
    const owned = profile().co?.find(g => g.uid === slot.uid);
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
    const candidates = list().filter(a => current(a) && valid(a) && position(a));
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
      const target = chosen || (harmful ? candidates.sort((a, b) => distance(me, a) - distance(me, b))[0] : me);
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

  function castFX(gu, spec, selection, harmful) {
    const common = {tu: id(player()), gu, fx: spec.fx};
    const {v, center, dx, dy, targets} = selection;
    if (['tron_quanh', 'tieu_to'].includes(v.hinh)) fx({...common, k: 'vong', x: center.x, y: center.y, r: v.r});
    else if (['tron_tai_diem', 'non', 'duong'].includes(v.hinh)) fx({...common, k: 'vung', ...v, x: center.x, y: center.y, dx: dx ?? 0, dy: dy ?? 0});
    else for (const a of targets) fx({...common, k: harmful ? 'trung' : 'buff', id: id(a)});
  }

  function apply(gu, spec, hu, selection, index, now, hold) {
    const source = id(player());
    const dealt = new Map();
    for (const [i, e] of hu.entries()) {
      const kind = e.loai;
      const targets = SELF.has(kind) ? [player()] : selection.targets;
      for (const a of targets) {
        if (!alive(a)) continue;
        const key = `${index}:${gu}:${i}`;
        const until = hold ? Infinity : now + (e.s || 0) * 1000;
        if (kind === 'sat_thuong') dealt.set(a, (dealt.get(a) || 0) + damage(a, e.goc, now, source));
        else if (kind === 'hoi_mau') heal(a, e.goc * (a === player() ? 1 : e.hoi_dong_minh ?? 1), source);
        else if (['khien', 'giam_sat_thuong', 'choang', 'troi', 'cham', 'bay'].includes(kind)) {
          const value = kind === 'khien' ? a.hpMax * e.ti_le_mau : kind === 'bay' ? e.toc : e.gia_tri || 0;
          put(a, key, {kind, value, until, held: hold, gu});
          fx({k: 'buff', id: id(a), tu: source, gu, fx: spec.fx, s: e.s || 0, ma: kind});
          if (kind === 'khien') fx({k: 'so', id: id(a), tu: source, v: value, loai: 'khien'});
        } else if (DOTS.has(kind) || kind === 'hoi_mau_dan') {
          const interval = (e.nhip_s || 1) * 1000;
          const value = DOTS.has(kind) ? e.moi_s : a.hpMax * e.ti_le_mau / (e.s / (interval / 1000));
          put(a, key, {kind: kind === 'hoi_mau_dan' ? 'hoi' : kind, value, until, next: now + interval, interval, source});
          if (DOTS.has(kind)) a.aggro = now + 6000;
        } else if (kind === 'giai_hieu_ung') {
          let left = e.so;
          for (const [key, status] of effects(a)) {
            if (HARM.has(status.kind) && left-- > 0) effects(a).delete(key);
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
  }

  function advance(now) {
    if (!finite(now) || now < clock) return false;
    clock = now;
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
    for (const [index, h] of [...held]) {
      if (slots()[index] !== h.slot || h.slot.loai !== h.gu || h.slot.uid !== h.uid || !h.slot.bat || !alive(player()) || resolveGu(h.gu) !== h.spec) stop(index);
    }
    for (const [a, entry] of [...statuses]) {
      if (!current(a) || !alive(a)) { clear(a); continue; }
      for (const [key, e] of [...entry.effects]) {
        // Aggregate missed DOT/HoT pulses into one bounded operation per effect.
        if (e.next && e.next <= Math.min(now, e.until)) {
          const count = Math.floor((Math.min(now, e.until) - e.next) / e.interval) + 1;
          e.next += count * e.interval;
          if (e.kind === 'hoi') heal(a, e.value * count, e.source);
          else damage(a, e.value * count, now, e.source, 'dot');
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
      flush();
      if (result.ok) room.onCombatAction?.({type, p, gu: result.gu ?? null, ...result});
      return result;
    };
    if (!p || typeof p !== 'object') return finish(fail('payload', 'Lệnh chiến đấu không hợp lệ.'));
    if (type === 'sat_chieu') {
      const km = Number.isInteger(p.o) ? profile().satChieuO?.[p.o] : null;
      const spec = room.data.killer?.[km];
      return finish(fail('unsupported', spec ? `${room.label(spec.ten_key, km)}: chưa hỗ trợ sát chiêu; dữ liệu công khai thiếu công thức hiệu ứng/CN.` : 'Ô sát chiêu chưa có kỹ năng hợp lệ.', ['killer.' + (km || 'empty')]));
    }
    if (type !== 'dung') return finish(fail('type', 'Lệnh chiến đấu không hợp lệ.'));
    const index = p.o;
    // Turning a held skill off must work even while stunned or on cooldown.
    if (Number.isInteger(index) && held.has(index)) { const gu = held.get(index).gu; stop(index); return finish({ok: true, gu, bat: false, unsupported: []}); }
    if ((p.x !== undefined || p.y !== undefined) && (!finite(p.x) || !finite(p.y))) return finish(fail('point', 'Tọa độ chiến đấu không hợp lệ.'));
    if (!alive(player()) || !position(player())) return finish(fail('dead', 'Không thể chiến đấu khi trọng thương.'));
    if (tokens(player()).has('choang')) return finish(fail('stun', 'Đang choáng, không thể dùng kỹ năng.'));
    if (index === 'tay') {
      const b = balance().don_tay || {};
      if (b.bat === false) return finish(fail('unsupported', 'Đòn tay chưa được bật.'));
      if (now < handCD) return finish(fail('cooldown'));
      const range = (b.tam_m ?? 1.5) + (b.noi_tam_m ?? .3);
      const selection = select(p, {vung: {hinh: 'muc_tieu', tam: range}}, true);
      if (selection.error) return finish(fail(selection.error, 'Mục tiêu đòn tay không hợp lệ hoặc ngoài tầm.'));
      const rank = clamp(Math.floor(profile().chuyen || player().chuyen || 1), 1, 5);
      const amount = b.goc?.['chuyen_' + rank] ?? 6.5;
      handCD = now + (b.hoi_chieu_s ?? 1.2) * 1000;
      room.meditating = false;
      player().dong = 'melee'; player().dongSeq = (player().dongSeq || 0) + 1;
      touch(player());
      castFX('tay', {}, selection, true);
      damage(selection.targets[0], amount, now, id(player()));
      return finish({ok: true, gu: 'tay', cd: handCD, targets: selection.targets.map(id), unsupported: []});
    }
    if (!Number.isInteger(index) || index < 0 || index >= MAX_SLOTS || !Object.hasOwn(slots(), index)) return finish(fail('slot', 'Ô cổ không hợp lệ.'));
    const slot = slots()[index], gu = slot?.loai, spec = resolveGu(gu);
    if (!spec) return finish(fail('slot', 'Ô này chưa lắp cổ trùng hợp lệ.'));
    const unsupported = [];
    const hu = (Array.isArray(spec.hu) ? spec.hu : []).slice(0, MAX_EFFECTS).filter(e => {
      if (supported(e, spec.kich_hoat)) return true;
      unsupported.push(e?.loai || 'hu'); return false;
    });
    for (const e of hu) {
      if (e.theo_luc) unsupported.push(e.loai + '.theo_luc');
      if (e.xuyen) unsupported.push(e.loai + '.xuyen_giap');
    }
    for (const e of spec.cong_huong || []) unsupported.push('cong_huong.' + e.loai);
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
    const harmful = hu.some(e => HARM.has(e.loai));
    const selection = select(p, spec, harmful);
    if (selection.error || !selection.targets.length) return finish(fail(selection.error || 'target', 'Mục tiêu hoặc vị trí không hợp lệ / ngoài tầm.'));
    slot.cd = now + slot.cdMax;
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
    if (room.combatOwnsBeasts === false) { flush(); return; }
    for (const a of room.state.actors.values()) {
      if (a.loai !== 'thu') continue;
      if (a.hp <= 0 && positive(a.respawn) && now >= a.respawn) {
        clear(a); a.hp = a.hpMax; a.respawn = 0; a.aggro = 0; a.nextHit = 0;
        if (finite(a.sx)) a.x = a.sx;
        if (finite(a.sy)) a.y = a.sy;
        touch(a);
        continue;
      }
      if (!canAct || !hostile(a) || !alive(player()) || !position(a) || !position(player()) || !(a.aggro > now) || tokens(a).has('choang')) continue;
      const d = distance(a, player());
      if (d > 1.4) {
        if (tokens(a).has('troi')) continue;
        const step = Math.min(d - 1.4, 1.4 * elapsed * (nonnegative(a.tocDo) ? a.tocDo : 1));
        a.x += (player().x - a.x) / d * step;
        a.y += (player().y - a.y) / d * step;
        a.dong = 'walk'; touch(a);
      } else if (now >= (a.nextHit || 0)) {
        a.nextHit = now + 1400;
        damage(player(), 8, now, a.id, 'nhan');
      }
    }
    flush();
  }

  function getDamageReduction() {
    const now = Math.max(clock, Date.now());
    return Math.max(0, ...[...effects(player()).values()].filter(e => e.kind === 'giam_sat_thuong' && e.until > now).map(e => e.value));
  }

  // Hosts with their own enemy loop should use this so shields, lethal cleanup,
  // FX and profile updates share the same path. Do not also subtract HP outside.
  function receiveDamage(amount, source, now = Date.now()) {
    if (!nonnegative(amount) || !advance(now)) return 0;
    const dealt = damage(player(), amount, now, typeof source === 'object' ? source?.id : source, 'nhan');
    flush();
    return dealt;
  }

  return {attack, tick, getDamageReduction, receiveDamage};
}
