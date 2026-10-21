/* Wiki Cổ Tiên Lộ (River 20/10): tìm kiếm trên chỉ mục tim.json, mở mục lục bên trên máy tính, lọc danh sách cổ. Viết tay, không thư viện. */
(function () {
  "use strict";
  var boDau = function (s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  };

  // Mục lục bên: máy tính mở sẵn, điện thoại gập (bấm "Mục lục" để mở)
  var ben = document.getElementById("ben");
  if (ben && window.matchMedia("(min-width: 900px)").matches) ben.open = true;

  // Tìm kiếm
  var o = document.getElementById("tim");
  var kq = document.getElementById("tim-kq");
  if (o && kq) {
    var chiMuc = null, dangTai = null, chon = -1;
    var tai = function () {
      if (chiMuc || dangTai) return dangTai;
      dangTai = fetch((o.getAttribute("data-goc") || "/wiki/") + "tim.json").then(function (r) { return r.json(); }).then(function (j) { chiMuc = j; return j; }).catch(function () { chiMuc = []; });
      return dangTai;
    };
    var tim = function (q) {
      var tu = boDau(q).split(/\s+/).filter(Boolean);
      if (!tu.length || !chiMuc) return [];
      var out = [];
      for (var i = 0; i < chiMuc.length; i++) {
        var m = chiMuc[i], ten = boDau(m.t), diem = 0, du = true;
        for (var j = 0; j < tu.length; j++) {
          if (ten.indexOf(tu[j]) >= 0) diem += ten.indexOf(tu[j]) === 0 ? 5 : 3;
          else if (m.k.indexOf(tu[j]) >= 0) diem += 1;
          else { du = false; break; }
        }
        if (du) out.push([diem + (ten === tu.join(" ") ? 10 : 0), m]);
      }
      out.sort(function (a, b) { return b[0] - a[0] || a[1].t.length - b[1].t.length; });
      return out.slice(0, 12).map(function (x) { return x[1]; });
    };
    var ve = function () {
      var q = o.value.trim();
      chon = -1;
      if (!q) { kq.hidden = true; kq.innerHTML = ""; return; }
      var ds = tim(q);
      kq.innerHTML = "";
      if (!ds.length) {
        var li = document.createElement("li"); li.className = "khong"; li.textContent = o.getAttribute("data-khong") || ""; kq.appendChild(li);
      }
      ds.forEach(function (m) {
        var li = document.createElement("li"), a = document.createElement("a"), s = document.createElement("small");
        a.href = m.u; a.textContent = m.t; a.setAttribute("role", "option");
        s.textContent = m.n; a.appendChild(s); li.appendChild(a); kq.appendChild(li);
      });
      kq.hidden = false;
    };
    o.addEventListener("focus", tai);
    o.addEventListener("input", function () { var p = tai(); if (p && !chiMuc) p.then(ve); else ve(); });
    o.addEventListener("keydown", function (e) {
      var as = kq.querySelectorAll("a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!as.length) return;
        e.preventDefault();
        chon = (chon + (e.key === "ArrowDown" ? 1 : -1) + as.length) % as.length;
        as.forEach(function (a, i) { a.setAttribute("aria-selected", i === chon ? "true" : "false"); });
      } else if (e.key === "Enter") {
        var a = as[chon >= 0 ? chon : 0];
        if (a) { e.preventDefault(); location.href = a.href; }
      } else if (e.key === "Escape") { kq.hidden = true; o.blur(); }
    });
    document.addEventListener("click", function (e) { if (!kq.contains(e.target) && e.target !== o) kq.hidden = true; });
  }

  // Lọc danh sách cổ theo lưu phái (trang Cổ trùng)
  var nut = document.querySelectorAll(".loc button[data-loc]");
  if (nut.length) {
    var loc = function (lp) {
      nut.forEach(function (b) { b.classList.toggle("dang", b.getAttribute("data-loc") === lp); });
      document.querySelectorAll("tr[data-lp]").forEach(function (tr) { tr.hidden = !!lp && tr.getAttribute("data-lp") !== lp; });
    };
    nut.forEach(function (b) { b.addEventListener("click", function () { loc(b.getAttribute("data-loc")); }); });
    var h = location.hash.replace(/^#lp-/, "");
    if (h && h !== location.hash) loc(h);
  }
})();
