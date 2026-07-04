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

function getWeekdayIndex(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getDay();
}

function getJapaneseWeekday(date: string) {
  return ["日", "月", "火", "水", "木", "金", "土"][getWeekdayIndex(date)];
}

function getDayHeaderStyle(date: string): React.CSSProperties {
  const day = getWeekdayIndex(date);

  if (day === 0) {
    return {
      ...dayHeaderBaseStyle,
      backgroundColor: "#f8e6e6",
      borderColor: "#efcaca",
      color: "#dc2626",
    };
  }

  if (day === 6) {
    return {
      ...dayHeaderBaseStyle,
      backgroundColor: "#e8f0fb",
      borderColor: "#c8dbf7",
      color: "#2563eb",
    };
  }

  return {
    ...dayHeaderBaseStyle,
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    color: "#111827",
  };
}

function formatDateCompact(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
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

export default function PublicAssignmentsPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  const [data, setData] = useState<PublicAssignmentsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

        const res = await fetch(`/api/public/assignments/${encodeURIComponent(token)}`, {
          method: "GET",
          cache: "no-store",
        });

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

    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalAssignments = useMemo(() => {
    if (!data) return 0;
    return data.days.reduce((sum, day) => sum + day.assignments.length, 0);
  }, [data]);

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

  const columns = useMemo(() => {
    if (!data) return "1fr";
    return data.viewMode === "week"
      ? "repeat(7, minmax(300px, 1fr))"
      : "repeat(3, minmax(320px, 1fr))";
  }, [data]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>公開番割</div>
            <h1 style={titleStyle}>{data?.shareTitle?.trim() || "番割表"}</h1>
            <div style={subTitleStyle}>
              {data?.organizationName?.trim() || "組織名未設定"}
            </div>
          </div>

          {data && (
            <div style={metaWrapStyle}>
              <div style={metaCardStyle}>
                <div style={metaLabelStyle}>表示形式</div>
                <div style={metaValueLargeStyle}>
                  {data.viewMode === "week" ? "今週1週間" : "翌日から3日間"}
                </div>
              </div>

              <div style={metaCardStyle}>
                <div style={metaLabelStyle}>有効期限</div>
                <div style={metaValueStyle}>{formatExpiresAt(data.expiresAt)}</div>
              </div>
            </div>
          )}
        </header>

        {loading && (
          <div style={panelStyle}>
            <div style={loadingTextStyle}>読み込み中...</div>
          </div>
        )}

        {!loading && error && (
          <div style={errorPanelStyle}>
            <div style={errorTitleStyle}>表示できません</div>
            <div style={errorTextStyle}>{error}</div>
            {token ? <div style={tokenStyle}>token: {token}</div> : null}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div style={summaryBarStyle}>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>日数</div>
                <div style={summaryValueStyle}>{data.days.length}日</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>現場数</div>
                <div style={summaryValueStyle}>{totalAssignments}件</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>配置人数</div>
                <div style={summaryValueStyle}>{totalMembers}人</div>
              </div>
            </div>

            <div style={scrollWrapStyle}>
              <div style={{ ...daysGridStyle, gridTemplateColumns: columns }}>
                {data.days.map((day) => (
                  <section key={day.date} style={dayColumnStyle}>
                    <div style={getDayHeaderStyle(day.date)}>
                      <div style={dayLabelTopStyle}>{day.label}</div>
                      <div style={dayWeekStyle}>{getJapaneseWeekday(day.date)}</div>
                      <div style={dayDateStyle}>{formatDateCompact(day.date)}</div>
                    </div>

                    {day.assignments.length === 0 ? (
                      <div style={emptyDayStyle}>番割はありません</div>
                    ) : (
                      <div style={cardsColumnStyle}>
  {day.assignments.map((row) => {
    const members = Array.isArray(row.members) ? row.members : [];

    return (
      <article
        key={`${day.date}-${row.assignment_id}`}
        style={row.shift_type === "night" ? nightCardStyle : cardStyle}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div style={siteTitleStyle}>
            {row.site_name || "現場名未設定"}
          </div>

          <div
            style={
              row.shift_type === "night"
                ? softNightShiftBadgeStyle
                : dayShiftBadgeStyle
            }
          >
            {row.shift_type === "night" ? "夜勤" : "昼勤"}
          </div>
        </div>

        <div style={contractorTextStyle}>
          元請：{row.contractor_name || "-"}
        </div>

        <div style={infoLineStyle}>集合：{row.meeting_time || "-"}</div>
        <div style={infoLineStyle}>担当：{row.manager_name || "-"}</div>

        <div style={infoLineStyle}>
          連絡先：
          {row.contact_phone ? (
            <a href={toTelHref(row.contact_phone)} style={infoLinkStyle}>
              {row.contact_phone}
            </a>
          ) : (
            " -"
          )}
        </div>

        <div style={infoLineStyle}>
          住所：
          {row.address ? (
            <a
              href={
                isUrl(row.address)
                  ? row.address
                  : toGoogleMapsSearchUrl(row.address)
              }
              target="_blank"
              rel="noreferrer"
              style={addressLinkStyle}
            >
              {row.address}
            </a>
          ) : (
            " -"
          )}
        </div>

        {row.notes ? (
          <div style={notesBarStyle}>作業：{row.notes}</div>
        ) : null}

        <div style={memberCountStyle}>人員 {members.length}人</div>

        <div style={membersWrapStyle}>
          {[...members]
            .sort((a, b) => {
              if (a.is_foreman === b.is_foreman) return 0;
              return a.is_foreman ? -1 : 1;
            })
            .map((member, index) => (
              <div
                key={`${day.date}-${row.assignment_id}-${member.employee_name}-${index}`}
                style={memberChipStyle}
              >
                <span>{member.employee_name}</span>
                {member.is_foreman ? (
                  <span style={foremanBadgeStyle}>職長</span>
                ) : null}
              </div>
            ))}
        </div>
      </article>
    );
  })}
</div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f3f4f6",
  padding: "24px 16px 40px",
  boxSizing: "border-box",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "100%",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
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
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.2,
  fontWeight: 900,
  color: "#111827",
};

const subTitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 15,
  color: "#4b5563",
  fontWeight: 600,
};

const metaWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const metaCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 14px",
  minWidth: 180,
  boxSizing: "border-box",
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 700,
  marginBottom: 6,
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#111827",
  fontWeight: 800,
};

const metaValueLargeStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#111827",
  fontWeight: 900,
};

const panelStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 24,
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#374151",
};

const errorPanelStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 16,
  padding: 24,
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

const tokenStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: "#991b1b",
  wordBreak: "break-all",
};

const summaryBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#6b7280",
  marginBottom: 8,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1,
};

const scrollWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  paddingBottom: 8,
};

const daysGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  alignItems: "start",
  minWidth: "max-content",
};

