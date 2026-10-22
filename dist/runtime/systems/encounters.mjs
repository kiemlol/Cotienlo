/**
 * Public-map encounter reconstruction. No transport, UI, combat AI or story owner.
 * Map species/counts/POIs are authoritative public data; unpublished statistics,
 * probabilities, timings and weekly rotation epoch are explicitly local policy.
 * See reports/ENCOUNTERS-V3.md before integrating.
 */
import {WIKI_BEASTS, WIKI_DUNGEONS, WIKI_RANKS} from './encounters-data.mjs?v=20261022-v3';

const finite = Number.isFinite;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const near = (a, b, r = 5) => a && b && finite(a.x) && finite(a.y) && Math.hypot(a.x - b.x, a.y - b.y) <= r;
const live = a => a && a.hp > 0 && !a.chet && !a.trongThuong;
const dayKey = now => new Date(now).toISOString().slice(0, 10);
const weekKey = now => Math.floor((now - Date.UTC(2026, 0, 5)) / 604800000);
const hash = value => { let n = 2166136261; for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
const roll = key => hash(key) / 4294967296;
const THEMES = ['me_cung', 'dau_bong', 'giu_den', 'do_thach'];
const EXITS = new Set(['cua_ra', 'loi_ra', 'ra_ve', 'cong_ra', 'bac_thang']);
const STORY = id => id === 'inst_mo_dau' || id.startsWith('inst_mo_lai_') || ['inst_lau_sup', 'inst_mong_canh_loan_chien', 'inst_dem_trang', 'inst_trai_dem_t04'].includes(id);
const dungeonID = id => Object.hasOwn(WIKI_DUNGEONS, id) ? id.replace(/^dg_/, 'inst_') : null;
const dungeonFor = id => Object.hasOwn(WIKI_DUNGEONS, id.replace(/^inst_/, 'dg_')) ? id.replace(/^inst_/, 'dg_') : null;
const FALLBACK = {1: [90, 8], 2: [320, 18], 3: [900, 38], 4: [2200, 85], 5: [5200, 180]};
const TIER = {thuong: 1, tinh_anh: 2.4, bach_vuong: 7, thien_vuong: 12, van_vuong: 20};
const CHANCES = {chac: 1, thuong: .65, hiem: .15, rat_hiem: .04};
export const ENCOUNTER_POLICY = Object.freeze({worldRespawnMs: 18000, warningMs: 1000, bossIntervalMs: 6500, holdMs: 8000, towerFloorMs: 90000, towerDailyRuns: 3, inheritanceFloorMs: 120000, difficultyHP: 1.5, difficultyAttack: 1.3, difficultyReward: 1.5, scheduleOffsetMinutes: 420, worldBossWindowMs: 1800000});

/** Safe subset of public map conditions. Hosts can supply the complete parser. */
export function encounterCondition(room, expression) {
  if (!expression || expression === 'true') return true;
  if (typeof room.encounterCondition === 'function') return !!room.encounterCondition(expression);
  const h = room.profile || {}, p = room.progress || {};
  const has = (bag, id) => Array.isArray(bag) ? bag.includes(id) : !!bag?.[id];
  const quest = id => p.quests?.[id] ?? p.story?.quests?.[id] ?? h.nv?.find?.(n => n.id === id);
  const term = text => {
    text = text.trim();
    if (text === 'false') return false;
    if (text === 'true') return true;
    if (text.startsWith('xong:')) return has(h.xong, text.slice(5)) || quest(text.slice(5))?.done === true;
    if (text.startsWith('dang:')) { const q = quest(text.slice(5)); return !!q && !q.done && !has(h.xong, text.slice(5)); }
    if (text.startsWith('buoc:')) {
      const m = /^buoc:([\w]+)\.b(\d+)(?:-b?(\d+))?$/.exec(text); if (!m) return false;
      const q = quest(m[1]), step = typeof q === 'string' ? q : q?.step ?? q?.buoc;
      const value = typeof step === 'number' ? step : Number(String(step).replace(/^b/, ''));
      return finite(value) && value >= +m[2] && value <= +(m[3] ?? m[2]);
    }
    if (text.startsWith('tu_vi:')) {
      const m = /^tu_vi:(\d+)\.(so|trung|cao|dinh)$/.exec(text); if (!m) return false;
      const rank = h.tv?.chuyen ?? h.chuyen ?? 0, raw = h.tv?.giai ?? 0;
      const stage = typeof raw === 'number' ? raw : ['so', 'trung', 'cao', 'dinh'].indexOf(raw);
      return rank > +m[1] || (rank === +m[1] && stage >= ['so', 'trung', 'cao', 'dinh'].indexOf(m[2]));
    }
    if (text.startsWith('flag_')) return has(h.flags, text) || has(p.flags, text);
    return false;
  };
  return String(expression).split('|').some(group => group.split('&').every(term));
}

/** All 55 maps retain declared points, routes and ext. No generic filler beasts. */
export function describeEncounters(data, id) {
  const z = data.zones?.[id]; if (!z) return null;
  const mode = STORY(id) ? 'story' : id === 'inst_dot_pha' ? 'progression' : id === 'inst_khai_khieu' ? 'awakening' : id === 'inst_thi_luyen_ba_cua' ? 'three-gates' : id === 'inst_ham_ruou' ? 'wine-cellar' : ['inst_thap_thi_luyen', 'inst_lau_chan_duong'].includes(id) ? 'tower' : id.startsWith('inst_tt_') ? 'inheritance' : z.loai === 'inst' && z.bai?.length ? 'dungeon' : 'world';
  return {id, mode, groups: z.bai || [], points: z.noi || [], ext: z.ext || {}, dungeon: dungeonFor(id), source: 'publicmaps', privateScriptKnown: false};
}

export function createEncounters(room) {
  let zoneId = room.zoneId ?? room.state.zoneId;
  let plan = describeEncounters(room.data, zoneId);
  let clock = finite(room.state.now) ? room.state.now : Date.now(), last = clock;
  let begun = false, pausedLast = false, dead = false, dialog = null, lastUI = 0;
  let z, root, hold = false, pending = new Map(), warned = new Map(), killed = new WeakSet();
  let onProgressionEvent = null;
  const policy = {...ENCOUNTER_POLICY, ...room.encounterPolicy};
  const zone = () => room.data.zones[zoneId];
  const label = (key, fallback) => room.label?.(key, fallback) ?? room.text?.[key] ?? fallback ?? key;
  const notify = text => room.notify?.(text);
  const emit = (type, data) => room.emit?.(type, data);
  const changed = a => room.changed?.(a);
  const save = () => { room.refresh?.(); room.save?.(); };
  const paused = () => !!(room.intro?.active || room.canh || room.state.canh || room.inCutscene || room.story?.inScene || room.story?.activeScene || (typeof room.encountersPaused === 'function' ? room.encountersPaused() : room.encountersPaused));
  const actors = () => [...room.state.actors.values()].filter(a => a.encounterZone === zoneId);
  const active = () => actors().filter(a => a.encounterSlot && live(a));
  const guide = (text, point) => emit('huong_dan', {text, ...(point ? {dich: {x: point.x, y: point.y}} : {})});
  const event = (kind, payload = {}) => {
    const p = {zone: zoneId, id: zoneId, ...payload};
    // One bridge only, even if both integration styles were configured.
    const callback = onProgressionEvent || room.onEncounterEvent || room.onProgressionEvent;
    callback?.call(room, kind, p);
  };
  function persist() {
    room.progress ||= {};
    root = room.progress.encounters ||= {version: 3, zones: {}, returns: {}, claims: {}};
    root.version = 3; root.zones ||= {}; root.returns ||= {}; root.claims ||= {};
    z = root.zones[zoneId] ||= {};
    z.dead ||= {}; z.lives ||= {}; z.paid ||= {}; z.phase ||= {};
    z.stage ??= 0; z.epoch ||= dayKey(clock);
  }
  function add(actor) {
    if (room.state.actors.has(actor.id)) return room.state.actors.get(actor.id);
    if (room.addActor) room.addActor(actor); else { room.state.actors.set(actor.id, actor); changed(actor); }
    return actor;
  }
  function remove(id) { if (room.removeActor) room.removeActor(id); else room.state.actors.delete(id); }
  function removeOwned() { for (const a of actors()) remove(a.id); pending.clear(); warned.clear(); }
  function point(id) { return plan.points.find(n => n.id === id); }
  function usable(n) { return encounterCondition(room, n?.hien_khi) && encounterCondition(room, n?.mo_khi); }
  function position(x, y, key, radius = 0) {
    const valid = (x, y) => x >= .5 && y >= .5 && x < zone().rong - .5 && y < zone().cao - .5 && ![...(zone().chan || []), ...(zone().ho || [])].some(r => x > r.x - .2 && x < r.x + r.w + .2 && y > r.y - .2 && y < r.y + r.h + .2);
    for (let i = 0; i < 40; i++) {
      const angle = roll(key + ':a:' + i) * Math.PI * 2, r = radius * Math.sqrt(roll(key + ':r:' + i));
      const px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
      if (valid(px, py)) return {x: px, y: py};
    }
    return valid(x, y) ? {x, y} : null; // Do not spawn through a wall/hole.
  }
  function stats(def) {
    const spec = room.data.beast?.[def]; if (!spec) return null;
    const declared = spec.stats || spec.chi_so || spec;
    const rank = clamp(declared.chuyen ?? WIKI_RANKS[def] ?? WIKI_BEASTS[def]?.rank ?? 1, 1, 5);
    const tier = TIER[spec.bac] || 1, [hp, cong] = FALLBACK[rank];
    return {...spec, chuyen: rank, hpMax: declared.hpMax ?? declared.hp ?? hp * tier, cong: declared.cong ?? cong * Math.sqrt(tier), tocDo: declared.tocDo ?? declared.toc_do ?? (spec.hanh_vi === 'chay' ? 1.15 : 1), reconstructedStats: !(finite(declared.hpMax) || finite(declared.hp))};
  }
  function mutations() {
    if (!z.hard) return [];
    const all = ['cong', 'mau', 'toc', 'suong_doc', 'hoi_sinh', 'goi_bay'];
    const seed = hash(`${weekKey(clock)}:${plan.dungeon || zoneId}`), count = 1 + seed % 2 + (z.seals || 0);
    return [...all].sort((a, b) => hash(seed + a) - hash(seed + b)).slice(0, Math.min(6, count));
  }
  function spawn(def, slot, x, y, options = {}) {
    const spec = stats(def); if (!spec || z.dead[slot]) return null;
    const id = 'enc:' + zoneId + ':' + slot;
    if (room.state.actors.has(id)) return room.state.actors.get(id);
    const at = position(x, y, slot, options.radius ?? 0); if (!at) return null;
    const mods = mutations();
    let hp = spec.hpMax * (options.scale ?? 1) * (z.hard ? policy.difficultyHP : 1) * (mods.includes('mau') ? 1.4 : 1);
    let cong = spec.cong * (options.scale ?? 1) * (z.hard ? policy.difficultyAttack : 1) * (mods.includes('cong') ? 1.25 : 1);
    const life = z.lives[slot] || 0;
    const a = add({id, def, hinh: spec.visual || def, loai: 'thu', ten: label(spec.ten_key, def), ...at, sx: at.x, sy: at.y, hp, hpMax: hp, cong, tocDo: spec.tocDo * (mods.includes('toc') ? 1.25 : 1), chuyen: spec.chuyen, bac: spec.bac || 'thuong', hanh_vi: spec.hanh_vi, co: 1, huong: 2, dong: 'idle', dongSeq: 0, hieuUng: '', tuongTac: false, giap: spec.giap || 0, an_m: spec.an_m, encounterZone: zoneId, encounterSlot: slot, encounterLife: life, encounterBoss: !!options.boss, encounterNoLoot: !!options.noLoot, encounterSource: spec.reconstructedStats ? 'public-roster/local-stats' : 'public-roster/declared-stats', encounterWave: z.stage, respawn: 0, aggro: 0});
    if (options.boss) { warned.set(id, clock + 2000); bossHUD(a); }
    return a;
  }
  function group(g, index) {
    if (!usable(g)) return;
    if (g.canh_ra_mat) event('boss-introduction', {scene: g.canh_ra_mat, group: g.id});
    const defs = g.thu || [];
    // Numeric `so` is a total for the group, not a multiplier per species.
    const counts = typeof g.so === 'object' ? defs.map(def => [def, g.so[def] || 0]) : defs.map((def, i) => [def, Math.floor((g.so || 0) / Math.max(1, defs.length)) + (i < (g.so || 0) % Math.max(1, defs.length) ? 1 : 0)]);
    for (const [def, count] of counts) for (let j = 0; j < clamp(count, 0, 100); j++) {
      const boss = plan.mode === 'dungeon' && (g.id === 'boss' || index === plan.groups.length - 1 && count === 1);
      const a = spawn(def, `bai:${g.id}:${def}:${j}`, g.x ?? g.tam?.x, g.y ?? g.tam?.y, {radius: (g.r || 1) * .7, boss});
      if (a && boss && def === 'beast_bong_lang_phu') {
        const wolf = spawn('beast_cuong_dien_lang', a.encounterSlot + ':leashed', a.sx - 3, a.sy, {noLoot: true});
        if (wolf) wolf.encounterLeashed = true;
      }
      if (a && boss && [...(room.state.players?.values() || [])].filter(live).length >= 3) {
        const secondary = def === 'beast_dia_thu_hang_chu' ? 'beast_chuot_dia_thu_chua' : def === 'beast_soi_tuyet_vuong' ? 'beast_gau_tuyet' : null;
        if (secondary) spawn(secondary, a.encounterSlot + ':ambush', a.sx - 4, a.sy, {noLoot: true, boss: true});
      }
    }
  }
  function npcs() {
    for (const n of plan.points) if (n.npc_goi_y && usable(n) && !room.state.actors.has(n.npc_goi_y)) {
      add({id: n.npc_goi_y, def: n.npc_goi_y, hinh: n.npc_goi_y, loai: 'npc', ten: label('npc.' + n.npc_goi_y.replace(/^npc_/, '') + '.ten', label(n.ten_key, n.id)), x: n.x, y: n.y + .8, hp: 0, hpMax: 0, huong: 2, co: 1, dong: 'idle', dongSeq: 0, hieuUng: '', tuongTac: true, encounterZone: zoneId, encounterPoint: n.id});
    }
  }
  function grant(key, reward) {
    if (root.claims[key]) return false;
    root.claims[key] = true; // one save contains ledger and profile mutation
    const h = room.profile; h.tui ||= {}; h.co ||= [];
    h.nguyenThach = (h.nguyenThach || 0) + (reward.nguyenThach || 0);
    for (const [id, count] of Object.entries(reward.items || {})) if (room.data.item?.[id] && count > 0) h.tui[id] = (h.tui[id] || 0) + count;
    for (const id of reward.gu || []) if (room.data.gu?.[id]) h.co.push({uid: `enc-gu-${hash(key + ':' + id).toString(36)}-${h.co.length}`, loai: id, luyenHoa: false, no: 100, thuanThuc: 0, xp: 0, xpCan: 20, sao: 0, buaToi: clock + 86400000, nghi: null, thuongNv: false});
    const rows = Object.entries(reward.items || {}).filter(([id, so]) => room.data.item?.[id] && so > 0).map(([id, so]) => ({id, so, ten: label(room.data.item[id].ten_key, id)}));
    if (reward.nguyenThach > 0) rows.unshift({id: 'item_nguyen_thach', so: reward.nguyenThach, ten: 'Nguyên thạch'});
    for (const id of reward.gu || []) if (room.data.gu?.[id]) rows.push({id, so: 1, ten: label(room.data.gu[id].ten_key, id)});
    if (rows.length) emit('nhat', rows); // recovered client consumes an ARRAY
    save();
    return true;
  }
  function loot(a) {
    const token = plan.mode === 'world' ? `${zoneId}:${a.encounterSlot}:${a.encounterLife}` : `${zoneId}:${z.epoch}:${a.encounterSlot}`;
    if (z.paid[token] || a.encounterNoLoot || ['tower', 'inheritance', 'three-gates'].includes(plan.mode)) return;
    const drops = a.encounterBoss && plan.dungeon ? WIKI_DUNGEONS[plan.dungeon]?.drops : WIKI_BEASTS[a.def]?.drops;
    const reward = {nguyenThach: 0, items: {}, gu: []};
    for (const d of drops || []) {
      if (roll(token + ':' + d.id + ':chance') >= (CHANCES[d.rarity] ?? 0)) continue;
      const count = d.min + Math.floor(roll(token + ':' + d.id + ':count') * (d.max - d.min + 1));
      if (d.id === 'item_nguyen_thach') reward.nguyenThach += count;
      else if (room.data.gu?.[d.id]) for (let i = 0; i < count; i++) reward.gu.push(d.id);
      else if (room.data.item?.[d.id]) reward.items[d.id] = count;
    }
    if (z.hard) {
      reward.nguyenThach = Math.floor(reward.nguyenThach * policy.difficultyReward);
      for (const id of Object.keys(reward.items)) reward.items[id] = Math.floor(reward.items[id] * policy.difficultyReward);
    }
    z.paid[token] = true;
    if (grant('loot:' + token, reward)) {
      room.progress.kills = (room.progress.kills || 0) + 1;
      save();
    }
  }
  function complete(id = zoneId, payload = {}) {
    if (z.done) return;
    z.done = true;
    if (z.hard && plan.dungeon) {
      const base = WIKI_DUNGEONS[plan.dungeon]?.drops.find(d => d.id === 'item_nguyen_thach')?.min || 0;
      const scout = [...(room.state.players?.values() || [])].some(p => live(p) && (p.vai === 'trinh' || p.role === 'trinh'));
      grant(`mutation:${zoneId}:${z.epoch}`, {nguyenThach: Math.floor(base * (1 + .25 * (z.seals || 0)) * (scout ? 1.05 : 1))});
    }
    save();
    guide('Đã hoàn thành. Trở về cửa ra.');
    event('instance_complete', {id, ...payload});
  }
  function bossHUD(a) { emit('boss', {id: a.id, pha: a.encounterPhase || 1, tong: 3, moc: [70, 40], nham: room.sessionId || room.player.id, noiDien: !!a.encounterEnraged}); }
  function scheduledBosses() {
    const local = new Date(clock + policy.scheduleOffsetMinutes * 60000);
    const date = local.toISOString().slice(0, 10), midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - policy.scheduleOffsetMinutes * 60000;
    for (const entry of room.data.lichThuVuong || []) {
      if (entry.zone !== zoneId) continue;
      const match = /^(\d+) (\d+) \* \* (\*|[0-6](?:,[0-6])*)$/.exec(entry.lich || '');
      const at = plan.points.find(n => n.id === entry.noi); // no invented boss coordinates
      if (!match || !at || (match[3] !== '*' && !match[3].split(',').includes(String(local.getUTCDay())))) continue;
      const start = midnight + (+match[2] * 60 + +match[1]) * 60000;
      const slot = `worldboss:${entry.id}:${date}`;
      if (clock < start || clock >= start + policy.worldBossWindowMs) {
        for (const a of actors()) if (a.encounterSlot === slot) remove(a.id);
        continue;
      }
      const a = spawn(entry.boss, slot, at.x, at.y, {boss: true, radius: 2});
      if (a) {
        a.encounterScheduled = true;
        const key = `worldboss-announced:${slot}`;
        if (!root.claims[key]) { root.claims[key] = true; notify(`${a.ten} xuất hiện: ${label(at.ten_key, at.id)}.`); event('worldboss', {beast: entry.boss, schedule: entry.id}); save(); }
      }
    }
  }
  function nextDungeon() {
    if (active().length || z.done || z.failed) return;
    while (z.stage < plan.groups.length) {
      const g = plan.groups[z.stage];
      if (!usable(g)) { z.stage++; continue; }
      group(g, z.stage);
      if (active().length) { guide(`Đợt ${z.stage + 1}/${plan.groups.length}: ${label(g.ten_key, g.id)}`, g); save(); return; }
      z.stage++;
    }
    complete();
  }
  function begin() {
    if (begun || !plan || paused() || plan.mode === 'story') return false;
    persist(); begun = true; last = clock;
    npcs();
    if (plan.mode === 'world') { plan.groups.forEach(group); scheduledBosses(); }
    else if (plan.mode === 'dungeon') { if (!z.failed) nextDungeon(); }
    else if (plan.mode === 'three-gates') {
      if (!z.done && !z.failed && z.stage === 0) plan.groups.forEach(group);
      threeGateGuide();
    } else if (plan.mode === 'awakening' && !z.done) guide('Đến mép biển hoa để bắt đầu lễ khai khiếu.', point('vach_bien_hoa'));
    else if (plan.mode === 'wine-cellar') guide(label(zone().ten_key + '.mo_ta', 'Hầm rượu nhà ngươi. Mát, tối, thơm men.'), point('vo_ruou_trang'));
    else if (plan.mode === 'tower') beginTower();
    else if (plan.mode === 'inheritance') beginInheritance();
    return true;
  }
  function threeGateGuide() {
    const texts = ['Cửa Đánh: hạ đủ thú trên sân.', 'Cửa Giữ: đứng bên đèn, giữ vững trong 8 giây.', 'Cửa Chạy: vượt chướng ngại đến đích.'];
    if (!z.done) guide(texts[z.stage] || texts[0], point(['cua_danh', 'den_giu', 'dich_chay'][z.stage]));
  }
  function teleport(at) { if (at) { if (room.teleport) room.teleport(at.x, at.y); else Object.assign(room.player, at); } }
  function returnRoute() {
    if (root?.returns[zoneId]) return root.returns[zoneId];
    for (const [id, map] of Object.entries(room.data.zones)) for (const n of map.noi || []) if (n.instance === zoneId || dungeonID(n.dg) === zoneId) return {zone: id, den_spawn: n.id};
    return {zone: 'zone_ta_gia_trai'};
  }
  function travel(destination, opts = {}) {
    if (!room.data.zones[destination]) return false;
    onTravel(destination, opts); save(); room.travel(destination, opts); return true;
  }
  function exit() { const route = returnRoute(); return travel(route.zone, {den_spawn: route.den_spawn, from: zoneId}); }
  /** Called BEFORE host travel. Handles both replacement Rooms and in-place hosts. */
  function onTravel(destination, opts = {}) {
    if (!plan || !room.data.zones[destination] || plan.mode === 'story') return false;
    if (!root) persist();
    if (destination.startsWith('inst_') && destination !== zoneId && !STORY(destination)) {
      const n = plan.points.find(n => n.id === opts.via || n.instance === destination || dungeonID(n.dg) === destination);
      root.returns[destination] = {zone: zoneId, ...(n ? {den_spawn: n.id} : {})};
    }
    hold = false; cancelWarnings(); return true;
  }
  function awakening() {
    if (z.done || !z.started) return;
    const pressure = zone().apLuc; if (!pressure) return;
    const p = room.player;
    if (p.x < pressure.x || p.x > pressure.x + pressure.w || p.y < pressure.y || p.y > pressure.y + pressure.h) return;
    z.steps = Math.max(z.steps || 0, clamp(Math.floor((pressure.y + pressure.h - p.y) / pressure.buocM), 0, pressure.toiDa));
    if (z.steps >= pressure.toiDa) {
      const h = room.profile;
      const fresh = Math.max(h.chuyen ?? 0, h.tv?.chuyen ?? 0) === 0;
      if (fresh) {
        h.chuyen = 1; h.tv = {...h.tv, chuyen: 1, giai: 0, diem: 0, can: 300};
        h.cnMax = Math.max(100, h.cnMax || 0); h.cn = h.cnMax;
        p.chuyen = 1; p.giai = 'so'; p.cnMax = h.cnMax; p.cn = h.cn;
        if (typeof room.progression?.rebase === 'function') room.progression.rebase({cnMax: 100});
        else room.progression?.applyBonuses?.({cnMax: 100});
      }
      z.done = true; save(); emit('fx', {k: 'khai_khieu', id: room.sessionId || p.id});
      event('awakening', {steps: z.steps, maximum: pressure.toiDa, completed: true, promoted: fresh, chuyen: h.chuyen});
      event('instance_complete', {id: zoneId, steps: z.steps});
      guide('Lễ khai khiếu đã hoàn thành. Trở về từ đường.', point('ra_ve'));
    } else if (clock - lastUI > 1000) { lastUI = clock; guide(`Biển hoa · ${z.steps}/${pressure.toiDa} bước. Tiến về phía nguyên tuyền.`); }
  }
  function interactSpecial(id) {
    if (plan.mode === 'awakening' && ['vach_bien_hoa', 'nguyen_tuyen'].includes(id)) {
      if (!z.done) { z.started = true; save(); guide('Bước qua biển hoa về phía nguyên tuyền.', point('nguyen_tuyen')); awakening(); }
      return true;
    }
    if (plan.mode === 'three-gates') {
      if (id === 'den_giu') { if (z.stage === 1) { hold = true; z.holdMs ||= 0; threeGateGuide(); } else threeGateGuide(); return true; }
      if (id === 'dich_chay' || id === 'cong_ra') { if (z.stage === 2) complete(); else threeGateGuide(); return true; }
      if (id === 'cua_danh') { threeGateGuide(); return true; }
    }
    if (plan.mode === 'wine-cellar' && id === 'vach_da_cu') {
      if (!z.wallSeen) { z.wallSeen = true; save(); event('cellar-wall', {point: id}); }
      notify(label(point(id).ten_key)); return true;
    }
    return false;
  }
  function gather(n) {
    const ids = String(n.item || '').split(',').filter(id => room.data.item?.[id]);
    if (!ids.length) return false;
    // Quest resources pay once per step; public un-gated nodes renew daily.
    const key = `gather:${zoneId}:${n.id}:${n.hien_khi || dayKey(clock)}`;
    if (!grant(key, {items: {[ids[0]]: 1}})) notify('Đã lấy vật phẩm ở điểm này.');
    else { room.progress.herbs = (room.progress.herbs || 0) + 1; event('gather', {point: n.id, item: ids[0], count: 1}); save(); }
    return true;
  }
  function onInteract(id) {
    if (!plan || paused() || plan.mode === 'story') return false;
    if (!begun) begin();
    if (plan.mode === 'inheritance' && inheritanceInteract(id)) return true;
    const n = point(id) || plan.points.find(n => n.npc_goi_y === id);
    if (!n) return false;
    if (!near(room.player, n)) { notify('Đến gần địa điểm để tương tác.'); return true; }
    if (!usable(n)) { notify('Địa điểm này chưa mở trong hành trình hiện tại.'); return true; }
    if (n.dg && dungeonID(n.dg)) {
      dialog = {id, dg: n.dg, destination: dungeonID(n.dg)};
      emit('thoai', {loai: 'lua_chon', tieuDe: label(n.ten_key, id), cac: [{i: 'encounter:normal', text: 'Vào hang'}, {i: 'encounter:hard', text: 'Vào (Khó)'}, {i: 'encounter:close', text: 'Để khi khác'}]}); return true;
    }
    if (n.toi || n.instance) return travel(n.toi || n.instance, {den_spawn: n.den_spawn, via: n.id, from: zoneId});
    if (interactSpecial(id)) return true;
    if (EXITS.has(id) && zone().loai === 'inst') return exit();
    if (n.loai === 'nguon_hai' || n.loai === 'nut_mo') return gather(n);
    if (n.npc_goi_y) return false; // parent owns story and NPC service dialogue
    if (n.chuc_nang || n.kieu === 'tuong_tac' || n.kieu === 'thu_vuong') return false;
    if (plan.mode === 'progression') return false; // Faraday exclusively owns bo_doan
    notify(label(n.chu_key || n.ten_key, label(zone().ten_key + '.mo_ta', n.id)));
    event('location', {point: id}); return true;
  }
  function enterDungeon(destination, {hard = false, seals = 0, via} = {}) {
    if (paused() || !room.data.zones[destination] || !dungeonFor(destination) || !live(room.player)) return false;
    if (!root) persist();
    seals = Number.isInteger(seals) ? clamp(seals, 0, 3) : 0;
    const target = root.zones[destination] ||= {}, today = dayKey(clock);
    const fee = hard ? [0, 50, 150, 400][seals] : 0;
    const feeKey = `seals:${destination}:${today}`;
    if (fee && !root.claims[feeKey] && (room.profile.nguyenThach || 0) < fee) { notify('Không đủ nguyên thạch cho ấn trấn.'); return false; }
    if (fee && !root.claims[feeKey]) { root.claims[feeKey] = true; room.profile.nguyenThach -= fee; }
    // Re-entry preserves deaths and loot ledger. An explicit reset can replay it.
    target.hard ??= hard; target.seals ??= hard ? seals : 0;
    return travel(destination, {via, from: zoneId, hard: target.hard, seals: target.seals});
  }
  function handle(type, p = {}) {
    if (!plan || paused() || plan.mode === 'story') return false;
    if (!p || typeof p !== 'object') return false;
    if (type === 'f') return onInteract(p.id);
    if (type === 'thoai' && typeof p.chon === 'string' && p.chon.startsWith('encounter:')) {
      const entry = dialog; dialog = null; emit('thoai', null);
      if (!entry || !near(room.player, point(entry.id)) || !usable(point(entry.id))) return true;
      if (p.chon === 'encounter:normal' || p.chon === 'encounter:hard') enterDungeon(entry.destination, {hard: p.chon === 'encounter:hard', via: entry.id});
      return true;
    }
    if (type === 'thap') {
      if (!root) persist();
      if (p.hd === 'vao') {
        const t = towerRecord();
        if (!encounterCondition(room, 'tu_vi:1.trung') || t.used >= policy.towerDailyRuns) { notify('Chưa đủ cảnh giới hoặc đã hết lượt Tháp hôm nay.'); return true; }
        if (plan.mode === 'tower') { if (!z.run?.active) startTower(); }
        else { root.towerPending = true; travel('inst_thap_thi_luyen'); }
      } else towerPanel();
      return true;
    }
    return false;
  }
  function cancelWarnings() {
    for (const warning of pending.values()) emit('fx', {k: 'huy_canh_bao', ma: warning.ma});
    pending.clear();
  }
  function warn(a, kind = 'slam') {
    const ma = `${a.id}:${clock}`;
    const line = kind === 'charge';
    const d = Math.hypot(room.player.x - a.x, room.player.y - a.y) || 1;
    const w = {ma, id: a.id, x: line ? a.x : room.player.x, y: line ? a.y : room.player.y, dx: (room.player.x - a.x) / d, dy: (room.player.y - a.y) / d, dai: line ? Math.min(18, d + 3) : 0, rong: 2.8, r: kind === 'poison' ? 5 : 3, hinh: line ? 'chu_nhat' : 'tron', ms: policy.warningMs, phe: 'thu', kind, due: clock + policy.warningMs};
    pending.set(a.id, w); emit('fx', {k: 'canh_bao', ...w});
    a.encounterWarningUntil = w.due; changed(a);
  }
  function hurt(amount, a) { if (live(room.player) && typeof room.combat?.receiveDamage === 'function') room.combat.receiveDamage(amount, a, clock); }
  function resolveWarnings() {
    for (const [id, w] of pending) {
      const a = room.state.actors.get(id);
      if (!live(a)) { emit('fx', {k: 'huy_canh_bao', ma: w.ma}); pending.delete(id); continue; }
      if (clock < w.due) continue;
      pending.delete(id); emit('fx', {k: 'huy_canh_bao', ma: w.ma});
      if (String(a.hieuUng).includes('choang') || (a.combatStunUntil || 0) > clock) continue;
      const p = room.player, dx = p.x - w.x, dy = p.y - w.y;
      const inside = w.kind === 'charge' ? dx * w.dx + dy * w.dy >= 0 && dx * w.dx + dy * w.dy <= w.dai && Math.abs(dx * w.dy - dy * w.dx) <= w.rong / 2 : Math.hypot(dx, dy) <= w.r;
      if (w.kind === 'poison') { a.encounterPoisonUntil = clock + 10000; a.encounterPoisonNext = clock; }
      if (inside && !onIsland(p)) hurt(a.cong * 1.5, a);
      if (w.kind === 'charge') { const at = position(w.x + w.dx * Math.min(w.dai, 7), w.y + w.dy * Math.min(w.dai, 7), w.ma); if (at) { a.x = at.x; a.y = at.y; changed(a); } }
      room.onEncounterBossAction?.(a, w);
    }
  }
  function onIsland(p) { return plan.points.some(n => n.kieu === 'dao_da' && near(p, n, n.r || 2.2)); }
  function summon(a, def, count = 2, suffix = 'adds') {
    for (let i = 0; i < count; i++) spawn(def, `${a.encounterSlot}:${suffix}:${i}`, a.sx, a.sy, {radius: 3, noLoot: true});
  }
  function bossTick(a) {
    const ratio = a.hp / a.hpMax;
    a.encounterPhase ||= 1;
    if (ratio <= .7 && !a.encounter70) {
      a.encounter70 = true; a.encounterPhase = 2;
      if (a.def === 'beast_lon_rung_vuong') summon(a, 'beast_lon_rung');
      if (a.def === 'beast_tam_nha') { summon(a, 'beast_nguoi_cam_day', 1); summon(a, 'beast_dien_lang', 2); }
      if (a.def === 'beast_thach_giap_boss') { room.state.gio = 0; changed(room.state); event('dungeon-darkness', {boss: a.id}); notify('Đèn tắt. Dùng cổ Trinh soi đường.'); }
      if (a.def === 'beast_dia_thu_hang_chu') summon(a, 'beast_chuot_dia_thu', 3);
      if (a.def === 'beast_soi_tuyet_vuong') summon(a, 'beast_soi_tuyet', 3);
      if (mutations().includes('goi_bay')) summon(a, plan.groups[0]?.thu[0], 2, 'mutation');
      bossHUD(a); save();
    }
    if (ratio <= .4 && !a.encounter40) {
      a.encounter40 = true; a.encounterPhase = 3;
      if (a.def === 'beast_thach_giap_boss') {
        a.encounterShieldBase = a.hpMax; a.encounterShieldHP = a.hp; a.encounterShieldUntil = clock + 15000;
        const shield = a.hpMax * .25; a.hp += shield; a.hpMax += shield;
        notify('Thạch giáp cuộn giáp. Phá khiên trong 15 giây.');
      } else { a.cong *= 1.35; a.tocDo *= 1.2; a.encounterEnraged = true; notify(a.ten + ' nổi điên!'); }
      bossHUD(a); changed(a); save();
    }
    if (a.encounterShieldUntil && (a.hp <= a.encounterShieldHP || clock >= a.encounterShieldUntil)) {
      const broken = a.hp <= a.encounterShieldHP;
      a.hp = Math.min(a.encounterShieldHP, a.hp); a.hpMax = a.encounterShieldBase; a.encounterShieldUntil = 0;
      if (!broken) { a.cong *= 1.35; a.encounterEnraged = true; }
      changed(a); bossHUD(a);
    }
    if (a.encounterPoisonUntil > clock && clock >= a.encounterPoisonNext) {
      a.encounterPoisonNext = clock + 2000;
      if (near(room.player, a, 12) && !onIsland(room.player)) hurt(a.cong * .4, a);
    }
    if (!pending.has(a.id) && clock >= (warned.get(a.id) || Infinity) && (a.aggro > clock || near(room.player, a, 10))) {
      const kind = a.def === 'beast_thuy_mang' ? 'poison' : /lon_rung|soi/.test(a.def) ? 'charge' : 'slam';
      warn(a, kind); warned.set(a.id, clock + policy.bossIntervalMs);
    }
  }
  function onAction(type, p = {}, result = {}) {
    if (!begun || paused()) return false;
    if (typeof type === 'object') { result = type; type = result.type; p = result.p || {}; }
    if (type === 'hoi_sinh' || type === 've') { if (z.failed && live(room.player)) reset(); return false; }
    if (type === 'dung' && result.ok) for (const id of result.targets || []) {
      const a = room.state.actors.get(id), w = pending.get(id);
      if (a?.def === 'beast_thuy_mang' && w?.kind === 'poison') { pending.delete(id); emit('fx', {k: 'huy_canh_bao', ma: w.ma}); notify('Đã ngắt niệm Thủy mãng.'); }
    }
    return false;
  }
  function onKill(a) {
    if (!begun || !a || a.encounterZone !== zoneId || !a.encounterSlot) return false;
    if (killed.has(a) || live(a)) return true;
    const w = pending.get(a.id); if (w) { emit('fx', {k: 'huy_canh_bao', ma: w.ma}); pending.delete(a.id); }
    a.respawn = 0;
    if (a.encounterBoss && mutations().includes('hoi_sinh') && !a.encounterRevived) {
      a.encounterRevived = true; a.hp = a.hpMax * .35; a.chet = false; a.trongThuong = false;
      changed(a); notify(a.ten + ' đứng dậy một lần!'); return true;
    }
    killed.add(a);
    z.dead[a.encounterSlot] = {until: a.encounterScheduled ? Number.MAX_SAFE_INTEGER : clock + policy.worldRespawnMs, life: a.encounterLife};
    loot(a); changed(a);
    if (a.def === 'beast_bong_lang_phu') for (const other of actors()) if (other.encounterLeashed) { z.dead[other.encounterSlot] = {until: Number.MAX_SAFE_INTEGER, life: 0}; remove(other.id); }
    if (a.def === 'beast_nguoi_cam_day') for (const other of active()) if (other.def === 'beast_dien_lang' && other.encounterNoLoot) { z.dead[other.encounterSlot] = {until: 0, life: 0}; remove(other.id); }
    if (plan.mode === 'three-gates' && z.stage === 0 && !active().length) { z.stage = 1; teleport(zone().spawns?.cua_2); threeGateGuide(); }
    if (plan.mode === 'dungeon' && !active().length) { z.stage++; nextDungeon(); }
    if (plan.mode === 'tower' && !active().length) towerCleared();
    if (plan.mode === 'inheritance' && !active().length) inheritanceCleared();
    event('kill', {actor: a.id, beast: a.def, rewardHandled: true, summoned: a.encounterNoLoot}); save();
    return true;
  }
  /** Reset only our actors. Reward claims survive death, re-entry and resets. */
  function reset() {
    if (!begun || paused()) return false;
    removeOwned(); z.dead = {}; z.phase = {}; z.stage = 0; z.holdMs = 0; z.failed = false; z.done = false; z.started = false; hold = false; dead = false;
    if (z.epoch !== dayKey(clock)) { z.epoch = dayKey(clock); z.hard = false; z.seals = 0; }
    begun = false; save(); return begin();
  }
  function onDeath() {
    if (!begun || plan.mode === 'story' || plan.mode === 'progression' || dead) return false;
    dead = true; hold = false; cancelWarnings();
    if (plan.mode === 'world' || plan.mode === 'wine-cellar') return false;
    z.failed = true;
    if (['tower', 'inheritance'].includes(plan.mode)) {
      if (z.run) z.run.active = false;
      removeOwned(); room.player.hp = room.player.hpMax; room.player.trongThuong = false; room.player.chet = false;
      if (plan.mode === 'tower') emit('thap_tang', {het: true, tangCao: z.run?.floor - 1 || 0});
      else inheritanceHUD('thua');
      save(); exit(); return true;
    }
    // Drop partial encounter state, while retaining every paid kill token.
    removeOwned(); z.dead = {}; z.stage = 0; z.holdMs = 0; z.started = false;
    notify('Thí luyện đã dừng. Hồi sinh rồi vào lại từ đầu.'); save(); return false;
  }

  // Tower timing/roster/first-clear amount are local; every fifth-floor boss and
  // the five milestone reward tables are documented by the official wiki.
  const milestones = {5: [20, 'item_bua_cuong_hoa_nho'], 10: [40, 'item_ruou_tram_ngay'], 15: [60, 'item_manh_co_phuong'], 20: [90, 'item_manh_co_phuong', 'item_ruou_tram_ngay'], 30: [150, 'item_bua_cuong_hoa_lon']};
  function towerRecord() {
    const t = root.tower ||= {best: 0, weekBest: 0, used: 0, day: dayKey(clock), week: weekKey(clock)};
    if (t.day !== dayKey(clock)) { t.day = dayKey(clock); t.used = 0; }
    if (t.week !== weekKey(clock)) { t.week = weekKey(clock); t.weekBest = 0; }
    return t;
  }
  function towerPanel() {
    const t = towerRecord();
    emit('thap', {mo: encounterCondition(room, 'tu_vi:1.trung'), luot: Math.max(0, policy.towerDailyRuns - t.used), luotNgay: policy.towerDailyRuns, caoNhat: t.best, caoTuan: t.weekBest, batDau: Math.max(1, Math.floor(t.weekBest / 5) * 5), moc: Object.keys(milestones).map(n => ({tang: +n, xong: !!root.claims[`tower:${t.day}:milestone:${n}`]}))});
  }
  function beginTower() {
    if (z.run?.active) { spawnTower(); return; }
    if (root.towerPending) { delete root.towerPending; startTower(); }
    else { towerPanel(); guide('Mở bảng Tháp, chọn Vào tháp để bắt đầu.'); }
  }
  function startTower() {
    const t = towerRecord();
    if (!encounterCondition(room, 'tu_vi:1.trung') || t.used >= policy.towerDailyRuns) return false;
    removeOwned(); dead = false;
    t.used++; z.failed = false; z.dead = {}; z.run = {active: true, floor: Math.max(1, Math.floor(t.weekBest / 5) * 5), deadline: clock + policy.towerFloorMs};
    spawnTower(); save(); return true;
  }
  function spawnTower() {
    const f = z.run.floor, boss = f % 5 === 0, tier = Math.min(3, 1 + Math.floor((f - 1) / 10));
    const defs = tier === 1 ? ['beast_lon_rung', 'beast_khi_da', 'beast_lon_rung_vuong'] : tier === 2 ? ['beast_dien_lang', 'beast_coc_doc', 'beast_hao_dien_lang'] : ['beast_khi_da_sau', 'beast_dao_si_huyet_buc', 'beast_dung_nham_ngac'];
    for (let i = 0; i < (boss ? 1 : 3); i++) spawn(boss ? defs[2] : defs[f % 2], `tower:${f}:${i}`, zone().rong / 2, zone().cao / 2, {radius: 3, scale: 1 + (f - 1) % 10 * .08, boss, noLoot: true});
    towerHUD();
  }
  function towerHUD() { if (z.run?.active) emit('thap_tang', {tang: z.run.floor, boss: z.run.floor % 5 === 0, con: active().length, giay: Math.max(0, Math.ceil((z.run.deadline - clock) / 1000))}); }
  function towerCleared() {
    if (!z.run?.active || z.run.next) return;
    const t = towerRecord(), f = z.run.floor;
    if (f > t.best) { grant(`tower:first:${f}`, {nguyenThach: 5 + f}); t.best = f; }
    t.weekBest = Math.max(t.weekBest, f);
    if (milestones[f]) { const [nt, ...items] = milestones[f]; grant(`tower:${t.day}:milestone:${f}`, {nguyenThach: nt, items: Object.fromEntries(items.map(id => [id, 1]))}); }
    z.run.next = clock + 3000; emit('thap_tang', {qua: true, tang: f, nghi: 3}); save();
  }

  // Inheritance uses three documented weekly floors. Missing private puzzles,
  // rosters, reward amounts and timings are bounded reconstruction below.
  function inheritanceRecord() {
    const week = weekKey(clock), theme = THEMES[((week % 4) + 4) % 4];
    if (!root.inheritance || root.inheritance.week !== week) root.inheritance = {week, theme, cleared: 0};
    return root.inheritance;
  }
  function beginInheritance() {
    const t = inheritanceRecord();
    if ((room.profile.chuyen || 0) < 2) { guide('Truyền thừa mở từ Nhị chuyển.'); return; }
    const theme = zoneId.replace(/^inst_tt_/, '');
    if (theme !== t.theme) { guide(`Tuần này là đề ${label('ui.truyen_thua.de.' + t.theme, t.theme)}.`); return; }
    if (t.cleared >= 3) { z.done = true; inheritanceHUD('xong'); return; }
    if (!z.run?.active) z.run = {active: true, floor: t.cleared + 1, deadline: clock + policy.inheritanceFloorMs, theme, opened: [], wave: 0, lamp: 100, checkpoint: 0};
    z.failed = false;
    spawnInheritance();
  }
  function inheritanceHUD(pha = 'danh') {
    const r = z.run || {}, theme = r.theme || zoneId.replace(/^inst_tt_/, '');
    emit('truyen_thua', {ten: label('ui.truyen_thua.de.' + theme, theme), ban: (room.profile.chuyen || 0) >= 3 ? 'tam' : 'nhi', tang: r.floor || 1, pha, con: Math.max(0, Math.ceil(((r.deadline || clock) - clock) / 1000)), muc: theme === 'giu_den' ? `Đèn ${Math.floor(r.lamp || 0)}% · đợt ${r.wave || 0}/3` : theme === 'do_thach' ? `Đá đã mở ${r.opened?.length || 0}/3 · thú đá ${active().length}` : `Còn ${active().length} đối thủ`});
  }
  function spawnInheritance() {
    const r = z.run, scale = 1 + (r.floor - 1) * .3, rank = Math.min(3, room.profile.chuyen || 2);
    if (r.theme === 'dau_bong') {
      // Same recovered player visual, with a bounded opponent stat line.
      const a = spawn('beast_nguoi_cam_day', `inherit:${r.floor}:shadow`, 15, 14, {scale, noLoot: true});
      if (a) Object.assign(a, {hinh: room.player.hinh, ten: 'Bóng của ' + room.player.ten, hp: room.player.hpMax * scale, hpMax: room.player.hpMax * scale, cong: (room.player.cong || FALLBACK[rank][1]) * scale, chuyen: rank});
    } else if (r.theme === 'giu_den') {
      if (!r.wave) r.wave = 1;
      for (let i = 0; i < 3; i++) spawn(rank >= 3 ? 'beast_dao_si_huyet_buc' : 'beast_dien_lang', `inherit:${r.floor}:wave:${r.wave}:${i}`, 15, 12, {radius: 5, scale, noLoot: true});
      add({id: `enc:lamp:${r.floor}`, hinh: 'prop_gpt_cot_da_do', loai: 'npc', ten: 'Đèn hồn', x: 15, y: 14, hp: 0, hpMax: 0, co: 1, huong: 2, dong: 'idle', dongSeq: 0, hieuUng: '', tuongTac: false, encounterZone: zoneId});
    } else if (r.theme === 'do_thach') {
      for (let i = 0; i < 3; i++) if (!r.opened.includes(i)) add({id: `enc:stone:${r.floor}:${i}`, hinh: 'prop_kho_cracked_grey_stone', loai: 'npc', ten: 'Khối đá', x: 8 + i * 7, y: 14, hp: 0, hpMax: 0, co: 1, huong: 2, dong: 'idle', dongSeq: 0, hieuUng: '', tuongTac: true, encounterZone: zoneId, encounterStone: i});
      for (const [i, def] of Object.entries(r.foes || {})) spawn(def, `inherit:${r.floor}:stone:${i}`, 8 + +i * 7, 14, {noLoot: true, boss: +i === 2, scale: 1 + r.floor * .2});
    } else guide('Đi qua các điểm trận đồ theo thứ tự.', {x: 5, y: 8});
    inheritanceHUD(); save();
  }
  function inheritanceInteract(id) {
    const r = z?.run; if (!r?.active || r.theme !== 'do_thach') return false;
    const a = room.state.actors.get(id); if (!a || a.encounterStone === undefined || a.encounterZone !== zoneId) return false;
    if (!near(room.player, a)) { notify('Đến gần khối đá.'); return true; }
    if (active().length) { notify('Còn thú đá trên sân. Hạ hết rồi mở tiếp.'); return true; }
    const i = a.encounterStone; if (r.opened.includes(i)) return true;
    r.opened.push(i); remove(a.id);
    const choice = hash(`${root.inheritance.week}:${r.floor}:${i}`) % 3;
    if (choice === 0 || i === 2) {
      r.foes ||= {}; r.foes[i] = i === 2 ? 'beast_thach_giap_boss' : 'beast_thach_giap';
      spawn(r.foes[i], `inherit:${r.floor}:stone:${i}`, a.x, a.y, {noLoot: true, boss: i === 2, scale: 1 + r.floor * .2});
    }
    else if (choice === 1) { room.player.hp = Math.min(room.player.hpMax, room.player.hp + room.player.hpMax * .2); changed(room.player); }
    else { emit('fx', {k: 'canh_bao', x: a.x, y: a.y, r: 2, ms: 1000, phe: 'thu'}); notify('Trong đá có vật liệu; nhận cùng thưởng tầng.'); }
    if (!active().length && r.opened.length >= 3) inheritanceCleared();
    else inheritanceHUD();
    save(); return true;
  }
  function inheritanceCleared() {
    const r = z.run; if (!r?.active || r.next || active().length) return;
    if (r.theme === 'do_thach' && r.opened.length < 3 || r.theme === 'me_cung' && r.checkpoint < 3) return;
    if (r.theme === 'giu_den' && r.wave < 3) { r.wave++; spawnInheritance(); return; }
    const t = inheritanceRecord(), f = r.floor;
    grant(`inheritance:${t.week}:${f}`, {nguyenThach: 20 * f * Math.min(3, room.profile.chuyen || 2), items: {item_manh_co_phuong: 1}});
    t.cleared = Math.max(t.cleared, f); inheritanceHUD(f === 3 ? 'xong' : 'qua');
    if (f === 3) { r.active = false; complete(zoneId, {theme: r.theme, floors: 3}); }
    else r.next = clock + 3000;
    save();
  }
  function tick(now) {
    if (!finite(now) || now < clock || !plan) return;
    const dt = clamp(now - last, 0, 1000); clock = now; last = now;
    if (paused() || plan.mode === 'story') { pausedLast = true; if (begun) cancelWarnings(); return; }
    if (!begun) begin();
    if (!begun) return;
    // Pause must not turn elapsed cutscene time into held progress or damage.
    if (pausedLast) { pausedLast = false; if (z.run?.active) z.run.deadline = clock + (z.run.remaining ?? (plan.mode === 'tower' ? policy.towerFloorMs : policy.inheritanceFloorMs)); return; }
    if (!live(room.player)) { onDeath(); return; }
    if (dead) { dead = false; if (z.failed) reset(); }
    if (z.failed) return;
    if (plan.mode === 'world') {
      for (const [slot, death] of Object.entries(z.dead)) if (clock >= death.until) { const a = actors().find(a => a.encounterSlot === slot); if (a) remove(a.id); z.lives[slot] = (death.life || 0) + 1; delete z.dead[slot]; }
      plan.groups.forEach(group); // idempotent; adds newly unlocked quest groups
      scheduledBosses();
      for (const a of actors()) { const g = plan.groups.find(g => a.encounterSlot?.startsWith('bai:' + g.id + ':')); if (g && !usable(g)) remove(a.id); }
    }
    if (plan.mode === 'awakening') awakening();
    if (plan.mode === 'three-gates' && !z.done) {
      if (z.stage === 1) {
        if (near(room.player, point('den_giu'), 3)) { hold = true; z.holdMs = (z.holdMs || 0) + dt; }
        else { hold = false; z.holdMs = 0; }
        if (hold && z.holdMs >= policy.holdMs) { z.stage = 2; teleport(zone().spawns?.cua_3); threeGateGuide(); save(); }
      } else if (z.stage === 2 && near(room.player, point('dich_chay'), 2)) complete();
    }
    for (const a of active()) if (a.encounterBoss) bossTick(a);
    resolveWarnings();
    if (!live(room.player)) { onDeath(); return; }
    if (z.run?.active) {
      const r = z.run;
      r.remaining = Math.max(0, r.deadline - clock);
      if (r.next && clock >= r.next) {
        removeOwned(); z.dead = {}; r.floor++; delete r.next;
        r.deadline = clock + (plan.mode === 'tower' ? policy.towerFloorMs : policy.inheritanceFloorMs);
        if (plan.mode === 'tower') spawnTower();
        else { Object.assign(r, {opened: [], foes: {}, wave: 0, lamp: 100, checkpoint: 0}); spawnInheritance(); }
        save();
      } else if (!r.next && clock >= r.deadline) { onDeath(); return; }
      if (plan.mode === 'inheritance' && r.theme === 'giu_den') {
        const pressure = active().filter(a => near(a, {x: 15, y: 14}, 6)).length;
        r.lamp = Math.max(0, r.lamp - pressure * dt / 1000 * 1.5);
        if (!r.lamp) { onDeath(); return; }
      }
      if (plan.mode === 'inheritance' && r.theme === 'me_cung') {
        const points = [{x: 5, y: 8}, {x: 24, y: 8}, {x: 15, y: 20}];
        if (near(room.player, points[r.checkpoint], 2)) { r.checkpoint++; if (r.checkpoint === 3) inheritanceCleared(); else guide('Đi tới điểm trận đồ tiếp theo.', points[r.checkpoint]); save(); }
      }
      if (clock - lastUI >= 1000 && !r.next) { lastUI = clock; if (plan.mode === 'tower') towerHUD(); else inheritanceHUD(); }
    }
  }
  return {begin, handle, tick, onKill, onInteract, onTravel, onAction, onDeath, reset, enterDungeon,
    describe: () => plan,
    set onProgressionEvent(callback) { onProgressionEvent = typeof callback === 'function' ? callback : null; },
    get onProgressionEvent() { return onProgressionEvent; },
    get npcInteractions() { return (plan?.points || []).filter(n => n.npc_goi_y).map(n => ({id: n.npc_goi_y, point: n.id, x: n.x, y: n.y})); },
    };
}
