// 숙소 이동(골프 → 호치민풀빌라) 목적지가 운영에서 리다이렉트 없이 200인지 확인한다(네트워크 필요).
// 실행: npm run check:lodging. 3xx·404 등 200이 아니면 실패한다. 빌드 후 vercel.json 기준으로 본다.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { poolvilla } from "./site-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
const targets = [...new Set([
  ...vercel.redirects.map((rule) => rule.destination).filter((url) => url.startsWith(`${poolvilla.siteUrl}/`)),
  poolvilla.villaList,
  poolvilla.apartmentList,
])].sort();

const failures = [];
for (const url of targets) {
  let status;
  try {
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "xinchao-golf-link-check" } });
    status = response.status;
  } catch (error) {
    status = `요청 실패 (${error.message})`;
  }
  console.log(`${status} ${url}`);
  if (status !== 200) failures.push(`${url}: ${status}`);
}

if (failures.length) {
  console.error(`풀빌라 목적지 확인 실패 ${failures.length}건 (200이어야 함, 3xx 금지)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`풀빌라 목적지 ${targets.length}개 모두 리다이렉트 없이 200`);
