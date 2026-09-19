"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (sending) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      alert("メールアドレスを入力してください");
      return;
    }

    setSending(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

    setSending(false);

    if (error) {
      alert(
        "再設定メールの送信に失敗しました: " +
          error.message
      );
      return;
    }

    // アカウントの存在有無を画面から判別させない
    setSent(true);
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 16,
      }}
    >
      <h1>パスワード再設定</h1>

      {sent ? (
        <>
          <p>
            入力されたメールアドレスが登録されている場合、
            パスワード再設定メールを送信しました。
          </p>

          <Link href="/login">
            ログイン画面へ戻る
          </Link>
        </>
      ) : (
        <>
          <p style={{ color: "#666", marginBottom: 24 }}>
            登録済みのメールアドレスを入力してください。
          </p>

          <p style={{ fontWeight: 600, marginBottom: 8 }}>
            メールアドレス
          </p>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            disabled={sending}
            autoComplete="email"
            style={{
              width: "100%",
              padding: 12,
              fontSize: 16,
              boxSizing: "border-box",
              marginBottom: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 16,
              backgroundColor: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: sending
                ? "not-allowed"
                : "pointer",
              opacity: sending ? 0.7 : 1,
              marginBottom: 20,
            }}
          >
            {sending
              ? "送信中..."
              : "再設定メールを送信"}
          </button>

          <Link href="/login">
            ログイン画面へ戻る
          </Link>
        </>
      )}
    </div>
  );
}