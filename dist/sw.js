/*
 * Service worker của Cổ Giới (viết tay, không phải file sinh ra): chỉ nhận thông báo đẩy lúc người chơi vắng
 * (GDD §12.4, HUD bản 101 cách C) và mở lại game khi bấm vào thông báo. Không lưu đệm trang.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let tin = { tieuDe: "Cổ Tiên Lộ", noi: "" };
  try { tin = { ...tin, ...e.data.json() }; } catch { /* bản tin rỗng: dùng chữ mặc định */ }
  e.waitUntil(self.registration.showNotification(tin.tieuDe, { body: tin.noi, tag: "cogioi-vang", renotify: false, lang: "vi" }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ds = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const dang = ds.find((c) => new URL(c.url).origin === self.location.origin);
    if (dang) return dang.focus();
    return self.clients.openWindow(self.registration.scope);
  })());
});
