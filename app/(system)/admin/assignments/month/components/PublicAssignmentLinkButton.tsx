// app/(system)/admin/assignments/month/components/PublicAssignmentLinkButton.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type CreatePublicLinkResponse = {
  success: boolean;
  url?: string;
  token?: string;
  expiresAt?: string;
  message?: string;
};

export default function PublicAssignmentLinkButton() {
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleCreateLink = async () => {
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

      const result = (await res.json()) as CreatePublicLinkResponse;

      if (!res.ok || !result.success || !result.url) {
        alert(result.message ?? "公開URLの発行に失敗しました");
        return;
      }

      setPublicUrl(result.url);
      setExpiresAt(result.expiresAt ?? "");
    } catch (error) {
      console.error(error);
      alert("公開URLの発行に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
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
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleCreateLink}
          disabled={loading}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: loading ? "default" : "pointer",
            fontWeight: 800,
            backgroundColor: loading ? "#9ca3af" : "#2563eb",
            color: "#fff",
          }}
        >
          {loading ? "発行中..." : "1週間限定の公開URLを発行"}
        </button>

        <div style={{ fontSize: 13, color: "#666" }}>
          ログイン不要で閲覧できる番割公開URLを発行します
        </div>
      </div>

      {publicUrl && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            公開URL
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "stretch",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              readOnly
              value={publicUrl}
              style={{
                flex: 1,
                minWidth: 280,
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: "10px 12px",
                backgroundColor: "#f9fafb",
              }}
            />

            <button
              type="button"
              onClick={handleCopy}
              style={{
                border: "1px solid #111",
                backgroundColor: "#111",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              コピー
            </button>
          </div>

          {expiresAt && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#666",
              }}
            >
              有効期限: {new Date(expiresAt).toLocaleString("ja-JP")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ================================================
// app/(system)/admin/assignments/month/page.tsx
// 先頭付近に追加する例
// ================================================

import PublicAssignmentLinkButton from "./components/PublicAssignmentLinkButton";

// 既存の page コンポーネント内の return の上の方にこれを差し込む
// 例:
// <div style={{ padding: 16 }}>
//   <PublicAssignmentLinkButton />
//   ...既存UI...
// </div>

// 実際には今の page.tsx の上部 import に追加して、return の上側に
// <PublicAssignmentLinkButton />
// を置いてください。