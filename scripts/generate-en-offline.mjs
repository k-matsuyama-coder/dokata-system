#!/usr/bin/env node
// /scripts/generate-en-offline.mjs
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INPUT_FILE = path.join(PROJECT_ROOT, "locales", "ja.cleaned.json");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "locales", "en.json");

const EXACT_TRANSLATIONS = {
  "戻る": "Back",
  "保存": "Save",
  "保存中...": "Saving...",
  "保存しました": "Saved",
  "保存成功": "Saved successfully",
  "保存失敗:": "Save failed:",
  "削除": "Delete",
  "削除失敗:": "Delete failed:",
  "更新": "Update",
  "更新成功": "Updated successfully",
  "更新失敗": "Update failed",
  "更新失敗:": "Update failed:",
  "登録": "Register",
  "登録失敗:": "Registration failed:",
  "取得失敗": "Fetch failed",
  "取得失敗:": "Fetch failed:",
  "追加失敗:": "Add failed:",
  "ログインしてください": "Please log in",
  "ログイン失敗:": "Login failed:",
  "ログイン情報なし": "No login information",
  "ログイン情報がありません": "No login information",
  "ログイン情報が取得できません": "Could not get login information",
  "会社情報が取得できません": "Could not load organization information",
  "会社情報の取得に失敗しました": "Failed to load organization information",
  "会社情報の取得に失敗しました:": "Failed to load organization information:",
  "管理者のみ閲覧できます": "Only administrators can view this page",
  "送信失敗": "Send failed",
  "送信中...": "Sending...",
  "通知": "Notify",
  "通知保存失敗:": "Failed to save notification:",
  "プッシュ通知失敗:": "Push notification failed:",
  "端末未登録": "No registered device",
  "必要な情報が不足しています": "Required information is missing",
  "今日": "Today",
  "前日": "Previous day",
  "翌日": "Next day",
  "今週": "This week",
  "前週": "Previous week",
  "翌週": "Next week",
  "前月": "Previous month",
  "翌月": "Next month",
  "日報送付確認": "Daily Report Submission Status",
  "日報確認依頼": "Daily Report Reminder",
  "未送付": "Not Submitted",
  "送付済み": "Submitted",
  "未送付のみ表示": "Show unsubmitted only",
  "この日のこの現場に職長が設定されていません": "No foreman is assigned for this site on this date",
  "日報取得失敗:": "Failed to load daily reports:",
  "番割メンバー取得失敗:": "Failed to load assignment members:",
  "日報": "Daily Report",
  "番割": "Assignments",
  "現場": "Site",
  "現場名": "Site Name",
  "元請": "Contractor",
  "担当者": "Manager",
  "連絡先": "Contact",
  "住所": "Address",
  "詳細": "Details",
  "名前": "Name",
  "メールアドレス": "Email Address",
  "会社名": "Company Name",
  "社員一覧": "Employee List",
  "車両管理": "Vehicle Management",
  "物品管理": "Item Management",
  "資格名で検索": "Search by certification name",
  "日付": "Date",
  "備考": "Notes",
  "作業内容": "Work Details",
  "開始": "Start",
  "終了": "End",
  "人工": "Workers",
  "車両": "Vehicle",
  "メンバー": "Members",
  "日勤": "Day Shift",
  "夜勤": "Night Shift",
  "未設定": "Not Set",
  "不明": "Unknown",
  "完了": "Completed",
  "未完了": "Incomplete",
};

const PARTIAL_TRANSLATIONS = [
  ["失敗:", " failed:"],
  ["失敗", " failed"],
  ["成功", " succeeded"],
  ["保存", "Save"],
  ["削除", "Delete"],
  ["更新", "Update"],
  ["登録", "Register"],
  ["取得", "Load"],
  ["入力してください", "Please enter"],
  ["選択してください", "Please select"],
  ["確認してください", "Please check"],
  ["会社情報", "organization information"],
  ["社員情報", "employee information"],
  ["現場", "site"],
  ["元請", "contractor"],
  ["担当者", "manager"],
  ["連絡先", "contact"],
  ["住所", "address"],
  ["車両", "vehicle"],
  ["物品", "item"],
  ["資格", "certification"],
  ["免許", "license"],
  ["通知", "notification"],
  ["日報", "daily report"],
  ["番割", "assignment"],
  ["管理", "management"],
  ["追加", "add"],
  ["並び替え", "sort order"],
  ["アップロード", "upload"],
  ["ファイル", "file"],
  ["メンバー", "member"],
  ["職長", "foreman"],
  ["対象会社", "target organization"],
  ["未選択", "not selected"],
  ["会社", "organization"],
  ["社員", "employee"],
  ["名前", "name"],
  ["メールアドレス", "email address"],
  ["パスワード", "password"],
  ["権限", "role"],
  ["今日", "today"],
  ["前日", "previous day"],
  ["翌日", "next day"],
];

function translateText(text) {
  if (typeof text !== "string" || text.trim() === "") return text;

  if (EXACT_TRANSLATIONS[text]) {
    return EXACT_TRANSLATIONS[text];
  }

  let result = text;

  for (const [ja, en] of PARTIAL_TRANSLATIONS) {
    result = result.split(ja).join(en);
  }

  return result;
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error("locales/ja.cleaned.json が見つかりません");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const { _meta = {}, ...translations } = raw;

  const result = {};

  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== "string") continue;
    result[key] = translateText(value);
  }

  const output = {
    ...Object.fromEntries(
      Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
    ),
    _meta,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Generated locales/en.json with ${Object.keys(result).length} entries.`);
}

main();