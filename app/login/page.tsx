"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ログイン失敗: " + error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      alert("ユーザー情報が取得できません");
      return;
    }

    const { data: employee } = await supabase
  .from("employees")
  .select("id, role, must_change_password")
  .eq("auth_user_id", user.id)
  .maybeSingle();

    if (!employee) {
      const defaultName =
        user.email?.split("@")[0] || "未登録";

      const { error: insertError } = await supabase
        .from("employees")
        .insert([
          {
            name: defaultName,
            role: "worker",
            auth_user_id: user.id,
          },
        ]);

      if (insertError) {
        alert("社員自動登録失敗: " + insertError.message);
        return;
      }

      if (employee?.must_change_password) {
        window.location.href = "/profile/password";
        return;
      }

      window.location.href = "/home";
      return;
    }

    window.location.href = "/home";
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 16 }}>
      <h1>ログイン</h1>

      <p>メールアドレス</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
          marginBottom: 12,
        }}
      />

      <p>パスワード</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
          marginBottom: 16,
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        ログイン
      </button>
    </div>
  );
}