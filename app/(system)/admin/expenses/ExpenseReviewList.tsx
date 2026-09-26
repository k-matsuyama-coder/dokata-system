"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Applicant = { name: string };

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
  applicant: Applicant | Applicant[] | null;
};

type Action = "approve" | "return" | "pay";

const labels = {
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

function employeeName(claim: Claim) {
  const applicant = Array.isArray(claim.applicant)
    ? claim.applicant[0]
    : claim.applicant;
  return applicant?.name || "名前未設定";
}

async function api<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
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

export default function ExpenseReviewList() {
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [page, setPage] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const [selected, setSelected] = useState<{
    claim: Claim;
    action: Action;
  } | null>(null);

  const [reason, setReason] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const [receipt, setReceipt] = useState<{
    id: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setClaims([]);
    setHasMore(false);
    setSelected(null);
    setReceipt(null);

    api<{ claims: Claim[]; hasMore: boolean }>(
      `/api/expenses/claims?scope=company&month=${encodeURIComponent(month)}&page=${page}`,
      { signal: controller.signal }
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setClaims(result.claims);
        setHasMore(result.hasMore);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error ? cause.message : "一覧を取得できません。"
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [month, page, refresh]);

  function choose(claim: Claim, action: Action) {
    setSelected({ claim, action });
    setReason("");
    setPaymentDate(today());
    setPaymentMethod("bank_transfer");
    setError("");
    setNotice("");
  }

  async function showReceipt(id: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setReceipt(null);

    try {
      const result = await api<{ url: string }>(
        `/api/expenses/receipts?claimId=${encodeURIComponent(id)}`
      );
      setReceipt({ id, url: result.url });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "領収書を取得できません。"
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function execute() {
    if (!selected || busyRef.current) return;

    if (selected.action === "return" && !reason.trim()) {
      setError("差し戻し理由を入力してください。");
      return;
    }

    if (selected.action === "pay" && !paymentDate) {
      setError("精算日を入力してください。");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api("/api/expenses/claims/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: selected.claim.id,
          updatedAt: selected.claim.updated_at,
          action: selected.action,
          reason,
          paymentDate,
          paymentMethod,
        }),
      });

      setNotice(
        selected.action === "approve"
          ? "承認しました。"
          : selected.action === "return"
            ? "差し戻しました。"
            : "精算済みとして記録しました。"
      );

      setSelected(null);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "保存できませんでした。"
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="review">
      <div className="heading">
        <h2>自社社員の申請</h2>

        <div className="buttons">
          <input
            aria-label="利用日の対象月"
            type="month"
            min="2000-01"
            max="9998-12"
            value={month}
            disabled={busy}
            onChange={(event) => {
              if (!event.target.value) return;
              setMonth(event.target.value);
              setPage(0);
              setError("");
              setNotice("");
            }}
          />
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => {
              setError("");
              setRefresh((value) => value + 1);
            }}
          >
            再読み込み
          </button>
        </div>
      </div>

      <p className="muted">経費の利用日を基準に、月別で表示します。</p>

      {notice && <p className="success" role="status">{notice}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {loading && <p role="status">読み込み中…</p>}

      {!loading && !loadError && claims.length === 0 && (
        <p className="muted">この月の申請はありません。</p>
      )}

      {claims.map((claim) => (
        <article key={claim.id}>
          <div className="heading">
            <strong>{employeeName(claim)}</strong>
            <span className={`badge ${claim.status}`}>
              {labels[claim.status]}
            </span>
          </div>

          <div className="amount">
            ¥{Number(claim.amount).toLocaleString("ja-JP")}
          </div>

          <p className="muted">
            {claim.expense_date} ／ {claim.category}
          </p>
          <p className="purpose">{claim.purpose}</p>
          {claim.site_name && <p>現場：{claim.site_name}</p>}

          {claim.status === "returned" && (
            <p className="error">
              差し戻し理由：{claim.return_reason}
            </p>
          )}

          {claim.status === "paid" && (
            <p className="success">
              精算日：{claim.payment_date} ／
              {claim.payment_method === "cash" ? "現金" : "振込"}
            </p>
          )}

          <div className="buttons">
            <button
              type="button"
              disabled={busy}
              onClick={() => void showReceipt(claim.id)}
            >
              領収書を確認
            </button>

            {claim.status === "submitted" && (
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => choose(claim, "approve")}
              >
                承認
              </button>
            )}

            {["submitted", "approved"].includes(claim.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => choose(claim, "return")}
              >
                差し戻し
              </button>
            )}

            {claim.status === "approved" && (
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => choose(claim, "pay")}
              >
                精算済みにする
              </button>
            )}
          </div>

          {receipt?.id === claim.id && (
            <p>
              <a href={receipt.url} target="_blank" rel="noopener noreferrer">
                領収書を開く（リンクは60秒間有効）
              </a>
            </p>
          )}

          {selected?.claim.id === claim.id && (
            <div className="confirmation">
              <strong>
                {employeeName(claim)} ／
                ¥{Number(claim.amount).toLocaleString("ja-JP")}
              </strong>

              {selected.action === "approve" && (
                <p>領収書と申請内容を確認し、この経費を承認します。</p>
              )}

              {selected.action === "return" && (
                <label>
                  差し戻し理由
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={reason}
                    disabled={busy}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="修正してほしい内容を入力"
                  />
                </label>
              )}

              {selected.action === "pay" && (
                <>
                  <p>
                    実際の支払いが完了した経費だけ記録してください。
                    この操作で振込は行われません。
                  </p>

                  <label>
                    精算日
                    <input
                      type="date"
                      value={paymentDate}
                      disabled={busy}
                      onChange={(event) => setPaymentDate(event.target.value)}
                    />
                  </label>

                  <label>
                    支払方法
                    <select
                      value={paymentMethod}
                      disabled={busy}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                      <option value="bank_transfer">振込</option>
                      <option value="cash">現金</option>
                    </select>
                  </label>

                  <p className="muted">
                    精算済みにすると、この申請は変更できなくなります。
                  </p>
                </>
              )}

              <div className="buttons">
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() => void execute()}
                >
                  {busy
                    ? "処理中…"
                    : selected.action === "approve"
                      ? "承認を確定"
                      : selected.action === "return"
                        ? "差し戻しを確定"
                        : "支払い完了を記録"}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setSelected(null)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </article>
      ))}

      <div className="pagination">
        <button
          type="button"
          disabled={page === 0 || busy || loading}
          onClick={() => setPage((value) => value - 1)}
        >
          前へ
        </button>
        <span>{page + 1}ページ</span>
        <button
          type="button"
          disabled={!hasMore || busy || loading}
          onClick={() => setPage((value) => value + 1)}
        >
          次へ
        </button>
      </div>

      <style jsx>{`
        .review { margin-top: 24px; padding: 22px; background: white; border: 1px solid #e2e8f0; border-radius: 14px; color: #1e293b; }
        h2 { font-size: 18px; font-weight: 700; margin: 0; }
        .heading, .buttons { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .heading { justify-content: space-between; }
        article { border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 20px; overflow-wrap: anywhere; }
        .amount { font-size: 24px; font-weight: 800; margin-top: 10px; }
        .muted { color: #64748b; font-size: 13px; line-height: 1.7; }
        .purpose { white-space: pre-wrap; }
        button { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; color: #334155; cursor: pointer; }
        button:disabled { opacity: 0.5; cursor: default; }
        .primary { background: #4f46e5; border-color: #4f46e5; color: white; }
        input, textarea, select { max-width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; color: #1e293b; font-size: 16px; }
        label { display: block; margin: 16px 0; font-size: 14px; }
        label input, label textarea, label select { display: block; width: 100%; margin-top: 6px; }
        .confirmation { margin-top: 16px; padding: 16px; border: 1px solid #c7d2fe; background: #f8faff; border-radius: 10px; line-height: 1.7; }
        .badge { padding: 5px 10px; border-radius: 20px; background: #f1f5f9; font-size: 12px; }
        .approved { background: #eef2ff; color: #4338ca; }
        .paid, .success { background: #ecfdf5; color: #047857; }
        .returned, .error { background: #fef2f2; color: #b91c1c; }
        .error, .success { padding: 12px; border-radius: 8px; line-height: 1.7; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 24px; }
        a { color: #4f46e5; text-decoration: underline; }
        @media (max-width: 540px) {
          .review { padding: 16px; }
        }
      `}</style>
    </section>
  );
}