// 골프장 1인 하한 '○○만 원~' (2026-11-26 총괄 결정: 가격을 바꾸지 않고 견적기에 이미 있는 값의 하한만 보여 준다. 달력 요금은 안 함)
// 출처: 견적기 골프 요금표(golfMaster 형식 JSON — 11월판 = 【신짜오】 견적·영업 골프가격_JSON/견적기_골프_2026-11판_본체.json)
//  - 자동 견적에 쓰는 규칙만(ruleStatus ACTIVE_AUTO·ACTIVE_CONDITIONAL), 견적기 GOLF_EXCLUDE_RE(현지인·레이디·시니어·주니어·회원) 조건 제외
//  - 평일(월~금) 가장 낮은 그린피(동) + 견적기 골프 예약수수료(publicQuoteCatalog extras.golfBookingFee, 1인 1라운드 $)
//  - 환산은 견적기 DEFAULT_RATE(1달러 = 26,960동 = 1,450원), 만 원 아래 버림
// 12월(11-26 총괄 결정, 11-24 대표님 지시): 견적기는 12-01 이후 라운드에 11월판 + 1인 1라운드 300,000동(currency-v2/golf.cjs golfDateAdjustment).
//  → next = 같은 하한 + 300,000동, 12-01 0시(베트남, UTC+7)부터 사이트에 '12월 예상'으로 보인다(build.mjs가 날짜로 고르고, 그 전 빌드는 페이지 안 스크립트가 0시에 바꿈).
// 실행: node scripts/golf-price-floor.mjs [요금표 JSON] [견적기 폴더]  → src/golf-price-floor.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tableFile = process.argv[2] || "C:/Users/PC/Documents/사업부/신짜오/견적영업/골프가격_JSON/견적기_골프_2026-11판_본체.json";
const resDir = process.argv[3] || "C:/Users/PC/code/xinchao-reservation";
const table = JSON.parse(fs.readFileSync(tableFile, "utf8"));
const pub = JSON.parse(fs.readFileSync(path.join(resDir, "publicQuoteCatalog.json"), "utf8"));
const VND_PER_USD = 26960, KRW_PER_USD = 1450;
const NEXT = { validMonth: "2026-12", from: "2026-12-01T00:00:00+07:00", label: "12월 예상", addVnd: 300000 };
const EXCLUDE = /(nội địa|noi dia|거주증|\blady\b|레이디|\bsenior\b|시니어|\bjunior\b|어린이|\bchild\b|\bmember\b|회원|hội viên|hoi vien)/i;
// 사이트 골프장 slug → 견적기 id (호치민 쪽 12곳)
const MAP = {
  "thu-duc-country-club": "hochiminh-vietnam-golf-and-country-club",
  "tan-son-nhat-golf-course": "hochiminh-tan-son-nhat-golf-course",
  "twin-doves-golf-club": "hochiminh-twin-doves-golf-club",
  "leman-golf-club": "hochiminh-vinpearl-golf-leman",
  "taekwang-jeongsan-country-club": "hochiminh-emerald-country-club-taekwang-jeongsan-country-club",
  "long-thanh-golf-club": "hochiminh-long-thanh-golf-club",
  "song-be-golf-resort": "hochiminh-song-be-golf-resort",
  "dong-nai-golf-resort": "hochiminh-dong-nai-golf-resort",
  "harmony-golf-park": "hochiminh-harmonie-golf-park",
  "west-lakes-golf-villas": "longan-west-lakes-golf-and-villa",
  "royal-long-an-golf": "longan-royal-long-an-golf-and-country-club",
  "royal-island-golf-villas": "binhduong-royal-island-golf-and-villas",
};
const feeUsd = Number(pub.prices.extras.golfBookingFee.amountUsd);
const floorItem = (slug, id, vnd) => {
  const usd = vnd / VND_PER_USD + feeUsd;
  return { slug, catalogId: id, greenFeeVnd: vnd, bookingFeeUsd: feeUsd, man: Math.floor((usd * KRW_PER_USD) / 10000), usd: Math.floor(usd) };
};
const base = Object.entries(MAP).map(([slug, id]) => {
  const c = table.courses.find((x) => x.id === id);
  if (!c) throw new Error(`요금표에 없음: ${id}`);
  const vnds = c.rules
    .filter((r) => ["ACTIVE_AUTO", "ACTIVE_CONDITIONAL"].includes(r.ruleStatus) && !EXCLUDE.test(`${r.krCondition || ""} ${(r.audienceTags || []).join(" ")}`))
    .flatMap((r) => Object.entries(r.priceByIsoWeekday || {}).filter(([d, v]) => Number(d) <= 5 && v > 0).map(([, v]) => v));
  return vnds.length ? { slug, id, vnd: Math.min(...vnds) } : null;
}).filter(Boolean);
const out = {
  source: `견적기 골프 요금표 ${path.basename(tableFile)} + publicQuoteCatalog.json 예약수수료`,
  validMonth: table._meta.validMonth,
  rate: { vndPerUsd: VND_PER_USD, krwPerUsd: KRW_PER_USD },
  items: base.map((b) => floorItem(b.slug, b.id, b.vnd)),
  next: { validMonth: NEXT.validMonth, from: NEXT.from, label: NEXT.label, rule: `견적기 ${table._meta.validMonth}판 + 1인 1라운드 ${NEXT.addVnd.toLocaleString("en-US")}동`, items: base.map((b) => floorItem(b.slug, b.id, b.vnd + NEXT.addVnd)) },
};
fs.writeFileSync(path.join(root, "src/golf-price-floor.json"), JSON.stringify(out, null, 2) + "\n");
console.log(out.items.map((i, n) => `${i.slug} ${i.greenFeeVnd} ${i.man}만 원~ ($${i.usd}) → 12월 ${out.next.items[n].greenFeeVnd} ${out.next.items[n].man}만 원~ ($${out.next.items[n].usd})`).join("\n"));
