"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

export default function PasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert("すべて入力してください");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("確認用パスワードが一致しません");
      return;
    }

    if (newPassword.length < 8) {
      alert("パスワードは8文字以上にしてください");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      alert("パスワード変更失敗: " + error.message);
      return;
    }

    alert("パスワードを変更しました");
    window.location.href = "/profile";

    const { data: userData } = await supabase.auth.getUser();
const user = userData.user;

if (user) {
  await supabase
    .from("employees")
    .update({ must_change_password: false })
    .eq("auth_user_id", user.id);
}
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
    boxSizing: "border-box" as const,
    border: "1px solid #ccc",
    borderRadius: 8,
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1>パスワード変更</h1>

      <p>新しいパスワード</p>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={inputStyle}
      />

      <p>新しいパスワード（確認）</p>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={handleUpdatePassword}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "変更中..." : "パスワードを変更する"}
      </button>
    </div>
  );
}