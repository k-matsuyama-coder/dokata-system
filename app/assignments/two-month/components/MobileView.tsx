import { useState } from "react";
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

export default function MobileView({
  days,
  groupedAssignments,
  getPlannedCount,
  updateDailyInfo,
}: Props) {
  const [weekIndex, setWeekIndex] = useState(0);

  const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "#f9fafb",
          padding: "8px 0",
        }}
      >
        <button
          type="button"
          onClick={() => setWeekIndex((prev) => Math.max(prev - 1, 0))}
          disabled={weekIndex === 0}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            fontWeight: 700,
          }}
        >
          ◀ 前週
        </button>

        <div style={{ fontWeight: 900, fontSize: 14 }}>
          {weekStart?.slice(5).replace("-", "/")} ～{" "}
          {weekEnd?.slice(5).replace("-", "/")}
        </div>

        <button
          type="button"
          onClick={() =>
            setWeekIndex((prev) =>
              Math.min(prev + 1, Math.floor((days.length - 1) / 7))
            )
          }
          disabled={weekIndex >= Math.floor((days.length - 1) / 7)}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            fontWeight: 700,
          }}
        >
          次週 ▶
        </button>
      </div>

      {groupedAssignments.map((group) => (
        <div key={group.label}>
          <div
            style={{
              fontWeight: 900,
              padding: "8px 10px",
              backgroundColor: group.color,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            {group.label}
          </div>

          {group.rows.map((assignment) => (
            <div
              key={assignment.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                backgroundColor: "#fff",
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {assignment.site_name || "-"}
              </div>

              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {assignment.contractor_name || "-"}
              </div>

              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                {assignment.start_date || "-"} ～ {assignment.end_date || "-"}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  marginTop: 12,
                  paddingBottom: 4,
                }}
              >
                {weekDays.map((date) => {
                  const day = new Date(date).getDay();
                  const isToday =
                    date === new Date().toISOString().slice(0, 10);

                  return (
                    <div
                      key={date}
                      style={{
                        minWidth: 72,
                        border: isToday
                          ? "2px solid #2563eb"
                          : "1px solid #ddd",
                        borderRadius: 8,
                        padding: 8,
                        textAlign: "center",
                        backgroundColor: isToday ? "#dbeafe" : "#f9fafb",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700 }}>
                        {date.slice(5).replace("-", "/")}
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          marginTop: 2,
                          color:
                            day === 0
                              ? "#ef4444"
                              : day === 6
                              ? "#2563eb"
                              : "#666",
                        }}
                      >
                        {["日", "月", "火", "水", "木", "金", "土"][day]}
                      </div>

                      <input
                        type="number"
                        inputMode="numeric"
                        defaultValue={getPlannedCount(assignment.id, date)}
                        onBlur={(e) =>
                          updateDailyInfo(
                            assignment.id,
                            date,
                            "planned_count",
                            e.target.value
                          )
                        }
                        style={{
                          width: 44,
                          marginTop: 6,
                          padding: 6,
                          border: "1px solid #ccc",
                          borderRadius: 6,
                          textAlign: "center",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}