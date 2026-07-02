#!/usr/bin/env node
// /scripts/clean-ja.mjs
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INPUT_FILE = path.join(PROJECT_ROOT, "locales", "ja.json");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "locales", "ja.cleaned.json");

const EXCLUDE_KEY_PREFIXES = [
  "certifications_page.",
  "two-month_constants.",
];

const EXCLUDE_EXACT_KEYS = new Set([
  "reports_page.佐藤",
  "reports_page.山田太郎",
  "reports_page.東京現場",
  "reports_page.田中鈴木",
]);

const EXCLUDE_VALUE_PATTERNS = [
  /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2,4}$/u,
  /^.+現場$/u,
  /^.+建設.+土木.+工業$/u,
];

const KEEP_KEY_PATTERNS = [
  /失敗/,
  /成功/,
  /保存/,
  /削除/,
  /更新/,
  /登録/,
  /取得/,
  /入力/,
  /確認/,
  /選択/,
  /表示/,
  /管理/,
  /通知/,
  /ログイン/,
  /パスワード/,
  /日報/,
  /番割/,
  /会社/,
  /社員/,
  /元請/,
  /現場/,
  /車両/,
  /物品/,
  /資格/,
  /免許/,
  /戻る/,
  /今日/,
  /前日/,
  /翌日/,
  /今週/,
  /前週/,
  /翌週/,
];

function shouldExcludeByPrefix(key) {
  return EXCLUDE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function shouldExcludeByExactKey(key) {
  return EXCLUDE_EXACT_KEYS.has(key);
}

function shouldExcludeByValue(value) {
  if (typeof value !== "string") return true;

  if (value.trim() === "") return true;

  if (EXCLUDE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    return true;
  }

  return false;
}

function shouldKeepByKey(key) {
  return KEEP_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function shouldKeepByValue(value) {
  return KEEP_KEY_PATTERNS.some((pattern) => pattern.test(value));
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error("locales/ja.json が見つかりません");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const { _meta = {}, ...translations } = raw;

  const cleaned = {};
  const cleanedMeta = {};

  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== "string") continue;
    if (shouldExcludeByPrefix(key)) continue;
    if (shouldExcludeByExactKey(key)) continue;

    const keepBecauseImportant = shouldKeepByKey(key) || shouldKeepByValue(value);

    if (!keepBecauseImportant && shouldExcludeByValue(value)) {
      continue;
    }

    cleaned[key] = value;

    if (_meta[key]) {
      cleanedMeta[key] = _meta[key];
    }
  }

  const sortedCleaned = Object.fromEntries(
    Object.entries(cleaned).sort(([a], [b]) => a.localeCompare(b))
  );

  const sortedMeta = Object.fromEntries(
    Object.entries(cleanedMeta).sort(([a], [b]) => a.localeCompare(b))
  );

  const output = {
    ...sortedCleaned,
    _meta: sortedMeta,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Generated locales/ja.cleaned.json with ${Object.keys(sortedCleaned).length} entries.`);
}

main();