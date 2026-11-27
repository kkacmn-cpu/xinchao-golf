// 거둔 안내글(2026-11-27, 대표님 지시 '색인 안 됨 사유 고치기' — 총괄 42차).
// 2026-09·10월에 같은 틀로 만든 안내글 42편은 제목만 다르고 본문이 거의 같았다(4묶음 11·11·11·9편, 4단어 겹침 60% 이상).
// 구글이 '크롤링됨/발견됨 - 색인 안 됨'으로 두는 주된 이유라, 쪽을 만들지 않고 가장 가까운 원래 글·주제 모음·골프장 상세로 308한다.
// to: 308 목적지. alt: 다른 쪽 '이어서 읽기'(course-guides related)에 이 글이 있으면 대신 넣을 안내글 slug.
export const retiredGuides = {
  // 예약 준비 묶음 11 → 예약 모음 또는 같은 주제의 원래 글
  "booking-order": { to: "/golf-booking" },
  "booking-payment-name-receipt-check": { to: "/guide/player-name-handicap-submission-check.html" },
  "booking-voucher-final-check": { to: "/guide/tee-time-confirmation-course-name-check.html" },
  "cancellation": { to: "/guide/tee-time-change-cancellation-deadline-check.html" },
  "first-trip": { to: "/golf-booking" },
  "golfer-name-correction-request": { to: "/guide/player-name-handicap-submission-check.html" },
  "group-flight-tee-time-request": { to: "/guide/group-pairing-final-submission-check.html" },
  "late-arrival-next-day-tee-time-fasttrack": { to: "/guide/first-day-flight-tee-time-buffer.html" },
  "rain": { to: "/guide/vietnam-golf-weather-contingency-plan.html" },
  "tee-time": { to: "/guide/tee-time-confirmation-course-name-check.html" },
  "two-player-join-request": { to: "/golf-booking" },
  // 일정 짜기 묶음 11
  "2n3d": { to: "/golf-itinerary" },
  "3n5d": { to: "/guide/hochiminh-golf-3-nights-5-days-itinerary.html" },
  "4n5d-three-rounds": { to: "/guide/hochiminh-golf-3-nights-5-days-itinerary.html" },
  "accommodation": { to: "/golf-itinerary" },
  "arrival-day-airport-hotel-golfbag-plan": { to: "/guide/first-day-flight-tee-time-buffer.html", alt: "first-day-flight-tee-time-buffer" },
  "departure-day-round-risk-check": { to: "/guide/round-next-day-flight-transfer-plan.html" },
  "golf-trip-day-zero-airport-fasttrack-plan": { to: "/guide/first-day-flight-tee-time-buffer.html" },
  "group": { to: "/golf-itinerary" },
  "hochiminh-3n4d-two-round-buffer": { to: "/guide/hochiminh-golf-3-nights-5-days-itinerary.html" },
  "hochiminh-golf-rest-day-plan": { to: "/golf-itinerary" },
  "transport": { to: "/rent/golf-transfer.html" },
  // 비용 확인 묶음 11
  "exchange-rate": { to: "/guide/quote-currency-exchange-payment-check.html" },
  "fasttrack-golf-trip-total-cost": { to: "/golf-price" },
  "group-budget": { to: "/golf-price" },
  "group-quote-per-person-total-check": { to: "/golf-price" },
  "included-items": { to: "/guide/caddie-tip-onsite-cost-separation-check.html" },
  "price-reading": { to: "/golf-price" },
  "quote-included-excluded-check": { to: "/guide/caddie-tip-onsite-cost-separation-check.html" },
  "quote-payment-deadline-hold-check": { to: "/golf-price" },
  "quote-validity-exchange-rate-check": { to: "/guide/quote-currency-exchange-payment-check.html" },
  "weekday-weekend": { to: "/guide/weekend-holiday-time-rate-check.html" },
  "weekend-holiday-price-comparison": { to: "/guide/weekend-holiday-time-rate-check.html" },
  // 골프장별 같은 틀 9 → 골프장 상세·지역 쪽
  "brg-da-nang-golf-booking-tee-time-check": { to: "/golf/legend-danang-golf-resort.html", alt: "danang-airport-montgomerie-links-arrival-day-plan" },
  "laguna-lang-co-golf-booking-caddie-cart-check": { to: "/golf/laguna-golf-lang-co.html", alt: "laguna-lang-co-1-to-8-player-cancellation-deadline" },
  "long-thanh-golf-booking-player-transfer-check": { to: "/golf/long-thanh-golf-club.html", alt: "long-thanh-golf-club-arrival-day-route-plan" },
  "dalat-palace-golf-group-flight-transport-plan": { to: "/golf/dalat-palace-golf-club.html", alt: "dalat-golf-palace-tuyen-lam-sightseeing" },
  "hanoi-golf-group-course-transport-plan": { to: "/regions/hanoi.html", alt: "multi-course-consecutive-round-transfer-plan" },
  "phu-quoc-golf-group-flight-stay-plan": { to: "/regions/phuquoc.html", alt: "phu-quoc-parents-golf-stay" },
  "long-bien-golf-course-price-included-check": { to: "/golf/long-bien-golf-course.html", alt: "hanoi-business-trip-golf-course" },
  "vinpearl-golf-nam-hoi-an-price-included-check": { to: "/golf/vinpearl-golf-nam-hoi-an.html", alt: "hoi-an-golf-old-town-itinerary" },
  "vinpearl-golf-phu-quoc-price-included-check": { to: "/golf/vinpearl-golf-phu-quoc.html", alt: "phu-quoc-vinpearl-stay-play-2026-room-round-transfer-plan" },
};
