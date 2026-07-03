"use client";

import React from "react";
import AssignmentDateHeader from "./AssignmentDateHeader";

import type {
  Assignment,
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
} from "../styles";

type DailySummary = {
  infos: DailyInfo[];
  members: SiteMember[];
};

type Props = {
  isMobile: boolean;
  viewMode: "month" | "week";
  days: string[];
  dailySummaryMap: Map<string, DailySummary>;
  assignmentMap: Map<string, Assignment>;
  enabledGroups: AssignmentGroupSetting[];
  groupNameMap: Map<AssignmentGroupKey, string>;
  getDateHeaderStyle: (date: string) => React.CSSProperties;
  children: React.ReactNode;
};

const MonthlyAssignmentsTable = React.forwardRef<HTMLDivElement, Props>(
  function MonthlyAssignmentsTable(
    {
      isMobile,
      viewMode,
      days,
      dailySummaryMap,
      assignmentMap,
      enabledGroups,
      groupNameMap,
      getDateHeaderStyle,
      children,
    },
    ref
  ) {
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
            minWidth:
              viewMode === "week"
                ? isMobile
                  ? 900
                  : 1200
                : isMobile
                  ? 950
                  : 1700,
            width: "100%",
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
                  left: isMobile ? 0 : 70,
                }}
              >
                現場名
              </th>

              {!isMobile && <th style={{ ...th, ...stickyTh3 }}>担当者</th>}

              <th style={th}>昼/夜</th>

              {days.map((date) => (
                <AssignmentDateHeader
                  key={date}
                  date={date}
                  summary={dailySummaryMap.get(date)}
                  assignmentMap={assignmentMap}
                  enabledGroups={enabledGroups}
                  groupNameMap={groupNameMap}
                  getDateHeaderStyle={getDateHeaderStyle}
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