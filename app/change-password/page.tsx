"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleChangePassword = async () => {
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

    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      alert("パスワード変更失敗: " + passwordError.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログイン情報がありません");
      return;
    }

    const { error: employeeError } = await supabase
      .from("employees")
      .update({
        must_change_password: false,
      })
      .eq("auth_user_id", user.id);

    if (employeeError) {
      alert("社員情報更新失敗: " + employeeError.message);
      return;
    }

    alert("パスワードを変更しました");
    window.location.href = "/home";
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1>パスワード変更</h1>

      <p>新しいパスワード</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />

      <p>新しいパスワード確認</p>
      <input
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleChangePassword}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
        }}
      >
        パスワードを変更
      </button>
    </div>
  );
}