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

  document.querySelectorAll(".js-consult").forEach((button) => {
    button.addEventListener("click", () => {
      if (!dialog || !interestInput) return;
      closeMenu();
      interestInput.value = button.dataset.interest || "골프 일정 상담";
      if (status) status.textContent = "";
      if (result) result.hidden = true;
      if (!dialog.open) dialog.showModal();
      document.body.classList.add("dialog-open");
      requestAnimationFrame(() => interestInput.focus());
    });
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
