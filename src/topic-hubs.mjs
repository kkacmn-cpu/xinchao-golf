// 주제별 모음 페이지(골프장별 가격·예약 방법·일정 짜기).
// 닫힌 xinchao-golf-price / -booking / -planner 사이트의 검색어를 이 사이트 한곳으로 모은다(2026-11-20).
// 원칙: 그린피 금액은 적지 않는다. 요금은 날짜·인원·홀 수·티타임에 따라 달라 상담 시점에 확인한다.
// 가격 모음에는 요금 구성(그린피 + 예약대행 수수료)과 결제·변경/취소 문장을 회사 견적기 문장 그대로 쓴다(src/pricing-guide.mjs).
import { pricing, pricingSummary } from "./pricing-guide.mjs";

export const topicHubs = [
  {
    key: "price",
    path: "/golf-price",
    category: "비용 확인",
    label: "골프장별 가격",
    title: "베트남 골프장 가격 확인 가이드",
    description: "베트남 골프장 그린피를 비교하기 전에 포함 항목, 캐디팁·현장 비용, 통화·환율, 견적 유효기간과 취소수수료를 확인하는 순서와 골프장별 가격 글을 모았습니다.",
    lead: "그린피 숫자만 비교하면 포함 항목이 달라 실제 비용이 어긋나기 쉽습니다. 같은 조건으로 비교하는 순서와 골프장별 가격 확인 글을 한곳에 모았습니다.",
    notice: pricingSummary,
    stepsTitle: "가격을 비교하는 순서",
    steps: ["included-items", "caddie-tip-onsite-cost-separation-check", "quote-currency-exchange-payment-check", "quote-validity-exchange-rate-check", "vietnam-golf-cancellation-fees-check"],
    courseTitle: "골프장별 가격 확인 글",
    keywords: ["베트남 골프장 가격", "베트남 골프 그린피", "호치민 골프장 가격", "베트남 골프 견적"],
    faq: [
      ["요금은 언제, 어떻게 결제하나요?", `${pricing.prepaid} ${pricing.onsite} ${pricing.split}`],
      ["예약을 바꾸거나 취소하면 수수료가 있나요?", pricing.change],
      ["견적을 비교할 때 무엇을 맞춰야 하나요?", "이용일·인원·홀 수·희망 티타임을 같게 두고 그린피·캐디·카트·팁·식사·차량·대여 장비·세금과 취소 조건을 나눠 비교하세요."],
    ],
  },
  {
    key: "booking",
    path: "/golf-booking",
    category: "예약 준비",
    label: "예약 방법",
    title: "베트남 골프 예약 방법",
    description: "베트남 골프장 예약을 날짜·인원 정리부터 티오프 회신, 영문명 제출, 취소 조건과 바우처 확인까지 순서대로 정리하고 골프장별 예약 글을 모았습니다.",
    lead: "날짜와 인원을 정리하는 단계부터 티오프 확정서와 바우처를 받는 단계까지, 실제 예약이 진행되는 순서대로 읽을 글을 모았습니다.",
    notice: "문의 접수는 예약 확정이 아닙니다. 골프장이 회신한 날짜·티오프·인원·이름이 모두 맞고 바우처를 받은 뒤에 확정으로 봅니다.",
    stepsTitle: "예약이 진행되는 순서",
    steps: ["booking-order", "tee-time", "player-name-handicap-submission-check", "tee-time-confirmation-course-name-check", "cancellation", "booking-voucher-final-check"],
    courseTitle: "골프장별 예약 글",
    keywords: ["베트남 골프 예약", "호치민 골프 예약", "베트남 골프장 예약 방법", "베트남 골프 티오프"],
    faq: [
      ["카카오톡으로 문의하면 바로 예약되나요?", "아니요. 문의 접수는 예약 확정이 아닙니다. 골프장 회신으로 날짜·티오프·인원·이름을 확인하고 결제 조건을 맞춘 뒤 바우처를 받아야 확정됩니다."],
      ["예약 문의에 무엇을 적어야 하나요?", "여행 날짜와 항공 도착·출국 시각, 인원과 대표자 영문명, 희망 지역·골프장·티오프 범위, 출발 숙소와 골프백·캐리어 수, 대체 후보를 함께 알려 주세요."],
      ["2명도 예약할 수 있나요?", "골프장마다 다릅니다. 2인이나 홀수 인원은 다른 팀과 조인될 수 있어, 조인 가능성과 최소 인원을 예약 전에 확인하세요."],
    ],
  },
  {
    key: "itinerary",
    path: "/golf-itinerary",
    category: "일정 짜기",
    label: "일정 짜기",
    title: "베트남 골프여행 일정 짜기",
    description: "베트남 골프여행 2박3일·3박5일·4박5일 일정표와 도착일·출국일 라운드 계산, 골프장 차량 동선, 우천 대체 계획을 한곳에 모았습니다.",
    lead: "항공 도착 시각, 공항에서 골프장까지 이동시간, 라운드 사이 휴식을 함께 계산해야 일정이 무리 없이 맞습니다. 기간별 일정표와 이동 계획 글을 모았습니다.",
    notice: "일정표는 항공 시각, 골프장 이동시간과 티오프 회신에 따라 달라집니다. 도착일 라운드는 입국 심사·짐 찾기 시간을 더해 잡으세요.",
    stepsTitle: "일정을 짜는 순서",
    steps: ["2n3d", "3n5d", "4n5d-three-rounds", "first-day-flight-tee-time-buffer", "departure-day-round-risk-check", "transport", "vietnam-golf-weather-contingency-plan"],
    courseTitle: "골프장별 일정 글",
    keywords: ["베트남 골프여행 일정", "호치민 골프 일정", "베트남 골프 2박3일", "베트남 골프 3박5일"],
    faq: [
      ["도착한 날 바로 라운드할 수 있나요?", "항공 도착 시각과 공항에서 골프장까지 이동시간에 따라 다릅니다. 입국 심사·수하물·차량 시간을 더해 골프장 도착 마감에 맞출 수 있을 때만 티오프를 잡으세요."],
      ["하루에 36홀도 가능한가요?", "골프장·계절·당일 운영에 따라 다릅니다. 두 라운드 사이의 체크인·식사·이동 시간을 나눠 계산하고, 두 라운드 모두 확정 조건을 받아 두세요."],
      ["비나 태풍 예보가 있으면 일정은 어떻게 하나요?", "예보만으로 취소나 티오프 변경을 단정할 수 없습니다. 공식 기상정보와 골프장·이동편의 실제 운영 회신을 각각 확인한 뒤 라운드와 휴식일을 다시 배치하세요."],
    ],
  },
];

