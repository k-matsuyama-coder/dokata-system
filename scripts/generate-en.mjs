#!/usr/bin/env node
// /scripts/generate-en.mjs
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INPUT_FILE = path.join(PROJECT_ROOT, "locales", "ja.cleaned.json");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "locales", "en.json");

async function translateText(text) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a professional software UI translator. Translate Japanese UI text into natural English for a construction management web app. Preserve placeholders like ${name}, punctuation, symbols, and line breaks. Return only the translated text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? text;
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error("locales/ja.cleaned.json が見つかりません");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY が設定されていません");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const { _meta = {}, ...translations } = raw;

  const result = {};
  const entries = Object.entries(translations);

  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;

    try {
      const translated = await translateText(value);
      result[key] = translated;
      console.log(`OK: ${key}`);
    } catch (error) {
      console.error(`NG: ${key}`, error);
      result[key] = value;
    }
  }

  const output = {
    ...Object.fromEntries(
      Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
    ),
    _meta,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log("Generated locales/en.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});