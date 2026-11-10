# Cổ Tiên Lộ · Bản game độc lập

Bản chơi đơn dùng client Phaser/React và asset công khai của https://cotienlo.com, được khảo sát bằng REA. Runtime trong `src/runtime.mjs` và profile trong `src/profile-defaults.mjs` là mã dựng mới, **không phải backend gốc**. Không kết nối tài khoản hoặc máy chủ game gốc.

## Trạng thái dự án

- Phiên bản hiện tại: `3.0.0`
- Mục tiêu: bản game độc lập chạy trên trình duyệt, không yêu cầu máy chủ gốc.
- Nhánh phát hành: `main`
- Máy chủ mặc định khi chạy local: `http://127.0.0.1:4175`

## Yêu cầu

- Node.js 20 trở lên.
- Trình duyệt hiện đại có JavaScript và IndexedDB.
- Không cần cài dependency npm; các lệnh bên dưới chỉ dùng module có sẵn của Node.js.

## Chạy

Node.js 20 trở lên, không cần dependency:

```sh
npm run build
npm start
```

Mở http://127.0.0.1:4175. Có thể phục vụ thư mục `dist/` bằng static host. Build chạy lại được; giữ nguyên `dist/assets/index-ChkNmBLw.js` làm đầu vào gốc và `src/index.original.html` làm template. Không cần repo recovery ở đường dẫn tuyệt đối.

## Các lệnh thường dùng

```sh
# Dựng lại dist từ mã nguồn hiện tại
npm run build

# Kiểm tra cú pháp runtime
npm run check

# Chạy toàn bộ bộ kiểm thử hệ thống
npm test

# Chạy máy chủ phát triển/local
npm start
```

Sau `npm run build`, thư mục cần triển khai là `dist/`. Máy chủ static phải hỗ trợ fallback về `index.html` nếu muốn dùng các route phía client.

## Cấu trúc chính

```text
src/
  runtime.mjs                 Runtime game độc lập và vòng lặp chơi
  profile-defaults.mjs        Hồ sơ nhân vật mặc định
  systems/                    Combat, quái, truyện, tiến trình, kho đồ, dịch vụ
  index.original.html         Template đầu vào để build client
scripts/
  build.mjs                   Tạo lại dist
  test-*.mjs                  Kiểm thử từng hệ thống
dist/
  assets/                     Client đã build và tài nguyên hình ảnh
reports/                      Báo cáo khảo sát, kiểm kê và phạm vi tính năng
server.mjs                    Máy chủ static local
```

## Lưu và khôi phục tiến trình

Tiến trình được tự lưu trong trình duyệt khoảng mỗi 4 giây bằng IndexedDB/local storage của client. Người chơi có thể xuất JSON dự phòng từ giao diện và nhập lại trên cùng bản game. Dữ liệu lưu không đồng bộ giữa các thiết bị; xóa dữ liệu trang hoặc đổi domain có thể làm mất bản lưu nếu chưa xuất file dự phòng.

## Cập nhật 22/10/2026

Client hiện dùng bundle `index-ChkNmBLw.js` và catalog 55 vùng / 377 cổ / 379 vật phẩm / 70 công thức. Xem `reports/INTEGRATION-2026-10-22.md` để biết bằng chứng và phạm vi; `dist/reconstruction/` có bảng kiểm kê 78 hệ và gói mã client giải rối.

## Đã dựng

- Tạo tên/giới tính/màu áo bằng giao diện gốc; vào bản đồ Tạ gia trại.
- Di chuyển, va chạm, camera, minimap, animation và UI gốc.
- Mở đầu Giấc mơ với Tri Thu, bộ cổ Ngũ chuyển, hướng dẫn và cảnh tỉnh dậy trước khi vào trại. Bản lưu cũ được giữ, có chơi lại mở đầu.
- Quái có HP, đuổi đánh, hồi sinh; hệ combat đọc data, có tầm/AoE/CN/cooldown/DoT/khiên/khống chế/cánh. 226 Gu có xử lý đầy đủ hoặc một phần, 151 báo chưa hỗ trợ.
- NPC trò chuyện/hồi phục; thu thập thảo dược; vận khí, tích tu vi, đột phá.
- Lắp/tháo, cho ăn, luyện hóa cổ; thuốc, mua/bán và công thức hợp luyện có kiểm tra tài nguyên. Tu luyện dùng mini UI gốc. Một số luật vẫn là reconstruction.
- Nhiệm vụ khởi hành chơi đơn và phần thưởng, không phải cây nhiệm vụ gốc; 16 vùng thế giới đi đến từ menu Hành trình.
- Tự lưu mỗi 4 giây trên trình duyệt; xuất file JSON dự phòng. Tiến trình không đồng bộ giữa thiết bị. Xóa dữ liệu trang sẽ mất bản lưu.

## Giới hạn

Đây là mô phỏng chơi đơn. Chưa có Colyseus backend thật, multiplayer/PvP, bang hội, giao dịch, tài khoản trực tuyến, cây nhiệm vụ ngoài intro, đầy đủ chế tạo/nghề nghiệp hoặc toàn bộ luật cổ trùng. Chỉ số/cân bằng/phần thưởng và trigger/timing của intro được dựng độc lập. Các nút ngoài phạm vi được ẩn hoặc báo rõ chưa hỗ trợ. Asset giữ nguồn gốc của chủ sở hữu; chưa xác minh giấy phép tái phân phối thương mại. Không nên xem bản này là máy chủ, bản sao dữ liệu tài khoản hoặc bản triển khai thương mại của game gốc.

## Quy trình phát triển

1. Sửa mã trong `src/` hoặc script trong `scripts/`.
2. Chạy `npm run check` và các test liên quan.
3. Chạy `npm run build` để cập nhật `dist/`.
4. Chạy `npm test` trước khi phát hành.
5. Kiểm tra trực tiếp bằng `npm start` trên desktop và mobile viewport.

Không sửa trực tiếp các file bundle đã build trong `dist/` nếu thay đổi đó có thể thực hiện ở `src/`; lần build sau sẽ ghi đè chúng.

## Triển khai

`.openai/hosting.json` khai báo static `dist/`. Ảnh cảnh 1x được giữ; bộ cảnh 2x có ở gói recovery riêng. Mã public client gốc được giữ nguyên, bản chạy `assets/game-client.js` chỉ thay transport và callback adapter; phần giải rối không bị coi là source TSX nguyên bản.
