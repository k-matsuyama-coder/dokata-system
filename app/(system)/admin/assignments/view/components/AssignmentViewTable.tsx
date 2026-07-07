"use client";

import React from "react";
import DetailPreview from "./DetailPreview";
import type { AssignmentFile } from "../hooks/useAssignmentViewData";
import { getDateAccentColors } from "@/app/(system)/admin/assignments/month/utils/dateColors";

type PublicGroupRow = {
  group_key: string;
  display_name: string;
  header_color: string | null;
  rows: Array<{
    id: string;
    site_name: string | null;
    contractor_name: string | null;
    manager_name: string | null;
    contact_phone: string | null;
    address: string | null;
    meeting_time: string | null;
    shift_type: string | null;
  }>;
};

type MemberRow = {
  id: string;
  employee_name: string;
  is_driver: boolean | null;
  is_operator: boolean | null;
  heavy_equipment: string | null;
  is_foreman: boolean | null;
};

type DailyInfoRow = {
  detail: string | null;
  vehicle_names: string[] | null;
};

type Props = {
  pdfRef: React.MutableRefObject<HTMLDivElement | null>;
  tableScrollRef: React.MutableRefObject<HTMLDivElement | null>;
  isMobile: boolean;
  isExportingImage: boolean;
  displayDates: string[];
  groupedVisibleAssignments: PublicGroupRow[];
  assignmentFiles: AssignmentFile[];
  memberSearchMatches: { key: string }[];
  activeMatchIndex: number;
  memberSearchMatchKeySet: Set<string>;
  matchElementMapRef: React.MutableRefObject<
    Record<string, HTMLDivElement | null>
  >;
  getWeekday: (date: string) => string;
  getMembers: (assignmentId: string, workDate: string) => MemberRow[];
  getDailyInfo: (assignmentId: string, workDate: string) => DailyInfoRow | undefined;
  highlightMemberName: (text: string) => React.ReactNode;
  setDetailModalAssignment: React.Dispatch<
    React.SetStateAction<{
      site_name: string | null;
      contractor_name: string | null;
      manager_name: string | null;
      contact_phone: string | null;
      address: string | null;
      shift_type: string | null;
      files: AssignmentFile[];
    } | null>
  >;
  setDetailTextModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      text: string;
    } | null>
  >;
};

