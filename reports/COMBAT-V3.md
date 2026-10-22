# Combat V3

42 nhóm test, kèm sweep toàn bộ 377 Gu công khai. 266 được chấp nhận, 18 trong số này có phần effect thiếu; 111 bị từ chối rõ ràng thay vì tạo sát thương chung. Chỉ số này đo executor, không đo parity game gốc.

Mở rộng ẩn thân/reveal, mù/phong khiếu, dash có cầu nối địa hình, tích băng/nổ băng, lá hồi, lực tạm/chậm bản thân, phản sát thương, kháng lưu phái, biến thân, bảo mệnh có cooldown lưu, cộng hưởng bản mệnh, lifecycle/AI đồng hành có factory host. Các effect lấy tham số công khai; công thức thiếu server được ghi rõ ở `src/systems/combat-notes.md`.

Parent sở hữu loot/quest. Callback `onKill` chỉ cộng quest sau khi encounter quyết định boss có hồi sinh không; callback `onCombatAction` cấp thuần thục cho Gu dùng trúng mục tiêu thật. Hộ cụ/passive/care được nối với progression. Nhận sát thương gọi progression hủy hấp thu và lưu HP sau đòn. Dummy không đánh trả/nhận thưởng; state effect theo object tránh lây sang quái respawn.

Giới hạn: actorstats/sát thương gốc chưa đủ công thức server; full pet capture/feeding/mount chưa có host; nô địch/địa lôi/trận/tường/thời gian/một số one-use và niệm còn thiếu; phần lớn sát chiêu chưa đủ công thức. Passive HP/CN/speed đã nối; vài chỉ số phụ như Lực/hoi_cn chưa đầy đủ. Đây là cải thiện mô hình chơi đơn dựa dữ liệu, không phải khôi phục toàn bộ backend.
