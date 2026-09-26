import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { courses, site } from "./site-data.mjs";
import { courseGuides } from "./course-guides.mjs";
const escaped = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

test("every course has its own source-bound questions and existing article links", () => {
  assert.deepEqual(Object.keys(courseGuides).sort(), courses.map(c => c.slug).sort());
  const questions = Object.values(courseGuides).flatMap(g => g.faqs.map(([q]) => q));
  assert.equal(new Set(questions).size, questions.length);
  for (const g of Object.values(courseGuides)) {
    assert.match(g.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(g.sources.length > 0 && g.faqs.length >= 2 && g.related.length >= 2);
    for (const [title, url] of g.sources) assert.ok(title && new URL(url).protocol === "https:");
    for (const [q, a] of g.faqs) assert.ok(q && a.length > 50);
  }
});

for (const course of courses) test(`${course.slug}: HTML and FAQ agree; canonical and CTA preserved`, async () => {
  const g = courseGuides[course.slug];
  const html = await readFile(new URL(`../dist/golf/${course.slug}.html`, import.meta.url), "utf8");
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const faq = schemas.find(s => s["@type"] === "FAQPage");
  assert.ok(faq, "FAQPage missing");
  assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), g.faqs);
  for (const [q, a] of g.faqs) { assert.ok(visible.includes(escaped(q))); assert.ok(visible.includes(escaped(a))); }
  for (const [, url] of g.sources) assert.ok(visible.includes(`href="${url}"`));
  for (const file of g.related) {
    assert.ok(visible.includes(`href="/blog/${file}"`));
    assert.ok((await readFile(new URL(`../dist/blog/${file}`, import.meta.url), "utf8")).includes("<h1"));
  }
  assert.ok(html.includes(`rel="canonical" href="${site.siteUrl}/golf/${course.slug}.html"`));
  assert.ok(visible.includes(`data-interest="${course.name} 상담"`));
  assert.ok(visible.includes("예약 확정이나 최종 요금 안내가 아닙니다"));
});
