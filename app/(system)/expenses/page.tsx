"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import BackButton from "@/app/components/BackButton";
import { supabase } from "@/lib/supabase";
import ExpenseResubmitForm from "./ExpenseResubmitForm";

type Claim = {
  id: string;
  expense_date: string;
  amount: number;
  category: string;
  purpose: string;
  site_name: string | null;
  status: "submitted" | "returned" | "approved" | "paid";
  return_reason: string | null;
  payment_date: string | null;
  payment_method: string | null;
  updated_at: string;
};

type Settings = {
  needsSetup: boolean;
  companyName: string;
};

const statusLabels = {
  submitted: "申請中",
  returned: "差し戻し",
  approved: "承認済み",
  paid: "精算済み",
};

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("ログインし直してください。");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "処理に失敗しました。");
  }

  return result as T;
}

// スマホの写真を縮小してJPEGに変換
async function preparePhoto(file: File): Promise<Blob> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("写真が大きすぎます。25MB以下の写真を選んでください。");
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            "写真を読み込めません。JPEG・PNG形式の写真を選んでください。"
          )
        );
      image.src = url;
    });

    const scale = Math.min(
      1,
      1800 / Math.max(image.naturalWidth, image.naturalHeight)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("写真を変換できませんでした。");

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("写真を変換できませんでした。")),
        "image/jpeg",
        0.85
      );
    });

    if (blob.size > 3 * 1024 * 1024) {
      throw new Error("写真を小さくできませんでした。別の写真を選んでください。");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ExpensesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [checking, setChecking] = useState(true);
  const [accessError, setAccessError] = useState("");

  const [expenseDate, setExpenseDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("交通費");
  const [purpose, setPurpose] = useState("");
  const [siteName, setSiteName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");

  const sendingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);
  const savedClaimIdRef = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [page, setPage] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [receipt, setReceipt] = useState<{ id: string; url: string } | null>(
    null
  );
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api<Settings>("/api/expenses/settings", {
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;

        if (result.needsSetup) {
          setAccessError("管理者が経費精算の利用開始設定を行ってください。");
        } else {
          setSettings(result);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setAccessError(
            error instanceof Error ? error.message : "利用権限を確認できません。"
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!settings || !month) return;

    const controller = new AbortController();
    setLoading(true);
    setListError("");
    setClaims([]);
    setHasMore(false);
    setReceipt(null);

    api<{ claims: Claim[]; hasMore: boolean }>(
      `/api/expenses/claims?scope=mine&month=${encodeURIComponent(month)}&page=${page}`,
      { signal: controller.signal }
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setClaims(result.claims);
        setHasMore(result.hasMore);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setListError(
            error instanceof Error ? error.message : "一覧を取得できません。"
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [settings, month, page, refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;

    setSubmitError("");
    setNotice("");

    const numericAmount = Number(amount);

    if (
      !expenseDate ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0 ||
      !purpose.trim()
    ) {
      setSubmitError("利用日・1円以上の金額・用途を入力してください。");
      return;
    }

    if (!photo) {
      setSubmitError("領収書写真を選択してください。");
      return;
    }

    sendingRef.current = true;
    setSaving(true);

    try {
      // 変換に失敗した場合は、申請を登録しない
      const preparedPhoto = await preparePhoto(photo);

      setLocked(true);
      requestIdRef.current ??= crypto.randomUUID();

      if (!savedClaimIdRef.current) {
        const result = await api<{ claim: Claim }>("/api/expenses/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: requestIdRef.current,
            expenseDate,
            amount: numericAmount,
            category,
            purpose,
            siteName,
          }),
        });

        savedClaimIdRef.current = result.claim.id;
      }

      const form = new FormData();
      form.set("claimId", savedClaimIdRef.current);
      form.set("file", preparedPhoto, "receipt.jpg");

      await api<{ ok: boolean }>("/api/expenses/receipts", {
        method: "POST",
        body: form,
      });

      requestIdRef.current = null;
      savedClaimIdRef.current = null;
      setLocked(false);
      setAmount("");
      setPurpose("");
      setSiteName("");
      setPhoto(null);

      if (photoInputRef.current) photoInputRef.current.value = "";

      setMonth(expenseDate.slice(0, 7));
      setPage(0);
      setRefresh((value) => value + 1);
      setNotice("領収書を添付して申請しました。");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "申請に失敗しました。"
      );
    } finally {
      sendingRef.current = false;
      setSaving(false);
    }
  }

  async function openReceipt(id: string) {
    if (openingId) return;
    setOpeningId(id);
    setListError("");
    setReceipt(null);

    try {
      const result = await api<{ url: string }>(
        `/api/expenses/receipts?claimId=${encodeURIComponent(id)}`
      );
      setReceipt({ id, url: result.url });
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "領収書を開けません。"
      );
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <main className="expenses">
      <BackButton />
      <h1>経費申請</h1>

      {checking && <p role="status">読み込み中…</p>}
      {accessError && <p className="error" role="alert">{accessError}</p>}

      {settings && (
        <>
          <p className="muted">{settings.companyName} ／ 給与とは別に精算</p>

          <section>
            <h2>新しい申請</h2>

            {notice && <p className="success" role="status">{notice}</p>}
            {submitError && (
              <p className="error" role="alert">{submitError}</p>
            )}

            {locked && !saving && (
              <p className="muted">
                送信が完了していません。画面を閉じずに「送信を再試行」を押してください。
                同じ申請として再送します。
              </p>
            )}

            <form onSubmit={submit}>
              <fieldset disabled={saving || locked}>
                <div className="grid">
                  <label>
                    利用日
                    <input
                      type="date"
                      required
                      min="2000-01-01"
                      max="9998-12-31"
                      value={expenseDate}
                      onChange={(event) => setExpenseDate(event.target.value)}
                    />
                  </label>

                  <label>
                    金額（円）
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  経費の種類
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {["交通費", "駐車場代", "燃料費", "資材・消耗品", "宿泊費", "その他"]
                      .map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  用途
                  <textarea
                    required
                    maxLength={1000}
                    rows={3}
                    placeholder="例：○○現場へ移動した際の高速道路料金"
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                  />
                </label>

                <label>
                  現場名（任意）
                  <input
                    maxLength={200}
                    value={siteName}
                    onChange={(event) => setSiteName(event.target.value)}
                  />
                </label>
              </fieldset>

              <label>
                領収書写真
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  disabled={saving}
                  onChange={(event) =>
                    setPhoto(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              <p className="muted">
                写真は1枚添付できます。送信時にサイズを調整します。
              </p>

              <button className="primary" type="submit" disabled={saving}>
                {saving ? "送信中…" : locked ? "送信を再試行" : "申請する"}
              </button>
            </form>
          </section>

          <section>
            <div className="heading">
              <h2>自分の申請</h2>
              <input
                aria-label="一覧の対象月"
                type="month"
                min="2000-01"
                max="9998-12"
                value={month}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setMonth(event.target.value);
                  setPage(0);
                }}
              />
            </div>

            {listError && <p className="error" role="alert">{listError}</p>}
            {loading && <p role="status">読み込み中…</p>}

            {!loading && !listError && claims.length === 0 && (
              <p className="muted">この月の申請はありません。</p>
            )}

            {claims.map((claim) => (
              <article key={claim.id}>
                <div className="heading">
                  <strong>¥{Number(claim.amount).toLocaleString("ja-JP")}</strong>
                  <span className={`badge ${claim.status}`}>
                    {statusLabels[claim.status]}
                  </span>
                </div>

                <p className="muted">
                  {claim.expense_date} ／ {claim.category}
                </p>
                <p className="purpose">{claim.purpose}</p>
                {claim.site_name && <p>現場：{claim.site_name}</p>}

                {claim.status === "returned" && (
                  <>
                    <p className="error">
                      差し戻し理由：{claim.return_reason}
                    </p>

                    <ExpenseResubmitForm
                      key={`${claim.id}:${claim.updated_at}`}
                      claim={claim}
                      request={api}
                      preparePhoto={preparePhoto}
                      onDone={(targetMonth) => {
                        setNotice("修正内容で再申請しました。");
                        setMonth(targetMonth);
                        setPage(0);
                        setReceipt(null);
                        setRefresh((value) => value + 1);
                      }}
                      onRefresh={() => {
                        setReceipt(null);
                        setRefresh((value) => value + 1);
                      }}
                    />
                  </>
                )}

                {claim.status === "paid" && (
                  <p className="success">
                    精算日：{claim.payment_date} ／
                    {claim.payment_method === "cash" ? "現金" : "振込"}
                  </p>
                )}

                <button
                  type="button"
                  disabled={openingId !== null}
                  onClick={() => void openReceipt(claim.id)}
                >
                  {openingId === claim.id ? "確認中…" : "領収書を確認"}
                </button>

                {receipt?.id === claim.id && (
                  <p>
                    <a href={receipt.url} target="_blank" rel="noopener noreferrer">
                      領収書を開く（リンクは60秒間有効）
                    </a>
                  </p>
                )}
              </article>
            ))}

            <div className="pagination">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((value) => value - 1)}
              >
                前へ
              </button>
              <span>{page + 1}ページ</span>
              <button
                type="button"
                disabled={!hasMore || loading}
                onClick={() => setPage((value) => value + 1)}
              >
                次へ
              </button>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .expenses { max-width: 820px; margin: auto; padding: 24px 16px; color: #1e293b; }
        h1 { font-size: 24px; font-weight: 800; margin: 24px 0 8px; }
        h2 { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
        section { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin-top: 22px; }
        fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
        label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
        input, select, textarea { display: block; width: 100%; box-sizing: border-box; padding: 11px; margin-top: 7px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; background: white; color: #1e293b; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        button { padding: 10px 16px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; color: #334155; cursor: pointer; }
        button:disabled { opacity: 0.5; cursor: default; }
        .primary { background: #4f46e5; border-color: #4f46e5; color: white; font-weight: 700; }
        .muted { color: #64748b; font-size: 13px; line-height: 1.7; }
        .error, .success { padding: 12px; border-radius: 8px; line-height: 1.7; overflow-wrap: anywhere; }
        .error { background: #fef2f2; color: #b91c1c; }
        .success { background: #ecfdf5; color: #047857; }
        article { padding: 18px 0; border-bottom: 1px solid #e2e8f0; overflow-wrap: anywhere; }
        .heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .heading input { width: auto; margin: 0; }
        .heading strong { font-size: 20px; }
        .purpose { white-space: pre-wrap; }
        .badge { padding: 5px 10px; border-radius: 20px; background: #f1f5f9; font-size: 12px; }
        .approved { background: #eef2ff; color: #4338ca; }
        .paid { background: #ecfdf5; color: #047857; }
        .returned { background: #fef2f2; color: #b91c1c; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; }
        a { color: #4f46e5; text-decoration: underline; }
        @media (max-width: 540px) {
          section { padding: 16px; }
          .grid { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>
    </main>
  );
}