// 자동 매칭이 틀리거나 놓치는 글은 여기서 직접 정한다(빈 배열 = 특정 골프장 글 아님).
const courseOverrides = {
  "thanh-lanh-hanoi-day-trip-address-route-check": ["thanh-lanh-valley-golf"],
  "hanoi-kings-island-golf-boat-transfer": ["brg-kings-island"],
  "kings-island-booking-window-player-limit-check": ["brg-kings-island"],
  "hanoi-golf-group-course-transport-plan": [],
  "hanoi-business-trip-golf-course": [],
  "the-bluffs-ho-tram-two-player-pairing-policy": ["the-bluffs-grand-ho-tram"],
  "the-bluffs-ho-tram-stay-play-1-night-golf-plan": ["the-bluffs-grand-ho-tram"],
  "brg-da-nang-golf-booking-tee-time-check": ["legend-danang-golf-resort"],
  "danang-legend-norman-nicklaus-course-differences": ["legend-danang-golf-resort"],
  "laguna-lang-co-golf-booking-caddie-cart-check": ["laguna-golf-lang-co"],
  "laguna-lang-co-golf-airport-hue-route-plan": ["laguna-golf-lang-co"],
  "cam-ranh-airport-kn-golf-nha-trang-route-plan": ["kn-golf-links-cam-ranh"],
  "west-lakes-hochiminh-address-pin-transfer-plan": ["west-lakes-golf-villas"],
  "phu-quoc-vinpearl-stay-play-2026-room-round-transfer-plan": ["vinpearl-golf-phu-quoc"],
  "vinpearl-phu-quoc-arrival-day-3pm-tee-window": ["vinpearl-golf-phu-quoc"],
  "hoiana-golf-family-non-golfer-plan": ["hoiana-shores-golf-club"],
  "nha-trang-island-golf-group-transfer-plan": ["vinpearl-golf-nha-trang"],
  "dalat-golf-2-night-3-day-two-course-schedule": ["dalat-palace-golf-club", "sam-tuyen-lam-golf"],
};

// "hanoi"처럼 지역 이름과 같은 골프장 주소 조각은 자동 매칭에 쓰지 않는다.
const ambiguousBases = new Set(["hanoi"]);

// 롱탄 신공항·탄손녓 공항은 골프장 이름과 겹친다. 주소에 airport가 든 글은 이 두 골프장에 자동으로 붙이지 않는다
// (정말 그 골프장 글이면 위 courseOverrides에 직접 적는다).
const airportNamedCourses = new Set(["long-thanh-golf-club", "tan-son-nhat-golf-course"]);

const baseOf = (slug) => slug.replace(/-(golf-club|golf-course|golf-resort|country-club|golf-links|golf)$/, "");

export function coursesForGuide(guide, courses) {
  if (Object.hasOwn(courseOverrides, guide.slug)) {
    return courseOverrides[guide.slug].map((slug) => {
      const course = courses.find((item) => item.slug === slug);
      if (!course) throw new Error(`주제 모음: 없는 골프장 ${slug} (${guide.slug})`);
      return course;
    });
  }
  const airportGuide = /(^|-)airport(-|$)/.test(guide.slug);
  return courses.filter((course) => {
    if (airportGuide && airportNamedCourses.has(course.slug)) return false;
    const base = baseOf(course.slug);
    const slugHit = !ambiguousBases.has(base) && new RegExp(`(^|-)${base}(-|$)`).test(guide.slug);
    const titleHit = [course.name, course.shortName].some((name) => name && name.length > 2 && guide.title.includes(name));
    return slugHit || titleHit;
  });
}

export const hubForCategory = (category) => topicHubs.find((hub) => hub.category === category);
