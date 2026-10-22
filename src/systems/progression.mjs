/**
 * Progression adapter for the recovered client, not recovered server code.
 * Client: recovered-current/modules/bundle.js (22 Oct capture):
 * At:19756 jobs; co.cham:144051, co.luyen_san:136177,
 * co.duong/lay_duong:168181, nghe.bo/chinh/doi:211870-211935,
 * ho_cu:142698-143129, do_deo:142299, mini:202653-203340.
 * Rules: official generated /wiki/tn/{nghe,ho_cu,tu_luyen,dot_pha,nuoi_co}
 * downloaded 22 Oct at work/cotienlo-expand/v3/wiki. Base equipment numbers
 * below come from dist/wiki/vat/<id>.html (21 Oct generated item pages).
 * Numeric equipment/set/upgrade tables are NOT present in the supplied client
 * or game.json. Local formulas are explicitly documented in PROGRESSION-V3.md.
 * No fetch, browser, timers, runtime patches, or mutations of room.data.
 */
const HOUR = 3_600_000, DAY = 24 * HOUR, VN = 7 * HOUR;
const own = (o, k) => Object.hasOwn(o ?? {}, k);
const get = (o, k) => typeof k === 'string' && own(o, k) ? o[k] : undefined;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const num = (n, fallback = 0) => finite(n) ? n : fallback;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const integer = (n, a = 0, b = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) && n >= a && n <= b;
const object = o => !!o && typeof o === 'object' && !Array.isArray(o);
const copy = o => structuredClone(o);
const day = now => Math.floor((now + VN) / DAY);
const STAGES = ['so', 'trung', 'cao', 'dinh'];
export const OCCUPATIONS = Object.freeze(['duong_co', 'u_ruou', 'san_thuoc_da', 'khai_mo', 'luyen_co', 'no_thu', 'giam_thach', 'dieu_ngu']);
const SLOTS = ['ao', 'giay', 'bao_tay', 'boi_suc'];
const WEAR = ['dau', 'lung', 'buoc'];
// Exact generated public cultivation table (tu_luyen.html, 22 Oct).
const REALMS = [[0, 0, 0, 0], [300, 450, 600, 750], [8400, 9800, 11200, 12600],
  [12000, 14000, 16000, 18000], [40000, 50000, 60000, 70000], [110000, 145000, 180000, 215000]];
