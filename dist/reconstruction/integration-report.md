# Bản game V3 — 22/10/2026

## Kết quả tích hợp

- Khôi phục chuỗi `canh_x01_tinh_day` gồm 13 lệnh từ lượt chơi thực: nội dung, thời lượng, thẻ Ngày thứ bảy, camera, sáng/tối và rung màn hình. Dùng chính bộ diễn cảnh của client gốc, có bỏ qua và lưu trạng thái.
- Ghi lại hội thoại Tri Thu sau khi tỉnh, ba lựa chọn và nhánh trả lời số 1; đối chiếu nhiệm vụ Xuống hầm rượu / Khiêng vò rượu cho mẹ. Bản mới có việc nhà ở cửa hầm trước khi tới lễ khai khiếu.
- Nhân vật mới tỉnh dậy đúng dạng quan sát: Phàm nhân, 300 HP, 0 CN, chưa có cổ/nguyên thạch. Save V1/V2 giữ nguyên tài sản và cảnh giới, không bị chuyển thành nhân vật mới.
- Bộ nhiệm vụ chơi đơn có 12 checkpoint, 8 việc phụ, mục tiêu, điều kiện theo sự kiện, ba nhánh hội thoại, cờ lựa chọn, quan hệ và sổ đã hoàn thành. Tiến trình thoại lưu được; phần thưởng không nhận lại bằng việc lặp gói tin/reload.
- Nghề: 8 tên nghề gốc, học khi làm, đổi/thôi nghề, bậc nghề, nghề phụ, công thức và vị trí làm theo wiki. Các mã công thức nghề `nghe:*` được đặt riêng vì chưa biết mã server.
- Hộ cụ: 4 ô, bộ 2/4 món, cấp/phẩm, nạp nguyên liệu, bảo hiểm thất bại, bùa, khảm/gỡ/ghép đá, thưởng Tứ Tượng và đồ đeo. Thay đồ cập nhật chỉ số thật, không cộng dồn sau mỗi lần refresh.
- Chăm cổ theo ngày VN, luyện sân, ô dưỡng cổ/đóng băng lịch bữa, sản xuất theo thời gian; ăn tự động khi vắng, đói/kiệt sức/xác cổ. Cứu cổ Nhất–Tam chuyển bằng `co.hoi_sinh`, theo nhóm nguyên liệu công bố, tại Cửu bà hoặc tự làm khi đủ nghề; hàng đợi hồi sinh dùng chung xử lý nghỉ của inventory.
- Luyện hóa có kim/giữ–thả và tiêu hao CN; hợp luyện chạy theo thời gian, dùng nguyên liệu thật, giữ cổ chính khi thất bại và cho nghỉ 24 giờ. Giá Kho tộc, giới hạn tuần và chu kỳ reset đọc từ dữ liệu công bố.
- Tu luyện dùng đủ bốn giai và bảng tu vi Nhất–Ngũ chuyển trong wiki; quá tải khiếu giảm hiệu quả, có Tửu Trùng đúng chuyển, bế quan có giới hạn và mốc lưu. Đột phá cần nhiệm vụ, tài nguyên, CN và ba lần giữ/thả đúng nhịp; lỡ nhịp mất phí thử lại, không thu nguyên liệu hai lần. Xá Lợi đúng chuyển lên một giai, tiêu hao cổ, xóa tu vi đang tích và không thay thế đột phá.
- Giao chiến: mở rộng ẩn thân/phát hiện, mù, phong khiếu, băng tích tầng, phản sát thương, kháng lưu phái, biến thân, lá hồi máu, bảo mệnh, cộng hưởng bản mệnh và cầu nối đồng hành. Bị đánh ngắt hấp thu; trói/choáng chặn di chuyển. Cổ bị động có thay đổi HP/CN/tốc độ thực tế.
- 55 map giữ điểm/cửa/bãi đúng catalog; 10 map phụ bản có các đợt theo dữ liệu, boss có cảnh báo và pha. Khai khiếu, ba cửa, hầm rượu, Tháp và truyền thừa có tiến trình riêng, checkpoint/reload, thất bại và sổ nhận thưởng. Không nhân đôi loot khi reset hoặc boss hồi sinh.
- Hòm đồ dùng giao diện `hom_do` gốc, gửi/rút/nâng ô có kiểm tra vị trí và tài nguyên. Hạ thú ngoài đồng Nhất–Tam chuyển nhận tu vi theo mức/cap công bố; cổ dùng trúng mục tiêu nhận thuần thục qua hook.
- Menu Hành trình gọn hơn, bỏ các nút nhận đồ/hồi phục miễn phí; chỉ đi xe tới trạm đã ghé, phải đứng gần trạm. Save/export và xem lại giấc mơ vẫn có.

## Bằng chứng và giới hạn chính xác

