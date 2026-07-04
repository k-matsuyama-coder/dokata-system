"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      alert("ログイン失敗: " + error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setIsLoading(false);
      alert("ユーザー情報が取得できません");
      return;
    }

    const [superAdminResult, employeeResult] = await Promise.all([
      supabase
        .from("super_admin_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      supabase
        .from("employees")
        .select("id, role, must_change_password, organization_id")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
    ]);

    const superAdminUser = superAdminResult.data;
    const employee = employeeResult.data;

    if (superAdminUser && employee) {
      router.replace("/login/select-mode");
      return;
    }

    if (superAdminUser && !employee) {
      router.replace("/super-admin");
      return;
    }

    if (!employee) {
      await supabase.auth.signOut();
      setIsLoading(false);
      alert("社員情報がありません。管理者に確認してください。");
      return;
    }

    if (employee.must_change_password) {
      router.replace("/change-password");
      return;
    }

    router.replace("/home");
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 16 }}>
      <h1>ログイン</h1>

      <p>メールアドレス</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
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
        disabled={isLoading}
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
        disabled={isLoading}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? "ログイン中..." : "ログイン"}
      </button>
    </div>
  );
}