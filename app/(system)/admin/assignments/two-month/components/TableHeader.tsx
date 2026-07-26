"use client";

import React, { useState } from "react";
import { stickyTh, th, totalTh } from "../styles";
import type { Employee } from "../types";

type Props = {
  days: string[];
  employees: Employee[];
  dateMemos: Map<string, string>;
onSaveDateMemo: (date: string, memo: string) => Promise<void>;

  previousMonthTotal: number;
  nextMonthTotal: number;

  getDailyTotal: (workDate: string) => {
    total: number;
    first: number;
    second: number;
    third: number;
  };
};

export default function TwoMonthTableHeader({
  days,
  employees,
  dateMemos,
onSaveDateMemo,

  previousMonthTotal,
  nextMonthTotal,

  getDailyTotal,
}: Props) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
const [editingDate, setEditingDate] = useState<string | null>(null);
const [memoDraft, setMemoDraft] = useState("");
  return (
    <thead>
      <tr style={{ position: "sticky", top: 0, zIndex: 60 }}>
        <th style={{ ...stickyTh, top: 0, zIndex: 61 }}>現場名</th>

        <th
          style={{
            ...totalTh,
            position: "sticky",
            top: 0,
            left: 180,
            zIndex: 61,
          }}
        >
          前月合計
        </th>

        <th
          style={{
            ...totalTh,
            position: "sticky",
            top: 0,
            left: 250,
            zIndex: 61,
          }}
        >
          後月合計
        </th>

        {days.map((date) => {
          const day = new Date(date).getDay();
          const isSunday = day === 0;
          const isSaturday = day === 6;

          return (
            <th
              key={date}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => {
                if (editingDate !== date) {
                  setHoveredDate(null);
                }
              }}
              style={{
                ...th,
                backgroundColor: isSunday
                  ? "#ffe5e5"
                  : isSaturday
                    ? "#e5f0ff"
                    : "#f5f5f5",
                color: isSunday ? "#d11a2a" : isSaturday ? "#2563eb" : "#111",
                position: "sticky",
                top: 0,
                zIndex: 60,
                cursor: "pointer",
              }}
            >
              <div
  style={{
    position: "relative",
    display: "inline-block",
  }}
>
  {date.slice(5).replace("-", "/")}

  {dateMemos.get(date) && (
    <span
      style={{
        position: "absolute",
        top: -2,
        right: -10,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#2563eb",
      }}
    />
  )}

{hoveredDate === date &&
  editingDate !== date &&
  !dateMemos.get(date) && (
    <button
      type="button"
      onClick={() => {
        setEditingDate(date);
        setMemoDraft("");
      }}
      style={{
        position: "absolute",
        top: "50%",
        right: -22,
        transform: "translateY(-50%)",
        padding: 2,
        border: 0,
        background: "transparent",
        fontSize: 16,
        lineHeight: 1,
        cursor: "pointer",
        zIndex: 9999,
      }}
      aria-label={`${date}のメモを追加`}
    >
      💬
    </button>
  )}

  {hoveredDate === date &&
  editingDate !== date &&
  dateMemos.get(date) && (
    <div
    onMouseEnter={() => setHoveredDate(date)}
      onClick={() => {
        setEditingDate(date);
        setMemoDraft(dateMemos.get(date) ?? "");
      }}
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 6,
        padding: "8px 10px",
        minWidth: 180,
        maxWidth: 260,
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,.15)",
        whiteSpace: "pre-wrap",
        zIndex: 9999,
        cursor: "pointer",
      }}
    >
      {dateMemos.get(date)}
    </div>
)}

{editingDate === date && (
  <div
    style={{
      position: "absolute",
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      marginTop: 6,
      padding: 10,
      width: 240,
      background: "#fff",
      border: "1px solid #d1d5db",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,.15)",
      zIndex: 9999,
      whiteSpace: "normal",
    }}
  >
    <textarea
      autoFocus
      value={memoDraft}
      onChange={(e) => setMemoDraft(e.target.value)}
      rows={4}
      style={{
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
      }}
    />

    <button
      type="button"
      onClick={async () => {
        await onSaveDateMemo(date, memoDraft);
setEditingDate(null);
setHoveredDate(date);
      }}
      style={{
        display: "block",
        width: "100%",
        marginTop: 8,
        padding: "6px 12px",
      }}
    >
      保存
    </button>
  </div>
)}
</div>
            </th>
          );
        })}
      </tr>

      <tr>
        <th
          style={{
            ...stickyTh,
            top: 30,
            zIndex: 59,
            backgroundColor: "#f9fafb",
          }}
        >
          日別合計
        </th>

        {/* 【変更③】前月合計の空欄に値を表示 */}
        <th
          style={{
            ...totalTh,
            position: "sticky",
            top: 28,
            left: 180,
            zIndex: 59,
            fontWeight: 900,
            backgroundColor: "#f9fafb",
          }}
        >
          {previousMonthTotal}
        </th>

        {/* 【変更③】後月合計の空欄に値を表示 */}
        <th
          style={{
            ...totalTh,
            position: "sticky",
            top: 28,
            left: 250,
            zIndex: 59,
            fontWeight: 900,
            backgroundColor: "#f9fafb",
          }}
        >
          {nextMonthTotal}
        </th>

        {days.map((date) => {
          const day = new Date(date).getDay();
          const isSunday = day === 0;
          const isSaturday = day === 6;
          const dailyTotal = getDailyTotal(date);

          return (
            <th
              key={date}
              style={{
                ...th,
                backgroundColor: isSunday
                  ? "#ffe5e5"
                  : isSaturday
                    ? "#e5f0ff"
                    : "#f9fafb",
                color: isSunday ? "#d11a2a" : isSaturday ? "#2563eb" : "#111",
                position: "sticky",
                top: 30,
                zIndex: 59,
                padding: "4px 2px",
              }}
            >
              <div style={dailyTotalCellWrapStyle}>
                <div style={dailyTotalMainLineStyle}>
                  全 {dailyTotal.total} / {employees.length}
                </div>

                <div style={dailyTotalSubLineStyle}>
                  ① {dailyTotal.first} / {employees.length}
                </div>

                <div style={dailyTotalSubLineStyle}>
                  ② {dailyTotal.second} / {employees.length}
                </div>

                <div style={dailyTotalSubLineStyle}>
                  ③ {dailyTotal.third} / {employees.length}
                </div>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

const dailyTotalCellWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  justifyItems: "center",
  lineHeight: 1.15,
  minWidth: 72,
};

const dailyTotalMainLineStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const dailyTotalSubLineStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  whiteSpace: "nowrap",
  opacity: 0.62,
};