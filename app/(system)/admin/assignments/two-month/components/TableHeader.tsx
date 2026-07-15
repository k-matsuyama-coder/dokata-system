// app/(system)/admin/assignments/two-month/components/TableHeader.tsx

import React from "react";
import { stickyTh, th, totalTh } from "../styles";
import type { Employee } from "../types";

type Props = {
  days: string[];
  employees: Employee[];

  // 【追加①】
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

  // 【追加②】
  previousMonthTotal,
  nextMonthTotal,

  getDailyTotal,
}: Props) {
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
              }}
            >
              {date.slice(5).replace("-", "/")}
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