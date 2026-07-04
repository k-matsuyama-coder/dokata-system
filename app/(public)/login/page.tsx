"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    console.log("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "SUPABASE_KEY_PREFIX",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("login error full", error);
      alert("ログイン失敗: " + error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      alert("ユーザー情報が取得できません");
      return;
    }

    const { data: superAdminUser } = await supabase
      .from("super_admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const { data: employee } = await supabase
      .from("employees")
      .select("id, role, must_change_password, organization_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (superAdminUser && employee) {
      window.location.href = "/login/select-mode";
      return;
    }

    if (superAdminUser && !employee) {
      window.location.href = "/super-admin";
      return;
    }

    if (!employee) {
      alert("社員情報がありません。管理者に確認してください。");
      await supabase.auth.signOut();
      return;
    }

    if (employee.must_change_password) {
      window.location.href = "/change-password";
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
        type="button"
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