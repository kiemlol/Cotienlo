# Cổ Tiên Lộ · Bản game độc lập

Bản chơi đơn dùng client Phaser/React và asset công khai của https://cotienlo.com, được khảo sát bằng REA. Runtime trong `src/runtime.mjs` và profile trong `src/profile-defaults.mjs` là mã dựng mới, **không phải backend gốc**. Không kết nối tài khoản hoặc máy chủ game gốc.

## Chạy

Node.js 20 trở lên, không cần dependency:

```sh
npm run build
npm start
```

Mở http://127.0.0.1:4175. Có thể phục vụ thư mục `dist/` bằng static host. Build chạy lại được; giữ nguyên `dist/assets/index-CKacMd2p.js` làm đầu vào gốc và `src/index.original.html` làm template. Không cần repo recovery ở đường dẫn tuyệt đối.

## Đã dựng

- Tạo tên/giới tính/màu áo bằng giao diện gốc; vào bản đồ Tạ gia trại.
- Di chuyển, va chạm, camera, minimap, animation và UI gốc.
- Quái có HP, đuổi đánh, hồi sinh; dùng đòn đánh/cổ trùng để hạ quái, nhận vật phẩm/nguyên thạch.
- NPC trò chuyện/hồi phục; thu thập thảo dược; vận khí, tích tu vi, đột phá.
- Nhiệm vụ khởi hành và phần thưởng; 6 vùng đi đến từ menu Hành trình.
- Tự lưu mỗi 4 giây trên trình duyệt; xuất file JSON dự phòng. Tiến trình không đồng bộ giữa thiết bị. Xóa dữ liệu trang sẽ mất bản lưu.

## Giới hạn

Đây là mô phỏng chơi đơn. Chưa có Colyseus backend thật, multiplayer/PvP, bang hội, giao dịch, tài khoản trực tuyến, hệ nhiệm vụ nguyên bản, đầy đủ chế tạo/nghề nghiệp hoặc toàn bộ luật cổ trùng. Chỉ số/cân bằng/phần thưởng được dựng độc lập. Các nút ngoài phạm vi được ẩn hoặc báo rõ chưa hỗ trợ. Asset giữ nguồn gốc của chủ sở hữu; chưa xác minh giấy phép tái phân phối thương mại.

## Triển khai

`.openai/hosting.json` khai báo static `dist/`. Ảnh cảnh 1x được giữ; bộ cảnh 2x có ở gói recovery riêng. Mã public client gốc được giữ nguyên, bản chạy `assets/game-client.js` chỉ thay transport và callback adapter; phần giải rối không bị coi là source TSX nguyên bản.
