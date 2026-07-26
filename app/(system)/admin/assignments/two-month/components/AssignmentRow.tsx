// app/(system)/admin/assignments/two-month/components/AssignmentRow.tsx
import { useEffect, useRef, useState } from "react";
import { getDateAccentColors } from "../../month/utils/dateColors";
import type { Assignment, AssignmentGroupKey } from "../types";
import { isOutOfAssignmentPeriod } from "../../month/utils";
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
  getMemo: (assignmentId: string, workDate: string) => string;
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
  updateAssignmentMemo: (
    assignmentId: string,
    memo: string
  ) => void | Promise<void>;
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
  getMemo,
  updateDailyInfo,
  updateAssignmentMemo,
  groupNameMap,
}: Props) {
  const [editingDetails, setEditingDetails] = useState<Record<string, string>>(
    {}
  );
  const [savedDetails, setSavedDetails] = useState<Record<string, boolean>>({});
  const [hoveredMemoKey, setHoveredMemoKey] = useState<string | null>(null);
  const [editingMemoKey, setEditingMemoKey] = useState<string | null>(null);
  const [editingMemos, setEditingMemos] = useState<Record<string, string>>({});
  const [saveTimers, setSaveTimers] = useState<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const [isSiteMemoHovered, setIsSiteMemoHovered] = useState(false);
const [isSiteMemoEditing, setIsSiteMemoEditing] = useState(false);
const [isSiteMemoPreviewVisible, setIsSiteMemoPreviewVisible] = useState(false);
const [siteMemoDraft, setSiteMemoDraft] = useState("");
const siteMemoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        onMouseEnter={() => {
          if (siteMemoCloseTimer.current) {
            clearTimeout(siteMemoCloseTimer.current);
            siteMemoCloseTimer.current = null;
          }
        
          setIsSiteMemoHovered(true);
          setIsSiteMemoPreviewVisible(true);
        }}
        onMouseLeave={() => {
          setIsSiteMemoHovered(false);
        
          if (isSiteMemoEditing) return;
        
          siteMemoCloseTimer.current = setTimeout(() => {
            setIsSiteMemoPreviewVisible(false);
          }, 200);
        }}
        style={{
          ...stickyTd,
          zIndex:
  isSiteMemoEditing || isSiteMemoPreviewVisible
    ? 2000
    : stickyTd.zIndex,
          cursor: sortMode === "manual" ? "grab" : "default",
          backgroundColor:
            draggingAssignmentId === assignment.id ? "#dbeafe" : "#fff",
        }}
      >
        <div
  style={{
    position: "relative",
    display: "flex",
    justifyContent: "flex-start",
    gap: 6,
    width: "fit-content",
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

  {!assignment.memo && isSiteMemoHovered && !isSiteMemoEditing && (
    <button
      type="button"
      onClick={() => {
        setSiteMemoDraft("");
        setIsSiteMemoPreviewVisible(false);
        setIsSiteMemoEditing(true);
      }}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
        fontSize: 14,
      }}
    >
      💬
    </button>
  )}

{assignment.memo && !isSiteMemoEditing && (
  <div
    title="メモあり"
    style={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: "#2563eb",
    }}
  />
)}

