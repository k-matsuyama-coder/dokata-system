"use client";

import React from "react";
import AssignmentDateHeader from "./AssignmentDateHeader";

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

    const mobileDateWidth = viewMode === "week" ? 112 : 92;
const mobileTableWidth = 128 + days.length * mobileDateWidth;

    return (
      <div
        ref={ref}
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