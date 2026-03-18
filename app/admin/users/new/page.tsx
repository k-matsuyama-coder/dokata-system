"use client";

import { useState } from "react";
import BackButton from "@/app/components/BackButton";

export default function NewUserPage() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");

  const handleCreate = async () => {
    if (!lastName || !firstName || !email) {
      alert("すべて入力してください");
      return;
    }

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lastName, firstName, email }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "社員作成失敗");
      return;
    }

    setCreatedPassword(result.password);
    alert("社員作成成功");
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1>社員追加</h1>

      <p>苗字</p>
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        style={inputStyle}
      />

      <p>名前</p>
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        style={inputStyle}
      />

      <p>メールアドレス</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={handleCreate}
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
        社員作成
      </button>

      {createdPassword && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <p>仮パスワード</p>
          <p style={{ fontWeight: "bold" }}>{createdPassword}</p>
          <p>このパスワードを社員に渡してください</p>
        </div>
      )}
    </div>
  );
}