export default function AssignmentViewTable({
  pdfRef,
  tableScrollRef,
  isMobile,
  isExportingImage,
  displayDates,
  groupedVisibleAssignments,
  assignmentFiles,
  memberSearchMatches,
  activeMatchIndex,
  memberSearchMatchKeySet,
  matchElementMapRef,
  getWeekday,
  getMembers,
  getDailyInfo,
  highlightMemberName,
  setDetailModalAssignment,
  setDetailTextModal,
}: Props) {
  return (
    <div
      ref={(element) => {
        pdfRef.current = element;
        tableScrollRef.current = element;
      }}
      style={tableOuterStyle}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...stickyHeaderCellStyle, ...stickySiteHeaderStyle }}>
              現場
            </th>

            {displayDates.map((workDate) => (
              <DateHeaderCell
                key={workDate}
                workDate={workDate}
                isExportingImage={isExportingImage}
                getWeekday={getWeekday}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {groupedVisibleAssignments.length === 0 && (
            <tr>
              <td colSpan={1 + displayDates.length} style={emptyBoardCellStyle}>
                番割なし
              </td>
            </tr>
          )}

          {groupedVisibleAssignments.map((group) => (
            <React.Fragment key={`group-${group.group_key}`}>
              <tr>
                <td
                  colSpan={1 + displayDates.length}
                  style={{
                    padding: isMobile ? "8px 10px" : "10px 14px",
                    background: `linear-gradient(180deg, ${
                      group.header_color || "#e5e7eb"
                    } 0%, #ffffff 180%)`,
                    borderTop: "1px solid #dbe2ea",
                    borderBottom: "1px solid #dbe2ea",
                    fontWeight: 900,
                    fontSize: isMobile ? 12 : 14,
                  }}
                >
                  {group.display_name}
                </td>
              </tr>

              {group.rows.map((assignment) => {
                const isNight = assignment.shift_type === "night";
                const rowSurfaceStyle = isNight
                  ? nightRowSurfaceStyleGray
                  : dayRowSurfaceStyle;

                return (
                  <tr key={assignment.id}>
                    <td
                      style={{
                        ...stickySiteBodyStyle,
                        ...rowSurfaceStyle,
                      }}
                    >
                      <div
                        style={{
                          ...siteTitleStyleEnhanced,
                          fontSize: isExportingImage ? 16 : isMobile ? 12 : 14,
                          lineHeight: isExportingImage ? 1.35 : isMobile ? 1.2 : 1.3,
                        }}
                      >
                        {assignment.site_name || "-"}
                      </div>

                      <div style={siteMetaStackStyle}>
                        <div
                          style={{
                            ...contractorBadgeStyle,
                            fontSize: isMobile ? 10 : 11,
                            padding: isMobile ? "3px 6px" : "4px 8px",
                          }}
                        >
                          {assignment.contractor_name || "-"}
                        </div>

                        <div
                          style={{
                            ...(isNight ? shiftBadgeNightStyleGray : shiftBadgeDayStyle),
                            width: "fit-content",
                            fontSize: isMobile ? 10 : 11,
                            padding: isMobile ? "4px 7px" : "5px 8px",
                          }}
                        >
                          {isNight ? "夜勤" : "日勤"}
                        </div>

                        <div
  style={{
    ...siteMetaTextStyle,
    fontSize: isExportingImage ? 16 : isMobile ? 12 : 14,
    lineHeight: isExportingImage ? 1.35 : isMobile ? 1.2 : 1.3,
    fontWeight: 400,
  }}
>
  担当：{assignment.manager_name || "-"}
</div>

<div
  style={{
    ...siteMetaTextStyle,
    fontSize: isExportingImage ? 16 : isMobile ? 12 : 14,
    lineHeight: isExportingImage ? 1.35 : isMobile ? 1.2 : 1.3,
    fontWeight: 400,
  }}
>
  集合：{assignment.meeting_time || "-"}
</div>

                        {isMobile ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDetailModalAssignment({
                                site_name: assignment.site_name,
                                contractor_name: assignment.contractor_name,
                                manager_name: assignment.manager_name,
                                contact_phone: assignment.contact_phone,
                                address: assignment.address,
                                shift_type: assignment.shift_type,
                                files: assignmentFiles.filter(
                                  (file) => file.assignment_id === assignment.id
                                ),
                              })
                            }
                            style={mobileSiteDetailButtonStyle}
                          >
                            詳細を見る
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {displayDates.map((workDate) => {
                      const members = getMembers(assignment.id, workDate);
                      const dailyInfo = getDailyInfo(assignment.id, workDate);

                      return (
                        <td
                          key={`${assignment.id}-${workDate}`}
                          style={{
                            ...boardBodyCellStyle,
                            ...rowSurfaceStyle,
                          }}
                        >
                          <div style={cellCardStyle}>
                            {dailyInfo?.detail ? (
                              <DetailPreview
                                detail={dailyInfo.detail}
                                title={assignment.site_name || "現場詳細"}
                                isMobile={isMobile}
                                onOpen={(title, text) =>
                                  setDetailTextModal({
                                    title,
                                    text,
                                  })
                                }
                              />
                            ) : null}

                            {dailyInfo?.vehicle_names?.length ? (
                              <div
                                style={{
                                  ...vehicleBlockStyle,
                                  fontSize: isExportingImage ? 12 : isMobile ? 10 : 12,
                                }}
                              >
                                🚚 {dailyInfo.vehicle_names.join(" / ")}
                              </div>
                            ) : null}

                            {members.length > 0 ? (
                              <div style={membersBlockWrapStyle}>
                                <div
                                  style={{
                                    ...memberCountLabelStyle,
                                    fontSize: isExportingImage ? 12 : isMobile ? 10 : 12,
                                  }}
                                >
                                  人員 {members.length}人
                                </div>

                                <div style={membersChipWrapStyle}>
                                  {[...members]
                                    .sort(
                                      (a, b) => Number(b.is_foreman) - Number(a.is_foreman)
                                    )
                                    .map((member) => {
                                      const matchKey = `${assignment.id}__${workDate}__${member.id}`;
                                      const isMatched = memberSearchMatchKeySet.has(matchKey);
                                      const isActive =
                                        memberSearchMatches[activeMatchIndex]?.key === matchKey;

                                      return (
                                        <div
                                          key={member.id}
                                          ref={(element) => {
                                            matchElementMapRef.current[matchKey] = element;
                                          }}
                                          style={{
                                            ...memberChipElevatedStyle,
                                            ...(isMatched ? memberChipMatchedStyle : {}),
                                            ...(isActive ? memberChipActiveStyle : {}),
                                            fontSize: isExportingImage ? 12 : isMobile ? 10 : 12,
                                            padding: isExportingImage
                                              ? "7px 10px"
                                              : isMobile
                                              ? "5px 8px"
                                              : "7px 11px",
                                          }}
                                        >
                                          <span>{member.is_foreman ? "👷 " : ""}</span>
                                          <span>{highlightMemberName(member.employee_name)}</span>
                                          {member.is_driver ? <span>🚚</span> : null}
                                          {member.is_operator ? <span>OP</span> : null}
                                          {member.heavy_equipment ? (
                                            <span>{member.heavy_equipment}</span>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DateHeaderCell({
  workDate,
  isExportingImage,
  getWeekday,
}: {
  workDate: string;
  isExportingImage: boolean;
  getWeekday: (date: string) => string;
}) {
  const colors = getDateAccentColors(workDate);

  return (
    <th
      style={{
        ...dateHeaderStyleBase,
        background: `linear-gradient(180deg, ${colors.headerBackground} 0%, #ffffff 100%)`,
        color: colors.headerColor,
      }}
    >
      <div
        style={{
          ...dateHeaderTopTextStyle,
          fontSize: isExportingImage ? 13 : dateHeaderTopTextStyle.fontSize,
        }}
      >
        {workDate}
      </div>
      <div
        style={{
          ...dateHeaderBottomTextStyle,
          fontSize: isExportingImage ? 13 : dateHeaderBottomTextStyle.fontSize,
        }}
      >
        {getWeekday(workDate)}
      </div>
    </th>
  );
}

const tableOuterStyle: React.CSSProperties = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  border: "1px solid #dbe2ea",
  borderRadius: 20,
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
};

const tableStyle: React.CSSProperties = {
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 0,
  width: "100%",
  backgroundColor: "#fff",
};

const stickyHeaderCellStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  padding: "10px 6px",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
  borderBottom: "1px solid #dbe2ea",
};

const stickySiteHeaderStyle: React.CSSProperties = {
  left: 0,
  zIndex: 70,
  minWidth: 116,
  width: 116,
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
};

const dateHeaderStyleBase: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 40,
  minWidth: 118,
  width: 118,
  padding: "8px 4px",
  textAlign: "center",
  borderBottom: "1px solid #dbe2ea",
  borderLeft: "1px solid #eef2f7",
};

const dateHeaderTopTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1.15,
};

const dateHeaderBottomTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  fontWeight: 700,
  opacity: 0.92,
};

const stickySiteBodyStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 20,
  minWidth: 116,
  width: 116,
  padding: "8px 8px",
  borderBottom: "1px solid #edf2f7",
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
  verticalAlign: "top",
};

const dayRowSurfaceStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const nightRowSurfaceStyleGray: React.CSSProperties = {
  background: "linear-gradient(180deg, #bcc3cc 0%, #d1d5db 42%, #e5e7eb 100%)",
};

const shiftBadgeDayStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: 999,
  backgroundColor: "#ecfdf5",
  color: "#166534",
  border: "1px solid #86efac",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const shiftBadgeNightStyleGray: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #374151 0%, #111827 100%)",
  color: "#ffffff",
  border: "1px solid #1f2937",
  boxShadow: "0 6px 14px rgba(17,24,39,0.22)",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const boardBodyCellStyle: React.CSSProperties = {
  minWidth: 118,
  width: 118,
  padding: "8px 4px",
  borderBottom: "1px solid #edf2f7",
  borderLeft: "1px solid #f1f5f9",
  verticalAlign: "top",
  boxSizing: "border-box",
};

const siteTitleStyleEnhanced: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1.2,
  color: "#0f172a",
  letterSpacing: 0,
  wordBreak: "break-word",
};

const siteMetaStackStyle: React.CSSProperties = {
  marginTop: 8,
  display: "grid",
  gap: 4,
};

const contractorBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  padding: "3px 6px",
  borderRadius: 999,
  backgroundColor: "#eef2ff",
  color: "#4338ca",
  fontSize: 10,
  fontWeight: 800,
  wordBreak: "break-word",
};

const siteMetaTextStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const cellCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const vehicleBlockStyle: React.CSSProperties = {
  padding: "8px 9px",
  borderRadius: 12,
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
  border: "1px solid #e5e7eb",
  color: "#334155",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const membersBlockWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const memberCountLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "#0f172a",
};

const membersChipWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const memberChipElevatedStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 8px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)",
  border: "1px solid #fed7aa",
  color: "#111827",
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1.2,
  boxShadow: "0 4px 10px rgba(251,146,60,0.08)",
};

const emptyBoardCellStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#6b7280",
  fontSize: 14,
};

const mobileSiteDetailButtonStyle: React.CSSProperties = {
  marginTop: 4,
  width: "fit-content",
  border: "none",
  borderRadius: 999,
  padding: "5px 9px",
  backgroundColor: "#e2e8f0",
  color: "#0f172a",
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const memberChipMatchedStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)",
  border: "1px solid #f59e0b",
};

const memberChipActiveStyle: React.CSSProperties = {
    outline: "3px solid #2563eb",
    outlineOffset: 2,
    boxShadow: "0 0 0 4px rgba(37,99,235,0.18)",
  };