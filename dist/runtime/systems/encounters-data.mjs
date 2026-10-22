/** Public wiki 21 Oct 2026: rank and drop ranges. Probability is NOT public.
 * Extracted from recovered public/wiki/thu/*.html; current dungeon pages were
 * checked 22 Oct. Numeric combat fallback and rarity chances are local policy.
 * Full source, scope and integration: reports/ENCOUNTERS-V3.md.
 */
export const WIKI_BEASTS = {
"beast_bong_lang_phu": {"rank":3,"drops":[]},
"beast_buu": {"rank":3,"drops":[{"id":"item_long_canh_buu","min":1,"max":2,"rarity":"chac"},{"id":"item_nguyen_thach","min":60,"max":120,"rarity":"chac"},{"id":"gu_cuong_tong","min":1,"max":1,"rarity":"rat_hiem"},{"id":"item_manh_co_phuong","min":1,"max":1,"rarity":"thuong"}]},
"beast_cho_hoang": {"rank":1,"drops":[{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":1,"rarity":"hiem"}]},
"beast_chuot_dia_thu": {"rank":4,"drops":[{"id":"item_vuot_dia_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_ngoc_vun","min":1,"max":2,"rarity":"hiem"},{"id":"item_nguyen_thach","min":3,"max":7,"rarity":"thuong"}]},
"beast_chuot_dia_thu_chua": {"rank":4,"drops":[{"id":"item_vuot_dia_thu","min":2,"max":4,"rarity":"chac"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"chac"},{"id":"item_ngoc_vun","min":1,"max":3,"rarity":"thuong"},{"id":"item_nguyen_thach","min":18,"max":36,"rarity":"chac"},{"id":"gu_dien_xi_sat_nhan_ngo","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_coc_doc": {"rank":2,"drops":[{"id":"item_tui_doc","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"},{"id":"gu_xu_thi","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_coc_doc_hiem": {"rank":2,"drops":[{"id":"item_thao_duoc","min":4,"max":6,"rarity":"thuong"},{"id":"item_tui_doc","min":2,"max":2,"rarity":"chac"},{"id":"item_nguyen_thach","min":1,"max":3,"rarity":"thuong"}]},
"beast_cuong_dien_lang": {"rank":3,"drops":[{"id":"item_tim_cuong_dien_lang","min":1,"max":1,"rarity":"chac"},{"id":"item_nguyen_thach","min":40,"max":80,"rarity":"chac"},{"id":"gu_loi_duc","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_tac_loi","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_dao_si_huyet_buc": {"rank":3,"drops":[{"id":"item_canh_doi","min":1,"max":2,"rarity":"thuong"},{"id":"item_huyet_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_mang_dao_si","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":2,"max":4,"rarity":"thuong"},{"id":"item_manh_cp_huyet_nguyet","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_huyet_tau","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_di_duong_luc_gia": {"rank":2,"drops":[]},
"beast_di_duong_tan_tu": {"rank":2,"drops":[]},
"beast_di_duong_thuong_gia": {"rank":2,"drops":[]},
"beast_dien_lang": {"rank":2,"drops":[{"id":"item_da_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"}]},
"beast_dien_lang_bien": {"rank":2,"drops":[{"id":"item_da_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"}]},
"beast_dien_lang_coc": {"rank":3,"drops":[{"id":"item_da_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":2,"max":4,"rarity":"thuong"}]},
"beast_dien_lang_hiem": {"rank":2,"drops":[{"id":"item_bom_hao_dien_lang","min":1,"max":1,"rarity":"thuong"},{"id":"item_thao_duoc","min":2,"max":3,"rarity":"thuong"},{"id":"item_da_soi","min":1,"max":2,"rarity":"chac"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":3,"rarity":"thuong"}]},
"beast_dien_lang_lac": {"rank":1,"drops":[{"id":"item_da_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"}]},
"beast_doi_hang": {"rank":1,"drops":[{"id":"item_canh_doi","min":1,"max":1,"rarity":"thuong"},{"id":"item_huyet_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":1,"rarity":"hiem"},{"id":"gu_qua_phu_chu","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_dung_nham_ngac": {"rank":3,"drops":[{"id":"item_vay_ngac_chua","min":1,"max":1,"rarity":"hiem"},{"id":"item_nguyen_thach","min":8,"max":15,"rarity":"thuong"},{"id":"gu_dan_hoa","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_gau_nui": {"rank":2,"drops":[{"id":"item_da_gau","min":1,"max":1,"rarity":"chac"},{"id":"item_mat_ong","min":1,"max":2,"rarity":"thuong"},{"id":"item_thit_thu","min":2,"max":4,"rarity":"chac"},{"id":"item_nguyen_thach","min":4,"max":8,"rarity":"thuong"}]},
"beast_gau_nui_bien": {"rank":2,"drops":[{"id":"item_da_gau","min":1,"max":1,"rarity":"chac"},{"id":"item_mat_ong","min":1,"max":2,"rarity":"thuong"},{"id":"item_quang_sat","min":1,"max":3,"rarity":"thuong"},{"id":"item_nguyen_thach","min":6,"max":10,"rarity":"thuong"},{"id":"item_manh_cp_tu_luc_canh_sinh","min":1,"max":1,"rarity":"hiem"}]},
"beast_hao_dien_lang": {"rank":2,"drops":[{"id":"item_bom_hao_dien_lang","min":1,"max":1,"rarity":"chac"},{"id":"item_da_soi","min":2,"max":4,"rarity":"chac"},{"id":"item_nguyen_thach","min":15,"max":30,"rarity":"chac"},{"id":"gu_ngu_lang_2","min":1,"max":1,"rarity":"hiem"},{"id":"gu_huyet_te_nguyen","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_hau_tho_the","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_hao_dien_lang_coc": {"rank":3,"drops":[{"id":"item_bom_hao_dien_lang","min":1,"max":1,"rarity":"thuong"},{"id":"item_da_soi","min":2,"max":3,"rarity":"chac"},{"id":"item_nanh_soi","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":12,"max":20,"rarity":"chac"},{"id":"gu_kim_boi_lang_bi","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_huou_nui": {"rank":1,"drops":[{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_da_huou","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"}]},
"beast_khi_da": {"rank":1,"drops":[{"id":"item_da_vun","min":1,"max":3,"rarity":"thuong"},{"id":"item_vay_da","min":1,"max":1,"rarity":"thuong"},{"id":"item_quang_dong","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"},{"id":"gu_hong_cham_hat","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_khi_da_hiem": {"rank":1,"drops":[{"id":"item_ngoc_vun","min":2,"max":4,"rarity":"thuong"},{"id":"item_da_vun","min":2,"max":3,"rarity":"chac"},{"id":"item_vay_da","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":3,"rarity":"thuong"}]},
"beast_khi_da_sau": {"rank":3,"drops":[{"id":"item_da_vun","min":1,"max":3,"rarity":"thuong"},{"id":"item_vay_da","min":1,"max":1,"rarity":"thuong"},{"id":"item_quang_dong","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":2,"max":4,"rarity":"thuong"}]},
"beast_khi_da_sau_hiem": {"rank":3,"drops":[{"id":"item_ngoc_vun","min":2,"max":4,"rarity":"thuong"},{"id":"item_quang_dong","min":1,"max":3,"rarity":"chac"},{"id":"item_vay_da","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":3,"max":6,"rarity":"thuong"}]},
"beast_lon_rung": {"rank":1,"drops":[{"id":"item_thit_lon","min":1,"max":1,"rarity":"hiem"},{"id":"item_da_heo","min":1,"max":1,"rarity":"thuong"},{"id":"item_nanh_heo","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"}]},
"beast_lon_rung_bien": {"rank":2,"drops":[{"id":"item_thit_lon","min":1,"max":1,"rarity":"hiem"},{"id":"item_da_heo","min":1,"max":1,"rarity":"thuong"},{"id":"item_nanh_heo","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"}]},
"beast_lon_rung_hiem": {"rank":1,"drops":[{"id":"item_nanh_heo_vuong","min":1,"max":1,"rarity":"thuong"},{"id":"item_thao_duoc","min":1,"max":2,"rarity":"thuong"},{"id":"item_da_heo","min":1,"max":2,"rarity":"chac"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"chac"},{"id":"item_nguyen_thach","min":1,"max":3,"rarity":"thuong"}]},
"beast_lon_rung_vuong": {"rank":2,"drops":[]},
"beast_ma_tu_dao": {"rank":2,"drops":[]},
"beast_ma_tu_doc": {"rank":2,"drops":[]},
"beast_ma_tu_soi": {"rank":2,"drops":[]},
"beast_nham_boi_hung": {"rank":2,"drops":[]},
"beast_qua_anh": {"rank":4,"drops":[{"id":"item_long_qua_anh","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":3,"max":7,"rarity":"thuong"}]},
"beast_ran_huyet_cuc": {"rank":1,"drops":[{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_da_ran","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"},{"id":"gu_huyet_coi","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_ran_nuoc": {"rank":2,"drops":[{"id":"item_da_ran","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"},{"id":"gu_thuy_xac","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_ran_nuoc_hiem": {"rank":2,"drops":[{"id":"item_thao_duoc","min":4,"max":6,"rarity":"thuong"},{"id":"item_da_ran","min":1,"max":2,"rarity":"chac"},{"id":"item_tui_doc","min":1,"max":2,"rarity":"chac"},{"id":"item_nguyen_thach","min":1,"max":3,"rarity":"thuong"},{"id":"item_manh_cp_an_lan","min":1,"max":1,"rarity":"hiem"}]},
"beast_se_dong": {"rank":1,"drops":[{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":1,"rarity":"hiem"}]},
"beast_soi_dau_dan": {"rank":2,"drops":[{"id":"item_da_soi","min":1,"max":2,"rarity":"thuong"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":2,"max":4,"rarity":"thuong"}]},
"beast_soi_gio": {"rank":4,"drops":[{"id":"item_mao_soi_gio","min":1,"max":2,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":4,"max":8,"rarity":"thuong"}]},
"beast_soi_gio_dau_dan": {"rank":4,"drops":[{"id":"item_mao_soi_gio","min":3,"max":5,"rarity":"chac"},{"id":"item_ngoc_vun","min":1,"max":3,"rarity":"thuong"},{"id":"item_nguyen_thach","min":20,"max":40,"rarity":"chac"},{"id":"gu_viem_dong","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_soi_gio_vuong": {"rank":4,"drops":[{"id":"item_mao_soi_gio","min":6,"max":10,"rarity":"chac"},{"id":"item_tim_soi_gio_vuong","min":1,"max":1,"rarity":"thuong"},{"id":"item_ngoc_vun","min":10,"max":16,"rarity":"chac"},{"id":"item_nguyen_thach","min":150,"max":250,"rarity":"chac"},{"id":"item_manh_co_phuong","min":1,"max":1,"rarity":"hiem"},{"id":"gu_dien_xi_sat_nhan_ngo","min":1,"max":1,"rarity":"hiem"},{"id":"gu_da_trong_kiem_anh","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_soi_nuoc": {"rank":3,"drops":[]},
"beast_soi_rau_doc": {"rank":4,"drops":[{"id":"item_tui_doc_soi_rau","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":4,"max":8,"rarity":"thuong"}]},
"beast_soi_rau_doc_vuong": {"rank":4,"drops":[{"id":"item_tui_doc_soi_rau","min":3,"max":5,"rarity":"chac"},{"id":"item_bang_tuyen_tinh","min":1,"max":1,"rarity":"thuong"},{"id":"item_ngoc_vun","min":4,"max":8,"rarity":"chac"},{"id":"item_nguyen_thach","min":60,"max":100,"rarity":"chac"},{"id":"item_manh_co_phuong","min":1,"max":1,"rarity":"hiem"},{"id":"gu_viem_dong","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_soi_xam_lon": {"rank":2,"drops":[{"id":"item_da_soi","min":1,"max":2,"rarity":"thuong"},{"id":"item_nanh_soi","min":1,"max":1,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":3,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":3,"rarity":"thuong"}]},
"beast_tam_nha": {"rank":2,"drops":[]},
"beast_thach_giap": {"rank":2,"drops":[{"id":"item_vay_da","min":2,"max":4,"rarity":"chac"},{"id":"item_quang_sat","min":1,"max":3,"rarity":"thuong"},{"id":"item_ngoc_vun","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":4,"max":8,"rarity":"thuong"},{"id":"gu_thach_bi","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_thach_giap_boss": {"rank":2,"drops":[]},
"beast_thach_giap_sau": {"rank":3,"drops":[{"id":"item_vay_da","min":2,"max":4,"rarity":"chac"},{"id":"item_quang_sat","min":2,"max":3,"rarity":"thuong"},{"id":"item_ngoc_vun","min":1,"max":3,"rarity":"thuong"},{"id":"item_nguyen_thach","min":10,"max":16,"rarity":"thuong"},{"id":"item_manh_cp_tho_tuong","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_thach_quy_tro_luc","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_thach_giap_vuong": {"rank":3,"drops":[{"id":"item_loi_thach_giap","min":1,"max":2,"rarity":"chac"},{"id":"item_ngoc_vun","min":5,"max":10,"rarity":"chac"},{"id":"item_nguyen_thach","min":40,"max":80,"rarity":"chac"},{"id":"gu_cu_xi_kim_ngo","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_cot_duc","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_bat_tu_thao","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_anh_phe","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_tho_nui": {"rank":1,"drops":[{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_long_tho","min":1,"max":2,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":1,"rarity":"hiem"}]},
"beast_tho_nui_hiem": {"rank":1,"drops":[{"id":"item_thao_duoc","min":3,"max":5,"rarity":"chac"},{"id":"item_mat_ong","min":1,"max":1,"rarity":"thuong"},{"id":"item_long_tho","min":2,"max":3,"rarity":"chac"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"thuong"}]},
"beast_tho_phi": {"rank":2,"drops":[]},
"beast_tho_phi_dau": {"rank":2,"drops":[]},
"beast_thue_coc_tran": {"rank":2,"drops":[]},
"beast_thue_ho_ve": {"rank":2,"drops":[]},
"beast_thue_muc_tieu": {"rank":2,"drops":[]},
"beast_thue_xe_hang": {"rank":2,"drops":[]},
"beast_thuy_mang": {"rank":2,"drops":[{"id":"item_vay_thuy_mang","min":1,"max":2,"rarity":"chac"},{"id":"item_tui_doc","min":2,"max":4,"rarity":"chac"},{"id":"item_nguyen_thach","min":15,"max":30,"rarity":"chac"},{"id":"gu_thuy_trao","min":1,"max":1,"rarity":"hiem"},{"id":"gu_ngac_luc","min":1,"max":1,"rarity":"hiem"},{"id":"gu_boi_giap","min":1,"max":1,"rarity":"hiem"},{"id":"gu_huyet_te_nguyen","min":1,"max":1,"rarity":"rat_hiem"},{"id":"gu_hau_tho_the","min":1,"max":1,"rarity":"rat_hiem"}]},
"beast_thuy_mang_non": {"rank":2,"drops":[{"id":"item_tui_doc","min":1,"max":2,"rarity":"thuong"},{"id":"item_da_ran","min":1,"max":2,"rarity":"thuong"},{"id":"item_vay_tran","min":1,"max":2,"rarity":"thuong"},{"id":"item_vay_thuy_mang","min":1,"max":1,"rarity":"hiem"},{"id":"item_nguyen_thach","min":5,"max":9,"rarity":"thuong"}]},
"beast_ung_nui": {"rank":1,"drops":[{"id":"item_long_ung","min":1,"max":2,"rarity":"thuong"},{"id":"item_thit_thu","min":1,"max":1,"rarity":"thuong"},{"id":"item_nguyen_thach","min":1,"max":2,"rarity":"hiem"}]},
};
// Current official public wiki: duplicate reward rows consolidated by first ID.
export const WIKI_DUNGEONS = {
  "dg_dam_hac_thuy": {
    "note": "Thủy mãng làm nước độc lan; đứng trên đảo đá, ngắt niệm.",
    "drops": [
      {
        "id": "item_vay_thuy_mang",
        "min": 1,
        "max": 2,
        "rarity": "chac"
      },
      {
        "id": "item_tui_doc",
        "min": 2,
        "max": 4,
        "rarity": "chac"
      },
      {
        "id": "item_nguyen_thach",
        "min": 20,
        "max": 40,
        "rarity": "chac"
      },
      {
        "id": "gu_thuy_trao",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "gu_thuy_toan",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "gu_ngu_lan",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_dd_ngoc_boi",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_manh_cp_loa_toan_thuy_tien",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      }
    ]
  },
  "dg_ham_mo": {
    "note": "Thạch giáp thú già làm sập trần (né theo vùng cảnh báo). Ở 70% máu đèn tắt: đánh trong tối, Trinh soi đường. Ở 40% nó cuộn giáp: phá khiên trong 15 giây.",
    "drops": [
      {
        "id": "item_quang_sat",
        "min": 2,
        "max": 4,
        "rarity": "chac"
      },
      {
        "id": "item_quang_dong",
        "min": 2,
        "max": 4,
        "rarity": "chac"
      },
      {
        "id": "item_vay_da",
        "min": 2,
        "max": 4,
        "rarity": "chac"
      },
      {
        "id": "item_ngoc_vun",
        "min": 1,
        "max": 2,
        "rarity": "thuong"
      },
      {
        "id": "item_nguyen_thach",
        "min": 6,
        "max": 12,
        "rarity": "chac"
      },
      {
        "id": "gu_thach_bi",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_tinh_thiet",
        "min": 1,
        "max": 2,
        "rarity": "thuong"
      },
      {
        "id": "item_dd_giap_tran_sat",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_dd_buoc_tinh_thach",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "gu_cot_thuong",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      }
    ]
  },
  "dg_hang_dia_thu": {
    "note": "Hang chủ Địa Thứ dậm đất, làm sập trần hang (né vòng báo) và gọi bầy chuột. Đủ ba người thì chuột chúa trồi lên từ sau lưng nó.",
    "drops": [
      {
        "id": "item_nguyen_thach",
        "min": 70,
        "max": 120,
        "rarity": "chac"
      },
      {
        "id": "item_vuot_dia_thu",
        "min": 3,
        "max": 5,
        "rarity": "chac"
      },
      {
        "id": "item_ngoc_vun",
        "min": 4,
        "max": 8,
        "rarity": "chac"
      },
      {
        "id": "item_giap_dia_thu_vuong",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "gu_kim_chung_trao",
        "min": 1,
        "max": 1,
        "rarity": "rat_hiem"
      },
      {
        "id": "item_manh_co_phuong",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      }
    ]
  },
  "dg_hang_heo": {
    "note": "Lợn Rừng Vương lao có cảnh báo, gọi lợn con ở 70% máu, nổi điên ở 40%.",
    "drops": [
      {
        "id": "item_nanh_heo_vuong",
        "min": 1,
        "max": 1,
        "rarity": "chac"
      },
      {
        "id": "item_da_heo",
        "min": 2,
        "max": 4,
        "rarity": "chac"
      },
      {
        "id": "item_thit_lon",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_nguyen_thach",
        "min": 5,
        "max": 10,
        "rarity": "chac"
      },
      {
        "id": "gu_bach_thi",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "gu_hac_thi",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "gu_hoa_thi",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_dd_non_la_rach",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      }
    ]
  },
  "dg_huyet_soi_tuyet": {
    "note": "Sói Tuyết vương gọi bầy, lao có báo trước, vồ và nhảy đập. Đủ ba người thì Gấu Tuyết nằm phục sau lưng nó cũng dậy.",
    "drops": [
      {
        "id": "item_nguyen_thach",
        "min": 160,
        "max": 280,
        "rarity": "chac"
      },
      {
        "id": "item_long_soi_tuyet",
        "min": 3,
        "max": 5,
        "rarity": "chac"
      },
      {
        "id": "item_mao_soi_gio",
        "min": 3,
        "max": 6,
        "rarity": "chac"
      },
      {
        "id": "item_da_gau_tuyet",
        "min": 1,
        "max": 2,
        "rarity": "thuong"
      },
      {
        "id": "item_to_duong_tam",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_ngoc_vun",
        "min": 8,
        "max": 14,
        "rarity": "chac"
      },
      {
        "id": "item_manh_co_phuong",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "gu_man_thien_phi_tuyet",
        "min": 1,
        "max": 1,
        "rarity": "rat_hiem"
      },
      {
        "id": "gu_bat_phoi_cuong_tong",
        "min": 1,
        "max": 1,
        "rarity": "rat_hiem"
      },
      {
        "id": "gu_xuan_quang_vo_han",
        "min": 1,
        "max": 1,
        "rarity": "rat_hiem"
      },
      {
        "id": "item_vuot_tuyet_hung_vuong",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      }
    ]
  },
  "dg_o_soi": {
    "note": "Tam Nha cùng đàn sói. Pha 2: Tam Nha thả sói nô; phải hạ người cầm dây trước.",
    "drops": [
      {
        "id": "item_da_soi",
        "min": 2,
        "max": 4,
        "rarity": "chac"
      },
      {
        "id": "item_nanh_soi",
        "min": 1,
        "max": 3,
        "rarity": "chac"
      },
      {
        "id": "item_nguyen_thach",
        "min": 15,
        "max": 30,
        "rarity": "chac"
      },
      {
        "id": "gu_ngu_lang_2",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_manh_cp_hac_tong",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_bom_hao_dien_lang",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_da_gau",
        "min": 1,
        "max": 2,
        "rarity": "thuong"
      },
      {
        "id": "item_dd_vong_nanh",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      }
    ]
  },
  "dg_sao_lang_phu": {
    "note": "Bóng Lang Phu dắt theo Cuồng Điện Lang. Hạ được kẻ cầm dây thì sói vương bỏ chạy.",
    "drops": [
      {
        "id": "item_nguyen_thach",
        "min": 35,
        "max": 60,
        "rarity": "chac"
      },
      {
        "id": "item_da_soi",
        "min": 3,
        "max": 5,
        "rarity": "chac"
      },
      {
        "id": "item_nanh_soi",
        "min": 2,
        "max": 3,
        "rarity": "chac"
      },
      {
        "id": "item_bom_hao_dien_lang",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tim_cuong_dien_lang",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "gu_ngu_lang_3",
        "min": 1,
        "max": 1,
        "rarity": "hiem"
      },
      {
        "id": "item_manh_cp_cuong_tong",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_dd_lang_thu_mao",
        "min": 1,
        "max": 1,
        "rarity": "rat_hiem"
      },
      {
        "id": "item_dd_lang_bi_phi",
        "min": 1,
        "max": 1,
        "rarity": "rat_hiem"
      },
      {
        "id": "item_bua_cuong_hoa_nho",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      },
      {
        "id": "item_tay_luyen_thach",
        "min": 1,
        "max": 1,
        "rarity": "thuong"
      }
    ]
  }
};
export const WIKI_RANKS = {"beast_se_dong":1,"beast_ung_nui":1,"beast_cho_hoang":1,"beast_doi_hang":1,"beast_huou_nui":1,"beast_khi_da":1,"beast_khi_da_hiem":1,"beast_lon_rung":1,"beast_lon_rung_hiem":1,"beast_ran_huyet_cuc":1,"beast_dien_lang_lac":1,"beast_tho_nui":1,"beast_tho_nui_hiem":1,"beast_gau_nui_bien":2,"beast_coc_doc":2,"beast_coc_doc_hiem":2,"beast_thue_coc_tran":2,"beast_tho_phi_dau":2,"beast_dien_lang":2,"beast_dien_lang_bien":2,"beast_dien_lang_hiem":2,"beast_gau_nui":2,"beast_hao_dien_lang":2,"beast_thue_ho_ve":2,"beast_di_duong_thuong_gia":2,"beast_lon_rung_bien":2,"beast_lon_rung_vuong":2,"beast_ma_tu_dao":2,"beast_ma_tu_soi":2,"beast_ma_tu_doc":2,"beast_thue_muc_tieu":2,"beast_di_duong_luc_gia":2,"beast_nham_boi_hung":2,"beast_ran_nuoc":2,"beast_ran_nuoc_hiem":2,"beast_soi_dau_dan":2,"beast_soi_xam_lon":2,"beast_tam_nha":2,"beast_di_duong_tan_tu":2,"beast_thach_giap":2,"beast_thach_giap_boss":2,"beast_tho_phi":2,"beast_thuy_mang":2,"beast_thuy_mang_non":2,"beast_thue_xe_hang":2,"beast_bong_lang_phu":3,"beast_buu":3,"beast_cuong_dien_lang":3,"beast_dung_nham_ngac":3,"beast_dao_si_huyet_buc":3,"beast_dien_lang_coc":3,"beast_hao_dien_lang_coc":3,"beast_khi_da_sau":3,"beast_khi_da_sau_hiem":3,"beast_soi_nuoc":3,"beast_thach_giap_sau":3,"beast_thach_giap_vuong":3,"beast_chuot_dia_thu":4,"beast_chuot_dia_thu_chua":4,"beast_dia_thu_hang_chu":4,"beast_qua_anh":4,"beast_soi_gio":4,"beast_soi_gio_dau_dan":4,"beast_soi_gio_vuong":4,"beast_soi_rau_doc":4,"beast_soi_rau_doc_vuong":4,"beast_gau_tuyet":5,"beast_soi_tuyet":5,"beast_soi_tuyet_dau_dan":5,"beast_soi_tuyet_vuong":5,"beast_tuyet_hung_vuong":5,"beast_ung_tuyet":5};
