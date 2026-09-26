"use client";

import { useEffect, useRef, useState } from "react";
import BackButton from "@/app/components/BackButton";
import { supabase } from "@/lib/supabase";
import ExpenseReviewList from "./ExpenseReviewList";

type ExpenseSettings = {
  needsSetup: boolean;
  isAdmin: boolean;
  companyName: string;
};

async function requestSettings(
  method: "GET" | "POST",
  signal?: AbortSignal
): Promise<ExpenseSettings> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("ログインし直してください。");
  }

  const response = await fetch("/api/expenses/settings", {
    method,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
    },
    cache: "no-store",
    signal,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "設定を取得できませんでした。");
  }

  if (!result.isAdmin) {
    throw new Error("この画面は管理者のみ利用できます。");
  }

  return result;
}

export default function ExpenseAdminPage() {
  const [settings, setSettings] = useState<ExpenseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const result = await requestSettings("GET", controller.signal);

        if (!controller.signal.aborted) {
          setSettings(result);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "読み込みに失敗しました。"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  async function startUsing() {
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setError("");

    try {
      const result = await requestSettings("POST");
      setSettings(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "設定の保存に失敗しました。"
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      <BackButton />

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "24px 0 8px" }}>
        経費精算
      </h1>

      <p style={{ color: "#64748b", marginBottom: 24 }}>
        自社社員の立替経費を、給与とは別に精算します。
      </p>

      {loading && <p role="status">読み込み中…</p>}

      {error && (
        <div
          role="alert"
          style={{
            padding: 16,
            marginBottom: 16,
            borderRadius: 10,
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {!loading && settings && (
        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 20px" }}>
            {settings.needsSetup ? "利用する会社の確認" : "会社設定"}
          </h2>

          <div style={{ color: "#64748b", fontSize: 13 }}>対象の会社</div>

          <div
            style={{
              fontSize: 21,
              fontWeight: 800,
              margin: "8px 0 20px",
              overflowWrap: "anywhere",
            }}
          >
            {settings.companyName}
          </div>

          {settings.needsSetup ? (
            <>
              <p style={{ lineHeight: 1.8, color: "#475569" }}>
                この会社に所属する社員のみ経費申請を利用できます。
                <br />
                表示された会社名が自社であることを確認してください。
              </p>

              <button
                type="button"
                disabled={saving}
                onClick={() => void startUsing()}
                style={{
                  marginTop: 16,
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: 9,
                  background: "#4f46e5",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "保存中…" : "この会社で利用開始"}
              </button>
            </>
          ) : (
            <div
              role="status"
              style={{
                padding: 16,
                borderRadius: 10,
                background: "#ecfdf5",
                color: "#047857",
                lineHeight: 1.8,
              }}
            >
                            自社の設定が完了しています。
              <br />
              下の一覧から申請を確認・承認・精算できます。
            </div>
          )}
                </section>
      )}

      {!loading && settings && !settings.needsSetup && (
        <ExpenseReviewList />
      )}
    </main>
  );
}