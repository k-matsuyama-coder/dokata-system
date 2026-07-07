"use client";

import React from "react";

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

      <button type="button" onClick={downloadImage} style={viewButtonStyle}>
        画像保存
      </button>
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