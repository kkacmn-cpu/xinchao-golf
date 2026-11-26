// 골프장 1인 하한 '○○만 원~' (2026-11-26 총괄 결정: 가격을 바꾸지 않고 견적기에 이미 있는 값의 하한만 보여 준다. 달력 요금은 안 함)
// 출처: 견적기 xinchao-reservation/publicQuoteCatalog.json golf.courses[].rules
//  - 자동 견적에 쓰는 규칙만(ruleStatus ACTIVE_AUTO·ACTIVE_CONDITIONAL), 견적기 GOLF_EXCLUDE_RE(현지인·레이디·시니어·주니어·회원) 조건 제외
//  - 평일(월~금) 가장 낮은 그린피(동) + 견적기 골프 예약수수료(extras.golfBookingFee, 1인 1라운드 $)
//  - 환산은 견적기 DEFAULT_RATE(1달러 = 26,960동 = 1,450원), 만 원 아래 버림
// 실행: node scripts/golf-price-floor.mjs [견적기 폴더]  → src/golf-price-floor.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const resDir = process.argv[2] || "C:/Users/PC/code/xinchao-reservation";
const cat = JSON.parse(fs.readFileSync(path.join(resDir, "publicQuoteCatalog.json"), "utf8"));
const VND_PER_USD = 26960, KRW_PER_USD = 1450;
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
const feeUsd = Number(cat.prices.extras.golfBookingFee.amountUsd);
const items = Object.entries(MAP).map(([slug, id]) => {
  const c = cat.golf.courses.find((x) => x.id === id);
  if (!c) throw new Error(`견적기에 없음: ${id}`);
  const vnds = c.rules
    .filter((r) => ["ACTIVE_AUTO", "ACTIVE_CONDITIONAL"].includes(r.ruleStatus) && !EXCLUDE.test(`${r.krCondition || ""} ${(r.audienceTags || []).join(" ")}`))
    .flatMap((r) => Object.entries(r.priceByIsoWeekday || {}).filter(([d, v]) => Number(d) <= 5 && v > 0).map(([, v]) => v));
  if (!vnds.length) return null;
  const vnd = Math.min(...vnds);
  const usd = vnd / VND_PER_USD + feeUsd;
  return { slug, catalogId: id, greenFeeVnd: vnd, bookingFeeUsd: feeUsd, man: Math.floor((usd * KRW_PER_USD) / 10000), usd: Math.floor(usd) };
}).filter(Boolean);
const out = { source: "xinchao-reservation publicQuoteCatalog.json", golfRevision: cat._meta.golfRevision, validMonth: cat.golf._meta.validMonth, rate: { vndPerUsd: VND_PER_USD, krwPerUsd: KRW_PER_USD }, items };
fs.writeFileSync(path.join(root, "src/golf-price-floor.json"), JSON.stringify(out, null, 2) + "\n");
console.log(items.map((i) => `${i.slug} ${i.man}만 원~ ($${i.usd})`).join("\n"));
