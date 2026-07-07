"use client";

import React from "react";

type Props = {
  memberSearchQuery: string;
  setMemberSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  memberSearchMatchesLength: number;
  activeMatchIndex: number;
  goToPrevMatch: () => void;
  goToNextMatch: () => void;
};

export default function AssignmentSearchBar({
  memberSearchQuery,
  setMemberSearchQuery,
  memberSearchMatchesLength,
  activeMatchIndex,
  goToPrevMatch,
  goToNextMatch,
}: Props) {
  return (
    <div style={searchStickyWrapStyle}>
      <div style={searchToolbarWrapStyle}>
        <input
          type="text"
          value={memberSearchQuery}
          onChange={(e) => setMemberSearchQuery(e.target.value)}
          placeholder="名前で検索"
          style={searchInputStyle}
        />

        <button
          type="button"
          onClick={goToPrevMatch}
          disabled={memberSearchMatchesLength === 0}
          style={{
            ...searchNavButtonStyle,
            opacity: memberSearchMatchesLength === 0 ? 0.45 : 1,
            cursor: memberSearchMatchesLength === 0 ? "not-allowed" : "pointer",
          }}
        >
          ↑
        </button>

        <button
          type="button"
          onClick={goToNextMatch}
          disabled={memberSearchMatchesLength === 0}
          style={{
            ...searchNavButtonStyle,
            opacity: memberSearchMatchesLength === 0 ? 0.45 : 1,
            cursor: memberSearchMatchesLength === 0 ? "not-allowed" : "pointer",
          }}
        >
          ↓
        </button>

        <div style={searchCountTextStyle}>
          {memberSearchQuery.trim()
            ? `${memberSearchMatchesLength === 0 ? 0 : activeMatchIndex + 1}/${memberSearchMatchesLength}`
            : "名前検索"}
        </div>
      </div>
    </div>
  );
}

const searchStickyWrapStyle: React.CSSProperties = {
  position: "sticky",
  top: 80,
  zIndex: 300,
  background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)",
  padding: "0 0 10px",
  marginBottom: 10,
};

const searchToolbarWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  padding: "8px 10px",
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.94)",
  border: "1px solid #dbe2ea",
  boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
  backdropFilter: "blur(8px)",
};

const searchInputStyle: React.CSSProperties = {
  padding: 9,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 16,
  backgroundColor: "#fff",
  minWidth: 180,
  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
};

const searchNavButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
  opacity: 1,
};

const searchCountTextStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#475569",
  padding: "0 4px",
};