// Official-source facts and consultation questions, not live inventory or prices.
import { golfAreas } from "./site-data.mjs";

// 골프장마다 공통으로 붙는 공항 이동시간 질문(2026-11-14). 시간은 평소 교통 기준 안내값.
export function courseFaqs(course) {
  const area = golfAreas.find((item) => item.key === course.area);
  const airport = course.airport || area.airport;
  const distance = course.driveKm ? ` 거리는 약 ${course.driveKm}입니다.` : "";
  const extra = course.driveNote ? ` ${course.driveNote}` : "";
  return [
    ...courseGuides[course.slug].faqs,
    [`${airport}에서 ${course.shortName}까지 얼마나 걸리나요?`, `평소 교통 기준 차량으로 약 ${course.drive} 걸립니다.${distance}${extra} 출퇴근 시간·주말·비 오는 날에는 더 걸릴 수 있으니, 도착일 라운드라면 입국 심사와 짐 찾기 시간까지 더해 티오프를 잡으세요.`],
  ];
}
export const courseGuides = {
  "thu-duc-country-club": {
    checkedAt: "2026-09-26",
    sources: [["Vietnam Golf & Country Club 공식 소개", "https://www.vietnamgolfcc.com/vn/"]],
    faqs: [
      ["투득CC 예약서에서 어떤 골프장 이름을 확인하나요?", "Vietnam Golf & Country Club을 확인하세요. 공식 소개의 전체 규모는 36홀입니다. ‘투득’이라는 지역명만 전달하지 말고 영문 상호와 이용할 홀 수를 함께 적어야 다른 코스와 혼동을 줄일 수 있습니다."],
      ["투득 골프와 숙박을 함께 문의할 때 무엇을 나누나요?", "공식 사이트는 골프와 Lakeviews Villas를 따로 안내합니다. 골프 예약에 숙박이 자동 포함되는 것은 아닙니다. 라운드 날짜·인원·홀 수와 숙박 날짜·객실 수를 분리해서 요청하세요."]
    ],
    related: ["hochiminh-thu-duc-golf-booking.html", "hochiminh-golf-36-hole-guide.html"]
  },
  "tan-son-nhat-golf-course": {
    checkedAt: "2026-09-26",
    sources: [["탄손넛 공식 코스·조명 시설 안내", "https://tansonnhatgolf.vn/en"]],
    faqs: [
      ["탄손넛 18홀 예약은 A·B·C·D를 모두 도나요?", "아닙니다. 공식 구성은 A·B·C·D 각 9홀, 총 36홀입니다. 시설 전체 규모와 예약한 라운드는 다릅니다. 18홀 견적을 받을 때 실제 배정할 두 코스와 티오프 시간을 함께 확인하세요."],
      ["탄손넛 야간 골프를 비행 당일에 넣어도 되나요?", "공식 안내에 코스 조명이 있지만 모든 날짜의 야간 티타임을 보장하지는 않습니다. 항공편 시간, 마지막 출발 시간, 완료 가능한 홀 수와 공항 이동을 함께 확인하세요. 공항 인근이라는 이유만으로 탑승 가능 일정을 확정하지 않습니다."]
    ],
    related: ["tan-son-nhat-golf-course-a-b-c-d-selection.html", "hochiminh-airport-fasttrack-golfbag-guide.html"]
  },
  "twin-doves-golf-club": {
    checkedAt: "2026-09-26",
    sources: [["Twin Doves 공식 코스·회원 안내", "https://twindovesgolf.vn/"]],
    faqs: [
      ["트윈도브의 루나·스텔라·솔레는 각각 몇 홀인가요?", "공식 안내는 Luna·Stella·Sole를 각 9홀, 전체 27홀로 구분합니다. 18홀을 원한다면 희망하는 코스 조합을 적고, 배정 가능 여부는 확정서에서 확인하세요."],
      ["트윈도브 회원 요금을 여행객 견적으로 사용해도 되나요?", "회원과 비회원 조건을 구분해야 합니다. 공식 사이트도 회원 예약과 방문객 예약을 나눕니다. 방문객 여부·날짜·인원·홀 수를 먼저 맞추고 캐디·공동 카트·식사·팁의 포함 범위를 대조하세요."]
    ],
    related: ["hochiminh-golf-course-price-guide.html", "hochiminh-golf-weekend-booking.html"]
  },
  "leman-golf-club": {
    checkedAt: "2026-09-26",
    sources: [["Vinpearl Golf Léman 공식 소개", "https://vinpearl.com/en/vinpearl-golf-leman"], ["빈펄 남코스 9홀 개장 공지 (2026-03-09)", "https://vinpearl.com/en/vinpearl-golf-leman-officially-launches-the-9-holes-of-the-south-course"]],
    faqs: [
      ["레만 골프장의 36홀 소개가 예약 당일 36홀 운영을 뜻하나요?", "아닙니다. 공식 소개의 36홀 전체 규모와 단계별 개장은 구분해야 합니다. 북코스 18홀 소개 외에 2026년 3월 8일 남코스 9홀 개장 공지가 있습니다. 이 자료만으로 예약일에 모든 코스가 열려 있다고 확정하지 않습니다."],
      ["레만 북코스와 남코스를 어떻게 요청하나요?", "Vinpearl Golf Léman이라는 상호, 희망 날짜와 이용 홀 수, 북·남코스 선호를 함께 전달하세요. 꾸찌 방면의 정확한 집결지와 배정 코스·티타임을 확인한 뒤 차량을 맞추는 순서가 좋습니다."]
    ],
    related: ["hochiminh-golf-36-hole-guide.html", "hochiminh-golf-rental-car-guide.html"]
  },
  "vung-tau-paradise-golf": {
    checkedAt: "2026-09-26",
    sources: [["Vung Tau Paradise 공식 코스 소개", "https://golfparadise.com.vn/en/about-us/"]],
    faqs: [
      ["붕따우 파라다이스 27홀을 전부 예약해야 하나요?", "27홀은 공식 소개에 나온 시설 규모입니다. 실제 예약할 홀 수와 코스 조합은 별도 조건입니다. 18홀과 27홀 견적을 섞지 말고 같은 이용일·인원·포함 항목으로 비교하세요."],
      ["파라다이스와 호트람 골프를 같은 픽업 목적지로 적어도 되나요?", "아니요. 파라다이스는 붕따우의 코스이고, 더 블러프스는 호트람의 골프장입니다. 같은 여행권으로 묶더라도 숙소 주소·정확한 골프장·왕복 또는 편도 조건을 각각 적어야 차량 동선을 확인할 수 있습니다."]
    ],
    related: ["hochiminh-golf-rental-car-guide.html", "hochiminh-golf-travel-guide.html"]
  },
  "the-bluffs-grand-ho-tram": {
    checkedAt: "2026-09-26",
    sources: [["The Bluffs Grand Ho Tram 공식 소개", "https://thebluffshotram.com/"]],
    faqs: [
      ["더 블러프스는 어떤 골프장인가요?", "공식 소개 기준 Greg Norman이 설계한 18홀 코스입니다. 호트람 해안의 모래언덕을 활용한 링크스 스타일로 소개됩니다. 이 특징을 당일 바람·잔디 상태나 모든 홀의 전망 보장으로 해석하지 않습니다."],
      ["호트람 숙박과 더 블러프스 라운드는 한 견적인가요?", "골프와 숙박이 함께 확정된 상품인지 먼저 확인하세요. 라운드 날짜·홀 수, 호텔·객실·숙박일, 식사와 차량을 구분해야 골프만 예약한 경우와 비교할 수 있습니다. 소개 페이지는 객실이나 티타임 확보를 뜻하지 않습니다."]
    ],
    related: ["the-bluffs-grand-ho-tram-golf-booking-guide.html", "hochiminh-golf-clothing-guide.html"]
  },
  "taekwang-jeongsan-country-club": {
    checkedAt: "2026-09-26",
    sources: [["Emerald 공식 소개·구 Jeongsan 명칭", "https://www.emeraldcc.com.vn/club"], ["Emerald 공식 SUN·MOON 코스도", "https://www.emeraldcc.com.vn/course"]],
    faqs: [
      ["태광정산과 에메랄드는 서로 다른 골프장인가요?", "공식 Emerald Country Club 소개는 이전 이름이 Jeongsan이었다고 명시합니다. 구 태광정산과 에메랄드를 서로 다른 두 골프장으로 예약하지 마세요. 예전 일정표를 사용할 때는 현재 상호와 동나이 목적지를 함께 대조하세요."],
      ["에메랄드 코스와 이동 조건은 무엇을 확인하나요?", "공식 코스도는 SUN 9홀과 MOON 9홀, 총 18홀·파72입니다. 섬에 있는 코스이므로 이용일의 실제 진입 경로·집결지·차량 포함 여부를 확인해야 합니다. 구 자료의 보트 이동편이나 요금을 현재 조건으로 그대로 사용하지 않습니다."]
    ],
    related: ["hochiminh-golf-voucher-final-check.html", "hochiminh-golf-rental-car-guide.html"]
  },
  "long-thanh-golf-club": {
    checkedAt: "2026-09-26",
    sourceNote: "공식 코스 안내의 검색 수집본으로 힐·레이크 구성을 대조했습니다. 직접 접속에서는 503 응답이 있어 현재 운영 상태와 요금은 확인하지 못했습니다.",
    sources: [["롱탄 공식 코스 안내", "https://www.longthanhgolfresort.com/choi-golf.html"]],
    faqs: [
      ["롱탄 힐과 레이크는 각각 몇 홀인가요?", "공식 코스 소개는 Hill 18홀과 Lake 18홀을 구분합니다. 전체 36홀 시설이라는 설명과 한 번 예약하는 라운드는 다릅니다. 희망 코스와 이용 홀 수를 지정해 견적을 요청하세요."],
      ["롱탄 18홀과 36홀 일정을 어떻게 비교하나요?", "같은 날짜·인원을 기준으로 배정 코스, 두 번째 티타임, 라운드 사이 휴식과 차량 대기 조건을 나눠 확인하세요. 첫 18홀 예약이 가능하다고 해서 당일 연속 36홀이 자동 확정되는 것은 아닙니다."]
    ],
    related: ["long-thanh-golf-booking-tee-time-transfer.html", "long-thanh-golf-practice-range-locker-guide.html"]
  },
  "song-be-golf-resort": {
    checkedAt: "2026-09-26",
    sources: [["송베 공식 27홀 코스 안내", "https://songbegolf.com.vn/san-golf.html"]],
    faqs: [
      ["송베 로터스·팜·데저트는 어떤 구분인가요?", "공식 코스 안내는 Lotus·Palm·Desert의 세 코스, 총 27홀을 소개합니다. 골프장 이름만 같다고 같은 라운드는 아니므로, 원하는 코스 조합과 이용 홀 수를 함께 확인하세요."],
      ["송베 코스를 지정하면 그대로 확정되나요?", "희망 코스 요청과 배정 확정은 다릅니다. 이용 날짜·인원·티타임과 코스 조합을 확정서에서 대조하고, 변경될 경우 안내받을 연락 방법도 정하세요. 이 홈페이지에서는 코스 재고를 실시간 조회하지 않습니다."]
    ],
    related: ["hochiminh-golf-voucher-final-check.html", "hochiminh-golf-tee-time-change-request.html"]
  },
  "dong-nai-golf-resort": {
    checkedAt: "2026-09-26",
    sources: [["Dong Nai Golf Resort 공식 소개", "https://dongnaigolf.com.vn/vi"]],
    faqs: [
      ["동나이 골프 예약이라고만 전달하면 충분한가요?", "Dong Nai Golf Resort라는 정확한 상호를 함께 적으세요. 동나이는 지역명이기도 해서 롱탄이나 에메랄드 등 다른 코스를 가리킬 수 있습니다. 공식 코스 구성은 A·B·C, 총 27홀입니다."],
      ["동나이CC 왕복 차량 문의에 무엇이 필요한가요?", "숙소 주소, 이용할 골프장과 홀 수, 희망 티타임, 인원·골프백 수, 라운드 뒤 목적지를 보내세요. 여러 코스가 있는 지역이므로 골프장 이름 없이 ‘동나이 왕복’만으로 시간과 차량 조건을 확정하지 않습니다."]
    ],
    related: ["hochiminh-dongnai-golf-booking.html", "hochiminh-golf-rental-car-guide.html"]
  },
  "harmony-golf-park": {
    checkedAt: "2026-09-26",
    sources: [["Harmonie Golf Park 공식 소개", "https://harmoniegolfpark.com/en/"]],
    faqs: [
      ["하모니 골프장의 공식 영문 이름과 규모는?", "Harmonie Golf Park입니다. 공식 소개는 Jim Engh가 설계한 18홀 코스를 설명합니다. 예약서·지도·차량 목적지에 이 이름을 함께 사용하면 비슷한 표기로 생기는 혼동을 줄일 수 있습니다."],
      ["하모니의 홈페이지 소개가 오늘의 예약 가능 여부인가요?", "아닙니다. 공식 소개에는 2018년 개장 당시 문구도 남아 있습니다. 코스의 설계·규모와 오늘의 운영 상태를 구분하고, 희망일의 티타임과 대여 장비·차량 조건은 따로 확인해야 합니다."]
    ],
    related: ["hochiminh-golf-booking-guide.html", "hochiminh-golf-club-rental-checklist.html"]
  },
  "west-lakes-golf-villas": {
    checkedAt: "2026-09-26",
    sources: [["West Lakes Golf & Villas 공식 소개", "https://www.westlakesgolf.com/"]],
    faqs: [
      ["웨스트레이크는 지금 27홀이 확정되어 있나요?", "공식 소개에는 2018년 18홀 완공과 2019년 9홀 추가 예정 문구가 함께 남아 있습니다. 예정 문구를 현재 운영 완료로 읽으면 안 됩니다. 예약일의 실제 운영 코스와 이용 가능한 홀 수를 확인해야 합니다."],
      ["웨스트레이크를 선택할 때 어떤 동선을 비교하나요?", "공식 소개는 호치민 서부의 Thomson Perrett 설계 코스로 안내합니다. 동부·동나이 방면 코스와 같은 방향으로 취급하지 말고, 출발 숙소와 다음 목적지를 기준으로 왕복·편도 차량 조건을 비교하세요."]
    ],
    related: ["hochiminh-golf-rental-car-guide.html", "hochiminh-golf-departure-time-checklist.html"]
  },
  // 2026-11-14 베트남 전역 확장: 기존 가이드 글의 공식 출처와 골프장 공식 사이트 기준.
  "royal-long-an-golf": {
    checkedAt: "2026-11-14",
    sources: [["Royal Long An 공식 사이트", "https://royallongangolfandcountryclub.com/en/home/"], ["Royal Long An 공식 셔틀 안내", "https://royallongangolfandcountryclub.com/en/tien-ich/shuttle-bus/"]],
    faqs: [
      ["로얄롱안은 27홀을 모두 칠 수 있나요?", "로얄롱안은 27홀 규모로 소개되지만 개장은 단계적으로 이뤄졌습니다. 예약일에 실제로 운영하는 코스와 이용할 홀 수를 확정서에서 따로 확인하고, 18홀과 27홀 견적을 섞어 비교하지 마세요."],
      ["로얄롱안 무료 셔틀만 믿고 일정을 짜도 되나요?", "공식 사이트에 호치민 왕복 셔틀 안내가 있지만 출발 시각·탑승 위치·좌석은 날짜마다 다를 수 있습니다. 셔틀 예약이 확정되지 않았다면 티오프에 맞춘 개별 차량을 함께 비교해 두는 편이 안전합니다."]
    ],
    related: ["royal-long-an-golf-shuttle-booking-check.html", "guide/royal-long-an-27-hole-hochiminh-day-trip-plan.html"]
  },
  "long-bien-golf-course": {
    checkedAt: "2026-11-14",
    sources: [["Long Bien Golf Course 공식 사이트", "https://www.longbiengolf.vn"]],
    faqs: [
      ["롱비엔 골프장은 하노이 시내에서 가깝나요?", "롱비엔은 하노이 시내 안에 있는 27홀 골프장이라 시내 호텔에서 이동 부담이 적은 편입니다. 다만 출퇴근 시간 다리 구간이 막힐 수 있으니 숙소 주소와 티오프를 함께 보내 차량 시간을 맞추세요."],
      ["롱비엔 야간 라운드는 아무 날이나 되나요?", "공식 소개에 조명 시설이 있지만 모든 날짜·시간의 야간 티오프를 보장하지는 않습니다. 희망일의 마지막 출발 시간, A·B·C 코스 배정과 귀가 차량을 같은 확정서에서 확인하세요."]
    ],
    related: ["guide/long-bien-golf-course-night-round-booking.html", "guide/long-bien-golf-course-price-included-check.html"]
  },
  "sky-lake-golf": {
    checkedAt: "2026-11-14",
    sources: [["스카이레이크CC 공식 한국어 예약 안내", "https://skylakegolfclub.vn/Kor/Reservation/ReservationGuide.aspx"]],
    faqs: [
      ["스카이레이크 Sky 코스와 Lake 코스는 어떻게 다른가요?", "스카이레이크는 Sky 18홀과 Lake 18홀, 두 코스로 운영됩니다. 같은 골프장이라도 배정 코스에 따라 라운드 느낌이 달라지므로 희망 코스를 적고 실제 배정 코스를 확정서에서 확인하세요."],
      ["스카이레이크 예약은 언제까지 해야 하나요?", "공식 한국어 예약 안내는 마감 시한과 확인 전화 절차를 따로 안내합니다. 출발이 가까울수록 원하는 시간이 없을 수 있으니 날짜·인원·희망 티오프를 미리 정해 문의하세요."]
    ],
    related: ["guide/sky-lake-online-booking-48-hour-confirmation-call.html", "guide/hanoi-golf-group-course-transport-plan.html"]
  },
  "brg-kings-island": {
    checkedAt: "2026-11-14",
    sources: [["킹스아일랜드 공식 플레이 규정", "https://kingsislandgolf.vn/1/277/B-REGULATIONS-OF-GOLF-PLAY"], ["킹스아일랜드 공식 위치·문의", "https://kingsislandgolf.vn/1/34/Lien-he"]],
    faqs: [
      ["킹스아일랜드의 세 코스는 어떻게 고르나요?", "킹스아일랜드는 레이크사이드·마운틴뷰·킹스 세 코스, 총 54홀입니다. 호수 건너 코스는 보트로 이동하므로 배정 코스에 따라 체크인 후 출발까지 걸리는 시간이 달라집니다. 희망 코스와 실제 배정을 함께 확인하세요."],
      ["킹스아일랜드 예약은 며칠 전까지 해야 하나요?", "공식 규정에 예약 가능 기간과 한 조 인원 기준이 있습니다. 단체는 조 수가 늘수록 같은 시간대 확보가 어려우니 날짜·인원·대체 시간을 먼저 정해 문의하세요."]
    ],
    related: ["guide/kings-island-booking-window-player-limit-check.html", "guide/hanoi-golf-group-course-transport-plan.html"]
  },
  "tam-dao-golf": {
    checkedAt: "2026-11-14",
    sources: [["땀다오 공식 예약 규정", "https://tamdaogolf.com/booking-regulations.html"], ["땀다오 공식 소개", "https://tamdaogolf.com/page/gioi-thieu.html"]],
    faqs: [
      ["땀다오 골프장은 노이바이 공항에서 바로 갈 수 있나요?", "땀다오는 하노이 시내보다 노이바이 공항 쪽에 가까워 도착일이나 출국일에 라운드를 넣는 일정이 많습니다. 항공 도착 뒤 입국·짐 찾기 시간을 더해 티오프를 잡고, 골프백을 실을 차량을 미리 정하세요."],
      ["땀다오 여름에는 티오프 시간이 바뀌나요?", "땀다오는 계절에 따라 티오프 시간 변경을 공지한 적이 있습니다. 예전 일정표를 그대로 쓰지 말고 예약일 기준 운영 시간과 확정 티오프를 다시 확인하세요."]
    ],
    related: ["tam-dao-golf-booking-rules-tee-time.html", "guide/tam-dao-noi-bai-airport-tee-time-transfer-plan.html"]
  },
  "thanh-lanh-valley-golf": {
    checkedAt: "2026-11-14",
    sources: [["탄라잉 공식 코스 소개", "https://thanhlanhgolf.com/vi/ve-chung-toi"], ["탄라잉 공식 연락처", "https://thanhlanhgolf.com/vi/lien-he"]],
    faqs: [
      ["탄라잉 골프장은 어떤 곳인가요?", "탄라잉 밸리는 하노이 북서쪽 탄라잉 호수 계곡에 있는 18홀 골프장으로, 닉 팔도 설계로 소개됩니다. 산과 호수가 둘러싼 지형이라 하노이 시내 코스와 다른 풍경을 원하는 분들이 많이 찾습니다."],
      ["탄라잉 차량은 무엇을 기사에게 보내야 하나요?", "비슷한 이름의 장소가 있어 골프장 공식 주소와 지도 핀을 함께 보내야 합니다. 숙소 주소, 인원·골프백 수, 확정 티오프와 라운드 뒤 목적지까지 한 번에 전달하세요."]
    ],
    related: ["guide/thanh-lanh-hanoi-day-trip-address-route-check.html", "guide/hanoi-golf-group-course-transport-plan.html"]
  },
  "dai-lai-golf": {
    checkedAt: "2026-11-14",
    sources: [["다이라이 골프클럽 공식 코스 설명", "https://dailaigolf.com.vn/mo-ta-18-ho-gon.html"], ["다이라이 골프클럽 공식 사이트", "https://dailaigolf.com.vn/"]],
    faqs: [
      ["다이라이 골프장은 몇 홀인가요?", "다이라이 골프클럽 공식 코스 설명은 A·B·C 세 구간, 27홀을 안내합니다. 18홀을 칠 때 어느 두 구간이 배정되는지는 예약일에 따라 다르니 확정서에서 확인하세요."],
      ["다이라이 호수에 골프장이 여러 곳인가요?", "다이라이 호수 주변에는 이름이 비슷한 다른 골프장도 있습니다. 예약서와 차량 목적지에 Dai Lai Golf Club이라는 정확한 이름과 공식 주소를 함께 적어야 엉뚱한 곳으로 가는 일을 막을 수 있습니다."]
    ],
    related: ["dai-lai-golf-booking-27-holes.html", "guide/hanoi-golf-group-course-transport-plan.html"]
  },
  "montana-golf-course": {
    checkedAt: "2026-11-14",
    sources: [["Montaña Golf Course 공식 사이트", "https://montana.grandline.com.vn/"]],
    faqs: [
      ["몬타냐 골프장은 지금 몇 홀을 칠 수 있나요?", "몬타냐는 전체 36홀로 계획된 새 골프장이고, 2026년 East 코스 18홀부터 운영을 시작했습니다. 전체 개발 규모와 예약일에 실제로 열리는 코스를 구분해 확인하세요."],
      ["몬타냐 골프장 위치는 어디인가요?", "공식 예약 안내는 푸토성 틴민을 위치로 표시합니다. 행정구역 통합 전 지명과 섞여 혼동이 생길 수 있으니 차량에는 공식 지도 위치를 보내고, 산길 이동 시간을 넉넉하게 잡으세요."]
    ],
    related: ["montana-golf-course-october-booking-check.html", "guide/hanoi-golf-group-course-transport-plan.html"]
  },
  "vinpearl-golf-hai-phong": {
    checkedAt: "2026-11-14",
    sources: [["Vinpearl Golf Hai Phong 공식 소개", "https://vinpearl.com/en/vinpearl-golf-hai-phong"]],
    faqs: [
      ["빈펄 골프 하이퐁은 하노이에서 당일로 갈 수 있나요?", "하노이에서 고속도로로 약 2시간 거리라 당일 왕복도 가능하지만, 이른 티오프라면 하이퐁에서 1박하는 편이 여유롭습니다. 하롱베이 일정과 묶으면 이동을 한 번에 줄일 수 있습니다."],
      ["빈펄 하이퐁 36홀은 어떻게 나뉘나요?", "빈펄 골프 하이퐁은 두 개의 18홀 코스, 총 36홀로 소개됩니다. 희망 코스를 적어도 배정은 날짜마다 달라질 수 있으니 확정서의 코스명과 티오프를 함께 확인하세요."]
    ],
    related: ["guide/vinpearl-golf-hai-phong-2026-price-check.html", "guide/vinpearl-golf-online-request-confirmation-check.html"]
  },
  "montgomerie-links-vietnam": {
    checkedAt: "2026-11-14",
    sources: [["몽고메리 링크스 공식 오시는 길", "https://www.montgomerielinks.com/how-to-get-here"], ["몽고메리 링크스 공식 클럽 규정", "https://www.montgomerielinks.com/news/club-regulations"]],
    faqs: [
      ["몽고메리 링크스는 다낭 도착일에 칠 수 있나요?", "공식 안내는 다낭 공항에서 20분이라고 적고 있지만, 이것은 차량 이동만의 시간입니다. 착륙 뒤 입국 심사, 짐·골프백 찾기, 체크인 시간까지 더해 티오프를 잡아야 도착일 라운드가 무리 없이 진행됩니다."],
      ["몽고메리 링크스 복장 규정이 있나요?", "공식 클럽 규정에 복장과 플레이 규칙이 안내돼 있습니다. 깃 있는 상의와 골프화 등 기본 규정을 출발 전에 확인하고, 대여 장비가 필요하면 예약할 때 함께 요청하세요."]
    ],
    related: ["guide/montgomerie-links-vietnam-tee-time-dress-code-booking.html", "guide/danang-airport-montgomerie-links-arrival-day-plan.html"]
  },
  "legend-danang-golf-resort": {
    checkedAt: "2026-11-14",
    sources: [["Legend Danang Golf Resort 공식 사이트", "https://dananggolfclub.com"]],
    faqs: [
      ["레전드 다낭과 BRG 다낭은 같은 골프장인가요?", "네. 예전 BRG 다낭 골프 리조트가 지금 Legend Danang Golf Resort라는 이름을 쓰고 있습니다. 예전 일정표나 기사 안내에 BRG라는 이름이 남아 있다면 현재 이름과 같은 곳인지 함께 확인하세요."],
      ["레전드 다낭 노먼 코스와 니클라우스 코스 중 어디를 고르나요?", "그렉 노먼 코스와 잭 니클라우스 코스, 두 개의 18홀이 있습니다. 풍경과 경기 부담을 같은 질문으로 비교해 고르고, 희망 시간에 자리가 없을 때 다른 코스도 괜찮은지 미리 정해 두세요."]
    ],
    related: ["guide/danang-legend-norman-nicklaus-course-differences.html", "guide/brg-da-nang-golf-booking-tee-time-check.html"]
  },
  "ba-na-hills-golf-club": {
    checkedAt: "2026-11-14",
    sources: [["바나힐스 골프클럽 공식 코스 안내", "https://banahillsgolf.com/the-course/"], ["바나힐스 공식 야간 골프 안내", "https://banahillsgolf.com/floodlit-golf/"]],
    faqs: [
      ["바나힐스 골프클럽은 야간에도 칠 수 있나요?", "공식 안내에 조명 시설을 갖춘 야간 골프가 소개돼 있습니다. 다만 날짜마다 야간 티오프 운영이 다를 수 있으니 희망일의 마지막 출발 시간과 다낭 시내로 돌아오는 차량을 함께 확인하세요."],
      ["바나힐스 골프장과 바나힐 관광지는 같은 곳인가요?", "골프장은 바나힐 산기슭에 있고, 케이블카로 올라가는 관광지와는 출입구가 다릅니다. 기사에게 Ba Na Hills Golf Club이라는 정확한 이름으로 목적지를 보내세요."]
    ],
    related: ["guide/ba-na-hills-golf-club-night-tee-time-booking.html", "guide/ba-na-hills-october-night-golf-return-transfer-plan.html"]
  },
  "hoiana-shores-golf-club": {
    checkedAt: "2026-11-14",
    sources: [["호이아나 쇼어스 공식 골프 안내", "https://hoiana.com/golf/"], ["호이아나 쇼어스 공식 예약 페이지", "https://golf.hoiana.com/golf"]],
    faqs: [
      ["호이아나 쇼어스 단체 예약은 몇 명까지 온라인으로 되나요?", "공식 온라인 예약에는 한 번에 신청할 수 있는 인원 제한이 있어, 그보다 많은 단체는 따로 문의해야 합니다. 조 수와 희망 티오프 간격을 정해 한 번에 요청하세요."],
      ["호이아나 쇼어스는 다낭 시내에서 멀지 않나요?", "공식 안내는 다낭 공항에서 차로 45분이라고 적고 있습니다. 다낭 시내 숙소라면 왕복 이동 시간이 길어지므로, 호이안이나 호이아나 리조트 숙박과 묶는 일정도 함께 비교해 보세요."]
    ],
    related: ["hoiana-shores-golf-club-booking-guide.html", "guide/hoiana-shores-golf-group-over-eight-booking.html"]
  },
  "vinpearl-golf-nam-hoi-an": {
    checkedAt: "2026-11-14",
    sources: [["Vinpearl Golf Nam Hoi An 공식 소개", "https://vinpearl.com/en/nam-hoi-an/discovery-and-activies/vinpearl-golf-nam-hoi-an"]],
    faqs: [
      ["빈펄 남호이안은 다낭 공항에서 얼마나 먼가요?", "빈펄 공식 안내는 다낭 공항에서 약 30km라고 적고 있으며, 숙소 위치에 따라 차량 시간이 달라집니다. 다낭 시내보다 호이안 남쪽에 가까워 리조트 숙박과 묶는 일정이 편합니다."],
      ["빈펄 남호이안 티오프는 어떻게 확정하나요?", "온라인 요청을 보낸 것과 확정은 다릅니다. 날짜·인원·홀 수·희망 시간을 보낸 뒤 예약번호와 확정 티오프가 적힌 회신을 받아야 일정표에 넣을 수 있습니다."]
    ],
    related: ["guide/vinpearl-nam-hoi-an-tee-time-arrival-check.html", "guide/vinpearl-golf-nam-hoi-an-price-included-check.html"]
  },
  "laguna-golf-lang-co": {
    checkedAt: "2026-11-14",
    sources: [["라구나 골프 랑꼬 공식 소개", "https://www.lagunalangco.com/golf/"], ["라구나 골프 랑꼬 공식 예약", "https://www.lagunalangco.com/golf/booking/"]],
    faqs: [
      ["라구나 랑꼬는 다낭에서 어떻게 가나요?", "다낭에서 하이반 터널을 지나 북쪽으로 약 1시간 거리입니다. 후에 푸바이 공항에서도 비슷한 거리라 다낭과 후에 일정을 잇는 중간 지점으로 많이 씁니다."],
      ["라구나 랑꼬 예약을 취소하면 언제부터 비용이 생기나요?", "공식 예약 안내는 인원과 취소 시점에 따라 취소 기준을 나눠 둡니다. 결제 전에 취소 기한과 비용이 생기는 시점을 확정서에서 확인하세요."]
    ],
    related: ["guide/laguna-lang-co-golf-booking-caddie-cart-check.html", "guide/laguna-lang-co-golf-airport-hue-route-plan.html"]
  },
  "kn-golf-links-cam-ranh": {
    checkedAt: "2026-11-14",
    sources: [["KN 골프링크스 공식 코스 안내", "https://www.kngolflinks.com/golf-courses"]],
    faqs: [
      ["KN 골프링크스 27홀은 어떻게 나뉘나요?", "KN 골프링크스는 그렉 노먼이 설계한 링크스 18홀과 오아시스 9홀, 총 27홀로 소개됩니다. 18홀만 칠지, 9홀을 더할지 정해 같은 조건으로 견적을 받으세요."],
      ["KN 골프링크스는 깜란 공항 도착일에 칠 수 있나요?", "공항 바로 옆이라 차량 이동은 10~15분 안팎이지만, 입국 심사와 골프백 수령 시간을 더해야 합니다. 항공 지연을 생각해 대체 티오프나 다음 날 라운드도 함께 정해 두세요."]
    ],
    related: ["guide/kn-golf-links-cam-ranh-18-27-hole-booking-check.html", "guide/cam-ranh-airport-kn-golf-nha-trang-route-plan.html"]
  },
  "vinpearl-golf-nha-trang": {
    checkedAt: "2026-11-14",
    sources: [["Vinpearl Golf Nha Trang 공식 코스 안내", "https://vinpearl.com/en/vinpearl-golf-nha-trang"], ["Vinpearl Nha Trang 공식 섬 이동 안내", "https://vinpearl.com/en/how-to-get-to-vinpearl-nha-trang"]],
    faqs: [
      ["빈펄 골프 나트랑은 섬으로 어떻게 들어가나요?", "골프장은 나트랑 앞바다 혼째섬에 있어 선착장에서 케이블카나 배로 건너갑니다. 케이블카 점검이나 날씨가 나쁜 날에는 배로 바뀔 수 있으니 섬 이동 수단과 첫 출발 시간을 미리 확인하세요."],
      ["빈펄 나트랑 단체는 이동을 어떻게 맞추나요?", "단체는 본토 차량, 섬 이동, 섬 안 셔틀을 한 번에 맞춰야 합니다. 조별 티오프 간격과 귀가 시간을 정한 뒤 선착장 집결 시간을 역산해 일행 모두에게 같은 안내를 보내세요."]
    ],
    related: ["vinpearl-golf-nha-trang-booking-guide.html", "guide/nha-trang-island-golf-group-transfer-plan.html"]
  },
  "dalat-palace-golf-club": {
    checkedAt: "2026-11-14",
    sources: [["Dalat Palace Golf Club 공식 사이트", "https://www.dalatpalacegolf.com"]],
    faqs: [
      ["달랏 팰리스 골프장은 시내에서 가깝나요?", "달랏 팰리스는 달랏 시내 쑤언흐엉 호수 북쪽 언덕에 있어 시내 숙소에서 차로 5분 안팎입니다. 공항에서는 약 30km 떨어져 있으니 도착일보다 둘째 날 라운드가 여유롭습니다."],
      ["달랏 팰리스 단체는 조 편성을 어떻게 하나요?", "8명이 넘으면 조가 나뉘어 출발 시간이 달라집니다. 조별 명단과 티오프 간격을 먼저 확정하고, 차량은 첫 조 출발 시간에 맞춰 배차하세요."]
    ],
    related: ["guide/dalat-palace-golf-group-flight-transport-plan.html", "guide/dalat-golf-2-night-3-day-two-course-schedule.html"]
  },
  "sam-tuyen-lam-golf": {
    checkedAt: "2026-11-14",
    sources: [["SAM 뚜옌럼 골프클럽 공식 소개", "https://samtuyenlamgolf.com.vn/about-us/?lang=en"]],
    faqs: [
      ["SAM 뚜옌럼은 공항과 시내 중 어디에 가깝나요?", "공식 소개는 골프장이 리엔크엉 공항 북쪽 약 15km, 달랏 시내 남쪽 약 15km에 있다고 안내합니다. 공항과 시내 사이에 있어 도착일이나 출국일 동선에 넣기 좋습니다."],
      ["SAM 뚜옌럼을 기사에게 어떻게 알려주나요?", "뚜옌럼 호수 관광지구 안에 여러 시설이 있어 달랏 골프장이라고만 하면 혼동될 수 있습니다. SAM Tuyen Lam Golf라는 정확한 이름과 지도 위치를 함께 보내세요."]
    ],
    related: ["guide/lien-khuong-airport-sam-tuyen-lam-golf-route-plan.html", "guide/dalat-golf-2-night-3-day-two-course-schedule.html"]
  },
  "dalat-at-1200": {
    checkedAt: "2026-11-14",
    sources: [["The Dalat at 1200 공식 예약 안내", "https://www.dalat1200.com/vi/booking/"]],
    faqs: [
      ["달랏 1200은 공항에서 얼마나 가깝나요?", "달랏 1200은 리엔크엉 공항에서 가장 가까운 달랏 골프장으로, 차량 15~25분 안팎입니다. 달랏 시내 숙소에서는 오히려 더 멀 수 있으니 숙소 위치와 함께 동선을 정하세요."],
      ["달랏 1200 예약 신청에는 무엇을 적나요?", "공식 예약 안내에는 플레이 날짜와 시간, 인원, 홀 수와 연락처를 적는 신청 양식이 있습니다. 신청과 확정은 다르니 확정 회신에서 티오프와 포함 항목을 다시 확인하세요."]
    ],
    related: ["dalat-1200-invitation-booking-guide.html", "guide/dalat-golf-2-night-3-day-two-course-schedule.html"]
  },
  "vinpearl-golf-phu-quoc": {
    checkedAt: "2026-11-14",
    sources: [["빈펄 골프 푸꾸옥 공식 소개", "https://vinpearl.com/en/vinpearl-golf-phu-quoc"]],
    faqs: [
      ["푸꾸옥 도착 당일에 빈펄 골프를 칠 수 있나요?", "공항에서 섬 북쪽 골프장까지 차량 35~50분이 걸립니다. 오전 도착 항공이라면 오후 티오프를 검토할 수 있지만, 항공 지연과 체크인 시간을 생각해 대체 시간도 함께 정해 두세요."],
      ["빈펄 푸꾸옥은 몇 홀인가요?", "빈펄 골프 푸꾸옥은 27홀로 운영됩니다. 18홀로 적은 오래된 자료도 있으니 예약할 때 실제 배정 코스와 이용 홀 수를 확정서에서 확인하세요."]
    ],
    related: ["vinpearl-golf-phu-quoc-booking-checklist.html", "guide/vinpearl-phu-quoc-arrival-day-3pm-tee-window.html"]
  },
  "novaworld-phan-thiet-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "노바월드 판티엣 공식 사이트",
        "https://novaworldphanthiet.com.vn/"
      ]
    ],
    "faqs": [
      [
        "노바월드 판티엣 오션 코스와 가든 코스는 어떻게 다른가요?",
        "두 코스 모두 그렉 노먼 설계의 18홀 파72입니다. 오션 코스가 먼저 2021년에 열렸고 뒤쪽 티 기준 약 7,400야드로 더 길며, 가든 코스는 2022년에 열렸고 약 7,100야드입니다. 오션 코스는 2022년 베트남 최우수 신규 골프장 상을 받았습니다."
      ],
      [
        "노바월드 판티엣 판티엣 공항으로 바로 갈 수 있나요?",
        "아직은 안 됩니다. 판티엣 공항 민간 터미널은 2026년 4월에 착공했고 여객 운항 개시일은 정해지지 않았습니다. 현재는 호치민 떤선녓 공항에 내려 고속도로로 이동하는 방법이 일반적입니다."
      ]
    ],
    "related": [
      "hochiminh-golf-rental-car-guide.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "sea-links-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Sea Links 공식 골프 안내",
        "https://www.sealinkscity.com/golf/"
      ]
    ],
    "faqs": [
      [
        "씨링크스 골프는 어떤 코스인가요?",
        "골프플랜의 로널드 프림이 설계한 18홀 파72 코스로, 바다를 내려다보는 언덕 위에 있어 대부분 홀에서 바다가 보입니다. 바람의 영향을 많이 받는 링크스 스타일 코스로 소개됩니다."
      ],
      [
        "씨링크스 골프장 안에 숙소가 있나요?",
        "같은 씨링크스 시티 단지 안에 씨링크스 비치 호텔, 씨링크스 빌라, 오션 비스타 아파트 등이 있어 숙박과 라운드를 한곳에서 해결할 수 있습니다. 판티엣 시내와 무이네 사이에 있습니다."
      ]
    ],
    "related": [
      "hochiminh-golf-rental-car-guide.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "sonadezi-chau-duc-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Chau Duc Golf Course 공식 사이트",
        "https://chauducgolfcourse.com.vn/"
      ]
    ],
    "faqs": [
      [
        "쩌우득CC 36홀 골프장인가요?",
        "계획은 리조트 코스와 토너먼트 코스를 합한 36홀이지만, 공식 사이트에는 현재 A·B 9홀씩 18홀로 안내돼 있습니다. 2023년 11월 18일 정식 개장했고 그 전에 시범 운영을 했습니다."
      ],
      [
        "쩌우득CC 붕따우 시내에서 가까운가요?",
        "붕따우 해변이 아니라 내륙 쩌우득 지역의 산업·도시 단지 안에 있습니다. 호치민에서 붕따우로 가는 길 중간쯤이라 호치민 출발 당일 라운드로도 다녀올 수 있습니다."
      ]
    ],
    "related": [
      "hochiminh-golf-rental-car-guide.html",
      "hochiminh-golf-departure-time-checklist.html"
    ]
  },
  "anara-binh-tien-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "ANARA Golf Club 공식 안내",
        "https://anarabinhtien.com/anara-golf-club/"
      ]
    ],
    "faqs": [
      [
        "나라 빈띠엔과 아나라 빈띠엔은 같은 곳인가요?",
        "같은 곳입니다. 2022년 Nara Binh Tien이라는 이름으로 문을 열었고 2023년 10월 ANARA Binh Tien Golf Club으로 이름을 바꿨습니다. 예약 사이트에 옛 이름이 남아 있는 경우가 있으니 주의하세요."
      ],
      [
        "아나라 빈띠엔 나트랑 시내에서 가깝나요?",
        "아닙니다. 골프장은 나트랑이 아니라 깜란 공항 남쪽 옛 닌투언 지역 해안에 있습니다. 깜란 공항에서 약 45km라 공항에서 바로 가기 좋고, 나트랑 시내에서는 이동 시간이 더 걸립니다."
      ]
    ],
    "related": [
      "guide/nha-trang-golf-stay-area-cam-ranh-city-island.html",
      "guide/cam-ranh-airport-kn-golf-nha-trang-route-plan.html"
    ]
  },
  "diamond-bay-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Diamond Bay Golf & Villas 공식 사이트",
        "https://diamondbaygolfvillas.com/"
      ]
    ],
    "faqs": [
      [
        "다이아몬드베이 골프는 누가 설계했나요?",
        "공식 사이트에 미국 설계가 앤디 다이(Andy Dye)의 작품으로 나와 있습니다. 바다를 끼고 있는 18홀 챔피언십 코스이며, 닉 팔도 설계로 잘못 소개되는 경우가 있으니 주의하세요."
      ],
      [
        "다이아몬드베이 공항에서 가까운가요?",
        "나트랑 시내보다 남쪽, 깜란 공항 방향에 있어 공항에서 차로 30분 안팎이면 닿는 편입니다. 시내 호텔보다 공항에서 바로 가기 좋은 위치입니다."
      ]
    ],
    "related": [
      "guide/nha-trang-golf-stay-area-cam-ranh-city-island.html",
      "guide/cam-ranh-airport-kn-golf-nha-trang-route-plan.html"
    ]
  },
  "eschuri-vung-bau-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Eschuri Vung Bau 공식 사이트",
        "https://eschurivungbau.com.vn/en"
      ]
    ],
    "faqs": [
      [
        "에스츄리 붕바우 야간 라운드가 가능한가요?",
        "가능합니다. 공식 사이트는 조명 시설을 갖춘 야간 골프를 이 골프장의 특징으로 소개합니다. 바닷가 코스라 해 질 녘 일몰을 보며 치는 라운드도 인기입니다."
      ],
      [
        "에스츄리 붕바우 썬그룹 리조트 숙박객 혜택이 있나요?",
        "공식 사이트에 푸꾸옥의 썬그룹 계열 리조트에 묵는 손님을 위한 Stay & Play 패키지가 안내돼 있습니다. 조건은 시기마다 바뀌니 예약 전에 확인하세요."
      ]
    ],
    "related": [
      "guide/phu-quoc-golf-group-flight-stay-plan.html",
      "guide/vinpearl-phu-quoc-arrival-day-3pm-tee-window.html"
    ]
  },
  "dragon-golf-links": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Dragon Golf Links 공식 사이트",
        "https://dragongolflinks.vn/"
      ]
    ],
    "faqs": [
      [
        "드래곤 골프링크스 27홀이 모두 열려 있나요?",
        "그렇습니다. 2023년 1단계로 문을 연 뒤 2단계 공사를 마치고 2025년 8월 23일 27홀 완공 행사를 열었습니다. 9홀씩 세 코스를 조합해 18홀을 칩니다."
      ],
      [
        "드래곤 골프링크스 공항과 하롱에서 얼마나 먼가요?",
        "공식 사이트에 깟비 국제공항에서 27km, 하롱 시내에서 60km, 하노이에서 123km로 나와 있습니다. 하이퐁 도착 당일 라운드나 하롱 일정과 묶기에 좋은 위치입니다."
      ]
    ],
    "related": [
      "guide/vinpearl-golf-hai-phong-2026-price-check.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "ruby-tree-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Ruby Tree Golf Resort 공식 사이트",
        "https://rubytreegolf.vn/"
      ]
    ],
    "faqs": [
      [
        "루비트리 도선 시사이드 골프와 같은 곳인가요?",
        "같은 곳입니다. 예전에는 Do Son Seaside Golf Resort라는 이름이었고 BRG 그룹이 인수한 뒤 Ruby Tree Golf Resort로 바뀌었습니다. 같은 도선 지역의 드래곤 골프 링크스와는 다른 골프장입니다."
      ],
      [
        "루비트리 코스는 어떤가요?",
        "공식 사이트 기준 18홀 파72, 전장 6,836m입니다. 바다를 앞에 두고 산을 등진 해변 코스로, 홀을 따라 자연 워터해저드가 이어집니다. 하이퐁 시내에서 약 15분 거리입니다."
      ]
    ],
    "related": [
      "guide/vinpearl-golf-hai-phong-2026-price-check.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "sono-felice-country-club": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Sono Felice CC 공식 위치 안내",
        "https://www.sonofelicecchp.com/content/about_location"
      ]
    ],
    "faqs": [
      [
        "소노펠리체 송지아, 소노벨과 같은 골프장인가요?",
        "같은 곳입니다. 송지아 골프 리조트로 알려졌다가 한국 소노 계열이 맡으며 소노벨 하이퐁, 지금은 소노펠리체 CC 하이퐁이라는 이름을 씁니다. 위치는 하롱이 아니라 하이퐁 투이응우옌입니다."
      ],
      [
        "소노펠리체 공항에서 얼마나 걸리나요?",
        "공식 안내에 깟비 공항에서 15km, 차로 약 35분으로 나와 있습니다. 하노이에서는 약 100km로 고속도로 이용 시 1시간 40분 정도 걸립니다. 하롱베이 관광과 함께 묶기 좋습니다."
      ]
    ],
    "related": [
      "guide/vinpearl-golf-hai-phong-2026-price-check.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "tuan-chau-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Tuan Chau Golf Resort 공식 사이트",
        "https://tuanchaugolfresort.vn/"
      ]
    ],
    "faqs": [
      [
        "뚜언쩌우 야간 골프가 되나요?",
        "됩니다. 모든 홀에 조명이 설치돼 있어 늦은 오후 티오프나 야간 라운드가 가능합니다. 하롱베이 일정 중 낮 관광을 하고 저녁에 치는 방식도 가능합니다."
      ],
      [
        "뚜언쩌우 코스 규모는 어떤가요?",
        "공식 사이트 기준 145ha가 넘는 부지에 18홀 파72, 7,338야드입니다. 퍼시픽 코스트 디자인이 하롱베이 바다 풍경을 살려 설계했고 국내외 대회를 열 수 있는 규모라고 소개합니다."
      ]
    ],
    "related": [
      "guide/vinpearl-golf-hai-phong-2026-price-check.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "flc-ha-long-golf": {
    "checkedAt": "2026-11-14",
    "sourceNote": "골프장 전용 사이트가 열리지 않아 운영사 FLC 그룹의 프로젝트 안내를 대조했습니다. 티타임·요금·당일 운영은 확인 범위에 포함되지 않습니다.",
    "sources": [
      [
        "FLC 그룹 하롱 프로젝트 안내",
        "https://www.flc.vn/du-an/quan-the-du-lich-nghi-duong-sinh-thai-flc-ha-long-quang-ninh/"
      ]
    ],
    "faqs": [
      [
        "FLC 하롱 골프는 지금도 운영하나요?",
        "운영 중입니다. 2026년에도 FLC Ha Long 이름을 그대로 쓰고 있으며, 2026년 8월에는 세계 아마추어 골프 선수권(WAGC) 측과 협약식을 이곳에서 열었습니다. 이름이 바뀌었다는 공식 발표는 없습니다."
      ],
      [
        "FLC 하롱 코스 특징은 무엇인가요?",
        "하롱 시내 언덕에 있어 많은 홀에서 하롱베이 바다가 보입니다. 슈미트-컬리가 설계한 18홀로, 같은 단지에 FLC 그랜드 호텔 하롱과 빌라가 있어 숙박과 묶기 쉽습니다."
      ]
    ],
    "related": [
      "guide/vinpearl-golf-hai-phong-2026-price-check.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "chi-linh-golf": {
    "checkedAt": "2026-11-14",
    "sourceNote": "골프장 공식 사이트가 응답하지 않아 골프장 정보 사이트로 코스 구성과 위치만 대조했습니다. 티타임·요금·당일 운영은 확인 범위에 포함되지 않습니다.",
    "sources": [
      [
        "Chi Linh Star Golf 골프장 정보(where2golf)",
        "https://www.where2golf.com/vietnam/chi-linh-star-golf-country-club"
      ]
    ],
    "faqs": [
      [
        "찌린 스타 몇 홀인가요?",
        "힐(A)·밸리(B)·레이크(C) 9홀 세 코스, 모두 27홀로 운영됩니다. 2003년 9홀로 시작해 차례로 늘렸고, 36홀로 적은 자료도 있지만 확인된 운영 홀 수는 27홀입니다."
      ],
      [
        "찌린 스타 하노이와 하롱 중 어디서 가기 좋나요?",
        "하노이에서 하롱으로 가는 길 중간의 찌린에 있어 하노이·하이퐁·하롱 어디서든 1~2시간대로 닿습니다. 하롱 이동 일정 중간에 들르는 라운드로 많이 씁니다."
      ]
    ],
    "related": [
      "guide/hanoi-golf-group-course-transport-plan.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "hanoi-golf-club": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Hanoi Golf Club 공식 사이트",
        "https://hanoigolfclub.com/"
      ]
    ],
    "faqs": [
      [
        "하노이GC 공항에서 얼마나 가깝나요?",
        "공식 사이트에 노이바이 공항에서 약 15분, 하노이 시내에서 차로 약 40분으로 나와 있습니다. 하노이 도착일이나 출국일에 라운드를 넣기 좋은 위치입니다."
      ],
      [
        "하노이GC 어떤 점이 특별한가요?",
        "일본인이 건설하고 관리하는 골프장으로 소개되며, 108ha 산자락에 27홀을 갖춰 하노이에서 드문 27홀 코스입니다. 설계는 일본의 후지와라 스스무로 알려져 있습니다."
      ]
    ],
    "related": [
      "guide/hanoi-golf-group-course-transport-plan.html",
      "guide/arrival-day-airport-hotel-golfbag-plan.html"
    ]
  },
  "legend-hill-country-club": {
    "checkedAt": "2026-11-14",
    "sourceNote": "골프장 공식 사이트를 확인하지 못해 베트남 골프 매체의 소개로 설계·규모만 대조했습니다. 티타임·요금·당일 운영은 확인 범위에 포함되지 않습니다.",
    "sources": [
      [
        "Vietnam Golf Magazine 레전드힐 소개",
        "https://vietnamgolfmagazine.net/en/brg-legend-hills-golf-resort-18-holes"
      ]
    ],
    "faqs": [
      [
        "BRG 레전드힐과 같은 곳인가요?",
        "같은 곳입니다. 2015년 BRG Legend Hill Golf Resort로 문을 열었고, 최근에는 Legend Hill Country Club 이름을 씁니다. 닌빈에 있는 레전드 밸리와는 다른 골프장입니다."
      ],
      [
        "레전드힐 코스 특징은 무엇인가요?",
        "니클라우스 디자인의 베트남 첫 작품으로, 한 홀에 그린을 두 개 둔 트윈 그린 방식을 처음 도입한 코스입니다. 속선 언덕 지대에 있어 노이바이 공항과 가깝습니다."
      ]
    ],
    "related": [
      "guide/hanoi-golf-group-course-transport-plan.html",
      "guide/arrival-day-airport-hotel-golfbag-plan.html"
    ]
  },
  "heron-lake-golf": {
    "checkedAt": "2026-11-14",
    "sourceNote": "골프장 공식 사이트를 확인하지 못해 골프장 정보 사이트로 코스 구성과 위치만 대조했습니다. 티타임·요금·당일 운영은 확인 범위에 포함되지 않습니다.",
    "sources": [
      [
        "Heron Lake 골프장 정보(where2golf)",
        "https://where2golf.com/vietnam/heron-lake-golf-course-resort"
      ]
    ],
    "faqs": [
      [
        "헤론레이크 담박 골프장과 같은 곳인가요?",
        "같은 곳입니다. 베트남어로는 담박(Đầm Vạc) 호수 이름을 따 Sân golf Đầm Vạc으로도 부릅니다. 호수와 작은 연못이 많은 평지형 18홀 파72 코스입니다."
      ],
      [
        "헤론레이크 하노이에서 당일로 다녀올 수 있나요?",
        "하노이 시내에서 약 45km, 노이바이 공항에서는 30km 안팎이라 당일 라운드가 충분히 가능합니다. 2025년 행정 통합 뒤 주소는 푸토성으로 바뀌었습니다."
      ]
    ],
    "related": [
      "guide/hanoi-golf-group-course-transport-plan.html",
      "guide/arrival-day-airport-hotel-golfbag-plan.html"
    ]
  },
  "hilltop-valley-golf": {
    "checkedAt": "2026-11-14",
    "sources": [
      [
        "Hilltop Valley Golf Club 공식 사이트",
        "https://hilltopvalleygolf.com/"
      ]
    ],
    "faqs": [
      [
        "힐탑밸리 코스 난도는 어떤가요?",
        "설계사 IMG가 매우 언덕이 많은 부지라고 설명할 만큼 고저차가 큰 산악 코스입니다. 공식 사이트도 베트남에서 가장 도전적이고 재미있는 코스로 소개합니다."
      ],
      [
        "힐탑밸리 몇 홀인가요?",
        "모두 27홀입니다. 첫 18홀은 2019년 9월에 문을 열었고, 세 번째 9홀은 2020년 10월 공사를 마치고 추가로 열었습니다. 운영사는 드래곤 골프 링크스와 같은 Geleximco 계열입니다."
      ]
    ],
    "related": [
      "guide/hanoi-golf-group-course-transport-plan.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  },
  "phoenix-golf-resort": {
    "checkedAt": "2026-11-14",
    "sourceNote": "골프장 공식 사이트를 확인하지 못해 2026년 보도자료와 언론 기사로 규모·소유·재단장 내용만 대조했습니다. 티타임·요금·당일 운영은 확인 범위에 포함되지 않습니다.",
    "sources": [
      [
        "피닉스 CV 골프 리조트 2026 보도자료(IAGTO)",
        "https://iagto.com/press-releases/c53bd1fa-1f3d-4260-97b1-4af1868142a7"
      ],
      [
        "VnEconomy 피닉스 CV 재단장 기사",
        "https://vneconomy.vn/phoenix-cv-golf-resort-dau-an-tai-dinh-vi-trong-chien-luoc-phat-trien-he-sinh-thai-toan-dien-cua-cv-resort.htm"
      ]
    ],
    "faqs": [
      [
        "피닉스 코스가 몇 개인가요?",
        "피닉스, 드래곤, 챔피언 세 코스로 각 18홀, 모두 54홀입니다. 코스마다 설계자가 다르며 피닉스 코스는 골프플랜의 로널드 프림이 설계했습니다."
      ],
      [
        "피닉스 최근에 바뀐 점이 있나요?",
        "한국 CV그룹이 Phoenix CV Golf & Resort로 이름을 새로 하고 새 클럽하우스를 열었으며 코스 전체를 개보수했습니다. 2026년 2~3월에는 재개장 기념 대회를 열었습니다."
      ]
    ],
    "related": [
      "guide/hanoi-golf-group-course-transport-plan.html",
      "guide/multi-city-transfer-day-plan.html"
    ]
  }
};
