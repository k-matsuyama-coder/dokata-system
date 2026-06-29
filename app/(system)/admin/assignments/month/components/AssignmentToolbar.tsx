import React from "react";
import { getWeekStart } from "../utils";

type Props = {
  month: string;
  setMonth: React.Dispatch<React.SetStateAction<string>>;
  viewMode: "month" | "week";
  setViewMode: React.Dispatch<React.SetStateAction<"month" | "week">>;
  weekStart: Date;
  setWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  sortMode: string;
  setSortMode: React.Dispatch<React.SetStateAction<string>>;
  showFinished: boolean;
  setShowFinished: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AssignmentToolbar({
  month,
  setMonth,
  viewMode,
  setViewMode,
  weekStart,
  setWeekStart,
  sortMode,
  setSortMode,
  showFinished,
  setShowFinished,
  setShowAddModal,
}: Props) {
  return (
    <>
      <h1>{viewMode === "week" ? "週間番割表" : "月間番割表"}</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "nowrap",
          marginBottom: 16,
          overflowX: "auto",
          position: "relative",
          zIndex: 5000,
        }}
      >
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
            height: 42,
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setViewMode("month")}
            style={{
              padding: "8px 14px",
              background: viewMode === "month" ? "#2563eb" : "#fff",
              color: viewMode === "month" ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            月間
          </button>

          <button
            type="button"
            onClick={() => setViewMode("week")}
            style={{
              padding: "8px 14px",
              background: viewMode === "week" ? "#2563eb" : "#fff",
              color: viewMode === "week" ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            週間
          </button>
        </div>

        {viewMode === "week" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() - 7);
                setWeekStart(d);
              }}
            >
              ← 前週
            </button>

            <button
              type="button"
              onClick={() => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + 7);
                setWeekStart(d);
              }}
            >
              次週 →
            </button>

            <button
              type="button"
              onClick={() => {
                setWeekStart(getWeekStart());
              }}
            >
              今週
            </button>
          </div>
        )}

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          style={{
            width: 160,
            height: 42,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            backgroundColor: "#fff",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          <option value="manual">標準</option>
          <option value="site">現場順</option>
          <option value="contractor">元請順</option>
          <option value="manager">担当者順</option>
          <option value="construction">工事区分順</option>
          <option value="shift">昼夜順</option>
        </select>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <input
            type="checkbox"
            checked={showFinished}
            onChange={(e) => setShowFinished(e.target.checked)}
          />
          終了現場表示
        </label>

        <button
          type="button"
          onClick={() => {
            console.log("現場追加クリック");
            setShowAddModal(true);
          }}
          style={{
            position: "relative",
            zIndex: 5000,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          ＋ 現場追加
        </button>
      </div>
    </>
  );
}