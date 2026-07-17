import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const REQUIRED_FIELDS = ["title", "description", "category", "date", "cover"];

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async" width="1200" height="800">')
    .replace(/\[([^\]]+)\]\((\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function parseFrontMatter(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: 글 상단의 --- 메타데이터 영역이 필요합니다.`);

  const metadata = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`${filename}: 잘못된 메타데이터 줄 (${rawLine})`);
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    metadata[key] = value;
  }
  return { metadata, body: match[2].trim() };
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let paragraph = [];
  let listType = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      output.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const wanted = unordered ? "ul" : "ol";
      if (listType !== wanted) {
        closeList();
        output.push(`<${wanted}>`);
        listType = wanted;
      }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(line)) {
      flushParagraph();
      closeList();
      output.push(`<figure class="content-media">${inlineMarkdown(line)}</figure>`);
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  closeList();
  return output.join("\n");
}

export async function loadMarkdownPosts(contentDirectory) {
  let entries;
  try {
    entries = await readdir(contentDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const posts = [];
  for (const entry of entries.filter((item) => item.isFile() && item.name.endsWith(".md") && !item.name.startsWith("_"))) {
    const source = await readFile(path.join(contentDirectory, entry.name), "utf8");
    const { metadata, body } = parseFrontMatter(source, entry.name);
    if (metadata.draft === "true") continue;
    for (const field of REQUIRED_FIELDS) {
      if (!metadata[field]) throw new Error(`${entry.name}: ${field} 값이 필요합니다.`);
    }
    const slug = metadata.slug || entry.name.replace(/\.md$/, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${entry.name}: slug는 영문 소문자·숫자·하이픈만 사용할 수 있습니다.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date)) throw new Error(`${entry.name}: date는 YYYY-MM-DD 형식이어야 합니다.`);
    if (!body) throw new Error(`${entry.name}: 본문이 비어 있습니다.`);
    posts.push({
      file: `${slug}.html`,
      slug,
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      region: metadata.region || "베트남",
      date: metadata.date,
      modified: metadata.modified || metadata.date,
      cover: metadata.cover.replace(/^\/?assets\/blog\//, ""),
      keywords: (metadata.keywords || "").split(",").map((keyword) => keyword.trim()).filter(Boolean),
      sourceType: "markdown",
      articleHtml: `<article class="blog-markdown">${markdownToHtml(body)}</article>`,
    });
  }
  return posts;
}
