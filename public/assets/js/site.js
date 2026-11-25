// 골프 일정 담기(2026-11-24, 1위 '장바구니' 따라잡기): 골프장 상세의 빠른 견적에서 날짜·인원·홀을 고른 라운드를
// 여러 골프장에 걸쳐 담고, 아래 막대에서 한 번에 카톡 견적 요약으로 보낸다. 가격·결제 없음. 3일 지나면 비운다.
window.golfTrip = (() => {
  const KEY = "golfTrip", MAX = 6, TTL = 3 * 864e5;
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return v.at && Date.now() - v.at < TTL && Array.isArray(v.rounds) ? v.rounds : []; } catch { return []; } };
  const write = (rounds) => { try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), rounds })); } catch {} };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let bar;
  const render = () => {
    const rounds = read();
    if (!bar) {
      if (!rounds.length) return;
      bar = document.createElement("div");
      bar.className = "trip-bar";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "담은 골프 일정");
      bar.innerHTML = '<details class="trip-list"><summary class="trip-count"></summary><ol></ol><button type="button" class="trip-share" data-cta="trip-share">일행에게 보내기</button><p class="trip-note" role="status"></p></details><div class="trip-actions"><button type="button" class="trip-send">한 번에 견적</button><button type="button" class="trip-clear" aria-label="일정 비우기">✕</button></div>';
      bar.querySelector(".trip-send").addEventListener("click", () => send());
      bar.querySelector(".trip-clear").addEventListener("click", () => { write([]); render(); });
      bar.querySelector(".trip-share").addEventListener("click", () => share());
      bar.querySelector("ol").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const r = read(); r.splice(Number(b.dataset.i), 1); write(r); render(); });
      document.body.append(bar);
    }
    bar.hidden = rounds.length === 0;
    document.body.classList.toggle("has-trip", rounds.length > 0);
    bar.querySelector(".trip-count").textContent = `골프 일정 ${rounds.length}라운드 담음`;
    bar.querySelector("ol").innerHTML = rounds.map((r, i) => `<li>${esc(r.date)} · ${esc(r.name)}${r.holes ? ` · ${esc(r.holes)}` : ""} · ${esc(r.people)} <button type="button" data-i="${i}" aria-label="이 라운드 빼기">빼기</button></li>`).join("");
  };
  const add = (round) => {
    const rounds = read().filter((r) => !(r.slug === round.slug && r.date === round.date));
    rounds.push(round);
    rounds.sort((a, b) => a.date.localeCompare(b.date));
    while (rounds.length > MAX) rounds.shift();
    write(rounds);
    render();
    return rounds.length;
  };
  const text = (rounds) => [
    "[신짜오골프 일정 견적]",
    ...rounds.map((r, i) => `${i + 1}) ${r.date} ${r.name}${r.holes ? ` ${r.holes}` : ""} · ${r.people}`),
    `보낸 쪽: ${location.origin}${location.pathname}`,
    "이 일정으로 티오프 가능 여부와 견적 부탁드립니다.",
  ].join("\n");
  const copy = async (t) => {
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(t); return true; } } catch {}
    const ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch {} ta.remove(); return ok;
  };
  // 일행에게 보내기(2026-11-25, 1위 'URL 복사' 따라잡기 + 우리만: 링크를 연 일행에게 같은 일정이 담긴다).
  const shareUrl = (rounds) => `${location.origin}/go/trip-share?to=${rounds[0].slug}&trip=${encodeURIComponent(JSON.stringify(rounds.map((r) => [r.slug, r.name, r.date, r.people, r.holes || ""])))}`; // 중간 쪽 /go/trip-share 열림 = 관제판 '링크 열림'(2026-11-25);
  const share = async () => {
    const rounds = read();
    if (!rounds.length) return;
    const url = shareUrl(rounds);
    const body = ["[신짜오골프] 같이 갈 골프 일정", ...rounds.map((r, i) => `${i + 1}) ${r.date} ${r.name}${r.holes ? ` ${r.holes}` : ""} · ${r.people}`), "링크를 열면 같은 일정이 담겨 있어요. 고칠 곳 있으면 말해 주세요."].join("\n");
    const note = bar.querySelector(".trip-note");
    if (navigator.share) { try { await navigator.share({ title: "골프 일정", text: body, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    note.textContent = (await copy(`${body}\n${url}`)) ? "일정과 링크가 복사됐어요. 카톡 단톡방에 붙여넣어 보내세요." : "복사가 안 됐어요. 주소창의 링크를 길게 눌러 보내 주세요.";
  };
  const load = () => {
    let raw = null;
    try { raw = new URLSearchParams(location.search).get("trip"); } catch {}
    if (!raw) return;
    let list = [];
    try { list = JSON.parse(raw); } catch {}
    const ok = (v, n) => typeof v === "string" && v.length <= n;
    const rounds = (Array.isArray(list) ? list.slice(0, MAX) : []).filter((r) => Array.isArray(r) && /^[a-z0-9-]{1,80}$/.test(r[0]) && ok(r[1], 60) && ok(r[2], 20) && ok(r[3], 12) && ok(r[4] || "", 12) && r[2] && r[3])
      .map(([slug, name, date, people, holes]) => ({ slug, name, date, people, holes: holes || "" }));
    rounds.forEach((r) => add(r));
    try { const u = new URL(location.href); u.searchParams.delete("trip"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch {}
    if (rounds.length && bar) { bar.querySelector(".trip-list").open = true; bar.querySelector(".trip-note").textContent = `일행이 보낸 일정 ${rounds.length}라운드가 담겼어요. '한 번에 견적'으로 바로 문의할 수 있어요.`; }
  };
  const send = async () => {
    const rounds = read();
    if (!rounds.length) return;
    const t = text(rounds);
    if (await copy(t)) { setTimeout(() => { location.href = "/go/quick-golf?from=trip"; }, 400); }
    else { window.prompt("아래 요약을 복사한 뒤 카톡에 붙여넣어 주세요.", t); location.href = "/go/quick-golf?from=trip"; }
  };
  const init = () => { render(); load(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  return { add, send, share, list: read, text };
})();

(() => {
  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const menuButton = document.querySelector(".menu-button");
  const menu = document.querySelector(".site-nav");
  const homePrepForm = document.querySelector("#home-prep-form");
  const homePrepResult = document.querySelector("#home-prep-result");

  const closeMenu = () => {
    menu?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  };

  menuButton?.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      closeMenu();
      menuButton?.focus();
    }
  });

  // 상담 준비 요약을 클립보드에 복사한다. 안 되면 직접 복사하도록 안내한다.
  const copyStatus = document.querySelector("#home-prep-copy-status");
  const legacyCopy = (text) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    return ok;
  };
  const copyPrepSummary = async (text) => {
    if (!copyStatus) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; }
      else ok = legacyCopy(text);
    } catch { ok = legacyCopy(text); }
    copyStatus.textContent = ok
      ? "복사됐어요. 아래 버튼으로 카카오톡을 열고 붙여 넣으세요."
      : "자동 복사가 되지 않았어요. 위 요약을 길게 눌러 복사한 뒤 카카오톡에 붙여 넣어 주세요.";
  };

  homePrepForm?.addEventListener("input", () => { if (homePrepResult) homePrepResult.hidden = true; });
  homePrepForm?.addEventListener("change", () => { if (homePrepResult) homePrepResult.hidden = true; });
  homePrepForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(homePrepForm);
    const region = String(data.get("region") || "");
    const date = String(data.get("date") || "");
    const people = Number(data.get("people"));
    const purpose = String(data.get("purpose") || "");
    const regionOptions = [...homePrepForm.querySelectorAll('select[name="region"] option')].map((option) => option.value).filter(Boolean);
    if (!homePrepForm.reportValidity() || !regionOptions.includes(region) || !Number.isInteger(people) || people < 1 || people > 40) return;
    // 화면에 보이는 요약과 복사되는 문장을 같게 한다(복사가 안 되면 화면 요약을 직접 복사).
    const summaryText = `[신짜오골프 상담 준비] 희망 지역: ${region} / 날짜: ${date} / 인원: ${people}명 / 목적: ${purpose}`;
    document.querySelector("#home-prep-summary").textContent = summaryText;
    copyPrepSummary(summaryText);
    const lists = document.querySelectorAll("#home-prep-candidates ul[data-region]");
    let found = false;
    lists.forEach((list) => { list.hidden = list.dataset.region !== region; if (!list.hidden) found = true; });
    document.querySelector("#home-prep-candidates").hidden = !found;
    document.querySelector("#home-prep-other-region").hidden = found;
    if (homePrepResult) homePrepResult.hidden = false;
  });

  const filterButtons = document.querySelectorAll(".filter-button");
  const areaSections = document.querySelectorAll("#course-list > [data-area]");
  const applyFilter = (filter) => {
    filterButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.filter === filter));
    areaSections.forEach((section) => { section.hidden = filter !== "all" && section.dataset.area !== filter; });
  };
  filterButtons.forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  const hashArea = location.hash.match(/^#area-([a-z]+)$/)?.[1];
  if (hashArea && [...filterButtons].some((button) => button.dataset.filter === hashArea)) applyFilter(hashArea);

  // 홈 첫 화면 밖 배경 사진: 화면 가까이 오면 붙인다.
  const applyStyle = (element, key) => {
    const value = element.dataset[key];
    if (!value) return;
    const current = element.getAttribute("style");
    element.setAttribute("style", current ? `${current};${value}` : value);
    delete element.dataset[key];
  };
  const lazyBackgrounds = document.querySelectorAll("[data-lazy-style]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      applyStyle(entry.target, "lazyStyle");
    }), { rootMargin: "600px 0px" });
    lazyBackgrounds.forEach((element) => observer.observe(element));
  } else {
    lazyBackgrounds.forEach((element) => applyStyle(element, "lazyStyle"));
  }
  const applyDeferred = () => document.querySelectorAll("[data-deferred-style]").forEach((element) => applyStyle(element, "deferredStyle"));
  if (document.readyState === "complete") applyDeferred();
  else window.addEventListener("load", applyDeferred, { once: true });

  // 빠른 견적 카드(골프 상세): 날짜·인원 칩 → 요약 복사 → /go/quick-golf(카톡). 11-21
  const qq = document.querySelector(".quick-quote");
  if (qq) {
    const state = { date: "", people: "", holes: "", extras: new Set(), arrival: "" };
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}(${days[d.getDay()]})`;
    const base = new Date(); base.setHours(12, 0, 0, 0);
    const sat0 = new Date(base); sat0.setDate(base.getDate() + ((6 - base.getDay() + 7) % 7));
    const pick = { sat0, sun0: new Date(sat0.getTime() + 864e5), sat1: new Date(sat0.getTime() + 7 * 864e5) };
    const press = (group, btn) => { group.querySelectorAll(".qq-chip").forEach((c) => { if (!c.hasAttribute("data-extra") && !c.hasAttribute("data-arrival")) c.setAttribute("aria-pressed", String(c === btn)); }); };
    const dateInput = qq.querySelector(".qq-date");
    const peopleInput = qq.querySelector(".qq-people");
    const status = qq.querySelector(".qq-status");
    const arrivalBox = qq.querySelector(".qq-arrival");
    const arrivalResult = qq.querySelector(".qq-arrival-result");
    const driveMax = Number(qq.dataset.driveMax) || 0;
    const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const calcArrival = () => {
      const v = qq.querySelector(".qq-time").value;
      if (!v) { state.arrival = ""; arrivalResult.textContent = ""; return; }
      const [h, m] = v.split(":").map(Number);
      const tee = Math.ceil((h * 60 + m + 60 + driveMax + 20) / 10) * 10; // 입국·짐 60분 + 공항 최대 이동 + 접수 20분
      const text = tee <= 13 * 60 ? `도착일 18홀 가능해요: 티오프 ${hhmm(tee)} 이후로 잡으면 됩니다(추정).`
        : tee <= 14 * 60 + 30 ? `18홀은 빠듯해요: 티오프 ${hhmm(tee)} 이후, 9홀이나 다음 날을 권해요(추정).`
        : `도착일 라운드는 어려워요(티오프 ${hhmm(tee)} 이후). 다음 날 라운드를 권해요(추정).`;
      arrivalResult.textContent = `${qq.dataset.airport} ${v} 도착 기준 — ${text}`;
      state.arrival = `${v} 도착 → ${text}`;
    };
    qq.addEventListener("click", (event) => {
      const btn = event.target.closest(".qq-chip");
      if (!btn) return;
      const group = btn.closest(".qq-group");
      if (btn.dataset.date) { press(group, btn); dateInput.hidden = true; state.date = fmt(pick[btn.dataset.date]); }
      else if (btn.hasAttribute("data-date-pick")) { press(group, btn); dateInput.hidden = false; dateInput.focus(); state.date = dateInput.value ? fmt(new Date(dateInput.value + "T12:00")) : ""; }
      else if (btn.dataset.people) { press(group, btn); peopleInput.hidden = true; state.people = `${btn.dataset.people}명`; }
      else if (btn.dataset.holes) { const on = btn.getAttribute("aria-pressed") !== "true"; press(group, on ? btn : null); state.holes = on ? btn.dataset.holes : ""; }
      else if (btn.hasAttribute("data-people-pick")) { press(group, btn); peopleInput.hidden = false; peopleInput.focus(); state.people = peopleInput.value ? `${peopleInput.value}명` : ""; }
      else if (btn.dataset.extra) { const on = btn.getAttribute("aria-pressed") !== "true"; btn.setAttribute("aria-pressed", String(on)); on ? state.extras.add(btn.dataset.extra) : state.extras.delete(btn.dataset.extra); }
      else if (btn.hasAttribute("data-arrival")) { const on = btn.getAttribute("aria-pressed") !== "true"; btn.setAttribute("aria-pressed", String(on)); arrivalBox.hidden = !on; if (on) qq.querySelector(".qq-time").focus(); else { state.arrival = ""; } }
      status.textContent = "";
    });
    dateInput.addEventListener("change", () => { state.date = dateInput.value ? fmt(new Date(dateInput.value + "T12:00")) : ""; });
    peopleInput.addEventListener("input", () => { state.people = peopleInput.value ? `${peopleInput.value}명` : ""; });
    qq.querySelector(".qq-time").addEventListener("input", calcArrival);
    const round = () => ({ slug: qq.dataset.slug, name: qq.dataset.name, date: state.date, people: state.people, holes: state.holes || "" });
    const need = () => (!state.date ? "날짜를 골라 주세요." : !state.people ? "인원을 골라 주세요." : "");
    const trip = window.golfTrip;
    qq.querySelector(".qq-trip-add")?.addEventListener("click", () => {
      const msg = need();
      if (msg) { status.textContent = msg; return; }
      const n = trip.add(round());
      status.textContent = `일정에 담았어요(${n}라운드). 다른 골프장에서도 담은 뒤 아래 막대의 '한 번에 견적'을 누르세요. 일행과 맞추려면 막대를 펼쳐 '일행에게 보내기'.`;
    });
    qq.querySelector(".qq-send").addEventListener("click", async () => {
      const msg = need();
      if (msg) { status.textContent = msg; return; }
      if (trip && trip.list().length) { trip.add(round()); trip.send(); return; }
      const lines = [
        "[신짜오골프 빠른 견적]",
        `골프장: ${qq.dataset.name}`,
        `날짜: ${state.date}`,
        `인원: ${state.people}`,
        ...(state.holes ? [`홀: ${state.holes}`] : []),
        ...(state.extras.size ? [`같이: ${[...state.extras].join(" · ")}`] : []),
        ...(state.arrival ? [`도착일: ${state.arrival}`] : []),
        `보낸 쪽: ${location.origin}${location.pathname}`,
        "이대로 보내 주시면 견적을 드립니다.",
      ];
      const text = lines.join("\n");
      let ok = false;
      try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } else ok = legacyCopy(text); } catch { ok = legacyCopy(text); }
      if (ok) {
        status.textContent = "요약이 복사됐어요. 카톡이 열리면 입력창을 길게 눌러 붙여넣고 보내 주세요.";
        setTimeout(() => { location.href = `/go/quick-golf?from=${encodeURIComponent(qq.dataset.slug)}`; }, 700);
      } else {
        const box = qq.querySelector(".qq-fallback"); box.hidden = false; box.value = text; box.select();
        status.innerHTML = '자동 복사가 안 됐어요. 위 요약을 길게 눌러 복사한 뒤 <a href="/go/quick-golf">카톡 열기</a>를 눌러 붙여넣어 주세요.';
      }
    });
  }
})();
// 상세 하단 "이 골프장으로 견적"(2026-11-22): 한 번 누르면 골프장 이름이 든 요약을 복사하고 카톡(/go/quick-golf)으로 간다.
document.querySelectorAll("[data-one-tap]").forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const text = `${link.dataset.oneTap}\n${location.href.split("#")[0]}`;
    try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text); } catch {}
    setTimeout(() => { location.href = link.href; }, 250);
  });
});

// 골프장 비교 담기(2026-11-23): 카드의 "＋ 비교"로 최대 3곳 → 아래 막대에서 표 보기·한 번에 견적.
(() => {
  const cards = [...document.querySelectorAll(".course-card[data-cmp-slug]")];
  if (!cards.length) return;
  const MAX = 3;
  let picked = [];
  try { picked = JSON.parse(sessionStorage.getItem("cmpGolf") || "[]").filter((x) => x && x.slug); } catch { picked = []; }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bar = document.createElement("div");
  bar.className = "cmp-bar";
  bar.hidden = true;
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "골프장 비교");
  bar.innerHTML = '<p class="cmp-count"></p><div class="cmp-actions"><button type="button" class="cmp-open">표로 비교</button><a class="cmp-quote" href="/go/quick-golf?from=compare">이 골프장들로 견적</a><button type="button" class="cmp-clear" aria-label="비교 비우기">✕</button></div>';
  const dlg = document.createElement("dialog");
  dlg.className = "cmp-dialog";
  document.body.append(bar, dlg);
  const save = () => { try { sessionStorage.setItem("cmpGolf", JSON.stringify(picked)); } catch {} };
  const render = () => {
    cards.forEach((card) => {
      const on = picked.some((p) => p.slug === card.dataset.cmpSlug);
      const btn = card.querySelector(".cmp-add");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "✓ 담음" : "＋ 비교";
    });
    bar.hidden = picked.length === 0;
    bar.querySelector(".cmp-count").textContent = picked.length < 2 ? `${picked.length}곳 담음 · 1곳 더 담으면 비교` : `${picked.length}곳 담음 (최대 ${MAX}곳)`;
    bar.querySelector(".cmp-open").disabled = picked.length < 2;
  };
  cards.forEach((card) => {
    card.querySelector(".cmp-add").addEventListener("click", () => {
      const d = card.dataset;
      const i = picked.findIndex((p) => p.slug === d.cmpSlug);
      if (i >= 0) picked.splice(i, 1);
      else {
        if (picked.length >= MAX) picked.shift();
        picked.push({ slug: d.cmpSlug, name: d.cmpName, region: d.cmpRegion, airport: d.cmpAirport, holes: d.cmpHoles, rating: d.cmpRating });
      }
      save();
      render();
    });
  });
  async function quote(event) {
    event.preventDefault();
    const text = `[신짜오골프] 골프장 비교 견적 문의\n${picked.map((p) => `- ${p.name}`).join("\n")}\n날짜·인원·티오프 희망 시간은 이어서 알려 드릴게요.`;
    try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text); } catch {}
    setTimeout(() => { location.href = "/go/quick-golf?from=compare"; }, 250);
  }
  const rows = [["지역", "region"], ["공항에서 차로", "airport"], ["홀", "holes"], ["구글 평점", "rating"]];
  bar.querySelector(".cmp-open").addEventListener("click", () => {
    dlg.innerHTML = `<div class="cmp-head"><h2>골프장 ${picked.length}곳 비교</h2><button type="button" class="cmp-close" aria-label="닫기">✕</button></div><div class="cmp-scroll"><table class="cmp-table"><thead><tr><th scope="col"></th>${picked.map((p) => `<th scope="col"><a href="/golf/${esc(p.slug)}.html">${esc(p.name)}</a></th>`).join("")}</tr></thead><tbody>${rows.map(([label, key]) => `<tr><th scope="row">${label}</th>${picked.map((p) => `<td>${esc(p[key] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="cmp-note">공항 시간은 평소 교통 기준, 평점은 구글 지도 확인 값입니다. 티오프·요금은 견적 때 확인합니다.</p><a class="button button-kakao cmp-quote" href="/go/quick-golf?from=compare">이 ${picked.length}곳으로 견적 받기</a>`;
    dlg.querySelector(".cmp-close").addEventListener("click", () => dlg.close());
    dlg.querySelector(".cmp-quote").addEventListener("click", quote);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  bar.querySelector(".cmp-quote").addEventListener("click", quote);
  bar.querySelector(".cmp-clear").addEventListener("click", () => { picked = []; save(); render(); });
  render();
})();

// 자주 묻는 질문 찾기(2026-11-24): 입력한 말이 든 질문만 남기고 펼친다. 띄어쓰기는 무시.
(() => {
  const input = document.querySelector(".faq-search");
  if (!input) return;
  const items = [...document.querySelectorAll(".faq-item")];
  const groups = [...document.querySelectorAll(".faq-group")];
  const count = document.querySelector(".faq-count");
  const empty = document.querySelector(".faq-empty");
  const norm = (t) => t.toLowerCase().replace(/\s+/g, "");
  const texts = items.map((item) => norm(item.textContent.replace("💬 이 질문 카톡으로 묻기", "").replace("자세한 글 보기 →", "")));
  input.addEventListener("input", () => {
    const q = norm(input.value);
    let shown = 0;
    items.forEach((item, i) => { const hit = !q || texts[i].includes(q); item.hidden = !hit; item.open = !!q && hit; if (hit) shown++; });
    groups.forEach((group) => { group.hidden = !group.querySelector(".faq-item:not([hidden])"); });
    if (count) count.textContent = q ? `${shown}개 질문` : "";
    if (empty) empty.hidden = shown > 0;
  });
})();

// 카톡 단추 위치 이름(data-cta) — 관제판 '단추별 클릭'용(11-24). HTML에 data-cta가 이미 있으면 그대로 둔다.
// 누르는 순간 위치를 보고 붙인다: header·float(고정 막대)·footer·form(요청서)·card·hero(첫 화면)·page-end(아래 30%)·mid.
(function () {
  var KAKAO = /^https?:\/\/(pf|open)\.kakao\.com\//;
  function place(a) {
    if (a.closest("header")) return "header";
    for (var n = a; n && n !== document.body; n = n.parentElement) {
      var p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return "float";
    }
    if (a.closest("footer")) return "footer";
    if (a.closest('form, [class*="req-"], [class*="quick"]')) return "form";
    if (a.closest('[class*="card"]')) return "card";
    var top = a.getBoundingClientRect().top + window.scrollY;
    if (top < window.innerHeight) return "hero";
    if (top > document.documentElement.scrollHeight * 0.7) return "page-end";
    return "mid";
  }
  window.addEventListener("click", function (e) {
    var a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a || a.hasAttribute("data-cta") || !KAKAO.test(a.href)) return;
    try { a.setAttribute("data-cta", place(a)); } catch (err) {}
  }, true);
})();
