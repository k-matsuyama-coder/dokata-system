// app/(system)/admin/assignments/two-month/components/MobileView.tsx
"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Assignment } from "../types";

type GroupedAssignment = {
  label: string;
  rows: Assignment[];
  color: string;
};

type Props = {
  days: string[];
  groupedAssignments: GroupedAssignment[];
  getPlannedCount: (assignmentId: string, workDate: string) => number | "";
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => void;
};

type MonthSummary = {
  firstMonthLabel: string;
  secondMonthLabel: string;
  firstMonthTotal: number;
  secondMonthTotal: number;
  grandTotal: number;
};

type DailyTotalSummary = {
  total: number;
  first: number;
  second: number;
  third: number;
};

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string) {
  const [, month] = monthKey.split("-");
  return `${Number(month)}月`;
}

function formatDateLabel(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getWeekday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return ["日", "月", "火", "水", "木", "金", "土"][parsed.getDay()] ?? "";
}

function getWeekdayIndex(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export default function MobileView({
  days,
  groupedAssignments,
  getPlannedCount,
  updateDailyInfo,
}: Props) {
  const assignments = useMemo(
    () => groupedAssignments.flatMap((group) => group.rows),
    [groupedAssignments]
  );

  const monthKeys = useMemo(() => {
    return Array.from(new Set(days.map(getMonthKey))).slice(0, 2);
  }, [days]);

  const firstMonthKey = monthKeys[0] ?? "";
  const secondMonthKey = monthKeys[1] ?? "";

  const monthSummary = useMemo<MonthSummary>(() => {
    let firstMonthTotal = 0;
    let secondMonthTotal = 0;

    assignments.forEach((assignment) => {
      days.forEach((date) => {
        const count = Number(getPlannedCount(assignment.id, date) || 0);
        const monthKey = getMonthKey(date);

        if (monthKey === firstMonthKey) {
          firstMonthTotal += count;
        } else if (monthKey === secondMonthKey) {
          secondMonthTotal += count;
        }
      });
    });

    return {
      firstMonthLabel: firstMonthKey
        ? formatMonthLabel(firstMonthKey)
        : "前月",
      secondMonthLabel: secondMonthKey
        ? formatMonthLabel(secondMonthKey)
        : "後月",
      firstMonthTotal,
      secondMonthTotal,
      grandTotal: firstMonthTotal + secondMonthTotal,
    };
  }, [
    assignments,
    days,
    firstMonthKey,
    secondMonthKey,
    getPlannedCount,
  ]);

  const siteTotalMap = useMemo(() => {
    const totals = new Map<string, number>();

    assignments.forEach((assignment) => {
      const total = days.reduce((sum, date) => {
        return sum + Number(getPlannedCount(assignment.id, date) || 0);
      }, 0);

      totals.set(assignment.id, total);
    });

    return totals;
  }, [assignments, days, getPlannedCount]);

  const dailyTotalMap = useMemo(() => {
    const totals = new Map<string, DailyTotalSummary>();
  
    days.forEach((date) => {
      totals.set(date, {
        total: 0,
        first: 0,
        second: 0,
        third: 0,
      });
    });
  
    groupedAssignments.forEach((group) => {
      group.rows.forEach((assignment) => {
        days.forEach((date) => {
          const count = Number(
            getPlannedCount(assignment.id, date) || 0
          );
  
          const summary = totals.get(date);
  
          if (!summary) return;
  
          summary.total += count;
  
          if (assignment.group_key === "group1") {
            summary.first += count;
          } else if (assignment.group_key === "group2") {
            summary.second += count;
          } else if (assignment.group_key === "group3") {
            summary.third += count;
          }
        });
      });
    });
  
    return totals;
  }, [days, groupedAssignments, getPlannedCount]);

  const scrollContainersRef = useRef<Set<HTMLDivElement>>(new Set());
const isSyncingScrollRef = useRef(false);
const registerScrollContainer = useCallback(
  (element: HTMLDivElement | null) => {
    if (!element) return;

    scrollContainersRef.current.add(element);
  },
  []
);

const handleSynchronizedScroll = useCallback(
  (event: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScrollRef.current) return;

    const source = event.currentTarget;
    const nextScrollLeft = source.scrollLeft;

    isSyncingScrollRef.current = true;

    scrollContainersRef.current.forEach((container) => {
      if (container === source) return;

      container.scrollLeft = nextScrollLeft;
    });

    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  },
  []
);

  const today = new Date().toISOString().slice(0, 10);

  if (days.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          textAlign: "center",
          color: "#6b7280",
          fontWeight: 700,
        }}
      >
        表示できる日付がありません
      </div>
    );
  }

  return (
    <div style={pageWrapStyle}>
      <section style={summaryCardStyle}>
        <div style={summaryTitleStyle}>全現場合計</div>

        <div style={summaryGridStyle}>
          <div style={summaryItemStyle}>
            <div style={summaryLabelStyle}>
              {monthSummary.firstMonthLabel}
            </div>
            <div style={summaryValueStyle}>
              {monthSummary.firstMonthTotal}
              <span style={summaryUnitStyle}>人</span>
            </div>
          </div>

          <div style={summaryItemStyle}>
            <div style={summaryLabelStyle}>
              {monthSummary.secondMonthLabel}
            </div>
            <div style={summaryValueStyle}>
              {monthSummary.secondMonthTotal}
              <span style={summaryUnitStyle}>人</span>
            </div>
          </div>

          <div style={summaryGrandItemStyle}>
            <div style={summaryGrandLabelStyle}>2か月合計</div>
            <div style={summaryGrandValueStyle}>
              {monthSummary.grandTotal}
              <span style={summaryGrandUnitStyle}>人</span>
            </div>
          </div>
        </div>
      </section>

      <section style={dailySummaryCardStyle}>
  <div style={dailySummaryTitleStyle}>日別合計</div>

  <div
  ref={registerScrollContainer}
  onScroll={handleSynchronizedScroll}
  style={dateScrollOuterStyle}
>
    <div
      style={{
        ...dateGridStyle,
        gridTemplateColumns: `repeat(${days.length}, 54px)`,
      }}
    >
      {days.map((date) => {
        const weekdayIndex = getWeekdayIndex(date);
        const isSunday = weekdayIndex === 0;
        const isSaturday = weekdayIndex === 6;
        const isToday = date === today;

        const summary = dailyTotalMap.get(date) ?? {
          total: 0,
          first: 0,
          second: 0,
          third: 0,
        };

        return (
          <div
            key={date}
            style={{
              ...dailySummaryColumnStyle,
              backgroundColor: isToday
                ? "#dbeafe"
                : isSunday
                  ? "#fee2e2"
                  : isSaturday
                    ? "#e5f0ff"
                    : "#f9fafb",
              borderColor: isToday ? "#2563eb" : "#e5e7eb",
            }}
          >
            <div
              style={{
                ...dailySummaryDateStyle,
                color: isSunday
                  ? "#dc2626"
                  : isSaturday
                    ? "#2563eb"
                    : "#111827",
              }}
            >
              {formatDateLabel(date)}
            </div>

            <div
              style={{
                ...dailySummaryMainStyle,
                color: isSunday
                  ? "#dc2626"
                  : isSaturday
                    ? "#2563eb"
                    : "#111827",
              }}
            >
              全 {summary.total}
            </div>

            <div style={dailySummarySubStyle}>
              ① {summary.first}
            </div>

            <div style={dailySummarySubStyle}>
              ② {summary.second}
            </div>

            <div style={dailySummarySubStyle}>
              ③ {summary.third}
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>

      <div style={scrollHintStyle}>左右にスクロールして2か月分を確認できます</div>

      {groupedAssignments.map((group) => (
        <section key={group.label} style={groupSectionStyle}>
          <div
            style={{
              ...groupHeaderStyle,
              backgroundColor: group.color,
            }}
          >
            {group.label}
          </div>

          <div style={groupRowsStyle}>
            {group.rows.map((assignment) => {
              const siteTotal = siteTotalMap.get(assignment.id) ?? 0;
              const isNight = assignment.shift_type === "night";

              return (
                <article
  key={assignment.id}
  style={{
    ...siteCardStyle,
    backgroundColor: isNight ? "#e5e7eb" : "#ffffff",
    borderColor: isNight ? "#9ca3af" : "#dbe2ea",
  }}
>
<div
  style={{
    ...siteHeaderStyle,
    backgroundColor: isNight ? "#d1d5db" : "#ffffff",
  }}
>
                    <div style={siteInfoStyle}>
                      <div style={siteNameStyle}>
                        {assignment.site_name || "-"}
                      </div>

                      {isNight && (
  <div
    style={{
      display: "inline-flex",
      marginTop: 6,
      padding: "3px 7px",
      borderRadius: 999,
      backgroundColor: "#374151",
      color: "#ffffff",
      fontSize: 9,
      fontWeight: 900,
    }}
  >
    夜勤
  </div>
)}

                      <div style={contractorNameStyle}>
                        {assignment.contractor_name || "-"}
                      </div>

                      <div style={periodStyle}>
                        {assignment.start_date || "-"} ～{" "}
                        {assignment.end_date || "-"}
                      </div>
                    </div>

                    <div style={siteTotalStyle}>
                      <div style={siteTotalLabelStyle}>現場合計</div>
                      <div style={siteTotalValueStyle}>
                        {siteTotal}
                        <span style={siteTotalUnitStyle}>人</span>
                      </div>
                    </div>
                  </div>

                  <div
  ref={registerScrollContainer}
  onScroll={handleSynchronizedScroll}
  style={dateScrollOuterStyle}
>
                    <div
                      style={{
                        ...dateGridStyle,
                        gridTemplateColumns: `repeat(${days.length}, 54px)`,
                      }}
                    >
                      {days.map((date) => {
                        const weekdayIndex = getWeekdayIndex(date);
                        const isSunday = weekdayIndex === 0;
                        const isSaturday = weekdayIndex === 6;
                        const isToday = date === today;
                        const value = getPlannedCount(assignment.id, date);

                        return (
                          <div
                            key={date}
                            style={{
                              ...dayColumnStyle,
                              backgroundColor: isToday
                                ? "#dbeafe"
                                : isSunday
                                  ? "#fff1f2"
                                  : isSaturday
                                    ? "#eff6ff"
                                    : "#f9fafb",
                              borderColor: isToday ? "#2563eb" : "#e5e7eb",
                              boxShadow: isToday
                                ? "inset 0 0 0 1px #2563eb"
                                : "none",
                            }}
                          >
                            <div
                              style={{
                                ...dateTextStyle,
                                color: isSunday
                                  ? "#dc2626"
                                  : isSaturday
                                    ? "#2563eb"
                                    : "#111827",
                              }}
                            >
                              {formatDateLabel(date)}
                            </div>

                            <div
                              style={{
                                ...weekdayTextStyle,
                                color: isSunday
                                  ? "#dc2626"
                                  : isSaturday
                                    ? "#2563eb"
                                    : "#6b7280",
                              }}
                            >
                              {getWeekday(date)}
                            </div>

                            <input
                              key={`${assignment.id}_${date}_${value}`}
                              type="number"
                              min={0}
                              inputMode="numeric"
                              defaultValue={value}
                              onClick={(event) => event.stopPropagation()}
                              onTouchStart={(event) =>
                                event.stopPropagation()
                              }
                              onBlur={(event) => {
                                const rawValue = event.currentTarget.value;
                                const safeValue =
                                  rawValue === ""
                                    ? ""
                                    : String(
                                        Math.max(0, Number(rawValue) || 0)
                                      );

                                event.currentTarget.value = safeValue;

                                updateDailyInfo(
                                  assignment.id,
                                  date,
                                  "planned_count",
                                  safeValue
                                );
                              }}
                              style={countInputStyle}
                              aria-label={`${assignment.site_name || "現場"} ${date} 人数`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const pageWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
  width: "100%",
  minWidth: 0,
};

const summaryCardStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  padding: 12,
  border: "1px solid #dbe2ea",
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.96)",
  boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
  backdropFilter: "blur(8px)",
};

const summaryTitleStyle: React.CSSProperties = {
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1.25fr",
  gap: 8,
};

const summaryItemStyle: React.CSSProperties = {
  padding: "9px 6px",
  borderRadius: 10,
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  textAlign: "center",
};

const summaryGrandItemStyle: React.CSSProperties = {
  padding: "9px 6px",
  borderRadius: 10,
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  textAlign: "center",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "#64748b",
};

const summaryValueStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: 18,
  fontWeight: 900,
  color: "#111827",
};

const summaryUnitStyle: React.CSSProperties = {
  marginLeft: 2,
  fontSize: 10,
  fontWeight: 800,
};

const summaryGrandLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "#1d4ed8",
};

const summaryGrandValueStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: 20,
  fontWeight: 900,
  color: "#1d4ed8",
};

const summaryGrandUnitStyle: React.CSSProperties = {
  marginLeft: 2,
  fontSize: 10,
  fontWeight: 900,
};

const scrollHintStyle: React.CSSProperties = {
  padding: "0 4px",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
};

const groupSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const groupHeaderStyle: React.CSSProperties = {
  position: "sticky",
  top: 98,
  zIndex: 20,
  padding: "9px 10px",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 900,
  color: "#111827",
};

const groupRowsStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const siteCardStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  border: "1px solid #dbe2ea",
  borderRadius: 14,
  backgroundColor: "#ffffff",
  boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
};

const siteHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
};

const siteInfoStyle: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
};

const siteNameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.3,
  wordBreak: "break-word",
};

const contractorNameStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  wordBreak: "break-word",
};

const periodStyle: React.CSSProperties = {
  marginTop: 3,
  fontSize: 10,
  fontWeight: 600,
  color: "#94a3b8",
};

const siteTotalStyle: React.CSSProperties = {
  flexShrink: 0,
  minWidth: 72,
  padding: "7px 8px",
  borderRadius: 10,
  backgroundColor: "#ecfdf5",
  border: "1px solid #bbf7d0",
  textAlign: "center",
};

const siteTotalLabelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  color: "#166534",
};

const siteTotalValueStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: 18,
  fontWeight: 900,
  color: "#166534",
};

const siteTotalUnitStyle: React.CSSProperties = {
  marginLeft: 2,
  fontSize: 9,
  fontWeight: 900,
};

const dateScrollOuterStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  padding: "10px 8px 12px",
  boxSizing: "border-box",
};

const dateGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  width: "max-content",
};

const dayColumnStyle: React.CSSProperties = {
  minWidth: 54,
  padding: "6px 3px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  textAlign: "center",
  boxSizing: "border-box",
};

const dateTextStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const weekdayTextStyle: React.CSSProperties = {
  marginTop: 1,
  fontSize: 9,
  fontWeight: 800,
};

const countInputStyle: React.CSSProperties = {
  width: 38,
  height: 32,
  marginTop: 5,
  padding: "4px 2px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  backgroundColor: "#ffffff",
  color: "#111827",
  textAlign: "center",
  fontSize: 14,
  fontWeight: 900,
  boxSizing: "border-box",
};

const dailySummaryCardStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  border: "1px solid #dbe2ea",
  borderRadius: 14,
  backgroundColor: "#ffffff",
  boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
};

const dailySummaryTitleStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
};

const dailySummaryColumnStyle: React.CSSProperties = {
  minWidth: 54,
  padding: "7px 3px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  textAlign: "center",
  boxSizing: "border-box",
  lineHeight: 1.2,
};

const dailySummaryDateStyle: React.CSSProperties = {
  marginBottom: 5,
  fontSize: 10,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const dailySummaryMainStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const dailySummarySubStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: 9,
  fontWeight: 500,
  color: "#6b7280",
  whiteSpace: "nowrap",
};