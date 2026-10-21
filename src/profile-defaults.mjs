/**
 * Local starter profile for the recovered client, not an original server save.
 * Field shapes follow recovered/main/modules/bundle.js; item/Gu IDs and their
 * costs follow public/data/game.json. Progression and base stats are estimates.
 * Keep every mutable value inside the factory: profiles must not share state.
 */
export function createProfile(name = 'Đạo Hữu', gender = 'nam', color = '') {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const gu = (uid, loai, banMenh = false) => ({
    uid, loai, banMenh,
    luyenHoa: true,
    no: 100,
    thuanThuc: 0,
    xp: 0,
    xpCan: 20,
    xpNgay: 0,
    sao: 0,
    buaToi: now + day,
    nghi: null,
    thuongNv: false,
  });
  const co = [
    gu('starter-nguyet-quang', 'gu_nguyet_quang', true),
    gu('starter-thu-bi', 'gu_thu_bi'),
    gu('starter-sinh-tuc-thao', 'gu_sinh_tuc_thao'),
    gu('starter-tieu-quang', 'gu_tieu_quang'),
  ];
  // Active slots are objects, including empty slots. Passive slots hold UIDs.
  // `cd` is an absolute expiry; zero makes a fresh slot immediately available.
  const slot = (g = null, cn = 0, cdMax = 0, cnGiay = false) => ({
    uid: g?.uid ?? null,
    loai: g?.loai ?? null,
    cd: 0, cdMax, cn, cnGiay,
    bat: false,
  });
  const emptyBonuses = () => ({ hp: 0, cn: 0, cong: 0, giap: 0, toc: 0, khang: [] });
  const stat = (k, tong, kieu = 'so') => ({ k, tong, kieu, nguon: [['goc', tong]] });

  return {
    ten: typeof name === 'string' && name.trim() ? name.trim() : 'Đạo Hữu',
    gioiTinh: gender === 'nu' ? 'nu' : 'nam',
    mauAo: typeof color === 'string' ? color : '',
    admin: false,
    ghiDe: false,
    chuyen: 1,
    tv: { chuyen: 1, giai: 0, diem: 0, can: 100 },
    hp: 200, hpMax: 200,
    cn: 100, cnMax: 100,
    theLuc: 100,
    suyNhuoc: 0,
    chienLuc: 100,
    nt: 200,
    nguyenThach: 200,
    ch: 0,
    luc: 0,
    vinhDu: 0,
    co,
    o: [slot(co[0], 8, 1000), slot(co[1], 2.2, 1000, true), slot(co[2], 6, 5000), slot()],
    obd: [co[3].uid],
    opt: [],
    soOPhuTro: 0,
    boLp: {},
    satChieu: [],
    satChieuO: [null, null],
    satChieuKhoa: {},
    satChieuUoc: {},
    cdSatChieu: {},
    coPhuong: [],
    coPhuongTk: [],
    tui: {
      item_canh_nguyet_lan: 10,
      item_thit_thu: 10,
      item_thao_duoc: 10,
      item_cao_cam_mau: 5,
      item_ruou_trang: 10,
    },
    tuiToiDa: 40,
    tuiMoRong: 0,
    hoCu: {
      o: {}, tui: {}, tong: emptyBonuses(),
      bo: [], cat: [], bua: [], tamThoi: false,
      da: { tui: {}, cs: { sat_thuong: 0, chi_mang: 0, giam: 0, sinh_luc: 0, tuTuong: false } },
    },
    doDeo: { o: {}, tui: {} },
    trangPhuc: [],
    tuDo: { ds: [] },
    daiDien: { a: 'dd_dung', k: '', anh: ['dd_dung'], khung: [] },
    danhHieu: [],
    danhHieuCay: { co: [], chua: [] },
    danhVong: [],
    theDao: { thanPhan: 'tan_tu' },
    giaLao: false,
    hienBanMenh: true,
    riengTu: { co: false, chiSo: true },
    chan: [],
    bieuCamMo: ['chao', 'vai_chao', 'cam_on', 'xin_loi', 'cuoi', 'buon', 'gian', 'ngac_nhien', 'dong_y', 'lac_dau', 'cho_chut', 'theo_ta'],
    chiSo: {
      than: [
        stat('sinh_luc', 200), stat('chan_nguyen', 100), stat('the_luc', 100),
        stat('luc', 0), stat('giap', 0), stat('toc_do', 1, 'pt'),
        stat('chi_mang', 0, 'pt'), stat('giam_sat_thuong', 0, 'pt'),
        stat('hoi_the_luc', 1, 'pt'),
      ],
    },
    chiSoChienDau: {
      hp: { goc: 200, hoCu: 0 }, cn: { goc: 100, hoCu: 0 },
      cong: { goc: 0, hoCu: 0 }, giap: { goc: 0, hoCu: 0 },
      toc: { goc: 1, hoCu: 0 }, khang: [],
    },
    tiemNang: {
      con: 0, tong: 0, tay: 0, tran: 100, trungTu: 0,
      diemMoiTieuCanh: 5, giaTay: 0,
      d: { can_cot: 0, luc: 0, than_thuc: 0, than_phap: 0 },
      moiDiem: { canCotSinhLuc: 0.01, luc: 1, lucChia: 200, thanThucCn: 0.01, thanPhapTocDo: 0.002, thanPhapHoiTheLuc: 0.01 },
    },
    luuPhai: {
      chinh: 'nguyet', doi: false, khoaMs: 0, tranNgay: 300,
      chonDuoc: false, oTangKinh: false, doiGia: 0, doiNgay: 0,
      sach: null, sachXong: false, dacTinh: null,
      ds: [{ lp: 'nguyet', laChinh: true, bac: 0, kn: 0, toi: 100 }],
    },
    vcl: {
      lh: co.map(g => g.loai), td: [], diem: 40,
      diemLoai: Object.fromEntries(co.map(g => [g.loai, 10])),
      sao: {}, moc: [], coPho: [],
    },
    chamCo: { mo: true, con: [], xp: 5 },
    luyenSan: { da: {}, gia: 20, xp: 10, toiDa: 5 },
    giaiLuyen: { gio: 24, toiDa: 1, uuDai: null },
    oDuongCo: { so: 0, o: [] },
    thuNha: { ds: [], theoToiDa: 1 },
    thuPho: { ds: [] },
    nghe: { ds: [], toiDaChinh: 2, matKhiBo: 0.2 },
    soCa: { kyLuc: {} },
    thu: { chuaDoc: 0, conQua: 0, soOTui: 0, tuiToiDa: 40, chiHacToi: 0, toiDaDo: 5, phi: 0, chuToiDa: 500 },
    soTuoi: { duoc: [], da: [], toiDa: 0, nguoi: 0 },
    huongDan: { moi: 0, co: 0 },
    homNay: [],
    nangDong: { diem: 0, tran: 100, moc: [] },
    mucTieuTuan: { ds: [], xong: 0, can: 1, duRuong: false, sapMat: false },
    dangNhap: { so: 0, homNay: false },
    dangNhapThang: { thang: new Date(now).toISOString().slice(0, 7), so: 0, tong: 0, homNay: false, ds: [] },
    thanhTuu: { choNhan: 0 },
    tinMoi: { chuaDoc: 0 },
    // Unlock core panels using the actual quest gates in bal.giao_dien.mo_nut.
    // This does not fabricate a completed story; the adapter owns quest state.
    mo: ['mq_x01', 'mq_x02', 'mq_x03', 'mq_x06', 'mq_x11'],
    xong: [],
    vatAn: [],
    vuon: { daDon: false, coDai: [], luong: {} },
    beQuan: { mo: false, tran: 8, daDung: 0, moiGio: 6 },
    dotPha: { mo: false, day: false, choMo: false, xemTruoc: false },
    trungTu: { duoc: false, da: false, tl: 0 },
    treo: { mo: false, dang: false, oBai: false, nghi: false, khiLuc: 0 },
    kheUoc: [],
    docThe: 0,
    monAn: null,
    ngocGian: null,
    phongTuyen: null,
    loiDai: null,
    loiDaiBaBa: null,
    push: { dangKy: false, khoa: '' },
  };
}
