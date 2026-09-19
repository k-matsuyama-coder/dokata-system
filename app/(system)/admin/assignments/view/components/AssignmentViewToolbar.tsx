"use client";

import React, { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type AssignmentGroupKey =
  | "group1"
  | "group2"
  | "group3"
  | "group4"
  | "group5";

type FilterMode = "all" | AssignmentGroupKey;
type ViewMode = "day" | "3days" | "week";

type GroupOption = {
  group_key: AssignmentGroupKey;
  display_name: string;
};

type Props = {
  date: string;
  setDate: (value: string) => void;
  viewMode: ViewMode;
  filterMode: FilterMode;
  setFilterMode: (value: FilterMode) => void;
  enabledGroups: GroupOption[];
  movePrev: () => void;
  moveNext: () => void;
  moveToday: () => void;
  changeViewMode: (mode: ViewMode) => void;
  downloadImage: () => void;
};

export default function AssignmentViewToolbar({
  date,
  setDate,
  viewMode,
  filterMode,
  setFilterMode,
  enabledGroups,
  movePrev,
  moveNext,
  moveToday,
  changeViewMode,
  downloadImage,
}: Props) {
  const [creatingPublicLink, setCreatingPublicLink] = useState(false);
  const [publicViewMode, setPublicViewMode] = useState<"week" | "next3days">("next3days");
  const [publicUrl, setPublicUrl] = useState("");
  const [publicLinkMessage, setPublicLinkMessage] = useState("");
  const creatingRef = useRef(false);

  const createPublicLink = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreatingPublicLink(true);
    setPublicUrl("");
    setPublicLinkMessage("");
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      const token = data.session?.access_token;
      if (!token) throw new Error("ログイン情報がありません。再ログインしてください。");
      const response = await fetch("/api/admin/public/assignments/create-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresInDays: 7, viewMode: publicViewMode, baseDate: date }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || typeof result.url !== "string") {
        throw new Error(result.message ?? "公開URLの発行に失敗しました");
      }
      setPublicUrl(result.url);
      try {
        await navigator.clipboard.writeText(result.url);
        setPublicLinkMessage("公開URLをコピーしました（有効期限7日間）");
      } catch {
        setPublicLinkMessage("公開URLを発行しました。下のURLを選択してコピーしてください。");
      }
    } catch (error) {
      setPublicLinkMessage(error instanceof Error ? error.message : "公開URLの発行に失敗しました");
    } finally {
      creatingRef.current = false;
      setCreatingPublicLink(false);
    }
  };

  return (
    <div style={toolbarWrapStyle}>
      <button type="button" onClick={movePrev} style={viewButtonStyle}>
        {viewMode === "week" ? "前週" : "前日"}
      </button>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={viewInputStyle}
      />

      <button type="button" onClick={moveNext} style={viewButtonStyle}>
        {viewMode === "week" ? "翌週" : "翌日"}
      </button>

      <button type="button" onClick={moveToday} style={viewButtonStyle}>
        {viewMode === "week" ? "今週" : "今日"}
      </button>

      {(["day", "3days", "week"] as const).map((mode) => {
        const label = mode === "day" ? "1日" : mode === "3days" ? "3日" : "週間";

        return (
          <button
            key={mode}
            type="button"
            onClick={() => changeViewMode(mode)}
            style={{
              ...viewButtonStyle,
              backgroundColor: viewMode === mode ? "#2563eb" : "#fff",
              color: viewMode === mode ? "#fff" : "#111",
              border:
                viewMode === mode
                  ? "1px solid #2563eb"
                  : "1px solid #d1d5db",
            }}
          >
            {label}
          </button>
        );
      })}

      <select
        value={filterMode}
        onChange={(e) => setFilterMode(e.target.value as FilterMode)}
        style={viewInputStyle}
      >
        <option value="all">全体表示</option>
        {enabledGroups.map((group) => (
          <option key={group.group_key} value={group.group_key}>
            {group.display_name}のみ
          </option>
        ))}
      </select>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", maxWidth: "100%", overflowX: "auto" }}>
        <button type="button" onClick={downloadImage} style={{ ...viewButtonStyle, whiteSpace: "nowrap", flexShrink: 0 }}>
          画像保存
        </button>
        <button type="button" onClick={createPublicLink} disabled={creatingPublicLink} style={{ ...viewButtonStyle, whiteSpace: "nowrap", flexShrink: 0 }}>
          {creatingPublicLink ? "発行中..." : "公開URLを発行"}
        </button>
        <select aria-label="公開URLの表示期間" value={publicViewMode} disabled={creatingPublicLink} onChange={(e) => setPublicViewMode(e.target.value as "week" | "next3days")} style={viewInputStyle}>
          <option value="next3days">公開：3日間</option>
          <option value="week">公開：1週間</option>
        </select>
      </div>
      <div style={{ width: "100%", fontSize: 12, color: "#475569" }}>
        公開URLは選択日を基準に発行します。公開期間は右の選択欄で指定し、グループの絞り込みは反映されません。
      </div>
      {publicLinkMessage && <div role="status" style={{ width: "100%" }}>{publicLinkMessage}</div>}
      {publicUrl && (
        <input aria-label="発行した公開URL" value={publicUrl} readOnly onFocus={(e) => e.currentTarget.select()} style={{ ...viewInputStyle, width: "100%", boxSizing: "border-box" }} />
      )}
    </div>
  );
}

const toolbarWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginBottom: 16,
  flexWrap: "wrap",
};

const viewButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
};

const viewInputStyle: React.CSSProperties = {
  padding: 9,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 16,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
};