"use client";

import React from "react";
import AssignmentDateHeader from "./AssignmentDateHeader";
import { getJapanDate } from "@/lib/japanDate";

import type {
  Assignment,
  AssignmentDateMemo,
  AssignmentGroupKey,
  AssignmentGroupSetting,
  DailyInfo,
  SiteMember,
} from "../types";

import {
  th,
  stickyTh1,
  stickyTh2,
  stickyTh3,
  stickyTh4,
} from "../styles";

type DailySummary = {
  infos: DailyInfo[];
  members: SiteMember[];
};

type Props = {
  isMobile: boolean;
  viewMode: "month" | "week";
  days: string[];
  dateMemos: AssignmentDateMemo[];
  dailySummaryMap: Map<string, DailySummary>;
  assignmentMap: Map<string, Assignment>;
  enabledGroups: AssignmentGroupSetting[];
  groupNameMap: Map<AssignmentGroupKey, string>;
  getDateHeaderStyle: (date: string) => React.CSSProperties;
  onSaveDateMemo: (date: string, memo: string) => Promise<void>;
  children: React.ReactNode;
};

const MonthlyAssignmentsTable = React.forwardRef<HTMLDivElement, Props>(
  function MonthlyAssignmentsTable(
    {
      isMobile,
      viewMode,
      days,
      dateMemos,
      dailySummaryMap,
      assignmentMap,
      enabledGroups,
      groupNameMap,
      getDateHeaderStyle,
      onSaveDateMemo,
      children,
    },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const periodKey =
  `${viewMode}:${days[0] ?? ""}:${days[days.length - 1] ?? ""}`;

const previousPeriodRef = React.useRef(periodKey);
const startFromTodayRef = React.useRef(true);

React.useLayoutEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  // 月・週を切り替えた後は先頭から表示する。
  if (previousPeriodRef.current !== periodKey) {
    previousPeriodRef.current = periodKey;
    startFromTodayRef.current = false;
  }

  if (!startFromTodayRef.current) {
    container.scrollLeft = 0;
    return;
  }

  const todayIndex = days.indexOf(getJapanDate());

      // 表示期間に今日がない場合は、期間の先頭から表示する。
      if (todayIndex < 0) {
        container.scrollLeft = 0;
        return;
      }

      const headerRow = container.querySelector("thead tr");
      if (!headerRow) return;

      const fixedColumns = isMobile ? 2 : 4;
      const firstDateHeader = headerRow.children[fixedColumns];
      const todayHeader =
        headerRow.children[fixedColumns + todayIndex];

      if (!firstDateHeader || !todayHeader) return;

      let userOperated = false;

      const alignToday = () => {
        if (userOperated) return;

        const left =
          todayHeader.getBoundingClientRect().left -
          firstDateHeader.getBoundingClientRect().left;

        container.scrollLeft = Math.max(0, left);
      };

      // データ取得後に列幅が変わった場合も位置を合わせる。
      const observer = new ResizeObserver(alignToday);
      observer.observe(headerRow);
      Array.from(headerRow.children).forEach((cell) => {
        observer.observe(cell);
      });

      const stopAutoScroll = () => {
        userOperated = true;
        observer.disconnect();
      };

      const events = ["pointerdown", "touchstart", "wheel", "keydown"];

      events.forEach((event) => {
        container.addEventListener(event, stopAutoScroll, {
          passive: true,
        });
      });

      alignToday();

      return () => {
        observer.disconnect();
        events.forEach((event) => {
          container.removeEventListener(event, stopAutoScroll);
        });
      };
    }, [days, isMobile, viewMode, periodKey]);

    const mobileDateWidth = viewMode === "week" ? 150 : 120;
const mobileTableWidth = 128 + days.length * mobileDateWidth;

    return (
      <div
      ref={(element) => {
        containerRef.current = element;

        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
        style={{
          overflowX: "auto",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: 12,
          backgroundColor: "#fff",
          maxHeight: "78vh",
          position: "relative",
        }}
      >
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: isMobile ? "fixed" : "auto",
minWidth: isMobile
  ? mobileTableWidth
  : viewMode === "week"
    ? 1200
    : 1700,
width: isMobile ? mobileTableWidth : "100%",
            backgroundColor: "#fff",
            fontSize: isMobile ? 10 : 12,
          }}
        >

{isMobile && (
  <colgroup>
    <col style={{ width: 96 }} />
    <col style={{ width: 32 }} />

    {days.map((date) => (
      <col
        key={date}
        style={{
          width: mobileDateWidth,
        }}
      />
    ))}
  </colgroup>
)}

          <thead>
            <tr>
              {!isMobile && <th style={{ ...th, ...stickyTh1 }}>元請</th>}

              <th
  style={{
    ...th,
    ...stickyTh2,
    left: isMobile ? 0 : 90,
    ...(isMobile
      ? {
          minWidth: 96,
          width: 96,
          padding: "4px 2px",
        }
      : {}),
  }}
>
  現場名
</th>

              {!isMobile && <th style={{ ...th, ...stickyTh3 }}>担当者</th>}

              <th
  style={{
    ...th,
    ...stickyTh4,
    left: isMobile ? 96 : 350,
    ...(isMobile
      ? {
          minWidth: 32,
          width: 32,
          padding: 2,
        }
      : {}),
  }}
>
  昼/夜
</th>

              {days.map((date) => (
                <AssignmentDateHeader
                key={`${date}:${dateMemos.find((item) => item.work_date === date)?.memo ?? ""}`}
                date={date}
                summary={dailySummaryMap.get(date)}
                assignmentMap={assignmentMap}
                enabledGroups={enabledGroups}
                groupNameMap={groupNameMap}
                getDateHeaderStyle={getDateHeaderStyle}
                memo={dateMemos.find((m) => m.work_date === date)?.memo ?? null}
                onSaveDateMemo={onSaveDateMemo}
              />
              ))}
            </tr>
          </thead>

          {children}
        </table>
      </div>
    );
  }
);

export default MonthlyAssignmentsTable;