"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] =
    useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && session) {
        setReady(true);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          mounted &&
          session &&
          (event === "PASSWORD_RECOVERY" ||
            event === "SIGNED_IN")
        ) {
          setReady(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async () => {
    if (saving) return;

    if (!password || !passwordConfirm) {
      alert("パスワードを入力してください");
      return;
    }

    if (password !== passwordConfirm) {
      alert("パスワードが一致しません");
      return;
    }

    if (password.length < 8) {
      alert("パスワードは8文字以上にしてください");
      return;
    }

    setSaving(true);

    const { error: passwordError } =
      await supabase.auth.updateUser({
        password,
      });

    if (passwordError) {
      setSaving(false);
      alert(
        "パスワード再設定に失敗しました: " +
          passwordError.message
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: employeeError } = await supabase
        .from("employees")
        .update({
          must_change_password: false,
        })
        .eq("auth_user_id", user.id);

      if (employeeError) {
        console.error(
          "初回変更状態の更新失敗:",
          employeeError
        );
      }
    }

    await supabase.auth.signOut();

    alert(
      "パスワードを再設定しました。新しいパスワードでログインしてください。"
    );

    window.location.replace("/login");
  };

  if (!ready) {
    return (
      <div
        style={{
          maxWidth: 420,
          margin: "60px auto",
          padding: 16,
        }}
      >
        <h1>パスワード再設定</h1>
        <p>
          再設定情報を確認しています。メール内のリンクから
          開いていない場合は、再設定メールを送り直してください。
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 16,
      }}
    >
      <h1>新しいパスワード</h1>

      <p style={{ fontWeight: 600, marginBottom: 8 }}>
        新しいパスワード
      </p>

      <input
        type="password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        disabled={saving}
        autoComplete="new-password"
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

      <p style={{ fontWeight: 600, marginBottom: 8 }}>
        新しいパスワード確認
      </p>

      <input
        type="password"
        value={passwordConfirm}
        onChange={(event) =>
          setPasswordConfirm(event.target.value)
        }
        disabled={saving}
        autoComplete="new-password"
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
        onClick={handleReset}
               disabled={saving}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: saving
            ? "not-allowed"
            : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving
          ? "変更中..."
          : "パスワードを再設定"}
      </button>
    </div>
  );
}