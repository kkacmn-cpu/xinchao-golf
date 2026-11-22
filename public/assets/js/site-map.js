/* 지도로 보기(2026-11-22). 풀빌라 사이트(js/villa-map.js)와 골프 사이트(public/assets/js/site-map.js)가 같은 파일을 쓴다 — 고치면 둘 다 복사.
   선택 자료(골프 사이트용): golf[].pop(팝업 HTML), areas[].b(누르면 맞출 범위), areas[].title, stays[](숙소 동네 표시), startAll(전국 골프장으로 시작), sideKm(이름표 펼칠 거리, 기본 2km). 자료는 쪽 안의 #mapData(동네 중심 좌표·골프장 좌표)만 쓴다.
   휴대폰 한 손: 지도는 화면 절반 높이라 아래로 넘기기 쉽고, 동네는 지도 바로 아래 큰 단추로 고른다(누르면 지도가 그 동네로 간다).
   지도 없이도(자바스크립트 꺼짐) 아래 동네 목록은 모두 보인다. */
(function () {
  var holder = document.getElementById("villaMap");
  var dataEl = document.getElementById("mapData");
  if (!holder || !dataEl) return;
  var data = JSON.parse(dataEl.textContent);
  var panels = Array.prototype.slice.call(document.querySelectorAll(".map-panel"));
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-area-btn]"));
  document.documentElement.classList.add("map-js");

  var map = null, areaMarkers = {}, layers = {};
  if (window.L) {
    map = L.map(holder, { zoomSnap: 0.25, zoomControl: false, scrollWheelZoom: false, dragging: true, tap: false, attributionControl: true });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    layers.villa = L.layerGroup().addTo(map);
    layers["golf-hcm"] = L.layerGroup().addTo(map);
    layers["golf-all"] = data.startAll ? L.layerGroup().addTo(map) : L.layerGroup();
    if (data.stays) {
      layers.stay = L.layerGroup().addTo(map);
      data.stays.forEach(function (s) {
        var icon = L.divIcon({ className: "mk", html: '<span class="mk-stay">🏠<i>' + s.label + "</i></span>", iconSize: null });
        L.marker([s.lat, s.lon], { icon: icon, title: s.label, keyboard: true }).bindPopup(s.pop, { maxWidth: 240 }).addTo(layers.stay);
      });
    }
    // 2km 안에 다른 동네가 있으면 이름표를 서로 반대쪽으로 펼쳐 겹치지 않게 한다(동서로 가까우면 좌우, 남북으로 가까우면 위아래).
    function side(a) {
      var near = null, best = data.sideKm || 2;
      data.areas.forEach(function (b) {
        if (b === a) return;
        var km = Math.sqrt(Math.pow((b.lat - a.lat) * 111, 2) + Math.pow((b.lon - a.lon) * 109, 2));
        if (km < best) { best = km; near = b; }
      });
      if (!near) return "";
      var dy = (near.lat - a.lat) * 111, dx = (near.lon - a.lon) * 109;
      if (Math.abs(dy) > Math.abs(dx)) return dy > 0 ? " mk-down" : " mk-up";
      return dx > 0 ? " mk-left" : " mk-right";
    }
    data.areas.forEach(function (a) {
      var icon = L.divIcon({ className: "mk", html: '<span class="mk-area' + side(a) + '">' + a.label + "<b>" + a.n + "</b></span>", iconSize: null });
      var m = L.marker([a.lat, a.lon], { icon: icon, title: a.title || (a.label + " 빌라 " + a.n + "채"), keyboard: true, riseOnHover: true, zIndexOffset: 1000 }).addTo(layers.villa);
      m.on("click", function () { select(a.id, false); });
      areaMarkers[a.id] = m;
    });
    data.golf.forEach(function (g) {
      var icon = L.divIcon({ className: "mk", html: '<span class="mk-golf' + (g.approx ? " mk-approx" : "") + '">⛳<i>' + g.short.split(" · ")[0] + "</i></span>", iconSize: null });
      var m = L.marker([g.lat, g.lon], { icon: icon, title: g.name, keyboard: true });
      m.bindPopup(g.pop || '<strong class="mk-pop-title">' + g.name + "</strong><br><span class=\"mk-pop-sub\">" + g.region + (g.approx ? " · 대략 위치(지역 중심)" : "") + '</span><br><a href="' + g.url + '" target="_blank" rel="noopener">골프장 자세히 보기 →</a><br><a href="/go/villa-golf-combo">⛳ 숙소와 골프 한 번에 견적 →</a>', { maxWidth: 240 });
      m.addTo(g.area === "hcm" ? layers["golf-hcm"] : layers["golf-all"]);
    });
    // 멀리 볼 때(전국)는 골프장 이름을 숨기고 ⛳만 둔다. 확대하면 이름이 나온다.
    var far = function () { holder.classList.toggle("map-far", map.getZoom() < 10); };
    map.on("zoomend", far);
    fitHcm();
    far();
  }

  function fitHcm() {
    if (!map) return;
    // 첫 화면은 빌라 동네만 맞춘다(동네 표시가 겹치지 않게). 호치민권 골프장은 지도를 줄이면 보인다.
    var pts = data.areas.map(function (a) { return [a.lat, a.lon]; });
    map.fitBounds(L.latLngBounds(pts), { maxZoom: 14, paddingTopLeft: [60, 24], paddingBottomRight: [90, 24] });
  }

  function select(id, pan) {
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-area") !== id; });
    buttons.forEach(function (b) { if (b.getAttribute("data-area-btn") === id) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    Object.keys(areaMarkers).forEach(function (k) {
      var el = areaMarkers[k].getElement && areaMarkers[k].getElement();
      if (el) el.classList.toggle("mk-on", k === id);
    });
    var area = data.areas.filter(function (a) { return a.id === id; })[0];
    if (map && pan !== false && area && area.b) map.fitBounds(area.b, { padding: [30, 30], maxZoom: 12 });
    else if (map && pan !== false && areaMarkers[id]) map.panTo(areaMarkers[id].getLatLng());
    if (id === "golf-list") setLayer("golf-all", true);
  }

  function setLayer(name, on) {
    var chip = document.querySelector('[data-layer="' + name + '"]');
    if (chip) chip.setAttribute("aria-pressed", String(on));
    if (!map) return;
    if (on) layers[name].addTo(map); else map.removeLayer(layers[name]);
    if (name === "golf-all") {
      if (on) {
        var all = data.golf.map(function (g) { return [g.lat, g.lon]; });
        map.fitBounds(L.latLngBounds(all).pad(0.05));
        if (!map.hasLayer(layers["golf-hcm"])) setLayer("golf-hcm", true);
      } else fitHcm();
    }
  }

  document.querySelectorAll("[data-layer]").forEach(function (chip) {
    chip.addEventListener("click", function () { setLayer(chip.getAttribute("data-layer"), chip.getAttribute("aria-pressed") !== "true"); });
  });
  buttons.forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); select(b.getAttribute("data-area-btn")); });
  });

  var first = location.hash && document.querySelector('[data-area="' + location.hash.slice(1) + '"]') ? location.hash.slice(1) : (data.areas[0] && data.areas[0].id);
  if (first) select(first, location.hash ? true : false);
})();
