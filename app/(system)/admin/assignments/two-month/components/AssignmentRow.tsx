// app/(system)/admin/assignments/two-month/components/AssignmentRow.tsx
import { useEffect, useState } from "react";
import { getDateAccentColors } from "../../month/utils/dateColors";
import type { Assignment, AssignmentGroupKey } from "../types";
import {
  stickyTd,
  stickyTotalTd1,
  stickyTotalTd2,
  td,
} from "../styles";

type Props = {
  assignment: Assignment;
  days: string[];
  sortMode: string;
  draggingAssignmentId: string | null;
  setDraggingAssignmentId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  moveAssignmentRow: (fromAssignmentId: string, toAssignmentId: string) => void;
  deleteAssignment: (id: string) => void;
  getMonthlyTotal: (assignmentId: string, targetMonthIndex: 0 | 1) => number;
  getPlannedCount: (assignmentId: string, workDate: string) => number | "";
  getBandColor: (assignment: Assignment) => string;
  getDetailTags: (assignmentId: string, workDate: string) => string[];
  removeDetailTag: (
    assignmentId: string,
    workDate: string,
    tag: string
  ) => void;
  addDetailTag: (
    assignmentId: string,
    workDate: string,
    tag: string
  ) => void;
  updateDailyInfo: (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => void | Promise<void>;
  groupNameMap: Map<AssignmentGroupKey, string>;
};

export default function TwoMonthAssignmentRow({
  assignment,
  days,
  sortMode,
  draggingAssignmentId,
  setDraggingAssignmentId,
  setEditingAssignment,
  moveAssignmentRow,
  deleteAssignment,
  getMonthlyTotal,
  getPlannedCount,
  getBandColor,
  getDetailTags,
  updateDailyInfo,
  groupNameMap,
}: Props) {
  const [editingDetails, setEditingDetails] = useState<Record<string, string>>(
    {}
  );
  const [savedDetails, setSavedDetails] = useState<Record<string, boolean>>({});
  const [saveTimers, setSaveTimers] = useState<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  useEffect(() => {
    return () => {
      Object.values(saveTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [saveTimers]);

  const groupLabel =
    groupNameMap.get(
      (assignment.group_key ?? "group1") as AssignmentGroupKey
    ) ?? "未設定グループ";

  return (
    <tr>
      <td
        draggable={sortMode === "manual"}
        onDragStart={() => setDraggingAssignmentId(assignment.id)}
        onDragEnd={() => setDraggingAssignmentId(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (!draggingAssignmentId) return;
          moveAssignmentRow(draggingAssignmentId, assignment.id);
        }}
        style={{
          ...stickyTd,
          cursor: sortMode === "manual" ? "grab" : "default",
          backgroundColor:
            draggingAssignmentId === assignment.id ? "#dbeafe" : "#fff",
        }}
      >
        <div
          onClick={() => setEditingAssignment(assignment)}
          style={{
            fontWeight: 800,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {assignment.site_name || "-"}
        </div>

        <button
          type="button"
          onClick={() => deleteAssignment(assignment.id)}
          style={{
            marginTop: 6,
            backgroundColor: "#d11a2a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          削除
        </button>

        <div style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>
          {groupLabel}
        </div>

        <div style={{ fontSize: 11, color: "#666" }}>
          {assignment.contractor_name || "-"}
        </div>

        <div style={{ fontSize: 10, color: "#888" }}>
          {assignment.start_date}
          {" ～ "}
          {assignment.end_date}
        </div>
      </td>

      <td style={stickyTotalTd1}>{getMonthlyTotal(assignment.id, 0)}</td>
      <td style={stickyTotalTd2}>{getMonthlyTotal(assignment.id, 1)}</td>

      {days.map((date) => {
        const count = getPlannedCount(assignment.id, date);
        const colors = getDateAccentColors(date);
        const hasPlannedCount = count !== "";
        const detailValue = getDetailTags(assignment.id, date).join(",");
        const detailKey = `${assignment.id}_${date}`;
        const textareaValue =
          detailKey in editingDetails
            ? editingDetails[detailKey]
            : detailValue;

        return (
          <td
            key={date}
            style={{
              ...td,
              backgroundColor: hasPlannedCount ? "#dcfce7" : colors.cellBackground,
              borderTop: hasPlannedCount ? "5px solid #22c55e" : td.border,
            }}
          >
            <div
              style={{
                display: "grid",
                gap: 4,
                justifyItems: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 72,
                }}
              >
                <textarea
                className="detail-textarea"
                  value={textareaValue}
                  onChange={(e) => {
                    const value = e.target.value;

                    setEditingDetails((prev) => ({
                      ...prev,
                      [detailKey]: value,
                    }));

                    if (saveTimers[detailKey]) {
                      clearTimeout(saveTimers[detailKey]);
                    }

                    const timer = setTimeout(async () => {
                      try {
                        await updateDailyInfo(
                          assignment.id,
                          date,
                          "detail",
                          value
                        );

                        setSavedDetails((prev) => ({
                          ...prev,
                          [detailKey]: true,
                        }));

                        setTimeout(() => {
                          setSavedDetails((prev) => {
                            const next = { ...prev };
                            delete next[detailKey];
                            return next;
                          });
                        }, 1000);
                      } finally {
                        setEditingDetails((prev) => {
                          const next = { ...prev };
                          delete next[detailKey];
                          return next;
                        });

                        setSaveTimers((prev) => {
                          const next = { ...prev };
                          delete next[detailKey];
                          return next;
                        });
                      }
                    }, 3000);

                    setSaveTimers((prev) => ({
                      ...prev,
                      [detailKey]: timer,
                    }));
                  }}
                  placeholder="詳細"
                  style={{
                    width: "100%",
                    height: 28,
                    minHeight: 28,
                    maxHeight: 28,
                    overflowY: "hidden",
                    padding: "0 4px",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    fontSize: 10,
                    lineHeight: "28px",
                    resize: "none",
                    backgroundColor: "#fff",
                    boxSizing: "border-box",
                  }}
                />

                {savedDetails[detailKey] && (
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 4,
                      fontSize: 8,
                      color: "#166534",
                      backgroundColor: "#dcfce7",
                      border: "1px solid #bbf7d0",
                      borderRadius: 999,
                      padding: "1px 5px",
                      lineHeight: 1.2,
                      fontWeight: 700,
                      pointerEvents: "none",
                    }}
                  >
                    保存済み
                  </div>
                )}
              </div>

              <input
                data-planned-input="true"
                data-assignment-id={assignment.id}
                data-work-date={date}
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={count}
                onKeyDown={(e) => {
                  const inputs = Array.from(
                    document.querySelectorAll<HTMLInputElement>(
                      'input[data-planned-input="true"]'
                    )
                  );

                  const currentIndex = inputs.indexOf(e.currentTarget);

                  if (currentIndex === -1) return;

                  if (e.key === "Tab") {
                    e.preventDefault();

                    const nextIndex = e.shiftKey
                      ? currentIndex - 1
                      : currentIndex + 1;

                    inputs[nextIndex]?.focus();
                    inputs[nextIndex]?.select();
                  }

                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    inputs[currentIndex + 1]?.focus();
                    inputs[currentIndex + 1]?.select();
                  }

                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    inputs[currentIndex - 1]?.focus();
                    inputs[currentIndex - 1]?.select();
                  }
                }}
                onBlur={(e) => {
                  const rawValue = e.target.value;

                  if (rawValue === "") {
                    updateDailyInfo(
                      assignment.id,
                      date,
                      "planned_count",
                      ""
                    );
                    return;
                  }

                  const safeValue = String(Math.max(0, Number(rawValue)));
                  e.currentTarget.value = safeValue;

                  updateDailyInfo(
                    assignment.id,
                    date,
                    "planned_count",
                    safeValue
                  );
                }}
                style={{
                  width: 44,
                  padding: 4,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  textAlign: "center",
                  fontSize: 12,
                  backgroundColor: "#fff",
                  appearance: "textfield",
                  MozAppearance: "textfield",
                }}
              />
            </div>
          </td>
        );
      })}
    </tr>
  );
}