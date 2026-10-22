# Progression V3

API: `createProgression(room)` → `handle/owns/tick/begin/recalculate`, `startCultivation/startTrial`, `openCrafting`, `learn/addTuVi/addMastery/gainOccupation`, `onEvent`, `applyBonuses/rebase`, `recipes/preview`.

Route `owns` trước inventory để `co.cham/duong/lay_duong/luyen_san`, `nghe`, `ho_cu`, `do_deo`, `che` mã `nghe:*`, `mini` đang tu luyện/đột phá không bị nhận nhầm. Module không xử lý intro. `recalculate` không emit/save nên gọi từ `room.refresh` được. `rebase` chỉ nhận chỉ số nền, dùng khi khai khiếu; không truyền chỉ số đã cộng đồ.

Dữ liệu chính xác có nguồn: trường wire/UI ở client đã giải rối; tên/nguyên liệu/vị trí công thức, bảng 4 giai và vật liệu/NT đột phá trong wiki; chế độ nghề chính/phụ, phí luyện sân, XP/giảm theo trần, loại vật liệu cứu cổ và sản lượng dưỡng cổ trong game.json. Bảng chỉ số cơ bản hộ cụ từ trang vật phẩm wiki đã lưu.

Chính sách tự dựng do thiếu bảng server: 2 nghề chính, mốc 25/50/75 và mất 50% điểm khi thôi; mã `nghe:*`; một số điểm nghề, slot nursery; tăng chỉ số theo chuyển; hệ số bộ, phẩm/cấp, phí/nạp/bảo hiểm, phần trăm thành công và hệ số đá; nhịp giữ-thả đột phá, phí retry và vài tác động của modifier. Các luật định tính giữ theo wiki. Không khẳng định các số này là số gốc. Một số đặc quyền nghề, toàn bộ nghề câu cá/nô thú/giám thạch và nhánh sản xuất ngoài các công thức có nguồn chưa hoàn chỉnh.

Nạp/đổi đồ dùng transaction planner: kiểm đủ nguyên liệu, chỗ chứa, cảnh giới, địa điểm trước khi trừ. Đổi đồ không làm mất đồ đã bind, ngọc được trả khi bỏ món. Bonus bộ chỉ tính slot khác nhau; refresh lặp không cộng lại. Cổ bị động lấy danh sách refined/equipped/đủ no từ combat, thay đổi HP/CN/tốc độ trên chỉ số nền.

Tu luyện bốn giai không tự vượt chuyển. Preview không trừ tiền; vào trial thu tài nguyên một lần. Thất bại thu retry, giữ receipt đã nộp. Input mini là giữ/thả thực, không nhận kết quả do client gửi. Đi lại/bị đánh hủy phiên. Bế quan dùng `room.previousSavedAt`, giới hạn số giờ/ngày đã mở và receipt, không tích tiến độ mini offline.

37 test progression qua; integration runtime thêm kiểm tra khai khiếu CN 0→100, cổ bị động không cộng dồn và trói chặn di chuyển. Xem báo cáo V3 chung cho giới hạn và browser QA.
