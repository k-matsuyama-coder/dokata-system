"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type PublicAssignmentMember = {
  employee_name: string;
  is_foreman: boolean | null;
};

type PublicAssignmentRow = {
  assignment_id: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  notes: string | null;
  members?: PublicAssignmentMember[] | null;
};

type PublicAssignmentsDay = {
  date: string;
  label: string;
  assignments: PublicAssignmentRow[];
};

type PublicAssignmentsResponse = {
  ok: true;
  shareTitle: string | null;
  organizationName: string | null;
  expiresAt: string;
  createdAt: string;
  viewMode: "week" | "next3days";
  baseDate: string;
  days: PublicAssignmentsDay[];
};

type PublicAssignmentsErrorResponse = {
  ok: false;
  error: string;
};

type AggregatedRow = {
  rowKey: string;
  assignment_id: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time_by_date: Record<string, string | null | undefined>;
  notes_by_date: Record<string, string | null | undefined>;
  members_by_date: Record<string, PublicAssignmentMember[]>;
};

function getWeekdayIndex(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getDay();
}

function getJapaneseWeekday(date: string) {
  return ["日", "月", "火", "水", "木", "金", "土"][getWeekdayIndex(date)];
}

function formatDateCompact(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function formatExpiresAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function toGoogleMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function getRowKey(row: PublicAssignmentRow) {
  return `${row.assignment_id}_${row.shift_type ?? "day"}`;
}

function getDateHeaderStyle(date: string): React.CSSProperties {
  const day = getWeekdayIndex(date);

  if (day === 0) {
    return {
      ...dateHeaderStyleBase,
      background:
        "linear-gradient(180deg, rgba(254,242,242,1) 0%, rgba(255,255,255,1) 100%)",
      color: "#dc2626",
      borderColor: "#fecaca",
    };
  }

  if (day === 6) {
    return {
      ...dateHeaderStyleBase,
      background:
        "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 100%)",
      color: "#2563eb",
      borderColor: "#bfdbfe",
    };
  }

  return {
    ...dateHeaderStyleBase,
    background:
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
      color: "#111827",
      borderColor: "#e5e7eb",
    };
}

export default function PublicAssignmentsPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  const [data, setData] = useState<PublicAssignmentsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setError("公開トークンがありません");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/public/assignments/${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json =
          ((await res.json()) as
            | PublicAssignmentsResponse
            | PublicAssignmentsErrorResponse) ?? null;

        if (cancelled) return;

        if (!res.ok || !json || !("ok" in json) || !json.ok) {
          setData(null);
          setError(
            json && "error" in json && typeof json.error === "string"
              ? json.error
              : "公開ページの取得に失敗しました"
          );
          return;
        }

        setData(json);
      } catch {
        if (cancelled) return;
        setData(null);
        setError("公開ページの取得に失敗しました");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalMembers = useMemo(() => {
    if (!data) return 0;
    return data.days.reduce(
      (sum, day) =>
        sum +
        day.assignments.reduce((innerSum, assignment) => {
          const members = Array.isArray(assignment.members) ? assignment.members : [];
          return innerSum + members.length;
        }, 0),
      0
    );
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];

    const rowMap = new Map<string, AggregatedRow>();

    for (const day of data.days) {
      for (const assignment of day.assignments) {
        const key = getRowKey(assignment);
        const members = Array.isArray(assignment.members) ? assignment.members : [];

        if (!rowMap.has(key)) {
          rowMap.set(key, {
            rowKey: key,
            assignment_id: assignment.assignment_id,
            contractor_name: assignment.contractor_name,
            site_name: assignment.site_name,
            shift_type: assignment.shift_type,
            manager_name: assignment.manager_name,
            contact_phone: assignment.contact_phone,
            address: assignment.address,
            meeting_time_by_date: {},
            notes_by_date: {},
            members_by_date: {},
          });
        }

        const current = rowMap.get(key)!;
        current.meeting_time_by_date[day.date] = assignment.meeting_time;
        current.notes_by_date[day.date] = assignment.notes;
        current.members_by_date[day.date] = members;
      }
    }

    return Array.from(rowMap.values());
  }, [data]);

  const groupedRows = useMemo(() => {
    const dayRows = rows.filter((row) => row.shift_type !== "night");
    const nightRows = rows.filter((row) => row.shift_type === "night");

    const sorter = (a: AggregatedRow, b: AggregatedRow) => {
      const contractorCompare = (a.contractor_name ?? "").localeCompare(
        b.contractor_name ?? "",
        "ja"
      );
      if (contractorCompare !== 0) return contractorCompare;
      return (a.site_name ?? "").localeCompare(b.site_name ?? "", "ja");
    };

    return {
      dayRows: [...dayRows].sort(sorter),
      nightRows: [...nightRows].sort(sorter),
    };
  }, [rows]);

  return (
    <div style={publicPageStyle}>
      <div style={publicContainerStyle}>
        <header style={topHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>公開番割</div>
            <h1 style={pageTitleStyle}>{data?.shareTitle?.trim() || "番割表"}</h1>
            <div style={pageSubTitleStyle}>
              {data?.organizationName?.trim() || "組織名未設定"}
            </div>
          </div>

          {data && (
            <div style={summaryMetaWrapStyle}>
              <div style={summaryMetaCardStyle}>
                <div style={summaryMetaLabelStyle}>表示形式</div>
                <div style={summaryMetaValueStyle}>
                  {data.viewMode === "week" ? "今週1週間" : "翌日から3日間"}
                </div>
              </div>

              <div style={summaryMetaCardStyle}>
                <div style={summaryMetaLabelStyle}>有効期限</div>
                <div style={summaryMetaValueStyle}>{formatExpiresAt(data.expiresAt)}</div>
              </div>

              <div style={summaryMetaCardStyle}>
                <div style={summaryMetaLabelStyle}>配置人数</div>
                <div style={summaryMetaValueStyle}>{totalMembers}人</div>
              </div>
            </div>
          )}
        </header>

        {loading && (
          <div style={statusPanelStyle}>
            <div style={statusTextStyle}>読み込み中...</div>
          </div>
        )}

        {!loading && error && (
          <div style={errorPanelStyle}>
            <div style={errorTitleStyle}>表示できません</div>
            <div style={errorTextStyle}>{error}</div>
          </div>
        )}

        {!loading && !error && data && (
          <div style={boardWrapStyle}>
            <div style={sectionTitleWrapStyle}>
              <div style={sectionPillDayStyle}>日勤</div>
            </div>
            <BoardTable rows={groupedRows.dayRows} days={data.days} isMobile={isMobile} />

            {groupedRows.nightRows.length > 0 && (
              <>
                <div style={{ ...sectionTitleWrapStyle, marginTop: 22 }}>
                  <div style={sectionPillNightStyle}>夜勤</div>
                </div>
                <BoardTable rows={groupedRows.nightRows} days={data.days} isMobile={isMobile} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardTable({
  rows,
  days,
  isMobile,
}: {
  rows: AggregatedRow[];
  days: PublicAssignmentsDay[];
  isMobile: boolean;
}) {
  const siteColumnWidth = isMobile ? 116 : 180;
  const shiftColumnWidth = isMobile ? 54 : 64;
  const dayColumnWidth = isMobile ? 118 : 150;

  return (
    <div style={boardTableOuterStyle}>
      <table
        style={{
          ...boardTableStyle,
          minWidth: siteColumnWidth + shiftColumnWidth + dayColumnWidth * days.length,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...stickyHeaderCellStyle,
                ...stickySiteHeaderStyle,
                minWidth: siteColumnWidth,
                width: siteColumnWidth,
              }}
            >
              現場
            </th>

            <th
              style={{
                ...stickyHeaderCellStyle,
                ...stickyShiftHeaderStyle,
                left: siteColumnWidth,
                minWidth: shiftColumnWidth,
                width: shiftColumnWidth,
              }}
            >
              区分
            </th>

            {days.map((day) => (
              <th
                key={day.date}
                style={{
                  ...getDateHeaderStyle(day.date),
                  minWidth: dayColumnWidth,
                  width: dayColumnWidth,
                  padding: isMobile ? "8px 4px" : "10px 6px",
                }}
              >
                <div style={dateHeaderTopTextStyle}>{day.label}</div>
                <div style={dateHeaderWeekTextStyle}>{getJapaneseWeekday(day.date)}</div>
                <div style={dateHeaderBottomTextStyle}>{formatDateCompact(day.date)}</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2 + days.length} style={emptyBoardCellStyle}>
                番割はありません
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isNight = row.shift_type === "night";
              const rowSurfaceStyle = isNight
                ? publicNightRowSurfaceStyleGray
                : publicDayRowSurfaceStyle;
              const shiftBadgeStyle = isNight
                ? publicShiftBadgeNightStyleGray
                : publicShiftBadgeDayStyle;

              return (
                <tr key={row.rowKey}>
                  <td
                    style={{
                      ...stickySiteBodyStyle,
                      ...rowSurfaceStyle,
                      minWidth: siteColumnWidth,
                      width: siteColumnWidth,
                      padding: isMobile ? "8px 8px" : "10px 10px",
                    }}
                  >
                    <div
                      style={{
                        ...siteTitleStyleEnhanced,
                        fontSize: isMobile ? 12 : 14,
                        lineHeight: isMobile ? 1.2 : 1.3,
                      }}
                    >
                      {row.site_name || "現場名未設定"}
                    </div>

                    <div style={siteMetaStackStyle}>
                      <div
                        style={{
                          ...contractorBadgeStyle,
                          fontSize: isMobile ? 10 : 11,
                          padding: isMobile ? "3px 6px" : "4px 8px",
                        }}
                      >
                        {row.contractor_name || "-"}
                      </div>

                      {row.manager_name ? (
                        <div
                          style={{
                            ...siteMetaTextStyle,
                            fontSize: isMobile ? 10 : 11,
                            lineHeight: isMobile ? 1.25 : 1.35,
                          }}
                        >
                          担当：{row.manager_name}
                        </div>
                      ) : null}

                      {row.contact_phone ? (
                        <div
                          style={{
                            ...siteMetaTextStyle,
                            fontSize: isMobile ? 10 : 11,
                            lineHeight: isMobile ? 1.25 : 1.35,
                          }}
                        >
                          連絡先：
                          <a href={toTelHref(row.contact_phone)} style={inlineLinkStyle}>
                            {row.contact_phone}
                          </a>
                        </div>
                      ) : null}

                      {row.address ? (
                        <div
                          style={{
                            ...siteMetaTextStyle,
                            fontSize: isMobile ? 10 : 11,
                            lineHeight: isMobile ? 1.25 : 1.35,
                          }}
                        >
                          住所：
                          <a
                            href={
                              isUrl(row.address)
                                ? row.address
                                : toGoogleMapsSearchUrl(row.address)
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={inlineLinkStyle}
                          >
                            {row.address}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </td>

                  <td
                    style={{
                      ...stickyShiftBodyStyle,
                      ...rowSurfaceStyle,
                      left: siteColumnWidth,
                      minWidth: shiftColumnWidth,
                      width: shiftColumnWidth,
                      padding: isMobile ? "8px 4px" : "10px 6px",
                    }}
                  >
                    <div
                      style={{
                        ...shiftBadgeStyle,
                        fontSize: isMobile ? 11 : 13,
                        padding: isMobile ? "5px 8px" : "6px 10px",
                      }}
                    >
                      {isNight ? "夜勤" : "日勤"}
                    </div>
                  </td>

                  {days.map((day) => {
                    const members = row.members_by_date[day.date] ?? [];
                    const notes = row.notes_by_date[day.date];
                    const meetingTime = row.meeting_time_by_date[day.date];

                    return (
                      <td
                        key={`${row.rowKey}_${day.date}`}
                        style={{
                          ...boardBodyCellStyle,
                          ...rowSurfaceStyle,
                          minWidth: dayColumnWidth,
                          width: dayColumnWidth,
                          padding: isMobile ? "8px 4px" : "10px 6px",
                        }}
                      >
                        <div style={cellCardStyle}>
                          {meetingTime ? (
                            <div
                              style={{
                                ...miniInfoPillStyle,
                                fontSize: isMobile ? 10 : 12,
                                padding: isMobile ? "4px 8px" : "5px 10px",
                              }}
                            >
                              集合 {meetingTime}
                            </div>
                          ) : null}

                          {notes ? (
                            <div
                              style={{
                                ...notesBlockStyle,
                                fontSize: isMobile ? 10 : 12,
                              }}
                            >
                              {notes}
                            </div>
                          ) : null}

                          {members.length > 0 ? (
                            <div style={membersBlockWrapStyle}>
                              <div
                                style={{
                                  ...memberCountLabelStyle,
                                  fontSize: isMobile ? 10 : 12,
                                }}
                              >
                                人員 {members.length}人
                              </div>

                              <div style={membersChipWrapStyle}>
                                {[...members]
                                  .sort((a, b) => {
                                    if (a.is_foreman === b.is_foreman) return 0;
                                    return a.is_foreman ? -1 : 1;
                                  })
                                  .map((member, index) => (
                                    <div
                                      key={`${day.date}-${row.assignment_id}-${member.employee_name}-${index}`}
                                      style={{
                                        ...memberChipElevatedStyle,
                                        fontSize: isMobile ? 10 : 12,
                                        padding: isMobile ? "5px 8px" : "7px 11px",
                                      }}
                                    >
                                      <span>{member.employee_name}</span>
                                      {member.is_foreman ? (
                                        <span style={foremanBadgeStyle}>職長</span>
                                      ) : null}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const publicPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)",
  padding: "24px 16px 40px",
  boxSizing: "border-box",
};

const publicContainerStyle: React.CSSProperties = {
  maxWidth: "100%",
  margin: "0 auto",
};

const topHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#2563eb",
  marginBottom: 6,
  letterSpacing: 0.4,
};

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.15,
  fontWeight: 900,
  color: "#111827",
};

const pageSubTitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 15,
  color: "#4b5563",
  fontWeight: 600,
};

const summaryMetaWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const summaryMetaCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "12px 14px",
  minWidth: 180,
  boxSizing: "border-box",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
};

const summaryMetaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 700,
  marginBottom: 6,
};

const summaryMetaValueStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#111827",
  fontWeight: 900,
};

const statusPanelStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#374151",
};

const errorPanelStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 28px rgba(127,29,29,0.08)",
};

const errorTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#991b1b",
  marginBottom: 10,
};

const errorTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#7f1d1d",
  whiteSpace: "pre-wrap",
};

const boardWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const sectionTitleWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const sectionPillDayStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 14px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #ecfdf5 0%, #dcfce7 100%)",
  color: "#166534",
  border: "1px solid #bbf7d0",
  fontSize: 13,
  fontWeight: 900,
  boxShadow: "0 6px 16px rgba(22,101,52,0.08)",
};

const sectionPillNightStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 14px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #4b5563 0%, #111827 100%)",
  color: "#ffffff",
  border: "1px solid #374151",
  fontSize: 13,
  fontWeight: 900,
  boxShadow: "0 8px 18px rgba(17,24,39,0.18)",
};

const boardTableOuterStyle: React.CSSProperties = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  border: "1px solid #dbe2ea",
  borderRadius: 20,
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
};

const boardTableStyle: React.CSSProperties = {
  borderCollapse: "separate",
  borderSpacing: 0,
  width: "100%",
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

const stickyShiftHeaderStyle: React.CSSProperties = {
  left: 116,
  zIndex: 71,
  minWidth: 54,
  width: 54,
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

const dateHeaderWeekTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1,
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

const stickyShiftBodyStyle: React.CSSProperties = {
  position: "sticky",
  left: 116,
  zIndex: 21,
  minWidth: 54,
  width: 54,
  padding: "8px 4px",
  borderBottom: "1px solid #edf2f7",
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
  textAlign: "center",
  verticalAlign: "top",
};

const publicDayRowSurfaceStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const publicNightRowSurfaceStyleGray: React.CSSProperties = {
  background: "linear-gradient(180deg, #bcc3cc 0%, #d1d5db 42%, #e5e7eb 100%)",
};

const publicShiftBadgeDayStyle: React.CSSProperties = {
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

const publicShiftBadgeNightStyleGray: React.CSSProperties = {
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

const inlineLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
  marginLeft: 2,
  fontWeight: 700,
};

const cellCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const miniInfoPillStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "4px 8px",
  borderRadius: 999,
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#1e293b",
  fontSize: 10,
  fontWeight: 800,
};

const notesBlockStyle: React.CSSProperties = {
  padding: "8px 9px",
  borderRadius: 12,
  background: "linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)",
  border: "1px solid #d1d5db",
  color: "#374151",
  fontSize: 10,
  fontWeight: 800,
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

const foremanBadgeStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: 999,
  padding: "2px 6px",
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1,
};

const emptyBoardCellStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#6b7280",
  fontSize: 14,
};