const BREAKTHROUGHS = {
  1: {nt: 100, can: {item_thao_duoc: 60, item_mat_ong: 3, item_ruou_trang: 2, item_nanh_heo_vuong: 1, item_nguyen_tuyen_lang: 1}},
  2: {nt: 400, can: {item_thao_duoc: 120, item_thao_duoc_tram_nam: 10, item_ngoc_vun: 10, item_bom_hao_dien_lang: 1, item_vay_thuy_mang: 2}},
  3: {nt: 1500, can: {item_thao_duoc: 200, item_thao_duoc_tram_nam: 20, item_ngoc_vun: 30, item_bom_hao_dien_lang: 3, item_tim_cuong_dien_lang: 1}},
  4: {nt: 3000, can: {item_thao_duoc: 300, item_thao_duoc_tram_nam: 40, item_mao_soi_gio: 40, item_vuot_dia_thu: 20, item_bang_tuyen_tinh: 6, item_tim_soi_gio_vuong: 2, item_giap_dia_thu_vuong: 1}},
};
// Wiki-generated profession rows; tuple = job, name, tier, costs, outputs, place.
// These local recipe IDs are deliberately namespaced; original server ma unknown.
const WIKI_RECIPES = [
  ["dieu_ngu","Nướng cá diếc lá thơm",0,{"item_ca_diec":2,"item_thao_duoc":1},{"item_ca_nuong_la_thom":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Nướng cá chép bùn lá thơm",0,{"item_ca_chep_bun":2,"item_thao_duoc":1},{"item_ca_nuong_la_thom":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Nấu canh cá trắm thuốc",0,{"item_ca_tram_den":1,"item_thao_duoc":2},{"item_canh_ca_thuoc":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Nấu canh lươn đá thuốc",0,{"item_luon_da":1,"item_thao_duoc":2},{"item_canh_ca_thuoc":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Trộn mồi linh thảo",1,{"item_thao_duoc":2,"item_moi_giun":1},{"item_moi_linh_thao":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Làm cần trúc tím",1,{"item_nguyen_thach":30,"item_thao_duoc":3,"item_luon_da":2},{"item_can_truc_tim":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Làm cần Ngư Cốt",2,{"item_can_truc_tim":1,"item_ca_ngan_lan":1,"item_ca_mac_ngu":1,"item_ca_hong_vi":1,"item_ca_bang_tu":1,"item_nguyen_thach":60},{"item_can_ngu_cot":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Ướp Ngân Lân ngư",3,{"item_ca_ngan_lan":2,"item_thao_duoc":3},{"item_ca_hiem_uop":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Ướp Mặc ngư",3,{"item_ca_mac_ngu":2,"item_thao_duoc":3},{"item_ca_hiem_uop":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Ướp Hồng Vĩ ngư",3,{"item_ca_hong_vi":2,"item_thao_duoc":3},{"item_ca_hiem_uop":1},["inst_gia_vien","luong_trong"]],
  ["dieu_ngu","Ướp Băng Tu ngư",3,{"item_ca_bang_tu":2,"item_thao_duoc":3},{"item_ca_hiem_uop":1},["inst_gia_vien","luong_trong"]],
  ["duong_co","Chế cao cầm máu",0,{"item_thao_duoc":2},{"item_cao_cam_mau":1},["zone_ta_gia_trai","tram_thuoc"]],
  ["duong_co","Chế Mê hương",0,{"item_thao_duoc":2,"item_canh_nguyet_lan":1},{"item_me_huong":1},["zone_ta_gia_trai","tram_thuoc"]],
  ["duong_co","Chế Hoạt Huyết Tán",1,{"item_thao_duoc":4,"item_canh_nguyet_lan":1},{"item_hoat_huyet_tan":1},["zone_ta_gia_trai","tram_thuoc"]],
  ["duong_co","Chế Sâm Linh Hoàn",2,{"item_tham_tu":2,"item_thao_duoc":5,"item_mat_ong":1},{"item_sam_linh_hoan":1},["zone_ta_gia_trai","tram_thuoc"]],
  ["duong_co","Chế Hoạt Huyết Tán",1,{"item_thao_duoc":4,"item_canh_nguyet_lan":1},{"item_hoat_huyet_tan":1},["zone_ben_thuong","quan_tro"]],
  ["duong_co","Chế Sâm Linh Hoàn",2,{"item_tham_tu":2,"item_thao_duoc":5,"item_mat_ong":1},{"item_sam_linh_hoan":1},["zone_ben_thuong","quan_tro"]],
  ["duong_co","Chế Mê hương",0,{"item_thao_duoc":2,"item_canh_nguyet_lan":1},{"item_me_huong":1},["zone_ben_thuong","quan_tro"]],
  ["duong_co","Nhân giống Sinh Cơ Diệp",2,{"item_co_tuoi":5,"item_thao_duoc":3,"item_nguyen_thach":5},{"gu_sinh_co_diep":1},["inst_gia_vien","luong_trong"]],
  ["duong_co","Nhân giống Tiểu Sinh Cơ Thảo",3,{"item_thao_duoc":6,"item_mat_ong":2,"item_nguyen_thach":20},{"gu_tieu_sinh_co_thao":1},["inst_gia_vien","luong_trong"]],
  ["duong_co","Nhân giống Giáp Diệp",2,{"item_co_tuoi":6,"item_thao_duoc":4,"item_nguyen_thach":8},{"gu_giap_diep":1},["inst_gia_vien","luong_trong"]],
  ["duong_co","Nhân giống Thanh Lộ",2,{"item_thao_duoc":5,"item_canh_nguyet_lan":2,"item_nguyen_thach":8},{"gu_thanh_lo":1},["inst_gia_vien","luong_trong"]],
  ["duong_co","Ươm lá Cửu Diệp Sinh Cơ Thảo",1,{"item_thao_duoc":4,"item_co_tuoi":4,"item_nguyen_thach":2},{"item_la_cuu_diep":1},["inst_gia_vien","luong_trong"]],
  ["u_ruou","Ủ rượu trắng",0,{"item_gao":2},{"item_ruou_trang":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ủ rượu ngọt",1,{"item_ruou_trang":2,"item_mat_ong":1},{"item_ruou_ngot":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ủ rượu chua",1,{"item_ruou_trang":2,"item_gao":2},{"item_ruou_chua":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ủ rượu đắng",1,{"item_ruou_trang":2,"item_thao_duoc":1},{"item_ruou_dang":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ủ rượu cay",1,{"item_ruou_trang":2,"item_cu_tham_tu":1},{"item_ruou_cay":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ngâm rượu thuốc",2,{"item_ruou_trang":3,"item_la_cuu_diep":1,"item_thao_duoc":2},{"item_ruou_thuoc":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ủ rượu trăm ngày",3,{"item_ruou_ngot":1,"item_ruou_chua":1,"item_ruou_dang":1,"item_ruou_cay":1,"item_nguyen_thach":10},{"item_ruou_tram_ngay":1},["inst_ham_ruou","ham_ruou"]],
  ["u_ruou","Ngâm rượu thuốc kiểu tán tu",0,{"item_ruou_trang":2,"item_thao_duoc":3},{"item_ruou_thuoc":1},["zone_ben_thuong","quan_tro"]],
  ["san_thuoc_da","Thuộc da lợn",0,{"item_da_heo":1},{"item_da_heo_thuoc":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May áo da lợn",0,{"item_da_heo_thuoc":3},{"item_ho_cu_da_heo":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May giày da lợn",0,{"item_da_heo_thuoc":2},{"item_giay_da_heo":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May bao tay da lợn",0,{"item_da_heo_thuoc":2},{"item_bao_tay_da_heo":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","Xâu dây nanh lợn",0,{"item_nanh_heo":3,"item_da_heo_thuoc":1},{"item_boi_suc_nanh_heo":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May áo da sói",1,{"item_da_soi":4},{"item_ao_da_soi":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May giày da sói",1,{"item_da_soi":2},{"item_giay_da_soi":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May bao tay da sói",1,{"item_da_soi":2},{"item_bao_tay_da_soi":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","Xâu dây nanh sói",1,{"item_nanh_soi":3,"item_da_soi":1},{"item_boi_suc_nanh_soi":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Thố Nhung Y",0,{"item_long_tho":4},{"item_ao_long_tho":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Thố Nhung Ngoa",0,{"item_long_tho":3},{"item_giay_long_tho":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Thố Nhung Thủ Sáo",0,{"item_long_tho":3},{"item_bao_tay_long_tho":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Thố Vĩ Trụy",0,{"item_long_tho":2,"item_da_heo_thuoc":1},{"item_day_chuyen_long_tho":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Ưng Vũ Y",0,{"item_long_ung":4},{"item_ao_long_ung":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Ưng Vũ Ngoa",0,{"item_long_ung":3},{"item_giay_long_ung":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Ưng Vũ Thủ Sáo",0,{"item_long_ung":3},{"item_bao_tay_long_ung":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Ưng Vũ Trụy",0,{"item_long_ung":2,"item_da_heo_thuoc":1},{"item_day_chuyen_long_ung":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Lộc Bì Y",0,{"item_da_huou":3},{"item_ao_da_huou":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Lộc Bì Ngoa",0,{"item_da_huou":2},{"item_giay_da_huou":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Lộc Bì Thủ Sáo",0,{"item_da_huou":2},{"item_bao_tay_da_huou":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Lộc Bì Hạng Liên",0,{"item_da_huou":2},{"item_day_chuyen_da_huou":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Bưu Dực Y",1,{"item_long_canh_buu":2,"item_da_heo_thuoc":2},{"item_ao_long_buu":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Bưu Dực Ngoa",1,{"item_long_canh_buu":1,"item_da_heo_thuoc":2},{"item_giay_long_buu":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Bưu Dực Thủ Sáo",1,{"item_long_canh_buu":1,"item_da_heo_thuoc":2},{"item_bao_tay_long_buu":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Bưu Dực Trụy",1,{"item_long_canh_buu":2},{"item_day_chuyen_long_buu":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May áo da gấu",2,{"item_da_gau":3,"item_da_heo_thuoc":2},{"item_ao_da_gau":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Xà Bì Y",1,{"item_da_ran":4},{"item_ao_da_ran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Xà Bì Ngoa",1,{"item_da_ran":2},{"item_giay_da_ran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Xà Bì Thủ Sáo",1,{"item_da_ran":2},{"item_bao_tay_da_ran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Xà Bì Trụy",1,{"item_da_ran":2,"item_tui_doc":1},{"item_day_chuyen_da_ran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Mãng Lân Y",2,{"item_vay_tran":4,"item_da_heo_thuoc":1},{"item_ao_vay_tran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Mãng Lân Ngoa",2,{"item_vay_tran":2},{"item_giay_vay_tran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Mãng Lân Thủ Sáo",2,{"item_vay_tran":2},{"item_bao_tay_vay_tran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Mãng Lân Trụy",2,{"item_vay_tran":3},{"item_day_chuyen_vay_tran":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Giày da gấu",2,{"item_da_gau":2,"item_da_heo_thuoc":1},{"item_giay_da_gau":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Bao tay da gấu",2,{"item_da_gau":2,"item_da_heo_thuoc":1},{"item_bao_tay_da_gau":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Dây vuốt gấu",2,{"item_da_gau":2},{"item_day_chuyen_da_gau":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","Xâu dây nanh Lợn Rừng Vương",3,{"item_nanh_heo_vuong":1,"item_da_soi":2},{"item_boi_suc_nanh_heo_vuong":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Đao Sí Y",2,{"item_mang_dao_si":4},{"item_ao_dao_si":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Đao Sí Ngoa",2,{"item_mang_dao_si":2},{"item_giay_dao_si":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Đao Sí Thủ Sáo",2,{"item_mang_dao_si":2},{"item_bao_tay_dao_si":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Đao Sí Trụy",2,{"item_mang_dao_si":3},{"item_day_chuyen_dao_si":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Quạ Ảnh Y",3,{"item_long_qua_anh":4},{"item_ao_qua_anh":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Quạ Ảnh Ngoa",3,{"item_long_qua_anh":2},{"item_giay_qua_anh":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Quạ Ảnh Thủ Sáo",3,{"item_long_qua_anh":2},{"item_bao_tay_qua_anh":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Quạ Ảnh Trụy",3,{"item_long_qua_anh":3},{"item_day_chuyen_qua_anh":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Dương Tàm Y",3,{"item_to_duong_tam":4},{"item_ao_duong_tam":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Dương Tàm Ngoa",3,{"item_to_duong_tam":2},{"item_giay_duong_tam":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Dương Tàm Thủ Sáo",3,{"item_to_duong_tam":2},{"item_bao_tay_duong_tam":1},["zone_ta_gia_trai","bang_san"]],
  ["san_thuoc_da","May Dương Tàm Trụy",3,{"item_to_duong_tam":3},{"item_day_chuyen_duong_tam":1},["zone_ta_gia_trai","bang_san"]],
  ["khai_mo","Lọc ngọc vụn lấy nguyên thạch",2,{"item_ngoc_vun":5},{"item_nguyen_thach":3},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Rèn Thiết Lân Giáp",1,{"item_tinh_thiet":3,"item_vay_da":4},{"item_ao_thiet_giap":1},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Rèn Thiết Lân Ngoa",1,{"item_tinh_thiet":2,"item_vay_da":2},{"item_giay_thiet_giap":1},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Rèn Thiết Lân Hộ Thủ",1,{"item_tinh_thiet":2,"item_vay_da":2},{"item_bao_tay_thiet_giap":1},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Rèn Thiết Lân Hạng Quyển",1,{"item_tinh_thiet":1,"item_vay_da":3},{"item_day_chuyen_thiet_giap":1},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Luyện tinh thiết",1,{"item_quang_sat":3,"item_than_cui":1},{"item_tinh_thiet":1},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Đốt than củi",0,{"item_cui_kho":3},{"item_than_cui":1},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Luyện tinh thiết kiểu Lục gia",0,{"item_quang_sat":4,"item_than_cui":1},{"item_tinh_thiet":2},["zone_mo_cu","lan_tho"]],
  ["khai_mo","Tôi tinh thiết bằng ngọc vụn",3,{"item_quang_sat":6,"item_than_cui":2,"item_ngoc_vun":2},{"item_tinh_thiet":3},["zone_mo_cu","lan_tho"]],
  ["giam_thach","Khắc vân đá",3,{"item_da_giam_200":1,"item_ngoc_vun":3,"item_nguyen_thach":20},{"item_da_giam_200_van_2":1},["inst_gia_vien","luong_trong"]]
];
// Wiki displays flat cong using a percent formatter (100% = 1); the client's
// AG() displays cong as a number. See report. No guessed values for 12 rare items.
const WIKI_EQUIPMENT = {
  "item_ao_da_gau": {"hp":90,"giap":2},
  "item_ao_da_huou": {"hp":30,"giap":0.3},
  "item_ao_da_ran": {"hp":50,"giap":1.2,"khang":{"doc":0.1}},
  "item_ao_da_soi": {"hp":60,"giap":1.5},
  "item_ao_dao_si": {"hp":145,"giap":2.5},
  "item_ao_duong_tam": {"hp":780,"giap":11},
  "item_ao_han_suong": {"hp":55,"giap":1.2},
  "item_ao_huyen_thach": {"hp":28,"giap":0.7},
  "item_ao_lang_nha": {"hp":55,"giap":1.2},
  "item_ao_loi_dai": {"hp":50,"giap":1.5},
  "item_ao_long_buu": {"hp":30,"giap":0.6},
  "item_ao_long_tho": {"hp":15,"toc":0.01},
  "item_ao_long_ung": {"hp":15,"giap":0.3},
  "item_ao_mac_thuy": {"hp":90,"giap":1},
  "item_ao_qua_anh": {"hp":340,"giap":5},
  "item_ao_thanh_khe": {"hp":25,"giap":0.4},
  "item_ao_thiet_giap": {"hp":50,"giap":2.5},
  "item_ao_vay_tran": {"hp":90,"giap":1},
  "item_ao_vu_anh": {"hp":22,"giap":0.4},
  "item_bao_tay_da_gau": {"hp":30,"cong":2},
  "item_bao_tay_da_heo": {"hp":10,"cong":1},
  "item_bao_tay_da_huou": {"hp":10,"cn":5},
  "item_bao_tay_da_ran": {"hp":20,"cong":4},
  "item_bao_tay_da_soi": {"hp":25,"cong":3},
  "item_bao_tay_dao_si": {"hp":60,"cong":6},
  "item_bao_tay_duong_tam": {"hp":325,"cong":35},
  "item_bao_tay_han_suong": {"hp":22,"cong":3},
  "item_bao_tay_huyen_thach": {"hp":10,"giap":0.2,"cong":1},
  "item_bao_tay_lang_nha": {"hp":22,"cong":5},
  "item_bao_tay_loi_dai": {"hp":20,"cong":3,"khang":{"cham":0.1}},
  "item_bao_tay_long_buu": {"hp":12,"cong":2},
  "item_bao_tay_long_tho": {"hp":5,"cong":1},
  "item_bao_tay_long_ung": {"hp":5,"cong":2},
  "item_bao_tay_mac_thuy": {"hp":35,"cong":2},
  "item_bao_tay_qua_anh": {"hp":140,"cong":15},
  "item_bao_tay_thanh_khe": {"hp":10,"cn":6},
  "item_bao_tay_thiet_giap": {"hp":20,"giap":0.5,"cong":2},
  "item_bao_tay_vay_tran": {"hp":40,"cong":1},
  "item_bao_tay_vu_anh": {"hp":8,"cong":2},
  "item_boi_suc_loi_dai": {"hp":10,"cn":20,"khang":{"choang":0.15}},
  "item_boi_suc_nanh_heo": {"hp":5,"cn":10,"khang":{"choang":0.1}},
  "item_boi_suc_nanh_heo_vuong": {"hp":30,"cn":35,"khang":{"cham":0.1,"choang":0.15}},
  "item_boi_suc_nanh_soi": {"hp":15,"cn":25,"khang":{"cham":0.1}},
  "item_day_chuyen_da_gau": {"hp":20,"cn":25,"khang":{"choang":0.1}},
  "item_day_chuyen_da_huou": {"hp":5,"cn":15},
  "item_day_chuyen_da_ran": {"hp":10,"cn":25,"khang":{"doc":0.15}},
  "item_day_chuyen_dao_si": {"hp":35,"cn":70,"khang":{"choang":0.1}},
  "item_day_chuyen_duong_tam": {"hp":195,"cn":360,"khang":{"doc":0.1}},
  "item_day_chuyen_han_suong": {"hp":12,"cn":25,"khang":{"cham":0.15}},
  "item_day_chuyen_huyen_thach": {"hp":8,"cn":10,"khang":{"choang":0.1}},
  "item_day_chuyen_lang_nha": {"hp":12,"cn":25,"cong":1},
  "item_day_chuyen_long_buu": {"hp":8,"cn":12,"khang":{"choang":0.1}},
  "item_day_chuyen_long_tho": {"cn":8,"khang":{"cham":0.15}},
  "item_day_chuyen_long_ung": {"hp":5,"cn":8},
  "item_day_chuyen_mac_thuy": {"hp":25,"cn":20,"khang":{"doc":0.15}},
  "item_day_chuyen_qua_anh": {"hp":85,"cn":155,"khang":{"cham":0.1}},
  "item_day_chuyen_thanh_khe": {"hp":5,"cn":14,"khang":{"doc":0.1}},
  "item_day_chuyen_thiet_giap": {"hp":15,"cn":20,"giap":0.5},
  "item_day_chuyen_vay_tran": {"hp":30,"cn":15},
  "item_day_chuyen_vu_anh": {"hp":5,"cn":10,"khang":{"cham":0.1}},
  "item_dd_co_long": {"cn":25,"khang":{"cham":0.15}},
  "item_dd_khan_quang": {"hp":5,"cn":8},
  "item_dd_khoa_truong_menh": {"hp":15,"cn":8},
  "item_dd_lo_co": {"cn":30},
  "item_dd_ngoc_boi": {"cn":35,"khang":{"doc":0.15}},
  "item_dd_tui_bua": {"cn":10,"khang":{"doc":0.1}},
  "item_dd_vong_bac": {"hp":15,"cn":25},
  "item_dd_vong_nanh": {"cn":25,"khang":{"choang":0.1}},
  "item_giay_da_gau": {"hp":25,"khang":{"choang":0.05}},
  "item_giay_da_heo": {"hp":5,"toc":0.02},
  "item_giay_da_huou": {"hp":10,"toc":0.01},
  "item_giay_da_ran": {"hp":15,"toc":0.02},
  "item_giay_da_soi": {"hp":15,"toc":0.02},
  "item_giay_dao_si": {"hp":35,"toc":0.02},
  "item_giay_duong_tam": {"hp":195,"toc":0.02},
  "item_giay_han_suong": {"hp":18,"toc":0.03},
  "item_giay_huyen_thach": {"hp":8,"giap":0.2},
  "item_giay_lang_nha": {"hp":15,"toc":0.02},
  "item_giay_loi_dai": {"hp":10,"toc":0.02},
  "item_giay_long_buu": {"hp":8,"toc":0.02},
  "item_giay_long_tho": {"hp":5,"toc":0.03},
  "item_giay_long_ung": {"hp":5,"toc":0.02},
  "item_giay_mac_thuy": {"hp":30},
  "item_giay_qua_anh": {"hp":85,"toc":0.02},
  "item_giay_thanh_khe": {"hp":7,"toc":0.02},
  "item_giay_thiet_giap": {"hp":15,"giap":0.5},
  "item_giay_vay_tran": {"hp":30},
  "item_giay_vu_anh": {"hp":6,"toc":0.03},
  "item_ho_cu_da_heo": {"hp":20,"giap":0.5}
};
const SET_SUFFIX = {da_heo:'heo', nanh_heo:'heo', da_soi:'soi', nanh_soi:'soi', da_huou:'huou',
  long_tho:'tho', long_ung:'ung', long_buu:'buu', da_ran:'ran', vay_tran:'tran', da_gau:'gau',
  dao_si:'dao_si', qua_anh:'qua_anh', duong_tam:'duong_tam', thiet_giap:'thiet_giap', loi_dai:'loi_dai',
  thanh_khe:'thanh_khe', vu_anh:'vu_anh', huyen_thach:'huyen_thach', han_suong:'han_suong', mac_thuy:'mac_thuy', lang_nha:'lang_nha'};
const emptyStats = () => ({hp:0, cn:0, cong:0, giap:0, toc:0, khang:[]});
const GEM = /^item_da_(bach_ho|chu_tuoc|huyen_vu|thanh_long)_([1-5])$/;
const emptySlot = () => ({uid:null, loai:null, cd:0, cdMax:0, cn:0, cnGiay:false, bat:false});

export function createProgression(room) {
  let attached, local, clock = num(room.state?.now, Date.now()), lastTick = clock;
  let session = null, sitting = false, absorbing = false, craftPlace = null, choices = new Set();
  let lastApplied = null, refreshing = false, begun = false;
  const h = () => room.profile, player = () => room.player;
  const data = () => room.data;
  const bal = () => data().bal?.cultivation ?? {};
  const mastery = () => bal().thuan_thuc ?? {};
  const zone = () => room.zoneId ?? room.state?.zoneId;
  const rank = () => num(h().chuyen, num(h().tv?.chuyen, 1));
  const spec = id => get(data().item, id) ?? get(data().gu, id);
  const name = id => room.label?.(spec(id)?.ten_key ?? id, id) ?? id;
  const jobName = id => room.label?.('ui.nghe.ten.' + id, id) ?? id;
  const money = () => Math.max(0, num(h().nguyenThach, num(h().nt)));
  const notify = text => { room.notify?.(text); return true; };
  const allowed = key => {
    const gate = get(room.story?.gates, key);
    return gate === undefined ? true : typeof gate === 'function' ? gate(rank(), h()) !== false : gate !== false;
  };
  const event = (kind, payload) => {
    try { room.onProgressionEvent?.(kind, copy(payload)); }
    catch { room.notify?.('Thao tác đã lưu; chưa cập nhật được nhiệm vụ.'); }
  };
  const gu = uid => typeof uid === 'string' ? h().co.find(g => g.uid === uid) : undefined;
  const healthy = g => g && g.luyenHoa && !g.nghi && num(g.no, 100) > 0 &&
    (get(data().gu, g.loai)?.chuyen ?? Infinity) <= Math.max(1, rank()) + num(data().bal?.combat?.co_cao_chuyen?.toi_da_vuot);
  const alive = () => num(player().hp) > 0 && !player().trongThuong;
  const busy = () => !alive() || player().coChien || num(player().combatStunUntil) > clock;
  const job = id => h().nghe.ds.find(j => j.id === id);
  const pointsTier = n => h().nghe.mocBac.reduce((a, v, i) => n >= v ? i : a, 0);

  function ensure() {
    if (room.intro?.active) return false;
    if (attached === h()) return true;
    attached = h();
    session = null; sitting = absorbing = false; lastApplied = null;
    const p = h();
    p.tui ??= {}; p.co ??= []; p.o ??= []; p.obd ??= []; p.opt ??= [];
    p.chuyen ??= p.tv?.chuyen ?? 1;
    p.tv ??= {chuyen:p.chuyen, giai:0, diem:num(room.progress?.training)};
    if (typeof p.tv.giai === 'string') p.tv.giai = Math.max(0, STAGES.indexOf(p.tv.giai));
    p.tv.giai = clamp(num(p.tv.giai), 0, 3);
    p.tv.diem = Math.max(0, num(p.tv.diem, num(room.progress?.training)));
    p.tv.chuyen = rank();
    p.tv.can = REALMS[rank()]?.[p.tv.giai] ?? num(p.tv.can);
    p.nghe ??= {ds:[]}; p.nghe.ds ??= [];
    // Two primary slots is the requested independent-game policy. Do not
    // demote existing legacy professions silently, even if a save has three.
    p.nghe.toiDaChinh = 2;
    p.nghe.mocBac = [0,25,50,75]; p.nghe.tran = 100; p.nghe.matKhiBo = 0.5;
    p.chamCo ??= {mo:true, con:[], xp:mastery().cham_co_xp ?? 5};
    p.luyenSan ??= {da:{}}; p.luyenSan.da ??= {};
    Object.assign(p.luyenSan, {gia:mastery().luyen_san?.nguyen_thach ?? 20,
      xp:mastery().luyen_san?.xp ?? 10, toiDa:mastery().luyen_san?.lan_ngay_moi_co ?? 5});
    p.oDuongCo ??= {so:0, o:[]}; p.oDuongCo.o ??= [];
    p.hoCu ??= {o:{}, cat:[]}; p.hoCu.o ??= {}; p.hoCu.cat ??= [];
    p.doDeo ??= {o:{}, tui:[]}; p.doDeo.o ??= {};
    local = p.progressionV3 ??= {version:3, day:day(clock), cared:{}, absorbed:0, nursery:{},
      equipment:{o:copy(p.hoCu.o), cat:copy(p.hoCu.cat)}, realmGains:0, nextUid:1};
    local.cared ??= {}; local.absorbed ??= 0; local.nursery ??= {};
    local.equipment ??= {o:copy(p.hoCu.o), cat:copy(p.hoCu.cat)};
    local.equipment.o ??= {}; local.equipment.cat ??= [];
    local.realmGains ??= 0; local.nextUid ??= 1;
    // Interpret old totals as already included in saved maxima, once only.
    local.base ??= {hpMax:Math.max(1, num(p.hpMax, num(player().hpMax,200)) - num(p.hoCu.tong?.hp)),
      cnMax:Math.max(0, num(p.cnMax, num(player().cnMax,100)) - num(p.hoCu.tong?.cn)),
      cong:num(player().cong,25) - num(p.hoCu.tong?.cong), giap:num(player().giap) - num(p.hoCu.tong?.giap),
      tocDo:num(player().tocDo,1) - num(p.hoCu.tong?.toc)};
    // Preserve an old captured cosmetic inventory; normal inventory is p.tui.
    local.cosmetics ??= Array.isArray(p.doDeo.tui) ? Object.fromEntries(p.doDeo.tui.map(r=>[r.id,num(r.so,1)])) :
      Object.fromEntries(Object.entries(p.doDeo.tui ?? {}).map(([id,r])=>[id,num(r?.so,num(r,1))]));
    for (const row of Object.values(local.equipment.o)) normalizeGear(row);
    for (const row of local.equipment.cat) normalizeGear(row);
    for (const g of p.co) normalizeMastery(g);
    for (const slot of p.oDuongCo.o) {
      const g=slot&&gu(slot.uid);
      if(!g)continue;
      const period=(get(data().gu,g.loai)?.an?.chu_ky_gio??24)*HOUR;
      local.nursery[g.uid]??={at:clock,productionAt:clock,mealRemaining:period};
      if(!g.nghi)g.nghi={ly:'duong',den:0};
      freezeNursery(g);
    }
    rollover();
    return true;
  }

  function rollover() {
    const today = day(clock);
    if (local.day !== today && today > num(local.day, -Infinity)) {
      local.day = today; local.cared = {}; local.absorbed = 0; h().luyenSan.da = {};
      for (const g of h().co) g.xpNgay = 0;
      if(h().beQuan)h().beQuan.daDung=0;
      return true;
    }
    return false;
  }

  function normalizeGear(row) {
    if (!object(row)) return;
    row.cap = clamp(num(row.cap),0,10); row.ph = clamp(num(row.ph),0,5);
    row.nap ??= {}; row.baoHiem ??= 0;
    row.da ??= Array.isArray(row.kham?.ds) ? copy(row.kham.ds) : [];
  }

  function normalizeMastery(g) {
    const cap = mastery().cap_toi_da ?? 10, steps = mastery().xp_len_cap ?? [20,40,70,110,160,230,320,430,560,720];
    g.thuanThuc = clamp(num(g.thuanThuc),0,cap); g.xp = Math.max(0,num(g.xp)); g.xpNgay = Math.max(0,num(g.xpNgay));
    while (g.thuanThuc < cap && g.xp >= (steps[g.thuanThuc] ?? Infinity)) {
      g.xp -= steps[g.thuanThuc]; g.thuanThuc++;
    }
    g.xpCan = g.thuanThuc >= cap ? 0 : steps[g.thuanThuc];
  }

  function finish(kind, payload = {}, message) {
    recalculate();
    // Host refresh may call recalculate again; that hook never emits or saves.
    room.refresh?.(); room.save?.();
    if (message) room.notify?.(message);
    if (kind) event(kind, payload);
    return true;
  }

  // Atomic item/currency transaction planner. Gu outputs are checked separately.
  function transaction(cost = {}, output = {}, nt = 0) {
    if (!object(cost) || !object(output) || !finite(nt) || nt < 0) return null;
    const items = {...h().tui}; let stones = money() - nt;
    for (const [id,n] of Object.entries(cost)) {
      if (!integer(n,1) || !spec(id)) return null;
      if (id === 'item_nguyen_thach') stones -= n;
      else { if (!integer(num(items[id]),n)) return null; items[id] -= n; if (!items[id]) delete items[id]; }
    }
    for (const [id,n] of Object.entries(output)) {
      if (!integer(n,1) || !get(data().item,id)) return null;
      if (id === 'item_nguyen_thach') stones += n;
      else { items[id] = num(items[id]) + n; if (!integer(items[id],1)) return null; }
    }
    if (!finite(stones) || stones < 0 || stones > Number.MAX_SAFE_INTEGER ||
      Object.values(items).filter(n=>n>0).length > (h().tuiToiDa ?? 40)) return null;
    return () => { h().tui = items; h().nguyenThach = h().nt = stones; };
  }

  const near = (place, radius = 5) => {
    if (!place || zone() !== place[0]) return false;
    if (['ham_ruou','luong_trong'].includes(place[1])) return true;
    const point = get(data().zones,zone())?.noi?.find(n=>n.id === place[1]);
    return !!point && Math.hypot(player().x-point.x,player().y-point.y) <= radius;
  };

  function recipes() {
    const rows = new Map();
    WIKI_RECIPES.forEach(([nghe,ten,bac,can,ra,noi],i) => {
      if (!OCCUPATIONS.includes(nghe) || !Object.keys(ra).length ||
        ![...Object.keys(can),...Object.keys(ra)].every(id=>spec(id))) return;
      rows.set('nghe:'+i, {ma:'nghe:'+i, nghe, ten, bac, can, ra, noi});
    });
    // Item source metadata is authoritative for recipes exported by this client.
    for (const [id,item] of Object.entries(data().item ?? {})) for (const source of item.nguon ?? []) {
      if (source.ma !== 'nghe' || !source.can || !OCCUPATIONS.includes(source.chi)) continue;
      if ([...rows.values()].some(r=>r.nghe === source.chi && r.ra[id] && JSON.stringify(r.can) === JSON.stringify(source.can))) continue;
      if (!Object.keys(source.can).every(key=>spec(key))) continue;
      const ma = 'nghe:'+id;
      rows.set(ma,{ma,nghe:source.chi,ten:name(id),bac:source.bac ?? 0,can:copy(source.can),ra:{[id]:1},noi:source.noi});
    }
    return rows;
  }

  function craftPanel(place = craftPlace) {
    return {ds:[...recipes().values()].filter(r=>!place || r.noi?.join(':') === place.join(':')).map(r=>{
      const j = job(r.nghe);
      return {ma:r.ma,ten:r.ten, can:Object.entries(r.can).map(([id,n])=>({id,ten:name(id),n,co:id==='item_nguyen_thach'?money():num(h().tui[id])})),
        ra:Object.entries(r.ra).map(([id,n])=>({id,ten:name(id),n})),
        khoa:!j ? 'Chưa học '+jobName(r.nghe)+'.' : r.bac > (j.chinh ? j.bac : 0) ? 'Cần nghề chính đủ bậc.' :
          !allowed('occupations') ? 'Chưa mở nghề theo hành trình.' : ''};
    })};
  }

  function learn(id) {
    if (!ensure() || !OCCUPATIONS.includes(id) || !allowed('occupations')) return false;
    if (job(id)) return true;
    const chinh = h().nghe.ds.filter(j=>j.chinh).length < 2;
    h().nghe.ds.push({id,chinh,diem:0,bac:0});
    return finish('nghe_hoc',{id,chinh},'Học được nghề '+jobName(id)+'.');
  }

  function gainOccupation(id, amount = 1, tier = 0) {
    if (!ensure() || !integer(amount,1,1000) || !integer(tier,0,3)) return 0;
    const j = job(id);
    if (!j?.chinh || tier < j.bac) return 0;
    const before = num(j.diem); j.diem = Math.min(100,before+amount); j.bac = pointsTier(j.diem);
    return j.diem-before;
  }

  function occupation(p) {
    const j = job(p.id);
    if (!['bo','chinh','doi'].includes(p.hd) || !j || !allowed('occupations')) return notify('Lệnh nghề hoặc nghề đã học không hợp lệ.');
    if (p.hd === 'bo') {
      if (!j.chinh) return notify('Nghề này không phải nghề chính.');
      j.chinh = false; const lost = j.diem-Math.floor(j.diem*0.5); j.diem -= lost; j.bac = pointsTier(j.diem);
      return finish('nghe_bo',{id:j.id,lost},'Thôi nghề chính; mất '+lost+' điểm.');
    }
    if (j.chinh) return notify('Đã là nghề chính.');
    const primaries = h().nghe.ds.filter(j=>j.chinh);
    if (p.hd === 'doi') {
      const old = job(p.bo);
      if (!old?.chinh || old === j) return notify('Chọn đúng nghề chính cần thôi.');
      // Validate every participant before applying the permanent loss.
      if (primaries.length > 2) return notify('Hãy thôi nghề dư trước khi đổi nghề.');
      old.chinh = false; old.diem = Math.floor(old.diem*0.5); old.bac = pointsTier(old.diem);
    } else if (primaries.length >= 2) return notify('Đã đủ hai nghề chính; hãy chọn Đổi nghề.');
    j.chinh = true;
    return finish('nghe_chinh',{id:j.id,bo:p.bo},jobName(j.id)+' thành nghề chính.');
  }

  function craft(p) {
    const r = recipes().get(p.ma), n = p.so ?? 1;
    if (!r || !integer(n,1,99) || !near(r.noi) || busy() || session || !allowed('occupations')) return notify('Không thể chế tại đây hoặc số lượng không hợp lệ.');
    // Public rules permit learning on first work. Resolve a new primary only
    // after all costs/capacity checks; failed crafts never teach or spend XP.
    const j = job(r.nghe), tier = j ? j.chinh ? j.bac : 0 : 0;
    if (r.bac > tier) return notify('Cần nghề chính đủ bậc.');
    const costs = Object.fromEntries(Object.entries(r.can).map(([id,v])=>[id,v*n]));
    const outputs = Object.fromEntries(Object.entries(r.ra).filter(([id])=>get(data().item,id)).map(([id,v])=>[id,v*n]));
    const guOutputs = Object.entries(r.ra).filter(([id])=>get(data().gu,id));
    const countGu = guOutputs.reduce((s,[,v])=>s+v*n,0);
    if (h().co.length+countGu > (h().coToiDa ?? 200)) return notify('Chỗ chứa cổ đã đầy.');
    const commit = transaction(costs,outputs);
    if (!commit) return notify('Thiếu nguyên liệu hoặc túi đã đầy.');
    commit();
    if (!j) { const chinh = h().nghe.ds.filter(j=>j.chinh).length<2; h().nghe.ds.push({id:r.nghe,chinh,diem:0,bac:0}); }
    for (const [id,v] of guOutputs) for(let i=0;i<v*n;i++) {
      let uid; do { uid='progression-gu-'+local.nextUid++; } while(gu(uid));
      h().co.push({uid,loai:id,luyenHoa:false,banMenh:false,no:100,thuanThuc:0,xp:0,
        xpCan:mastery().xp_len_cap?.[0] ?? 20,xpNgay:0,sao:0,buaToi:clock+24*HOUR,nghi:null});
    }
    const points = gainOccupation(r.nghe,n,r.bac);
    finish('nghe_che',{id:r.nghe,ma:r.ma,so:n,points,ra:r.ra},r.ten+' ×'+n+'.');
    room.emit('che_tao',craftPanel(craftPlace));
    return true;
  }

  function addMastery(uid, amount) {
    if (!ensure() || !integer(amount,1,10000)) return 0;
    const g = gu(uid);
    if (!g || g.thuanThuc >= (mastery().cap_toi_da ?? 10)) return 0;
    const cap = mastery().tran_xp_ngay_moi_co ?? 120, tiers = mastery().vuot ?? [];
    let awarded = 0;
    for (let i=0;i<amount;i++) {
      const next = num(g.xpNgay)+1;
      const factor = next <= cap ? 1 : num(tiers.find(t=>t.den === undefined || next <= t.den)?.he_so);
      awarded += factor; g.xpNgay = next;
    }
    g.xp = num(g.xp)+awarded; normalizeMastery(g);
    return awarded;
  }

  function care(p) {
    if (!h().chamCo.mo || !allowed('care') || busy()) return notify('Chưa chăm cổ được.');
    const targets = p.cham === 'het' ? h().co.filter(g=>healthy(g) && !local.cared[g.uid]) : [gu(p.cham)];
    if (!targets.length || targets.some(g=>!healthy(g) || local.cared[g.uid])) return notify('Cổ không sẵn sàng hoặc hôm nay đã chăm rồi.');
    let xp = 0;
    for (const g of targets) {
      local.cared[g.uid] = true; xp += addMastery(g.uid,mastery().cham_co_xp ?? 5);
    }
    gainOccupation('duong_co',targets.length,0);
    return finish('cham_co',{uids:targets.map(g=>g.uid),so:targets.length,xp},'Đã chăm '+targets.length+' con cổ.');
  }

  function trainGu(uid) {
    const g = gu(uid), rule = mastery().luyen_san ?? {}, p = h().luyenSan;
    if (!healthy(g) || g.thuanThuc >= (mastery().cap_toi_da ?? 10) ||
      !near([zone(),'san_luyen_tap'],rule.ban_kinh_m ?? 14) || busy() || session || !allowed('training')) return notify('Đến sân luyện tập với cổ đã luyện hóa, khỏe mạnh.');
    if (num(p.da[uid]) >= p.toiDa) return notify('Hôm nay cổ đã dùng hết lượt luyện sân.');
    const commit = transaction({}, {}, p.gia);
    if (!commit) return notify('Không đủ nguyên thạch để luyện cổ.');
    commit(); p.da[uid] = num(p.da[uid])+1;
    const xp = addMastery(uid,p.xp);
    gainOccupation('luyen_co',1,0);
    return finish('luyen_san',{uid,xp},'Cổ được luyện ở sân: +'+xp+' kinh nghiệm.');
  }

  function nursery(p) {
    const slots = h().oDuongCo;
    if (zone() !== 'inst_gia_vien' || !allowed('nursery') || busy()) return notify('Chỉ đặt / lấy cổ ở gia viên.');
    if (own(p,'lay_duong')) {
      if (!integer(p.lay_duong,0,slots.o.length-1) || !slots.o[p.lay_duong]) return notify('Ô dưỡng không hợp lệ.');
      const entry = slots.o[p.lay_duong], g = gu(entry.uid);
      if (!g) return notify('Cổ trong ô dưỡng không còn tồn tại.');
      // Production and XP up to the withdrawal instant belong to this Gu.
      settleNursery(g,clock);
      const saved = local.nursery[g.uid];
      if (g.nghi?.ly === 'duong') g.nghi = null;
      const period = (get(data().gu,g.loai)?.an?.chu_ky_gio ?? 24)*HOUR;
      g.buaToi = clock + Math.max(0,num(saved?.mealRemaining,period));
      if (h().guInventory?.foodAt) h().guInventory.foodAt[g.uid] = clock;
      delete local.nursery[g.uid]; slots.o[p.lay_duong] = null;
      return finish('lay_duong',{uid:g.uid,o:p.lay_duong},'Đã lấy '+name(g.loai)+' khỏi ô dưỡng.');
    }
    const g = gu(p.duong);
    if (!healthy(g) || g.banMenh || g.thuongNv || slots.o.some(e=>e?.uid === g.uid)) return notify('Cổ chưa sẵn sàng; không đặt bản mệnh hoặc cổ nhiệm vụ vào ô dưỡng.');
    const index = slots.o.findIndex(e=>!e);
    if (index < 0 || index >= slots.so) return notify('Hết ô dưỡng cổ. Nâng gia viên để mở thêm ô.');
    const period = (get(data().gu,g.loai)?.an?.chu_ky_gio ?? 24)*HOUR;
    const active = h().o.find(s=>s?.uid === g.uid);
    g.inventoryCd = Math.max(num(g.inventoryCd),num(active?.cd));
    h().o.forEach((s,i)=>{ if(s?.uid === g.uid) h().o[i]=emptySlot(); });
    h().obd.forEach((s,i)=>{ if(s === g.uid) h().obd[i]=null; });
    h().opt.forEach((s,i)=>{ if(s === g.uid) h().opt[i]=null; });
    local.nursery[g.uid] = {at:clock,productionAt:clock,mealRemaining:clamp(num(g.buaToi,clock+period)-clock,0,period)};
    // Local rest sentinel makes existing inventory/combat reject use/sale and
    // skip hunger. It is removed on withdrawal; the original panel uses oDuongCo.
    g.nghi = {ly:'duong',den:0}; slots.o[index] = {uid:g.uid,loai:g.loai};
    freezeNursery(g);
    return finish('o_duong_co',{uid:g.uid,o:index},'Đã đặt '+name(g.loai)+' vào ô dưỡng.');
  }

  function settleNursery(g,now) {
    const state = local.nursery[g.uid];
    if (!state) return false;
    let dirty = false;
    const hours = Math.floor(Math.max(0,now-num(state.at,now))/HOUR);
    if (hours) {
      // At most the latest 24 hours per settlement, to bound clock jumps.
      addMastery(g.uid,Math.min(24,hours)); state.at += hours*HOUR; dirty = true;
    }
    const effect = get(data().gu,g.loai)?.hu?.find(e=>e.loai === 'san_xuat');
    if (effect && integer(effect.so,1) && finite(effect.chu_ky_gio) && effect.chu_ky_gio > 0) {
      const interval = effect.chu_ky_gio*HOUR;
      const cycles = Math.min(30,Math.floor(Math.max(0,now-num(state.productionAt,now))/interval));
      if (cycles) {
        const commit = transaction({}, {[effect.item]:effect.so*cycles});
        if (commit) { commit(); state.productionAt = now; dirty = true; }
      }
    }
    return dirty;
  }

  function freezeNursery(g) {
    // Both legacy and current inventory hunger clocks honor future foodAt.
    // Freeze the deadline as well, so no automatic meal consumes the pantry.
    g.buaToi=Number.MAX_SAFE_INTEGER;
    if(h().guInventory?.foodAt)h().guInventory.foodAt[g.uid]=Number.MAX_SAFE_INTEGER;
  }

  const equipmentDef = id => {
    const item = get(data().item,id);
    if (!item?.ho_cu_o) return null;
    const exact = item.ho_cu?.chi_so ?? item.chi_so ?? get(data().bal?.ho_cu?.mon,id);
    const stats = exact ?? get(WIKI_EQUIPMENT,id);
    if (!stats) return null;
    const suffix = id.replace(/^item_(?:ao_|giay_|bao_tay_|day_chuyen_|boi_suc_|ho_cu_)/,'');
    const bo = item.ho_cu?.bo ?? SET_SUFFIX[suffix] ?? null;
    const required = item.chuyen ?? (suffix === 'duong_tam' ? 5 : suffix === 'qua_anh' ? 4 : suffix === 'dao_si' ? 3 : 1);
    return {id,o:item.ho_cu_o,bo,stats,required};
  };
  const gemSlots = row => [0,1,1,2,2,3][row.ph] ?? 0;
  const statsObject = s => ({hp:num(s?.hp),cn:num(s?.cn),cong:num(s?.cong),giap:num(s?.giap),toc:num(s?.toc),
    khang:Array.isArray(s?.khang) ? Object.fromEntries(s.khang) : s?.khang ?? {}});
  function gearStats(row) {
    const d = equipmentDef(row.id), s = statsObject(d?.stats);
    const factor = [1,1.2,1.5,1.9,2.4,3][row.ph]*(1+row.cap*0.1);
    for(const k of ['hp','cn','cong','giap','toc']) s[k] *= factor;
    return {...s,khang:Object.entries(s.khang).map(([k,n])=>[k,Math.min(0.75,num(n)*factor)])};
  }
  function upgrade(row) {
    if (row.cap >= 10) return null;
    const next = row.cap+1, source = get(data().item,row.id)?.nguon?.find(s=>s.ma === 'nghe' && s.can);
    const ingredients = source?.can ?? {item_da_heo_thuoc:2};
    const can = Object.entries(ingredients).filter(([id])=>get(data().item,id)).map(([id,n])=>({id,ten:name(id),n:n*next,nap:num(row.nap[id]),co:num(h().tui[id])}));
    const nt = 20*next, ntNap = num(row.nap.nguyen_thach);
    const total = nt+can.reduce((s,c)=>s+c.n,0), deposited = ntNap+can.reduce((s,c)=>s+c.nap,0);
    const day = can.every(c=>c.nap>=c.n) && ntNap>=nt;
    return {can,nt,ntNap,ntCo:money(),day,phan:clamp(deposited/total,0,1),
      tiLe:next<=3?1:Math.max(0.25,1-(next-3)*0.1),chac:row.baoHiem>=3,
      baoHiem:row.baoHiem,baoHiemDu:3,sau:gearStats({...row,cap:next})};
  }
  function promotion(row) {
    if (row.ph >= 5) return null;
    const phu = 2**(row.ph+1), nt = 50*(row.ph+1);
    const can = row.ph >= 2 ? [{id:'item_nanh_heo_vuong',ten:name('item_nanh_heo_vuong'),n:row.ph-1,co:num(h().tui.item_nanh_heo_vuong)}] : [];
    const phuCo = num(h().tui[row.id]);
    return {phu,phuCo,phuTen:name(row.id),nt,ntCo:money(),can,tiLe:[1,1,0.8,0.6,0.4][row.ph],
      du:phuCo>=phu && money()>=nt && can.every(c=>c.co>=c.n),sau:gearStats({...row,ph:row.ph+1})};
  }
  function gearView(row, index) {
    const d = equipmentDef(row.id);
    if (!d) return {...row,ten:name(row.id),chiSo:emptyStats(),nang:null,thang:null};
    const p = promotion(row), u = upgrade(row), sockets = gemSlots(row);
    return {...copy(row),ten:name(row.id),o:d.o,bo:d.bo,chiSo:gearStats(row),nang:u,thang:p,
      kham:{so:sockets,ds:copy(row.da),go:row.da.map(id=>+(id?.match(GEM)?.[2] ?? 0)*5)},
      ...(index===undefined?{}:{i:index,nc:{pg:[],ban:null,chuyen:null,khoa:true}})};
  }

  function computeBonuses() {
    const total = emptyStats(), resist = {}, groups = new Map();
    const stones = {sat_thuong:0,chi_mang:0,giam:0,sinh_luc:0,tuTuong:false}, types = new Map();
    const add = (s, factor = 1) => {
      for(const k of ['hp','cn','cong','giap','toc']) total[k] += num(s[k])*factor;
      for(const [k,n] of (Array.isArray(s.khang)?s.khang:Object.entries(s.khang ?? {}))) resist[k] = num(resist[k])+num(n)*factor;
    };
    for (const [slot,row] of Object.entries(local.equipment.o)) {
      const def = equipmentDef(row?.id);
      if (!def || def.o !== slot || def.required > rank()) continue;
      add(gearStats(row));
      if (def.bo) { const g=groups.get(def.bo)??[]; g.push(row); groups.set(def.bo,g); }
      for (const id of row.da.slice(0,gemSlots(row))) {
        const m = typeof id === 'string' && id.match(GEM); if(!m)continue;
        const key = {bach_ho:'sat_thuong',chu_tuoc:'chi_mang',huyen_vu:'giam',thanh_long:'sinh_luc'}[m[1]], level=+m[2];
        stones[key] += level*0.01; types.set(m[1],Math.max(types.get(m[1])??0,level));
      }
    }
    const bo=[];
    for(const [id,rows] of groups) {
      const base = emptyStats();
      for(const row of rows){const s=gearStats(row);for(const k of ['hp','cn','cong'])base[k]+=s[k];}
      // Public docs establish 2/4 piece activation; percentages are local policy.
      const published = get(data().bal?.ho_cu?.bo,id);
      const du2Cs = published?.du2 ?? {...base,hp:base.hp*0.1,cn:base.cn*0.1,cong:base.cong*0.1};
      const du4Cs = published?.du4 ?? {...base,hp:base.hp*0.2,cn:base.cn*0.2,cong:base.cong*0.2};
      const du2=rows.length>=2,du4=rows.length>=4;
      if(du2)add(du2Cs); if(du4)add(du4Cs);
      bo.push({bo:id,so:rows.length,du2,du4,du2Cs,du4Cs});
    }
    stones.tuTuong = types.size===4 && [...types.values()].every(n=>n>=3);
    if(stones.tuTuong)for(const k of ['sat_thuong','chi_mang','giam','sinh_luc'])stones[k]+=0.02;
    total.khang=Object.entries(resist).map(([k,n])=>[k,Math.min(0.75,n)]);
    return {total,bo,stones};
  }

  // Non-recursive hook for room.refresh(). Optional base argument replaces the
  // stat baseline; pass unmodified base stats, never already-bonused maxima.
  function applyBonuses(base) {
    if (!ensure()) return null;
    if (base) for(const k of ['hpMax','cnMax','cong','giap','tocDo']) {
      if(finite(base[k]))local.base[k]=base[k];
    }
    else if(lastApplied)for(const k of ['hpMax','cnMax','cong','giap','tocDo']) {
      const delta=num(player()[k],lastApplied[k])-lastApplied[k];
      if(Math.abs(delta)>1e-8)local.base[k]+=delta;
    }
    const {total,bo,stones}=computeBonuses(), b=local.base, growth=local.realmGains;
    const passive=room.combat?.getPassiveBonuses?.()??{},attributes=passive.attributes??{};
    const result={hpMax:Math.max(1,((b.hpMax+growth*40)*(1+num(attributes.sinh_luc_toi_da))+total.hp)*(1+stones.sinh_luc)),
      cnMax:Math.max(rank()>0?1:0,(b.cnMax+growth*10)*(1+num(attributes.cn_toi_da))+total.cn),cong:b.cong+growth*3+total.cong,
      giap:b.giap+total.giap,tocDo:Math.max(0.1,b.tocDo*(1+num(attributes.toc_chay)+num(passive.speedBonus))+total.toc)};
    Object.assign(player(),result,{chuyen:rank(),giai:STAGES[h().tv.giai],
      hp:Math.min(num(player().hp),result.hpMax),cn:Math.min(num(player().cn),result.cnMax)});
    lastApplied=result;
    h().hoCu.tong=total; h().hoCu.bo=bo; h().hoCu.da={tui:Object.entries(h().tui).filter(([id,n])=>GEM.test(id)&&n>0).map(([id,so])=>{
      const m=id.match(GEM),level=+m[2]; return {id,so,ten:name(id),ghep:level<5?{can:3,nt:10*level}:null};
    }),cs:stones};
    for(const k of ['hpMax','cnMax','hp','cn'])h()[k]=player()[k];
    h().chiSoChienDau={...(h().chiSoChienDau??{}),hp:{goc:b.hpMax+growth*40,hoCu:result.hpMax-(b.hpMax+growth*40)},
      cn:{goc:b.cnMax+growth*10,hoCu:total.cn},cong:{goc:b.cong+growth*3,hoCu:total.cong},
      giap:{goc:b.giap,hoCu:total.giap},toc:{goc:b.tocDo,hoCu:total.toc},khang:copy(total.khang)};
    return copy({...total,gems:stones});
  }

  function recalculate() {
    if (refreshing || !ensure()) return;
    refreshing=true;
    try {
      rollover();
      for(const j of h().nghe.ds) { j.diem=clamp(num(j.diem),0,100); j.bac=pointsTier(j.diem); }
      for(const g of h().co) normalizeMastery(g);
      h().chamCo.xp=mastery().cham_co_xp??5;
      h().chamCo.con=h().co.filter(g=>healthy(g)&&!local.cared[g.uid]).map(g=>g.uid);
      h().oDuongCo.so=clamp(Math.floor(num(h().oDuongCo.so)),0,64);
      while(h().oDuongCo.o.length<h().oDuongCo.so)h().oDuongCo.o.push(null);
      const hc=h().hoCu;
      hc.o=Object.fromEntries(Object.entries(local.equipment.o).map(([slot,row])=>[slot,gearView(row)]));
      hc.cat=local.equipment.cat.map((r,i)=>gearView(r,i)); hc.tui={}; hc.bua=[]; hc.tamThoi=false;
      for(const [id,n] of Object.entries(h().tui)) if(n>0&&equipmentDef(id))hc.tui[id]=gearView({id,cap:0,ph:0,da:[],nap:{},baoHiem:0});
      for(const [id,them] of [['item_bua_cuong_hoa_nho',0.1],['item_bua_cuong_hoa_lon',0.25]])if(num(h().tui[id])>0)hc.bua.push({id,ten:name(id),so:h().tui[id],them});
      // Cosmetic counts remain in the main bag, except legacy captured rows.
      const cosmetics={...local.cosmetics,...h().tui};
      h().doDeo.tui=Object.entries(cosmetics).filter(([id,n])=>n>0&&WEAR.includes(get(data().item,id)?.do_deo?.o)).map(([id,so])=>({id,so,ten:name(id),...data().item[id].do_deo}));
      for(const [slot,row] of Object.entries(h().doDeo.o)) {
        const id=typeof row==='string'?row:row?.id, d=get(data().item,id)?.do_deo;
        if(d&&d.o===slot)h().doDeo.o[slot]={id,ten:name(id),...d};
      }
      const tv=h().tv; tv.chuyen=rank(); tv.can=REALMS[rank()]?.[tv.giai]??num(tv.can);
      const preview=breakthroughPreview();
      h().dotPha={...(h().dotPha??{}),mo:allowed('breakthrough')&&rank()>0&&rank()<5,
        day:tv.giai===3&&tv.diem>=tv.can,choMo:!allowed('breakthrough'),xemTruoc:rank()>0&&rank()<5};
      h().nt=h().nguyenThach=money();
      if(room.progress)room.progress.training=tv.diem;
      applyBonuses();
      return preview;
    } finally {refreshing=false;}
  }

  function equipment(p) {
    if (busy() || session || !allowed('equipment')) return notify('Chưa thể thay đổi hộ cụ lúc này.');
    const eq=local.equipment, selected=SLOTS.includes(p.o)?eq.o[p.o]:undefined;
    if(p.hd==='mac') {
      let row,index;
      if(p.tu==='cat') {
        if(!integer(p.i,0,eq.cat.length-1))return notify('Món đã cất không hợp lệ.');
        index=p.i; row=eq.cat[index];
      } else {
        if(p.tu!==undefined || !equipmentDef(p.id))return notify('Không có số liệu công khai cho món hộ cụ này.');
        row={id:p.id,cap:0,ph:0,nap:{},baoHiem:0,da:[]};
      }
      const def=equipmentDef(row.id);
      if(!def || def.required>rank() || get(data().item,row.id)?.khoa)return notify('Cảnh giới chưa đủ hoặc món hộ cụ bị khóa.');
      const commit=index===undefined?transaction({[row.id]:1}):()=>{};
      if(!commit)return notify('Không có món hộ cụ trong túi.');
      commit(); if(index!==undefined)eq.cat.splice(index,1);
      if(eq.o[def.o])eq.cat.push(eq.o[def.o]); eq.o[def.o]=row;
      return finish('ho_cu',{hd:p.hd,id:row.id,o:def.o},'Đã mặc '+name(row.id)+'.');
    }
    if(p.hd==='coi') {
      if(!selected)return notify('Ô hộ cụ trống hoặc không hợp lệ.');
      eq.cat.push(selected); delete eq.o[p.o];
      return finish('ho_cu',{hd:p.hd,id:selected.id,o:p.o},'Đã cởi hộ cụ; cấp và phẩm vẫn giữ.');
    }
    if(p.hd==='bo') {
      if(!integer(p.i,0,eq.cat.length-1))return notify('Món đã cất không hợp lệ.');
      const row=eq.cat[p.i],returned={};
      for(const id of row.da)if(id)returned[id]=num(returned[id])+1;
      const commit=transaction({},returned);
      if(!commit)return notify('Cần chỗ trống để trả đá khảm về túi.');
      commit(); eq.cat.splice(p.i,1);
      return finish('ho_cu',{hd:p.hd,id:row.id},'Đã bỏ món hộ cụ đã cất; đá khảm được trả về túi.');
    }
    if(p.hd==='ghep_da') {
      const m=typeof p.da==='string'&&p.da.match(GEM);
      if(!m || +m[2]>=5)return notify('Đá không hợp lệ hoặc đã đạt cấp tối đa.');
      const next='item_da_'+m[1]+'_'+(+m[2]+1),commit=transaction({[p.da]:3},{[next]:1},10*(+m[2]));
      if(!commit)return notify('Cần ba đá cùng cấp, nguyên thạch và chỗ trống.');
      commit();return finish('ho_cu',{hd:p.hd,da:next},'Ghép đá thành công.');
    }
    if(!selected || !equipmentDef(selected.id))return notify('Ô hộ cụ không hợp lệ hoặc thiếu số liệu công khai.');
    if(p.hd==='nap') {
      const u=upgrade(selected);
      if(!u || !object(p.vat) || !Object.keys(p.vat).length)return notify('Số nạp không hợp lệ.');
      const required=Object.fromEntries(u.can.map(c=>[c.id,c.n])); required.nguyen_thach=u.nt;
      const costs={};let nt=0;
      for(const [id,n]of Object.entries(p.vat)) {
        if(!own(required,id) || !integer(n,1,required[id]-num(selected.nap[id])))return notify('Số nạp không hợp lệ, chưa nạp gì.');
        if(id==='nguyen_thach')nt=n;else costs[id]=n;
      }
      const commit=transaction(costs,{},nt);
      if(!commit)return notify('Thiếu vật liệu / nguyên thạch, chưa nạp gì.');
      commit();for(const [id,n]of Object.entries(p.vat))selected.nap[id]=num(selected.nap[id])+n;
      return finish('ho_cu',{hd:p.hd,id:selected.id},'Đã nạp vật liệu vào thanh cường hóa.');
    }
    const charm= p.bua===undefined?null:h().hoCu.bua.find(b=>b.id===p.bua);
    if(p.bua!==undefined&&!charm)return notify('Bùa cường hóa không hợp lệ.');
    if(p.hd==='len') {
      const u=upgrade(selected);
      if(!u?.day)return notify('Nạp đầy thanh trước khi cường hóa.');
      const commit=transaction(charm?{[charm.id]:1}:{});
      if(!commit)return notify('Không còn bùa trong túi.');
      const chance=u.chac?1:Math.min(1,u.tiLe+num(charm?.them));
      const success=chance>=1 || random()<chance;
      commit();
      if(success){selected.cap++;selected.nap={};selected.baoHiem=0;}
      else{for(const id of Object.keys(selected.nap))selected.nap[id]=Math.floor(selected.nap[id]/2);selected.baoHiem++;}
      return finish('ho_cu',{hd:p.hd,id:selected.id,success,cap:selected.cap},success?'Cường hóa thành công.':'Cường hóa không thành; mất nửa thanh, tích một điểm bảo hiểm.');
    }
    if(p.hd==='thang_pham') {
      const v=promotion(selected);
      if(!v?.du)return notify('Chưa đủ món phụ, vật liệu hoặc nguyên thạch để thăng phẩm.');
      const cost=Object.fromEntries(v.can.map(c=>[c.id,c.n]));
      cost[selected.id]=v.phu;
      if(charm)cost[charm.id]=num(cost[charm.id])+1;
      // Plan the full attempt before drawing RNG or touching the main item.
      if(!transaction(cost,{},v.nt))return notify('Thiếu nguyên liệu thăng phẩm.');
      const success=v.tiLe+num(charm?.them)>=1 || random()<v.tiLe+num(charm?.them);
      if(!success)cost[selected.id]=Math.ceil(v.phu/2);
      const commit=transaction(cost,{},v.nt);commit();if(success)selected.ph++;
      return finish('ho_cu',{hd:p.hd,id:selected.id,success,ph:selected.ph},success?'Thăng phẩm thành công.':'Thăng phẩm không thành; giữ nguyên phẩm và cấp, mất nửa món phụ.');
    }
    if(p.hd==='kham' || p.hd==='go_da') {
      if(!integer(p.i,0,gemSlots(selected)-1))return notify('Ô khảm chưa mở hoặc không hợp lệ.');
      const old=selected.da[p.i],cost={},output={};let nt=0;
      if(p.hd==='kham') {
        const m=typeof p.da==='string'&&p.da.match(GEM);
        if(!m || selected.da.some((id,i)=>i!==p.i&&id?.match(GEM)?.[1]===m[1]))return notify('Một món không khảm hai viên cùng loại.');
        if(old)return notify('Gỡ đá đang có trước khi khảm đá mới.');
        cost[p.da]=1;
      }else{
        if(!old)return notify('Ô khảm trống.');
        output[old]=1;nt=+(old.match(GEM)?.[2]??0)*5;
      }
      const commit=transaction(cost,output,nt);
      if(!commit)return notify('Thiếu đá, nguyên thạch hoặc chỗ trống trong túi.');
      commit();selected.da[p.i]=p.hd==='kham'?p.da:null;
      return finish('ho_cu',{hd:p.hd,id:selected.id},p.hd==='kham'?'Đã khảm đá.':'Đã gỡ đá về túi.');
    }
    return notify('Thao tác hộ cụ này chưa có số liệu phục dựng; chưa trừ tài nguyên.');
  }

  const random = () => {
    const r=room.random?.() ?? Math.random();return finite(r)&&r>=0&&r<1?r:0.999999;
  };

  function cosmetics(p) {
    if(busy() || session || !allowed('equipment'))return notify('Chưa thể thay đồ đeo lúc này.');
    const rows=h().doDeo.o;
    if(p.hd==='thao') {
      const row=WEAR.includes(p.o)&&rows[p.o];if(!row)return notify('Ô đồ đeo không hợp lệ.');
      const commit=transaction({},{[row.id]:1});if(!commit)return notify('Túi đã đầy.');
      commit();delete rows[p.o];return finish('do_deo',{hd:p.hd,id:row.id,o:p.o},'Đã tháo đồ đeo.');
    }
    const def=get(data().item,p.id)?.do_deo;
    if(p.hd!=='deo' || !def || !WEAR.includes(def.o))return notify('Đồ đeo không hợp lệ.');
    const fromLegacy=num(h().tui[p.id])<1 && num(local.cosmetics[p.id])>0;
    const old=rows[def.o];
    const commit=transaction(fromLegacy?{}:{[p.id]:1},old?{[old.id]:1}:{});
    if(!commit)return notify('Không sở hữu món đồ đeo hoặc túi đã đầy.');
    commit();if(fromLegacy)local.cosmetics[p.id]--;
    rows[def.o]={id:p.id,ten:name(p.id),...def};
    // Existing renderer reads the schema cosmetic fields as well as ho_so.
    for(const k of WEAR)player()[k]=rows[k]?.hinh??'';
    room.changed?.(player());
    return finish('do_deo',{hd:p.hd,id:p.id,o:def.o},'Đã đeo '+name(p.id)+'.');
  }

  function guBonus(effect) {
    return Math.max(0,...h().co.filter(healthy).flatMap(g=>(get(data().gu,g.loai)?.hu??[])
      .filter(e=>e.loai===effect && e.chi_chuyen===rank()).map(e=>num(e.gia_tri))));
  }

  function absorbFactor() {
    const cap=bal().tai_khieu_ngay?.['chuyen_'+rank()] ?? 30;
    const next=local.absorbed+1, tiers=bal().tai_khieu_vuot ?? bal().vuot;
    if(next<=cap)return 1;
    if(Array.isArray(tiers))return num(tiers.find(t=>t.den===undefined||next<=t.den)?.he_so);
    // Current official prose says excess stones continue at reduced efficiency.
    // The older recovered text says zero beyond 2x; prefer the current prose.
    return next<=cap*2?0.5:0.25;
  }

  function addTuVi(amount, source = 'reward') {
    if(!ensure() || !finite(amount) || amount<=0 || amount>1e9 || rank()<1 || !REALMS[rank()])return 0;
    const tv=h().tv;let rest=amount,awarded=0;
    while(rest>0) {
      const can=REALMS[rank()][tv.giai],space=Math.max(0,can-tv.diem),gain=Math.min(space,rest);
      tv.diem+=gain;rest-=gain;awarded+=gain;
      if(tv.diem>=can && tv.giai<3) {
        tv.diem-=can;tv.giai++;local.realmGains++;
        event('len_giai',{chuyen:rank(),giai:tv.giai,source});
        room.emit('len_canh',{chuyen:rank(),giai:STAGES[tv.giai]});
      } else break;
    }
    tv.can=REALMS[rank()][tv.giai];
    if(room.progress)room.progress.training=tv.diem;
    return awarded;
  }

  function cultivationMini() {
    if(session?.kind!=='cultivation')return;
    const cap=bal().tai_khieu_ngay?.['chuyen_'+rank()]??30;
    room.emit('mini',{loai:'tu_luyen',tuVi:session.tv,vien:session.stones,nt:Math.floor(money()),
      hap:local.absorbed,tran:cap,hs:absorbFactor(),tuTu:session.auto?1:0});
  }

  function safePlace() {
    if(zone()==='inst_dot_pha'||zone()==='inst_gia_vien'||zone()==='zone_ta_gia_trai')return true;
    const z=get(data().zones,zone());
    return z?.pvp==='an_toan' || (z?.noi??[]).some(n=>n.loai==='tram'&&Math.hypot(player().x-n.x,player().y-n.y)<=8);
  }

  function startCultivation() {
    if(!ensure())return false;
    clock=Math.max(clock,Date.now());rollover();
    if(session?.kind==='cultivation'){cultivationMini();return true;}
    if(busy()||session||rank()<1||!REALMS[rank()]||!safePlace()||!allowed('cultivation'))return notify('Tu luyện cần chỗ an toàn, khiếu đã mở và không giao chiến.');
    if(h().tv.giai===3&&h().tv.diem>=h().tv.can)return notify('Thanh đỉnh phong đã đầy. Mở bảng Đột phá để xem điều kiện.');
    session={kind:'cultivation',held:false,auto:false,stones:0,tv:0,next:clock+1500,zone:zone(),x:player().x,y:player().y,hp:player().hp};
    sitting=true;absorbing=false;player().dong='sit';
    room.changed?.(player());cultivationMini();
    return true;
  }

  function stopSession() {
    const had=!!session;session=null;sitting=absorbing=false;
    if(player().dong==='sit')player().dong='idle';
    if(had)room.emit('mini',null);
    return had;
  }

  function materialSources(id) {
    const sources=[];
    for(const [z,d] of Object.entries(data().zones??{}))for(const n of d.noi??[]) {
      if(n.item===id)sources.push({chu:room.label?.(n.ten_key,n.id)??n.id,dich:{zone:z,x:n.x,y:n.y}});
    }
    for(const source of get(data().item,id)?.nguon??[]) {
      if(source.ma==='nghe')sources.push({chu:jobName(source.chi),...(source.noi?{dich:{zone:source.noi[0],
        ...get(data().zones,source.noi[0])?.noi?.find(n=>n.id===source.noi[1])}}:{})});
    }
    if(!sources.length)sources.push({chu:id==='item_nguyen_tuyen_lang'?'Nhiệm vụ chính cuối năm':'Thú vương / phó bản / Thương hội (xem wiki)'});
    return sources;
  }

  function breakthroughPreview() {
    const tv=h().tv,rule=BREAKTHROUGHS[rank()],paid=local.breakthrough?.rank===rank();
    const canRank=rank()>0&&rank()<5;
    const gate=allowed('breakthrough') && allowed('breakthrough:'+rank());
    const peak=tv.giai===3&&tv.diem>=tv.can&&tv.can>0;
    const phi=rule?.nt??0;
    const dk=[{ma:'dinh_phong',du:peak,giai:tv.giai,phan:tv.can>0?Math.min(1,tv.diem/tv.can):0},
      {ma:'nhiem_vu',du:gate},{ma:'nguyen_thach',du:paid||money()>=phi,co:Math.floor(money()),can:phi}];
    const nl=Object.entries(rule?.can??{}).map(([id,n])=>({item:id,ten:name(id),can:n,co:num(h().tui[id]),
      du:paid||num(h().tui[id])>=n,kiem:materialSources(id)}));
    return {tu:rank(),len:rank()+1,phi,dk,nl,thieu:dk.filter(d=>!d.du).length+nl.filter(n=>!n.du).length,
      daNop:paid,tran:!canRank,choMo:!gate,coTheLen:canRank&&gate,xemTruoc:!gate};
  }

  function enterBreakthrough(p) {
    const preview=breakthroughPreview();
    if(p.hd==='xem'){room.emit('dot_pha',preview);return true;}
    if(p.hd!=='vao')return notify('Lệnh đột phá không hợp lệ.');
    if(busy()||session?.kind==='breakthrough'||!preview.coTheLen||(!preview.daNop&&preview.thieu)||!preview.dk[0].du)return notify('Chưa đủ điều kiện đột phá. Hãy xem bảng điều kiện.');
    if(!preview.daNop) {
      const rule=BREAKTHROUGHS[rank()],commit=transaction(rule.can,{},rule.nt);
      if(!commit)return notify('Thiếu nguyên liệu / nguyên thạch; chưa nộp gì.');
      commit();local.breakthrough={rank:rank(),fee:rule.nt,failures:0};
    }
    stopSession();finish('dot_pha_nop',{chuyen:rank()});room.emit('dot_pha',null);
    if(zone()==='inst_dot_pha')return startTrial();
    room.travel?.('inst_dot_pha');
    return true;
  }

  function trialMini() {
    if(session?.kind!=='breakthrough')return;
    const boost=guBonus('rong_vung_dot_pha'),aGoc=0.45,bGoc=0.65,width=bGoc-aGoc;
    room.emit('mini',{loai:'xung_kich',tu:rank(),len:rank()+1,nhip:session.hits,can:3,
      aGoc,bGoc,a:aGoc-width*boost/2,b:bGoc+width*boost/2,tuu:boost>0?1:0,
      tien:session.held?Math.min(1,(clock-session.heldAt)/2000):0,giu:session.held?1:0,coS:2,
      cn:Math.floor(player().cn),cnMax:Math.floor(player().cnMax),gia:local.breakthrough.fee,
      phi:Math.max(1,Math.ceil(local.breakthrough.fee*0.1))});
  }

  // Own timing trial, independent of encounters.startTrial. Only a paid receipt
  // and a real bồ đoàn interaction may start it; no client-supplied score trusted.
  function startTrial() {
    if(!ensure())return false;
    if(session?.kind==='breakthrough'){trialMini();return true;}
    const paid=local.breakthrough,preview=breakthroughPreview();
    if(!paid||paid.rank!==rank()||!preview.coTheLen||!preview.dk[0].du||busy()||
      !near(['inst_dot_pha','bo_doan']) || player().cn < player().cnMax*0.3)return notify('Tới bồ đoàn, nộp đủ nguyên liệu và hồi ít nhất 30% chân nguyên trước khi xung kích.');
    stopSession();session={kind:'breakthrough',held:false,heldAt:0,hits:0,zone:zone(),x:player().x,y:player().y,hp:player().hp};
    trialMini();return true;
  }

  function trialInput(p) {
    if(!own(p,'giu')||typeof p.giu!=='boolean')return notify('Lệnh giữ / thả không hợp lệ.');
    if(p.giu) {
      if(!session.held){session.held=true;session.heldAt=clock;trialMini();}
      return true;
    }
    if(!session.held)return true; // repeated keyup cannot award a beat
    const heldFor=(clock-session.heldAt)/2000,boost=guBonus('rong_vung_dot_pha');
    const hit=heldFor>=0.45-0.1*boost&&heldFor<=0.65+0.1*boost;
    const cost=player().cnMax*0.1;
    session.held=false;
    if(player().cn+1e-8<cost){stopSession();return finish(null,{},'Thiếu chân nguyên; có thể hồi rồi vào lại, không nộp lại nguyên liệu.');}
    player().cn=Math.max(0,player().cn-cost);
    if(!hit) {
      const fee=Math.max(1,Math.ceil(local.breakthrough.fee*0.1)),commit=transaction({}, {}, fee);
      session.hits=0;local.breakthrough.failures++;
      if(!commit){stopSession();return finish('dot_pha_lo_nhip',{fee,paid:false},'Lỡ nhịp, thiếu phí làm lại. Nguyên liệu đã nộp vẫn được giữ.');}
      commit();room.emit('mini_dap',{dung:false,text:'Lỡ nhịp. Đã nộp '+fee+' nguyên thạch để thử lại.'});
      finish('dot_pha_lo_nhip',{fee,paid:true});trialMini();return true;
    }
    session.hits++;
    if(session.hits>=3) {
      const from=rank();h().chuyen=from+1;h().tv={...h().tv,chuyen:from+1,giai:0,diem:0,can:REALMS[from+1][0]};
      local.realmGains++;delete local.breakthrough;stopSession();
      finish('dot_pha',{from,chuyen:from+1});room.emit('len_canh',{chuyen:from+1,giai:'so'});
      room.notify('Đột phá thành công · Chuyển '+(from+1)+'.');return true;
    }
    room.emit('mini_dap',{dung:true,text:'Xung kích trúng nhịp.'});
    finish('dot_pha_nhip',{nhip:session.hits});trialMini();return true;
  }

  function mini(p) {
    if(p.huy===true&&Object.keys(p).length===1){stopSession();room.save?.();return true;}
    if(own(p,'huy')||['giu','tuTu'].some(k=>own(p,k)&&typeof p[k]!=='boolean') ||
      (!own(p,'giu')&&!own(p,'tuTu')) || Object.keys(p).some(k=>!['giu','tuTu'].includes(k)))return notify('Lệnh tu luyện không hợp lệ.');
    if(session.kind==='breakthrough') {
      if(own(p,'tuTu'))return notify('Thử thách đột phá cần giữ / thả đúng nhịp.');
      return trialInput(p);
    }
    if(own(p,'giu'))session.held=p.giu;
    if(own(p,'tuTu'))session.auto=p.tuTu;
    cultivationMini();return true;
  }

  // Trusted integration callback, never a client command. Supports the agreed
  // (kind,payload) signature and inventory's existing single event-object form.
  function onEvent(kind, payload = {}) {
    if(object(kind)){payload=kind;kind=kind.type;}
    if(!ensure()||!object(payload))return false;
    if(kind==='learn-occupation'||kind==='nghe_hoc')return learn(payload.id);
    if(kind==='tu-vi'||kind==='tu_vi') {
      const amount=addTuVi(payload.amount??payload.so,payload.source??'reward');
      if(amount)finish('tu_vi',{so:amount,source:payload.source??'reward'});return amount>0;
    }
    if(kind==='mastery') {
      const amount=addMastery(payload.uid,payload.amount??payload.so);
      if(amount)finish(null);return amount>0;
    }
    if(kind==='damage'||kind==='hurt') {if(session){stopSession();room.save?.();}return true;}
    if(kind==='craft') {
      const id=payload.profession??(payload.recipe&&get(data().recipe,payload.recipe)?'luyen_co':undefined);
      const j=id&&job(id);
      if(!j)return false;
      const r=get(data().bal?.nghe?.che_tao,payload.recipe),tier=r?.bac??Math.max(0,(get(data().gu,payload.id)?.chuyen??1)-1);
      const amount=gainOccupation(id,payload.success===false?2:4,tier);
      if(amount)finish(null);return true;
    }
    if(kind==='gu-refine'||kind==='refine') {
      if(payload.success===false)return false;
      if(!job('luyen_co'))learn('luyen_co');
      const gained=gainOccupation('luyen_co',1,0);if(gained)finish(null);return true;
    }
    if(kind==='occupation-work') {
      const n=gainOccupation(payload.id,payload.amount??1,payload.tier??0);
      if(n)finish('nghe_diem',{id:payload.id,so:n});return n>0;
    }
    return false;
  }

  function owns(type,p={}) {
    if(['nghe','ho_cu','do_deo','ngoi','hap','dot_pha'].includes(type))return true;
    if(type==='mini')return !!session;
    if(type==='co')return object(p)&&['cham','duong','lay_duong','luyen_san'].some(k=>own(p,k));
    if(type==='che')return typeof p?.ma==='string'&&p.ma.startsWith('nghe:');
    if(type==='che_tao')return object(p)&&(p.nghe===true||Array.isArray(p.noi));
    return false;
  }

  function openCrafting(p={}) {
    if(!ensure())return false;
    if(!object(p))return notify('Lệnh chế tạo không hợp lệ.');
    const place=Array.isArray(p.noi)?p.noi:null;
    if(place&&!near(place))return notify('Đến đúng bàn chế tạo.');
    craftPlace=place;room.emit('che_tao',craftPanel(place));return true;
  }

  function handle(type,p={}) {
    if(room.intro?.active)return false;
    // Shared mini messages belong to whichever system opened the panel.
    if(type==='mini'&&!session)return false;
    const movement=type==='in'&&object(p)&&(p.dx||p.dy);
    if(movement&&session){stopSession();room.save?.();return false;}
    if(!owns(type,p)&&type!=='f')return false;
    if(!object(p))return owns(type,p)?notify('Lệnh tiến triển không hợp lệ.'):false;
    if(!ensure())return false;
    clock=Math.max(clock,Date.now());rollover();
    if(type==='nghe') {
      // hoc is a LOCAL story/first-work adapter entry point, not an observed
      // outgoing client command. The original panel sends bo/chinh/doi only.
      if(p.hd==='hoc')return learn(p.id)||notify('Nghề không hợp lệ hoặc chưa mở.');
      return occupation(p);
    }
    if(type==='ho_cu')return equipment(p);
    if(type==='do_deo')return cosmetics(p);
    if(type==='co') {
      const actions=['cham','duong','lay_duong','luyen_san','lap','go','an','luyen','giai_luyen','hoi_sinh','tha'].filter(k=>own(p,k));
      if(actions.length!==1)return notify('Mỗi lần chỉ thực hiện một thao tác cổ.');
      if(own(p,'cham'))return care(p);
      if(own(p,'luyen_san'))return trainGu(p.luyen_san);
      return nursery(p);
    }
    if(type==='che')return craft(p);
    if(type==='che_tao')return openCrafting(p);
    if(type==='dot_pha')return enterBreakthrough(p);
    if(type==='mini')return mini(p);
    if(type==='ngoi') {
      if(busy())return notify('Không thể ngồi khi giao chiến hoặc trọng thương.');
      if(session){stopSession();room.save?.();return true;}
      sitting=!sitting;absorbing=false;player().dong=sitting?'sit':'idle';room.changed?.(player());
      return true;
    }
    if(type==='hap') {
      if(typeof p.giu!=='boolean')return notify('Lệnh hấp thu không hợp lệ.');
      if(session)return mini({giu:p.giu});
      if(rank()<1||busy())return notify('Chưa hấp thu được chân nguyên.');
      absorbing=p.giu;return true;
    }
    if(type==='f') {
      if(p.id==='bo_doan'&&zone()==='inst_dot_pha') {
        if(!near(['inst_dot_pha','bo_doan']))return notify('Đến gần bồ đoàn để tu luyện.');
        return local.breakthrough?.rank===rank()?startTrial():startCultivation();
      }
      if(sitting&&(!p.id||p.id==='tu_luyen'))return startCultivation();
      const places=[...new Map([...recipes().values()].filter(r=>r.noi?.[1]===p.id&&r.noi[0]===zone()).map(r=>[r.noi.join(':'),r.noi])).values()];
      if(places.length)return openCrafting({noi:places[0]});
    }
    return false;
  }

  function tick(now) {
    if(!finite(now)||now<clock||!ensure())return;
    clock=now;const reset=rollover();
    const elapsed=Math.min(2,Math.max(0,(now-lastTick)/1000));lastTick=now;
    let dirty=reset;
    for(const slot of h().oDuongCo.o) {
      const g=slot&&gu(slot.uid);if(!g||g.nghi?.ly!=='duong')continue;
      freezeNursery(g);dirty=settleNursery(g,now)||dirty;
    }
    if(session) {
      const moved=zone()!==session.zone||Math.hypot(player().x-session.x,player().y-session.y)>0.5;
      if(moved||busy()||player().hp<session.hp){stopSession();dirty=true;}
    }
    if(session?.kind==='cultivation'&&(session.held||session.auto)&&now>=session.next) {
      // Online work only: no offline cultivation or runaway catch-up spending.
      const steps=Math.min(5,1+Math.floor((now-session.next)/1500));
      for(let i=0;i<steps&&session?.kind==='cultivation';i++) {
        if(h().tv.giai===3&&h().tv.diem>=h().tv.can){stopSession();break;}
        const commit=transaction({}, {}, 1);
        if(!commit){stopSession();notify('Cần nguyên thạch để tiếp tục tu luyện.');break;}
        const base=bal().tu_vi_moi_vien?.['chuyen_'+rank()]??4;
        const gain=base*absorbFactor()*(zone()==='inst_dot_pha'?1:0.75)*(1+guBonus('tang_hieu_suat_tu_luyen'));
        commit();local.absorbed++;session.stones++;
        const awarded=addTuVi(gain,'cultivation');session.tv+=awarded;
        player().cn=Math.min(player().cnMax,player().cn+Math.max(1,player().cnMax*0.2));
        event('tu_luyen',{so:awarded,stones:1,absorbed:local.absorbed});dirty=true;
      }
      if(session){session.next=now+1500;cultivationMini();}
    } else if(session?.kind==='breakthrough') {
      trialMini();
    } else if(!session&&absorbing&&now-num(local.lastAbsorb)>=1500&&player().cn<player().cnMax) {
      const commit=transaction({}, {}, 1);
      if(commit){commit();player().cn=Math.min(player().cnMax,player().cn+player().cnMax*0.2);dirty=true;}
      else absorbing=false;
      local.lastAbsorb=now;
    }
    if(sitting&&!session&&alive()&&elapsed>0) {
      const hp=player().hp,cn=player().cn;
      player().hp=Math.min(player().hpMax,hp+elapsed*2);player().cn=Math.min(player().cnMax,cn+elapsed*3);
      dirty=dirty||player().hp!==hp||player().cn!==cn;
    }
    if(dirty)finish(null);
  }

  function begin() {
    if(!ensure())return false;
    if(!begun)settleOffline();
    recalculate();
    if(!begun){begun=true;room.refresh?.();room.save?.();}
    return true;
  }

  function settleOffline() {
    const q=h().beQuan;
    const previous=room.previousSavedAt;
    if(!q?.mo||rank()<1||!finite(previous)||previous<=0||previous>=clock)return;
    const since=Math.max(previous,num(local.offlineAt,previous));
    // Reconnection grace is bounded to the remaining daily allowance, even
    // after weeks away. No refund, repeated receipt, or offline trial progress.
    const cap=num(q.tran,num(data().bal?.limits?.be_quan_gio?.mac_dinh,8));
    const hours=Math.min(Math.floor((clock-since)/HOUR),Math.max(0,cap-num(q.daDung)));
    local.offlineAt=clock;
    if(hours<=0)return;
    const perHour=bal().be_quan?.tu_vi_moi_gio?.['chuyen_'+rank()];
    if(!finite(perHour)||perHour<=0)return;
    const awarded=addTuVi(hours*perHour,'be_quan');q.daDung=num(q.daDung)+hours;q.moiGio=perHour;
    if(awarded){room.notify?.('Bế quan: +'+awarded+' tu vi ('+hours+' giờ).');event('be_quan',{so:awarded,hours});}
  }

  const api={handle,owns,tick,begin,refresh:recalculate,recalculate,applyBonuses,rebase:applyBonuses,startCultivation,startTrial,
    onEvent,learn,addTuVi,addMastery,gainOccupation,openCrafting,
    get active(){return session?.kind??null;},get isSitting(){return sitting;},
    bonuses(){if(!ensure())return null;return copy(computeBonuses());},
    recipes(){if(!ensure())return [];return copy([...recipes().values()]);},
    preview(){if(!ensure())return null;return copy(breakthroughPreview());}};
  room.progression=api;
  return api;
}