{assignment.memo &&
  isSiteMemoPreviewVisible &&
  !isSiteMemoEditing && (
    <div
  onMouseEnter={() => {
    if (siteMemoCloseTimer.current) {
      clearTimeout(siteMemoCloseTimer.current);
      siteMemoCloseTimer.current = null;
    }
  }}
  onClick={() => {
    setSiteMemoDraft(assignment.memo ?? "");
    setIsSiteMemoPreviewVisible(false);
    setIsSiteMemoEditing(true);
  }}
  onMouseLeave={() => {
    if (isSiteMemoEditing) return;
  
    siteMemoCloseTimer.current = setTimeout(() => {
      setIsSiteMemoPreviewVisible(false);
    }, 200);
  }}
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: 6,
        width: 260,
        padding: 10,
        backgroundColor: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        whiteSpace: "pre-wrap",
        fontSize: 12,
        zIndex: 1000,
        cursor: "pointer",
      }}
    >
      {assignment.memo}
    </div>
)}
{isSiteMemoEditing && (
  <div
    style={{
      position: "absolute",
top: "calc(100% + 6px)",
left: 0,
      transform: "none",
      width: 160,
      padding: 10,
      boxSizing: "border-box",
      display: "grid",
      gap: 8,
      backgroundColor: "#fff",
      border: "1px solid #d1d5db",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
    }}
  >
    <textarea
      value={siteMemoDraft}
      onChange={(e) => setSiteMemoDraft(e.target.value)}
      placeholder="現場メモを入力"
      style={{
        width: "100%",
        minHeight: 100,
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />

    <button
      type="button"
      onClick={async () => {
        await updateAssignmentMemo(assignment.id, siteMemoDraft);
        setIsSiteMemoEditing(false);
        setIsSiteMemoPreviewVisible(false);
      }}
      style={{
        width: "100%",
        padding: "6px 0",
        border: "none",
        borderRadius: 6,
        backgroundColor: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      保存
    </button>
  </div>
)}
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

        const isOutOfPeriod = isOutOfAssignmentPeriod(
          date,
          assignment.start_date,
          assignment.end_date
        );

        const detailValue = getDetailTags(assignment.id, date).join(",");
        const memo = getMemo(assignment.id, date);
        const detailKey = `${assignment.id}_${date}`;
        const textareaValue =
          detailKey in editingDetails
            ? editingDetails[detailKey]
            : detailValue;

        return (
          <td
  key={date}
  onMouseEnter={() => setHoveredMemoKey(detailKey)}
  onMouseLeave={() => {
    if (editingMemoKey !== detailKey) {
      setHoveredMemoKey(null);
    }
  }}
  style={{
  ...td,
  backgroundColor: isOutOfPeriod
  ? "#d1d5db"
  : memo !== ""
  ? "#fef3c7"
    : hasPlannedCount
      ? "#dcfce7"
      : colors.cellBackground,
  backgroundImage: isOutOfPeriod
    ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 8px, transparent 8px, transparent 16px)"
    : "none",
  borderTop:
    !isOutOfPeriod && hasPlannedCount ? "5px solid #22c55e" : td.border,
}}
          >
            <div
  style={{
    position: "relative",
    display: "grid",
    gap: 4,
    justifyItems: "center",
    opacity: isOutOfPeriod ? 0.55 : 1,
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
                      position: "fixed",
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
              {memo !== "" && editingMemoKey !== detailKey && (
  <div
    title="メモあり"
    style={{
      position: "absolute",
      top: 3,
      right: 3,
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: "#2563eb",
      pointerEvents: "none",
      zIndex: 10,
    }}
  />
)}
              {hoveredMemoKey === detailKey && memo === "" && (
  <button
  type="button"
  onClick={() => {
    setEditingMemoKey(detailKey);
  }}
  style={{
      position: "absolute",
      top: 4,
      right: 4,
      border: "none",
      background: "#fff",
      cursor: "pointer",
      fontSize: 14,
      borderRadius: 4,
      padding: 2,
      zIndex: 1000,
    }}
  >
    💬
  </button>
)}
{editingMemoKey === detailKey && (
  <div
    style={{
      position: "absolute",
      top: 4,
      left: "calc(100% + 6px)",
      width: 240,
      padding: 10,
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
    }}
  >
    <textarea
  value={editingMemos[detailKey] ?? memo}
  onChange={(e) =>
    setEditingMemos((prev) => ({
      ...prev,
      [detailKey]: e.target.value,
    }))
  }
  placeholder="メモを入力"
  style={{
    width: "100%",
    minHeight: 100,
    resize: "vertical",
  }}
/>
<button
  type="button"
  onClick={async () => {
    await updateDailyInfo(
      assignment.id,
      date,
      "memo",
      editingMemos[detailKey] ?? ""
    );
  
    setEditingMemoKey(null);
  
    setEditingMemos((prev) => {
      const next = { ...prev };
      delete next[detailKey];
      return next;
    });
  }}
  style={{
    marginTop: 8,
    width: "100%",
    padding: "6px 0",
    border: "none",
    borderRadius: 6,
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  }}
>
  保存
</button>
  </div>
)}
              
              {hoveredMemoKey === detailKey &&
  editingMemoKey !== detailKey &&
  memo !== "" && (
  <div
  onClick={() => {
    setEditingMemoKey(detailKey);
    setEditingMemos((prev) => ({
      ...prev,
      [detailKey]: memo,
    }));
  }}
  style={{
    position: "absolute",
    top: 4,
    left: "calc(100% + 6px)",
    width: 240,
    padding: 10,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    whiteSpace: "pre-wrap",
    zIndex: 1000,
    fontSize: 12,
    cursor: "pointer",
  }}
>
    {memo}
  </div>
)}
            </div>
          </td>
        );
      })}
    </tr>
  );
}