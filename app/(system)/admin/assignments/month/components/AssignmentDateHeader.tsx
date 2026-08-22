"use client";

import { useState } from "react";
import type {
  Assignment,
  AssignmentGroupKey,
  AssignmentGroupSetting,
  DailyInfo,
  SiteMember,
} from "../types";

type Props = {
  date: string;
  memo: string | null;
  summary:
    | {
        infos: DailyInfo[];
        members: SiteMember[];
      }
    | undefined;
  assignmentMap: Map<string, Assignment>;
  enabledGroups: AssignmentGroupSetting[];
  groupNameMap: Map<AssignmentGroupKey, string>;
  getDateHeaderStyle: (date: string) => React.CSSProperties;
  onSaveDateMemo: (date: string, memo: string) => Promise<void>;
};

export default function AssignmentDateHeader({
  date,
  memo,
  summary,
  assignmentMap,
  enabledGroups,
  groupNameMap,
  getDateHeaderStyle,
  onSaveDateMemo,
}: Props) {
  const [isMemoEditing, setIsMemoEditing] = useState(false);
  const [memoDraft, setMemoDraft] = useState(memo ?? "");
  const [isHovered, setIsHovered] = useState(false);

  const infosOfDate = summary?.infos ?? [];
const membersOfDate = summary?.members ?? [];

const infosWithinAssignmentPeriod = infosOfDate.filter((info) => {
  const assignment = assignmentMap.get(info.assignment_id);

  if (!assignment) return false;

  return (
    (!assignment.start_date || date >= assignment.start_date) &&
    (!assignment.end_date || date <= assignment.end_date)
  );
});

const plannedAll = infosWithinAssignmentPeriod.reduce(
    (sum, info) => sum + (info.planned_count ?? 0),
    0
  );

  const totalAll = membersOfDate.length;

  const groupSummaries = enabledGroups.map((group) => {
    const planned = infosWithinAssignmentPeriod
      .filter((info) => {
        const assignment = assignmentMap.get(info.assignment_id);
        return (assignment?.group_key ?? "group1") === group.group_key;
      })
      .reduce((sum, info) => sum + (info.planned_count ?? 0), 0);

    const total = membersOfDate.filter((member) => {
      const assignment = assignmentMap.get(member.assignment_id);
      return (assignment?.group_key ?? "group1") === group.group_key;
    }).length;

    return {
      key: group.group_key,
      label: groupNameMap.get(group.group_key) ?? group.display_name,
      planned,
      total,
    };
  });

  return (
    <th
      style={getDateHeaderStyle(date)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isMemoEditing) {
          setIsHovered(false);
        }
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {memoDraft.trim() && (
          <span
            aria-label="メモあり"
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              pointerEvents: "none",
            }}
          />
        )}

        <div style={{ fontSize: 14, fontWeight: 800 }}>
          {Number(date.slice(-2))}
        </div>

        <div style={{ fontSize: 11, marginTop: 2 }}>
          {
            ["日", "月", "火", "水", "木", "金", "土"][
              new Date(date).getDay()
            ]
          }
        </div>

        {isHovered && !memoDraft.trim() && (
          <button
            type="button"
            aria-label="日付メモを開く"
            onClick={() => setIsMemoEditing(true)}
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 26,
              height: 26,
              padding: 0,
              border: "1px solid #ddd",
              borderRadius: "50%",
              backgroundColor: "#fff",
              cursor: "pointer",
              fontSize: 14,
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              zIndex: 2,
            }}
          >
            💬
          </button>
        )}

        {isHovered && !isMemoEditing && memoDraft.trim() && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsMemoEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setIsMemoEditing(true);
              }
            }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: 190,
              maxHeight: 120,
              overflowY: "auto",
              padding: "8px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              backgroundColor: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              color: "#222",
              fontSize: 11,
              fontWeight: 400,
              lineHeight: 1.5,
              textAlign: "left",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              cursor: "pointer",
              zIndex: 1000,
            }}
          >
            {memoDraft}
          </div>
        )}

        {isMemoEditing && (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: 190,
              padding: 8,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              backgroundColor: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              zIndex: 1000,
              boxSizing: "border-box",
              whiteSpace: "normal",
            }}
          >
            <textarea
              autoFocus
              value={memoDraft}
              onChange={(event) => setMemoDraft(event.target.value)}
              onBlur={() => setIsMemoEditing(false)}
              rows={5}
              placeholder="日付メモを入力"
              style={{
                width: "100%",
                minHeight: 80,
                padding: 6,
                border: "none",
                outline: "none",
                boxSizing: "border-box",
                fontSize: 11,
                lineHeight: 1.5,
                resize: "vertical",
                display: "block",
              }}
            />

            <button
              type="button"
              onClick={async () => {
                await onSaveDateMemo(date, memoDraft);
                setIsMemoEditing(false);
                setIsHovered(true);
              }}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "6px 0",
                border: "none",
                borderRadius: 4,
                backgroundColor: "#2563eb",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "block",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              保存
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            lineHeight: 1.4,
            color: "#333",
            fontWeight: 800,
          }}
        >
          <div>
          全 {totalAll}/{plannedAll}
          </div>

          {groupSummaries.map((group) => (
            <div key={group.key}>
              {group.label} {group.total}/{group.planned}
            </div>
          ))}
        </div>
      </div>
    </th>
  );
}