// 요금 구성·결제·변경/취소·견적 받는 법 안내(2026-11-20 손님 점검 #2·#3).
// 문장은 회사 견적기 문장을 그대로 쓴다. 그린피 금액은 적지 않고, 금액은 예약대행 수수료(USD 6)만 적는다.
// 며칠 전 몇 % 같은 취소 규정이나 답변 시간 숫자는 만들지 않는다.

export const bookingFee = "1인 1라운드 USD 6";

export const pricing = {
  greenFee: "그린피는 골프장·요일·시간대마다 다르며, 견적 때 그날 기준으로 안내합니다.",
  fee: `예약대행 수수료는 ${bookingFee}입니다.`,
  prepaid: "당사 수납 골프장은 노쇼 방지와 사전 부킹을 위해 그린피까지 선입금하며, 현지 업체 입금 완료 후 부킹이 확정됩니다.",
  onsite: "현장결제 골프장은 그린피를 골프장에서 직접 결제하며, 예약대행 수수료 입금 후 부킹을 진행합니다.",
  split: "견적서에는 미리 입금할 금액과 현장에서 결제할 금액을 나눠 적어 드립니다.",
  change: "예약 변경·취소 수수료는 각 업체 정책과 확정 시점에 따라 적용됩니다. 확정한 금액은 이후 환율이 바뀌어도 유지됩니다.",
  howTo: "카카오톡 버튼을 한 번 누르고 날짜·인원·지역(골프장)·희망 시간대를 보내 주세요.",
  reply: "카카오톡으로 문의 주시면 확인 후 순서대로 답변드립니다.",
};

// 요금 구성 한 문단(주제 모음 /golf-price 안내 문구, llms.txt).
export const pricingSummary = `요금은 ① 그린피와 ② 예약대행 수수료(${bookingFee})로 구성됩니다. ${pricing.greenFee}`;

// full: 홈·소개 페이지용 4칸(요금 구성·결제·변경/취소·견적 받는 법)
// compact: 골프장 상세 예약 단계 옆 요약(요금 구성·결제·변경/취소). 견적 받는 법은 상세의 예약 단계가 대신한다.
export function pricingGuideHtml({ variant = "full", kakaoUrl }) {
  const items = [
    ["요금 구성", `<p>① 그린피: ${pricing.greenFee.replace("그린피는 ", "")}</p><p>② 예약대행 수수료: ${bookingFee}</p>`],
    ["결제", `<p>${pricing.prepaid}</p><p>${pricing.onsite}</p><p>${pricing.split}</p>`],
    ["변경·취소", `<p>${pricing.change}</p>`],
  ];
  if (variant === "compact") {
    const compact = [["그린피", `<p>${pricing.greenFee.replace("그린피는 ", "")}</p>`], ...items.slice(1)];
    return `<details class="pay-guide-compact"><summary><strong>요금</strong> 그린피 + 예약대행 수수료(${bookingFee}) <span>결제·변경/취소 보기</span></summary><dl class="pay-guide">${compact.map(([title, body]) => `<div><dt>${title}</dt><dd>${body}</dd></div>`).join("")}</dl></details>`;
  }
  items.push(["견적 받는 법", `<p>${pricing.howTo}</p><p>${pricing.reply}</p><a class="button button-kakao" href="${kakaoUrl}" target="_blank" rel="noopener noreferrer">카카오톡으로 견적 문의</a>`]);
  return `<dl class="pay-guide">${items.map(([title, body]) => `<div><dt>${title}</dt><dd>${body}</dd></div>`).join("")}</dl>`;
}
