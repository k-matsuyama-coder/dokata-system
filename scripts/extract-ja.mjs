#!/usr/bin/env node
// /scripts/extract-ja.mjs
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, "locales");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ja.json");

const TARGET_DIRS = [
  "app",
  "components",
  "lib",
  "hooks",
  "contexts",
  "utils",
  "src",
];

const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "public",
  "locales",
]);

const IGNORE_FILES = [
  /\.d\.ts$/,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
];

function isTargetFile(filePath) {
  const ext = path.extname(filePath);
  if (!TARGET_EXTENSIONS.has(ext)) return false;
  return !IGNORE_FILES.some((pattern) => pattern.test(filePath));
}

function walk(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && isTargetFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function containsJapanese(value) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/.test(value);
}

function shouldIgnoreText(value) {
  if (!value) return true;

  const text = normalizeWhitespace(value);

  if (!text) return true;
  if (!containsJapanese(text)) return true;
  if (text.length === 1 && /[ぁ-んァ-ヶー一-龠]/.test(text)) return true;

  const ignoreExact = new Set([
    "○",
    "◯",
    "△",
    "×",
    "ー",
  ]);

  if (ignoreExact.has(text)) return true;

  return false;
}

function sanitizeKeyPart(value) {
  const base = normalizeWhitespace(value)
    .replace(/[{}[\]()`"'“”‘’]/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();

  return base || "text";
}

function buildKey(text, filePath, usedKeys) {
  const fileBase = path.basename(filePath, path.extname(filePath));
  const dirBase = path.basename(path.dirname(filePath));
  const prefix = sanitizeKeyPart(`${dirBase}_${fileBase}`);
  const textPart = sanitizeKeyPart(text).slice(0, 40);
  let key = `${prefix}.${textPart}`;
  let index = 2;

  while (usedKeys.has(key)) {
    key = `${prefix}.${textPart}_${index}`;
    index += 1;
  }

  usedKeys.add(key);
  return key;
}

function extractStrings(source) {
  const results = [];

  const patterns = [
    /"((?:\\.|[^"\\])*)"/g,
    /'((?:\\.|[^'\\])*)'/g,
    /`((?:\\.|[^`\\])*)`/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const raw = match[1];
      if (!raw) continue;

      const value = raw
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");

      if (shouldIgnoreText(value)) continue;

      results.push({
        text: normalizeWhitespace(value),
        index: match.index,
      });
    }
  }

  return results;
}

function loadExistingJa() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return { translations: {}, meta: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
    const { _meta = {}, ...translations } = parsed;
    return { translations, meta: _meta };
  } catch {
    return { translations: {}, meta: {} };
  }
}

function main() {
  const filePaths = TARGET_DIRS.flatMap((dir) => walk(path.join(PROJECT_ROOT, dir)));
  const existing = loadExistingJa();

  const textToKey = new Map();
  const usedKeys = new Set(Object.keys(existing.translations));

  for (const [key, value] of Object.entries(existing.translations)) {
    if (typeof value === "string") {
      textToKey.set(value, key);
    }
  }

  const nextTranslations = { ...existing.translations };
  const nextMeta = { ...existing.meta };

  for (const filePath of filePaths) {
    const source = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(PROJECT_ROOT, filePath).replaceAll("\\", "/");
    const extracted = extractStrings(source);

    for (const item of extracted) {
      const { text } = item;

      let key = textToKey.get(text);
      if (!key) {
        key = buildKey(text, filePath, usedKeys);
        textToKey.set(text, key);
        nextTranslations[key] = text;
      }

      if (!nextMeta[key]) {
        nextMeta[key] = {
          source: text,
          files: [],
        };
      }

      if (!nextMeta[key].files.includes(relativePath)) {
        nextMeta[key].files.push(relativePath);
      }
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const sortedTranslations = Object.fromEntries(
    Object.entries(nextTranslations).sort(([a], [b]) => a.localeCompare(b))
  );

  const sortedMeta = Object.fromEntries(
    Object.entries(nextMeta)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [
        key,
        {
          source: value.source,
          files: [...value.files].sort(),
        },
      ])
  );

  const output = {
    ...sortedTranslations,
    _meta: sortedMeta,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  const count = Object.keys(sortedTranslations).length;
  console.log(`Generated ${path.relative(PROJECT_ROOT, OUTPUT_FILE)} with ${count} entries.`);
}

main();