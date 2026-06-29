"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ImpersonationState = {
  active: boolean;
  organizationId: string | null;
  organizationName: string | null;
  expiresAt?: string | null;
};

export default function Header() {
  const [impersonation, setImpersonation] = useState<ImpersonationState>({
    active: false,
    organizationId: null,
    organizationName: null,
  });

  const fetchImpersonation = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) return;

    const res = await fetch("/api/super-admin/impersonate/current", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(result.error || "代理ログイン状態の取得に失敗しました");
      return;
    }

    setImpersonation({
      active: Boolean(result.active),
      organizationId: result.organizationId ?? null,
      organizationName: result.organizationName ?? null,
      expiresAt: result.expiresAt ?? null,
    });
  };

  const stopImpersonation = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      return;
    }

    const res = await fetch("/api/super-admin/impersonate/stop", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "代理ログイン解除に失敗しました");
      return;
    }

    setImpersonation({
      active: false,
      organizationId: null,
      organizationName: null,
    });

    window.location.href = "/super-admin";
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    fetchImpersonation();
  }, []);

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #ddd",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 900,
          }}
        >
          DOKATA-System
        </h2>

        <button
          onClick={logout}
          style={{
            border: "none",
            background: "#111",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          ログアウト
        </button>
      </div>

      {impersonation.active && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            borderTop: "1px solid #ffe08a",
            padding: "10px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#7a5200",
            fontWeight: 800,
          }}
        >
          <div>
            代理ログイン中：
            {impersonation.organizationName ?? "会社名未取得"}
          </div>

          <button
            type="button"
            onClick={stopImpersonation}
            style={{
              border: "none",
              borderRadius: 8,
              backgroundColor: "#111",
              color: "#fff",
              padding: "8px 12px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            解除
          </button>
        </div>
      )}
    </header>
  );
}