Client nền là 4 bundle công khai đã khôi phục ở lần khảo sát đầu 22/10. REA: main `ev_f575ceb894d2ec9eaf56cc01ef3b631348fbe1052903631c27dd9f03b65b2580`; chunks `ev_02b5a3106773bfd085cf1d0c1a3620991fa821c83dc1c05253d7d9477d3608f2`. Phân tích semantic toàn bundle chính trước đó bị giới hạn heap; không coi là đã hiểu hết mọi hàm.

Lần chơi V3 dùng nhân vật khách riêng trên game gốc. Quan sát hội thoại/gói kịch bản là ghi chép Playwright, không phải một Evidence ID mới của REA. Chỉ xuất bản bản trích chọn đã bỏ tên nhân vật thử, không xuất thông tin xác thực, storage trình duyệt hay log người chơi khác. `observed-wake.json` và `research-manifest.json` ghi phạm vi và SHA-256. Hai chân dung mới tải trực tiếp từ URL được client yêu cầu.

Nguồn luật chính: wiki chính thức `/wiki/tn/nghe.html`, `ho_cu.html`, `tu_luyen.html`, `dot_pha.html`, `nuoi_co.html`, `luyen_hoa.html`, `hop_luyen.html`, `chien_dau.html`, `sat_chieu.html`; bảng vật phẩm/thú/phụ bản đã lưu. Trong khi khảo sát, game gốc thay client từ `index-iCsj8eQn.js` sang `index-XH21pn5C.js`. Catalog Gu vẫn 377, zones 55, recipes 70; dữ liệu buổi chiều thêm 2 item. Bản clone giữ bộ client/catalog đã kiểm thử, không thay bundle trong lúc tích hợp.

**Phần tự dựng, chưa xác nhận trùng server:** toàn bộ nhiệm vụ sau đoạn Sáng xuân đã quan sát, phần thưởng/nhánh nhiệm vụ 12 checkpoint và 8 việc phụ, câu trả lời lựa chọn 0/2 lúc tỉnh, hội thoại dịch vụ, điều kiện quest chi tiết, AI/chỉ số thú thiếu trong catalog, xác suất rơi, timing một số boss; số ô nghề và hệ số nghề không công bố; các hệ số nâng phẩm/cường hóa/bảo hiểm/bộ/đá không có bảng server; giá hòm/xe và một số phí nghỉ/cứu cổ. Cứu cổ dùng policy cục bộ 20×chuyển² NT + 5×chuyển thảo dược, vật liệu nhóm Nhị/Tam, nghỉ một giờ mỗi chuyển và mất 10% thuần thục; đây không phải số gốc được giải mã. Quầy Tạ Ninh/Tú Nương hiện mở catalog vật liệu Thương hội thay vì catalog riêng chưa quan sát. Chưa có đủ script mọi phụ bản hay toàn bộ cây truyện nhiều năm của bản gốc.

Combat sweep: **266/377** Gu được executor chấp nhận, trong đó 248 không báo thiếu effect trong phạm vi executor, 18 xử lý một phần; **111** trường hợp không khả dụng qua combat executor. Con số này không phải số Gu khôi phục đúng toàn game; Xá Lợi/chăm cổ/các tiện ích được xử lý bởi module khác. Nhiều cổ một lần, địa lợi, trận/tường, nô thú, kỹ năng niệm và sát chiêu vẫn chưa đầy đủ. Chưa có đầy đủ công thức sát thương server, tẩy luyện/nâng sao cổ, thú nhà hay toàn bộ đặc quyền của từng nghề.

Multiplayer, tài khoản/lưu cloud, bang/PvP, chợ chung và các hoạt động server vẫn nằm ngoài bản chơi đơn này. Xem từng hệ trong `feature-matrix.json`; báo cáo không gọi V3 là bản sao 100%.

## Kiểm tra

`npm test` có 8 bộ kiểm tra: runtime/migration, intro, inventory, combat, progression, encounters, story và services. Các bộ dùng catalog thật, có kiểm tra thiếu tài nguyên, input sai, sự kiện lặp, thời gian/reload, atomicity và bảo toàn save.

Browser desktop đã đi hết Giấc mơ, cảnh tỉnh, hội thoại/việc nhà, khai khiếu, chọn cổ, điều khiển mini luyện hóa thật, lắp cổ, mở nghề/công thức/nhân vật/quầy và reload giữ tiến trình. Không có page error, HTTP lỗi hay request ra server gốc trong lượt cuối. Các test dùng dịch chuyển/điều khiển host để rút ngắn đường đi; không tuyên bố đã tự đi mọi đường hoặc kiểm hết 78 hệ.

Browser cảm ứng 844×390 đã kiểm tra đọc save cũ, giao diện hòm đồ, gửi/rút vật phẩm, mặc hộ cụ làm đổi HP thật, mở bảng nghề, bố cục không tràn ngang, lọc báo cáo và tải gói source. Lượt này không có page error hoặc HTTP lỗi.

Các báo cáo chi tiết: `INVENTORY-V3.md`, `ENCOUNTERS-V3.md`, `PROGRESSION-V3.md`, `COMBAT-V3.md`. Runtime mới giữ project/audience cũ và không sửa cấu hình MCP dùng chung.
