"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";

type Claim = {
  id: string;
  expense_date: string;
  amount: number;
  category: string;
  purpose: string;
  site_name: string | null;
  updated_at: string;
};

type Props = {
  claim: Claim;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
  preparePhoto: (file: File) => Promise<Blob>;
  onDone: (month: string) => void;
  onRefresh: () => void;
};

export default function ExpenseResubmitForm({
  claim,
  request,
  preparePhoto,
  onDone,
  onRefresh,
}: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(claim.expense_date);
  const [amount, setAmount] = useState(String(claim.amount));
  const [category, setCategory] = useState(claim.category);
  const [purpose, setPurpose] = useState(claim.purpose);
  const [siteName, setSiteName] = useState(claim.site_name ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [version, setVersion] = useState(claim.updated_at);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoSaved, setPhotoSaved] = useState(false);

  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;

    const numericAmount = Number(amount);

    if (
      !date ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0 ||
      !category.trim() ||
      !purpose.trim()
    ) {
      setError("利用日・金額・経費の種類・用途を入力してください。");
      return;
    }

    busyRef.current = true;
    setSaving(true);
    setError("");

    try {
      let latestVersion = version;

      if (photo) {
        const converted = await preparePhoto(photo);

        const form = new FormData();
        form.set("claimId", claim.id);
        form.set("updatedAt", latestVersion);
        form.set("file", converted, "receipt.jpg");

        const result = await request<{
          ok: boolean;
          updatedAt: string;
        }>("/api/expenses/receipts", {
          method: "POST",
          body: form,
        });

        latestVersion = result.updatedAt;
        setVersion(latestVersion);
        setPhotoSaved(true);
        setPhoto(null);

        if (fileRef.current) fileRef.current.value = "";
      }

      await request("/api/expenses/claims/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: claim.id,
          updatedAt: latestVersion,
          expenseDate: date,
          amount: numericAmount,
          category,
          purpose,
          siteName,
        }),
      });

      onDone(date.slice(0, 7));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "再申請に失敗しました。"
      );
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          margin: "12px 0",
          padding: "10px 16px",
          border: "none",
          borderRadius: 8,
          background: "#4f46e5",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        修正して再申請
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="resubmit">
      <h3>申請内容の修正</h3>

      {error && <p className="error" role="alert">{error}</p>}

      {photoSaved && (
        <p className="muted">
          領収書の差し替えは保存済みです。
          内容を確認して再申請してください。
        </p>
      )}

      <fieldset disabled={saving}>
        <div className="grid">
          <label>
            利用日
            <input
              type="date"
              required
              min="2000-01-01"
              max="9998-12-31"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label>
            金額（円）
            <input
              type="number"
              required
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        </div>

        <label>
          経費の種類
          <input
            required
            maxLength={50}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </label>

        <label>
          用途
          <textarea
            required
            rows={3}
            maxLength={1000}
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

        <label>
          領収書の差し替え（変更する場合のみ）
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(event) =>
              setPhoto(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <p className="muted">
          写真を選ばなければ、現在の領収書をそのまま使用します。
        </p>

        <div className="buttons">
          <button type="submit" className="primary">
            {saving ? "送信中…" : "修正内容で再申請"}
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRefresh();
            }}
          >
            閉じて一覧を更新
          </button>
        </div>
      </fieldset>

      <style jsx>{`
        .resubmit {
          margin: 16px 0;
          padding: 16px;
          border: 1px solid #c7d2fe;
          border-radius: 10px;
          background: #f8faff;
        }
        h3 { margin: 0 0 16px; font-size: 16px; font-weight: 700; }
        fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
        label { display: block; margin-bottom: 14px; font-size: 14px; }
        input, textarea {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #1e293b;
          font-size: 16px;
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .buttons { display: flex; flex-wrap: wrap; gap: 10px; }
        button {
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #334155;
          cursor: pointer;
        }
        .primary { background: #4f46e5; border-color: #4f46e5; color: white; }
        fieldset:disabled { opacity: 0.6; }
        .muted { font-size: 13px; color: #64748b; line-height: 1.7; }
        .error {
          padding: 12px;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 8px;
          overflow-wrap: anywhere;
        }
        @media (max-width: 540px) {
          .grid { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>
    </form>
  );
}