const dayColumnStyle: React.CSSProperties = {
  width: 300,
};

const dayHeaderBaseStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 10px",
  marginBottom: 8,
  textAlign: "center",
  boxSizing: "border-box",
};

const dayLabelTopStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.2,
};

const dayWeekStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 34,
  fontWeight: 900,
  lineHeight: 1,
};

const dayDateStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 700,
  color: "inherit",
  opacity: 0.9,
};

const emptyDayStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  color: "#6b7280",
  fontSize: 14,
};

const cardsColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  boxSizing: "border-box",
};

const nightCardStyle: React.CSSProperties = {
  backgroundColor: "#f8fbff",
  border: "1px solid #dbeafe",
  borderLeft: "5px solid #60a5fa",
  borderRadius: 12,
  padding: 14,
  boxSizing: "border-box",
};

const siteTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.3,
  marginBottom: 8,
};

const contractorTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  fontWeight: 700,
  marginBottom: 8,
};

const infoLineStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const addressLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
  marginLeft: 2,
};

const notesBarStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 10,
  padding: "8px 10px",
  borderRadius: 8,
  backgroundColor: "#e6f4ec",
  color: "#166534",
  fontSize: 13,
  fontWeight: 800,
};

const memberCountStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 10,
  fontSize: 14,
  fontWeight: 900,
  color: "#111827",
};

const membersWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const memberChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  backgroundColor: "#faf4ea",
  border: "1px solid #f0dcc0",
  color: "#111827",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
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

const dayShiftBadgeStyle: React.CSSProperties = {
  flexShrink: 0,
  backgroundColor: "#f3f4f6",
  color: "#4b5563",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1,
};

const softNightShiftBadgeStyle: React.CSSProperties = {
  flexShrink: 0,
  backgroundColor: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1,
};

const infoLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
  marginLeft: 2,
};