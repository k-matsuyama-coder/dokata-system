// app/(system)/admin/assignments/month/components/PublicAssignmentLinkSection.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type CreateLinkResponse = {
  success: boolean;
  message?: string;
  url?: string;
  expiresAt?: string;
};

export default function PublicAssignmentLinkSection() {
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const createPublicLink = async () => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        alert("ログイン情報がありません");
        return;
      }

      const res = await fetch("/api/admin/public/assignments/create-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expiresInDays: 7,
        }),
      });

      const result = (await res.json()) as CreateLinkResponse;

      if (!res.ok || !result.success || !result.url || !result.expiresAt) {
        alert(result.message ?? "公開URLの発行に失敗しました");
        return;
      }

      setPublicUrl(result.url);
      setExpiresAt(result.expiresAt);
      alert("公開URLを発行しました");
    } catch (error) {
      console.error(error);
      alert("公開URLの発行に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      alert("公開URLをコピーしました");
    } catch (error) {
      console.error(error);
      alert("コピーに失敗しました");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 16,
          marginBottom: 8,
        }}
      >
        公開URL
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#555",
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        ログイン不要で番割表示ページを共有できます。<br />
        URLの有効期限は発行から7日です。
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={createPublicLink}
          disabled={loading}
          style={{
            border: "none",
            backgroundColor: loading ? "#9ca3af" : "#2563eb",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "発行中..." : "7日限定の公開URLを発行"}
        </button>

        {publicUrl && (
          <button
            type="button"
            onClick={copyUrl}
            style={{
              border: "1px solid #ddd",
              backgroundColor: "#fff",
              color: "#111",
              borderRadius: 8,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            URLをコピー
          </button>
        )}
      </div>

      {publicUrl && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#666",
              marginBottom: 6,
            }}
          >
            公開URL
          </div>

          <div
            style={{
              fontSize: 13,
              wordBreak: "break-all",
              color: "#111",
              marginBottom: 8,
            }}
          >
            {publicUrl}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#666",
            }}
          >
            有効期限: {new Date(expiresAt).toLocaleString("ja-JP")}
          </div>
        </div>
      )}
    </div>
  );
}


// app/(system)/admin/assignments/month/page.tsx
// 1) import を追加
import PublicAssignmentLinkSection from "./components/PublicAssignmentLinkSection";

// 2) return 内の上の方、既存のUIの先頭付近に追加
// 例:
export default function MonthlyAssignmentsPage() {
  return (
    <div style={{ padding: 16 }}>
      <PublicAssignmentLinkSection />

      {/* ここから下は既存の画面そのまま */}
    </div>
  );
}