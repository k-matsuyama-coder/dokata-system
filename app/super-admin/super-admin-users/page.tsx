"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SuperAdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string | null;
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/super-admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Super Admin一覧取得に失敗しました");
      setLoading(false);
      return;
    }

    setUsers(result ?? []);
    setLoading(false);
  };

  const createUser = async () => {
    if (!name || !email) {
      alert("名前とメールアドレスを入力してください");
      return;
    }

    setCreating(true);
    setCreatedPassword("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      setCreating(false);
      return;
    }

    const res = await fetch("/api/super-admin/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
      }),
    });

    const result = await res.json();

    setCreating(false);

    if (!res.ok) {
      alert(result.error || "Super Admin作成に失敗しました");
      return;
    }

    setCreatedPassword(result.password);
    setName("");
    setEmail("");
    fetchUsers();
    alert("Super Adminを作成しました");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1>Super Adminアカウント管理</h1>

      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>新規Super Admin追加</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="名前"
          style={inputStyle}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          style={inputStyle}
        />

        <button
          type="button"
          onClick={createUser}
          disabled={creating}
          style={{
            border: "none",
            borderRadius: 8,
            padding: 14,
            backgroundColor: creating ? "#999" : "#111",
            color: "#fff",
            fontWeight: 900,
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "作成中..." : "Super Adminを作成"}
        </button>

        {createdPassword && (
          <div
            style={{
              border: "1px solid #facc15",
              backgroundColor: "#fef9c3",
              borderRadius: 8,
              padding: 12,
              fontWeight: 800,
            }}
          >
            <div>初期パスワード</div>
            <div style={{ fontSize: 22, marginTop: 6 }}>{createdPassword}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              このパスワードを新しいSuper Adminに伝えてください。
            </div>
          </div>
        )}
      </div>

      <h2>Super Admin一覧</h2>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 900 }}>{user.name ?? "名前未設定"}</div>
              <div style={{ color: "#555" }}>{user.email ?? "-"}</div>
              <div style={{ fontSize: 13, color: "#777" }}>
                作成日：{user.created_at ? user.created_at.slice(0, 10) : "-"}
              </div>
            </div>
          ))}

          {users.length === 0 && <p>Super Adminが登録されていません</p>}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box" as const,
};