# Cập nhật khảo sát và tích hợp — 22/10/2026

## Kết quả có căn cứ

- Đã tải và giải rối bản client đang phục vụ ở `index-ChkNmBLw.js`, SHA-256 `86878ad9ae94b44c7e99244fb8a51a08c03ebad3c0ec763cb43edb0229f7d183`.
- REA recovery main: `ev_f575ceb894d2ec9eaf56cc01ef3b631348fbe1052903631c27dd9f03b65b2580`, complete. Cả bundle được bảo toàn đầu vào và mã dẫn xuất; không phải TSX gốc.
- REA recovery ba chunk/worker: `ev_02b5a3106773bfd085cf1d0c1a3620991fa821c83dc1c05253d7d9477d3608f2`, complete.
- REA guest browser scenario: `ev_902e540ce2ed5f25abe9e151e16f8db5e4ed2975d0628a4d35ab605aa08edaaa`. Vào được Giấc mơ, quan sát Ngũ chuyển 5200 HP/2400 CN, Tri Thu, nhiệm vụ `mq_mo_dau` và câu đầu. Network capture incomplete vì một số request còn đang chạy khi kết thúc.
- Quan sát bổ sung bằng Playwright instrument client, không phải Evidence do REA phát hành: đã đi qua đoạn kết Giấc mơ tới Tạ gia trại. Các lời thoại trong intro module đối chiếu từ luồng đã quan sát; giữ nguyên biến tên người chơi của bản clone, không đóng gói khóa hoặc token của guest.
- REA static analysis bốn script: `ev_ad4c36a8bdd518b4ac64aaab4fff9fcf6d11f1597c0ca022153c520821e6a004`. Partial: main bundle hết heap 3072 MiB; ba chunk parse thành công. Không được coi đây là semantic analysis hoàn chỉnh. AST inventory riêng ghi nhận 78 nhóm chức năng, 120 outgoing command literal và 179 incoming type; dynamic sends còn unknown.
- Dữ liệu mới: 55 vùng, 377 cổ, 379 vật phẩm, 88 thú, 23 sát chiêu, 70 công thức. Visual index 2072 nhóm. Đồng bộ 40 file ảnh/atlas mới hoặc đổi thuộc 22 nhóm.

## Đã tích hợp trong lần này

1. Client và catalog mới nguyên bộ; transport/callback thay bằng runtime chơi đơn.
2. Khởi tạo Giấc mơ trước khi vào trại: lời thoại đầu, Tri Thu, cửa sập, lướt, cánh, sân đá, Công/Thủ/Trị/Trinh, chiến đấu tự do, hấp thu, sát chiêu, né đòn, lựa chọn đối thoại, tự bạo, rừng cây và tỉnh dậy. Snapshot cũ giữ chỉ số/vật phẩm/tiền ở trại; quyền năng trong mơ không ghi đè lên tiến trình thường. Có chơi lại.
3. Bỏ công thức damage cố định cho mọi cổ. Combat đọc data; 226/377 Gu có xử lý đầy đủ hoặc một phần trong catalog sweep, 151 báo rõ chưa hỗ trợ. Bao gồm mục tiêu/tầm/AoE/CN/cooldown, hồi máu, khiên, giảm sát thương, DoT, khống chế và cánh. Không suy diễn damage cho sát chiêu thường khi thiếu dữ liệu; sát chiêu mở đầu có kịch bản riêng.
4. Lắp/tháo cổ, cho ăn/độ no, luyện hóa, dùng cao cầm máu, mua/bán, 70 công thức có định nghĩa (các công thức bản mệnh/nâng cao vẫn bị khóa khi chưa có luật).
5. NPC F có lựa chọn dịch vụ, cửa hàng/chế tạo dùng UI gốc; tu luyện hiển thị mini UI gốc; trả về khi trọng thương dùng command `ve`; chat nhận đúng string/`tu`; ô tiêu hao `o_do`; đột phá có preview không trừ tài nguyên.
6. Đi đến mọi vùng `zone_*` trong dữ liệu. Không tự nhét đàn lợn vào hub. Instance không có encounter script không được coi là đã clone hoàn chỉnh.

## Phần còn thiếu — không thể lấy bằng trình duyệt

Không có backend hoặc database gốc. Mã public không chứa đầy đủ định nghĩa/nhánh/thưởng nhiệm vụ, luật đấu trường và bang hội, thị trường nhiều người, tài khoản, RNG/drop, script toàn bộ instance và công thức sát chiêu máy chủ. Các giao diện tương ứng đã nằm trong bundle không có nghĩa là các hệ đó chạy được.

Các trigger/timing chiến đấu và cutscene intro, nhánh lựa chọn chưa quan sát, giá mua/luyện hóa, quy trình chế tạo, cân bằng và chỉ số chơi đơn vẫn là reconstruction. Character thường hiện giữ cấu hình khởi hành của bản chơi đơn cũ (Nhất chuyển), không tự hạ cấp save về Phàm nhân như tài khoản mới của server thật. Cảnh tỉnh dậy tiếp theo/nhiệm vụ ngoài Giấc mơ chưa có script server. Không tuyên bố clone 1:1 hoặc đã dịch ngược source backend.

## Kiểm thử

`npm test`: runtime/save migration, toàn bộ luồng intro, 15 test inventory/Gu/shop/recipe và 21 nhóm test combat + sweep 377 Gu. Browser QA bản local: đi hết intro về trại, lựa chọn NPC bằng F, panel túi/nhân vật/cổ, shop/craft, mini tu luyện, reload giữ save; không có page error, HTTP lỗi hoặc request sang server gốc trong lượt kiểm tra. Luồng cảm ứng được kiểm tra riêng ở màn hình ngang. Kết quả browser chỉ bao phủ những thao tác đã thử, không phải toàn bộ 78 hệ.

`feature-matrix.snapshot.json` / `feature-audit.snapshot.md` là snapshot kiểm kê trước các bản sửa cuối. Thay đổi sau snapshot: đã sửa chat string/tu, `ve`, exact dream predicate, `o_do`, preview `dot_pha`; intro đã được tích hợp và kiểm thử. Giữ snapshot không sửa lịch sử bằng các kết quả chưa có ở thời điểm chụp.
