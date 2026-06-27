import type { Assignment } from "../types";
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
  ) => void;
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
  removeDetailTag,
  addDetailTag,
  updateDailyInfo,
}: Props) {
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
          {assignment.construction_type || "第一工事"}
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

        return (
          <td
            key={date}
            style={{
              ...td,
              backgroundColor:
                count !== ""
                  ? getBandColor(assignment)
                  : new Date(date).getDay() === 0
                  ? "#fff7f7"
                  : new Date(date).getDay() === 6
                  ? "#f7fbff"
                  : "#fff",
              borderTop: count !== "" ? "5px solid #22c55e" : td.border,
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
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                {getDetailTags(assignment.id, date).map((tag) => (
                  <div
                    key={tag}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {tag}

                    <button
                      type="button"
                      onClick={() =>
                        removeDetailTag(assignment.id, date, tag)
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#166534",
                        fontWeight: 700,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <input
                  list="detail-history"
                  placeholder="+"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;

                    e.preventDefault();

                    const value = e.currentTarget.value.trim();

                    addDetailTag(assignment.id, date, value);

                    e.currentTarget.value = "";
                  }}
                  style={{
                    width: 60,
                    border: "none",
                    background: "transparent",
                    fontSize: 10,
                    textAlign: "center",
                  }}
                />
              </div>

              <input
                data-planned-input="true"
                data-assignment-id={assignment.id}
                data-work-date={date}
                type="number"
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