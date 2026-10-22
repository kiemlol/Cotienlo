/** Public recipe values are exact; missing server modifiers use an explicit
 * local policy. The policy is injectable, never taken from command payloads.
 * See INVENTORY-V3.md for provenance and the unavailable bal.hop_luyen fields.
 */
const own = (o, k) => Object.hasOwn(o ?? {}, k);
const get = (o, k) => typeof k === 'string' && own(o, k) ? o[k] : undefined;
const nonnegative = n => Number.isFinite(n) && n >= 0;

export function recipeContract(data, profile, id, policy = {}) {
  const r = get(data.recipe, id);
  if (!r || !get(data.gu, r.chinh) || !get(data.gu, r.ra) || !Array.isArray(r.phu) ||
      !nonnegative(r.cn) || !nonnegative(r.thoi_gian_s) || !nonnegative(r.ti_le_goc) || r.ti_le_goc > 1 ||
      !r.phu.every(p => (get(data.gu, p.id) || get(data.item, p.id)) && Number.isSafeInteger(p.so) && p.so > 0)) return null;
  const profession = profile.nghe?.ds?.find(n => (n.id ?? n.nghe) === 'luyen_co');
  const school = profile.luuPhai?.ds?.find(n => n.lp === data.gu[r.ra].luu_phai);
  const torn = !profile.coPhuong?.includes(id) && (profile.coPhuongTk?.includes(id) ?? false);
  const cap = nonnegative(policy.cap) ? Math.min(1, policy.cap) : .95;
  const craftBonus = Math.max(0, profession?.diem ?? 0) * (policy.perProfessionPoint ?? 0);
  const schoolBonus = Math.max(0, school?.bac ?? 0) * (policy.perSchoolRank ?? 0);
  const penalty = torn ? policy.tornPenalty ?? .15 : 0;
  const chance = r.luon_thanh_cong ? 1 : Math.max(0, Math.min(cap, r.ti_le_goc + craftBonus + schoolBonus - penalty));
  return {r, chance, cap, craftBonus, schoolBonus, penalty, torn, profession,
    injuryMs: (policy.injuryHours ?? 24) * 3_600_000,
    // These defaults are conservative adapter choices, not recovered constants.
    slots: policy.slots ?? 1,
    requiredProfessionRank: Math.max(0, (data.gu[r.ra].chuyen ?? 1) - 1)};
}
