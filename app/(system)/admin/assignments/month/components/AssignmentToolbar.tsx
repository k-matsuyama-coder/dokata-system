"use client";

type AssignmentToolbarProps = {
  month: string;
  setMonth: (value: string) => void;
  viewMode: "month" | "week";
  setViewMode: (value: "month" | "week") => void;
  weekStart: string;
  setWeekStart: (value: string) => void;
  sortMode: string;
  setSortMode: (value: string) => void;
  showFinished: boolean;
  setShowFinished: (value: boolean) => void;
  setShowAddModal: (value: boolean) => void;
  onCreatePublicLink?: () => void;
  creatingPublicLink?: boolean;
  publicViewMode?: "week" | "next3days";
  setPublicViewMode?: (value: "week" | "next3days") => void;
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
  onCreatePublicLink,
  creatingPublicLink = false,
  publicViewMode = "next3days",
  setPublicViewMode,
}: AssignmentToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{
          padding: "8px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      />

      <button
        type="button"
        onClick={() => setViewMode("month")}
        style={{
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          fontWeight: 700,
          cursor: "pointer",
          backgroundColor: viewMode === "month" ? "#1d4ed8" : "#e5e7eb",
          color: viewMode === "month" ? "#fff" : "#111827",
        }}
      >
        月間
      </button>

      <button
        type="button"
        onClick={() => setViewMode("week")}
        style={{
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          fontWeight: 700,
          cursor: "pointer",
          backgroundColor: viewMode === "week" ? "#1d4ed8" : "#e5e7eb",
          color: viewMode === "week" ? "#fff" : "#111827",
        }}
      >
        週間
      </button>

      {viewMode === "week" && (
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          style={{
            padding: "8px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
      )}

      <select
        value={sortMode}
        onChange={(e) => setSortMode(e.target.value)}
        style={{
          padding: "8px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        <option value="default">標準</option>
        <option value="contractor">元請順</option>
        <option value="site">現場順</option>
      </select>

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          cursor: "pointer",
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
        onClick={() => setShowAddModal(true)}
        style={{
          border: "1px solid #d1d5db",
          backgroundColor: "#fff",
          borderRadius: 8,
          padding: "8px 12px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ＋ 現場追加
      </button>

      {setPublicViewMode && (
        <select
          value={publicViewMode}
          onChange={(e) => setPublicViewMode(e.target.value as "week" | "next3days")}
          style={{
            padding: "8px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            backgroundColor: "#fff",
          }}
        >
          <option value="week">1週間</option>
          <option value="next3days">3日間</option>
        </select>
      )}

      {onCreatePublicLink && (
        <button
          type="button"
          onClick={onCreatePublicLink}
          disabled={creatingPublicLink}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            fontWeight: 700,
            cursor: creatingPublicLink ? "default" : "pointer",
            backgroundColor: creatingPublicLink ? "#9ca3af" : "#111827",
            color: "#fff",
          }}
        >
          {creatingPublicLink ? "公開URL発行中..." : "公開URLを発行"}
        </button>
      )}
    </div>
  );
}