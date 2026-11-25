/* 요청서 카드(2026-11-23): 공항 픽업·패스트트랙 / 골프·숙소·차량 묶음 / 한 달 살기 아파트.
   골프 public/assets/js/req-card.js = 풀빌라 js/req-card.js (고치면 둘 다 복사).
   <section class="req-card" data-go="/go/..." data-head="[제목]">
     <fieldset class="qq-group" data-field="이름" [data-multi] [data-required]>
       <button class="qq-chip" data-v="값"> · 날짜 칩 data-date="sat0|sun0|sat1" · 직접 칩 data-pick + 같은 묶음 .qq-input
     <input class="qq-input" data-field="편명"> (칩 없는 글칸)
     <button class="req-send"> <p class="qq-status"> <textarea class="qq-fallback" hidden>
   누르면 "제목 / 이름: 값 …" 요약을 복사하고 data-go?from=경로 로 간다(카톡). */
(function () {
  var cards = document.querySelectorAll(".req-card");
  if (!cards.length) return;
  var days = ["일", "월", "화", "수", "목", "금", "토"];
  function fmt(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "(" + days[d.getDay()] + ")"; }
  var base = new Date(); base.setHours(12, 0, 0, 0);
  var sat0 = new Date(base); sat0.setDate(base.getDate() + ((6 - base.getDay() + 7) % 7));
  var pick = { sat0: sat0, sun0: new Date(sat0.getTime() + 864e5), sat1: new Date(sat0.getTime() + 7 * 864e5) };
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(text); });
    return Promise.resolve(legacy(text));
  }
  function legacy(text) {
    var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; } t.remove(); return ok;
  }
  function inputValue(input) {
    var v = (input.value || "").trim();
    if (!v) return "";
    if (input.type === "date") return fmt(new Date(v + "T12:00"));
    if (input.type === "number") return v + (input.getAttribute("data-unit") || "명");
    return v;
  }
  function groupValues(group) {
    var out = [];
    group.querySelectorAll('.qq-chip[aria-pressed="true"]').forEach(function (c) {
      if (c.hasAttribute("data-pick")) { var inp = group.querySelector(".qq-input"); var v = inp ? inputValue(inp) : ""; if (v) out.push(v); }
      else if (c.getAttribute("data-date")) out.push(fmt(pick[c.getAttribute("data-date")]));
      else out.push(c.getAttribute("data-v"));
    });
    return out;
  }
  cards.forEach(function (card) {
    var status = card.querySelector(".qq-status");
    card.addEventListener("click", function (event) {
      var btn = event.target.closest(".qq-chip");
      if (!btn || !card.contains(btn)) return;
      var group = btn.closest(".qq-group");
      var on = btn.getAttribute("aria-pressed") !== "true";
      if (!group.hasAttribute("data-multi")) group.querySelectorAll(".qq-chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", String(group.hasAttribute("data-multi") ? on : true));
      var inp = group.querySelector(".qq-input");
      if (inp && group.querySelector(".qq-chip[data-pick]")) {
        var show = !!group.querySelector('.qq-chip[data-pick][aria-pressed="true"]');
        inp.hidden = !show; if (show && btn.hasAttribute("data-pick")) inp.focus();
      }
      if (status) status.textContent = "";
    });
    card.querySelector(".req-send").addEventListener("click", function () {
      var lines = [card.getAttribute("data-head") || "[견적 요청]"];
      var missing = "";
      card.querySelectorAll(".qq-group").forEach(function (group) {
        var vals = groupValues(group);
        if (!vals.length && group.hasAttribute("data-required") && !missing) missing = group.getAttribute("data-field");
        if (vals.length) lines.push(group.getAttribute("data-field") + ": " + vals.join(" · "));
      });
      card.querySelectorAll("input.qq-input[data-field]").forEach(function (input) { var v = inputValue(input); if (v) lines.push(input.getAttribute("data-field") + ": " + v); });
      if (missing) { status.textContent = missing + " 항목을 골라 주세요."; return; }
      lines.push("보낸 쪽: " + location.origin + location.pathname);
      lines.push("이대로 보내 주시면 확인해서 견적을 드립니다.");
      var text = lines.join("\n");
      var go = card.getAttribute("data-go") + "?from=" + encodeURIComponent(card.getAttribute("data-from") || location.pathname);
      copy(text).then(function (ok) {
        if (ok) { status.textContent = "요약이 복사됐어요. 카톡이 열리면 입력창을 길게 눌러 붙여넣고 보내 주세요."; setTimeout(function () { location.href = go; }, 700); }
        else { var box = card.querySelector(".qq-fallback"); box.hidden = false; box.value = text; box.select(); status.innerHTML = '자동 복사가 안 됐어요. 위 요약을 길게 눌러 복사한 뒤 <a href="' + go + '">카톡 열기</a>를 눌러 붙여넣어 주세요.'; }
      });
    });
  });
})();
