(() => {
  const menuButton = document.querySelector(".menu-button");
  const menu = document.querySelector(".site-nav");
  const dialog = document.querySelector("#consult-dialog");
  const interestInput = document.querySelector("#consult-interest");
  const consultForm = document.querySelector("#consult-form");
  const status = document.querySelector("#consult-status");
  const result = document.querySelector("#consult-result");
  const summaryArea = document.querySelector("#consult-summary");
  const copyButton = document.querySelector("#consult-copy");
  const kakaoLink = document.querySelector("#consult-kakao");
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

  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    closeMenu();
  }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      closeMenu();
      menuButton?.focus();
    }
  });

  const openConsult = (interest) => {
    if (!dialog || !interestInput) return;
    closeMenu();
    interestInput.value = interest || "골프 일정 상담";
    if (status) status.textContent = "";
    if (result) result.hidden = true;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("dialog-open");
    requestAnimationFrame(() => interestInput.focus());
  };

  document.querySelectorAll(".js-consult").forEach((button) => {
    button.addEventListener("click", () => openConsult(button.dataset.interest));
  });

  homePrepForm?.addEventListener("input", () => { if (homePrepResult) homePrepResult.hidden = true; });
  homePrepForm?.addEventListener("change", () => { if (homePrepResult) homePrepResult.hidden = true; });
  homePrepForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(homePrepForm);
    const region = String(data.get("region") || "");
    const date = String(data.get("date") || "");
    const people = Number(data.get("people"));
    const purpose = String(data.get("purpose") || "");
    if (!homePrepForm.reportValidity() || !["호치민", "하노이", "다낭", "나트랑", "푸꾸옥"].includes(region) || !Number.isInteger(people) || people < 1 || people > 40) return;
    document.querySelector("#home-prep-summary").textContent = `${region} · ${date} · ${people}명 · ${purpose}. 티오프와 예약 가능 여부는 상담 시 확인합니다.`;
    document.querySelector("#home-prep-candidates").hidden = region !== "호치민";
    document.querySelector("#home-prep-other-region").hidden = region === "호치민";
    if (homePrepResult) homePrepResult.hidden = false;
  });

  document.querySelector("#home-prep-continue")?.addEventListener("click", () => {
    if (!consultForm || !homePrepForm || homePrepResult?.hidden) return;
    const data = new FormData(homePrepForm);
    consultForm.elements.namedItem("region").value = String(data.get("region") || "");
    consultForm.elements.namedItem("date").value = String(data.get("date") || "");
    consultForm.elements.namedItem("people").value = String(data.get("people") || "");
    consultForm.elements.namedItem("note").value = "";
    openConsult(String(data.get("purpose") || "골프 일정 상담"));
  });

  dialog?.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const copySummary = async (summary) => {
    try {
      await navigator.clipboard.writeText(summary);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = summary;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      return copied;
    }
  };

  consultForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(consultForm);
    const lines = [
      `[신짜오골프 상담]`,
      `문의: ${data.get("interest") || "골프 일정"}`,
      `지역: ${data.get("region") || "미정"}`,
      `예정일: ${data.get("date") || "미정"}`,
      `인원: ${data.get("people") || "미정"}`,
      `추가 요청: ${data.get("note") || "없음"}`,
      `확인 페이지: ${window.location.href}`,
    ];
    const summary = lines.join("\n");
    if (summaryArea) summaryArea.value = summary;
    if (result) result.hidden = false;
    if (status) status.textContent = "문의 내용을 준비했습니다. 카카오톡 대화창에 붙여넣어 주세요.";
    copySummary(summary).then((copied) => {
      if (status) status.textContent = copied
        ? "문의 내용이 복사되었습니다. 카카오톡 대화창에 붙여넣어 주세요."
        : "자동 복사가 제한되었습니다. 아래 내용에서 ‘문의 다시 복사’를 눌러주세요.";
    });
    window.open(window.XINCHAO_KAKAO_URL, "_blank", "noopener,noreferrer");
  });

  copyButton?.addEventListener("click", async () => {
    const summary = summaryArea?.value || "";
    const copied = await copySummary(summary);
    if (status) status.textContent = copied
      ? "문의 내용이 다시 복사되었습니다."
      : "복사가 제한되었습니다. 문의 내용을 길게 눌러 직접 복사해 주세요.";
    if (!copied) summaryArea?.select();
  });

  kakaoLink?.addEventListener("click", () => {
    if (status) status.textContent = "카카오톡에서 복사한 문의 내용을 붙여넣어 주세요.";
  });

  const filterButtons = document.querySelectorAll(".filter-button");
  const courseItems = document.querySelectorAll("#course-list > [data-region]");
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    const filter = button.dataset.filter;
    courseItems.forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.region !== filter;
    });
  }));
})();
