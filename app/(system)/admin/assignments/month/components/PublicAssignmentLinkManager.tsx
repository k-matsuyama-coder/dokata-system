// app/(system)/admin/assignments/month/components/PublicAssignmentLinkManager.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PublicLink = {
  id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

type ListResponse = {
  success: boolean;
  message?: string;
  links?: PublicLink[];
};

type RevokeResponse = {
  success: boolean;
  message?: string;
};

export default function PublicAssignmentLinkManager() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        alert("ログイン情報がありません");
        return;
      }

      const res = await fetch("/api/admin/public/assignments/links", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await res.json()) as ListResponse;

      if (!res.ok || !result.success || !result.links) {
        alert(result.message ?? "公開URL一覧の取得に失敗しました");
        return;
      }

      setLinks(result.links);
    } catch (error) {
      console.error(error);
      alert("公開URL一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLinks();
  }, []);

  const copyUrl = async (token: string) => {
    const url = `${window.location.origin}/public/assignments/${token}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("公開URLをコピーしました");
    } catch (error) {
      console.error(error);
      alert("コピーに失敗しました");
    }
  };

  const revokeLink = async (id: string) => {
    const ok = window.confirm("この公開URLを無効化しますか？");
    if (!ok) return;

    try {
      setRevokingId(id);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        alert("ログイン情報がありません");
        return;
      }

      const res = await fetch("/api/admin/public/assignments/revoke-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const result = (await res.json()) as RevokeResponse;

      if (!res.ok || !result.success) {
        alert(result.message ?? "公開URLの無効化に失敗しました");
        return;
      }

      setLinks((prev) =>
        prev.map((link) =>
          link.id === id ? { ...link, is_active: false } : link
        )
      );

      alert("公開URLを無効化しました");
    } catch (error) {
      console.error(error);
      alert("公開URLの無効化に失敗しました");
    } finally {
      setRevokingId(null);
    }
  };

  const now = Date.now();

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
          marginBottom: 12,
        }}
      >
        発行済み公開URL一覧
      </div>

      {loading ? (
        <div style={{ color: "#666", fontSize: 14 }}>読み込み中...</div>
      ) : links.length === 0 ? (
        <div style={{ color: "#666", fontSize: 14 }}>
          発行済みの公開URLはありません
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {links.map((link) => {
            const expired = new Date(link.expires_at).getTime() < now;

            let status = "有効";
            let statusColor = "#16a34a";

            if (!link.is_active) {
              status = "無効";
              statusColor = "#6b7280";
            } else if (expired) {
              status = "期限切れ";
              statusColor = "#dc2626";
            }

            const publicUrl = `${window.location.origin}/public/assignments/${link.token}`;

            return (
              <div
                key={link.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: statusColor,
                      fontSize: 13,
                    }}
                  >
                    {status}
                  </div>

                  <div style={{ fontSize: 12, color: "#666" }}>
                    発行日: {new Date(link.created_at).toLocaleString("ja-JP")}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#111",
                    wordBreak: "break-all",
                    marginBottom: 8,
                  }}
                >
                  {publicUrl}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginBottom: 10,
                  }}
                >
                  有効期限: {new Date(link.expires_at).toLocaleString("ja-JP")}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => copyUrl(link.token)}
                    style={{
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    URLをコピー
                  </button>

                  {link.is_active && !expired && (
                    <button
                      type="button"
                      onClick={() => revokeLink(link.id)}
                      disabled={revokingId === link.id}
                      style={{
                        border: "none",
                        backgroundColor:
                          revokingId === link.id ? "#9ca3af" : "#dc2626",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontWeight: 700,
                        cursor:
                          revokingId === link.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {revokingId === link.id ? "無効化中..." : "無効化"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}