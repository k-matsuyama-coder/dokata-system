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

const plannedInputSelector = 'input[data-planned-input="true"]';

function getAdjacentPlannedInput(
  current: HTMLInputElement,
  direction: 1 | -1
): HTMLInputElement | null {
  const currentRow = current.closest("tr");
  if (!currentRow) return null;

  const rowInputs = Array.from(
    currentRow.querySelectorAll<HTMLInputElement>(plannedInputSelector)
  );

  const currentIndex = rowInputs.indexOf(current);
  const sameRowInput = rowInputs[currentIndex + direction];

  if (sameRowInput) return sameRowInput;

  let nextRow =
    direction === 1
      ? currentRow.nextElementSibling
      : currentRow.previousElementSibling;

  while (nextRow) {
    const inputs = Array.from(
      nextRow.querySelectorAll<HTMLInputElement>(plannedInputSelector)
    );

    if (inputs.length > 0) {
      return direction === 1 ? inputs[0] : inputs[inputs.length - 1];
    }

    nextRow =
      direction === 1
        ? nextRow.nextElementSibling
        : nextRow.previousElementSibling;
  }

  return null;
}

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
    field: "planned_count" | "detail" | "memo",
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
  const [editingDetailKey, setEditingDetailKey] = useState<string | null>(null);
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
  title={`${groupLabel}
${assignment.contractor_name || "-"}
${assignment.start_date} ～ ${assignment.end_date}`}
  style={{
    paddingRight: 34,
    fontSize: 12,
    lineHeight: 1.25,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "underline",
    textAlign: "left",
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

{isSiteMemoHovered && (
        <button
          type="button"
          onClick={() => deleteAssignment(assignment.id)}
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            backgroundColor: "#d11a2a",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "2px 5px",
            cursor: "pointer",
            fontSize: 9,
            fontWeight: 700,
            zIndex: 5,
          }}
        >
          削除
        </button>
        )}
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

            const isDetailVisible =
            editingMemoKey !== detailKey &&
            (
              editingDetailKey === detailKey ||
              (
                hoveredMemoKey === detailKey &&
                textareaValue.trim() !== ""
              )
            );

        return (
          <td
  key={date}
  onDoubleClick={() => {
    if (isOutOfPeriod) return;
  
    setEditingDetailKey(detailKey);
    setHoveredMemoKey(detailKey);
  
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>(
          `textarea[data-detail-key="${detailKey}"]`
        )
        ?.focus();
    }, 0);
  }}
  title={
    textareaValue.trim()
      ? textareaValue
      : isOutOfPeriod
        ? undefined
        : "ダブルクリックで作業内容を入力"
  }
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
    minWidth: 50,
width: 50,
maxWidth: 50,
  padding: "3px 2px",
  borderTop:
    !isOutOfPeriod && hasPlannedCount ? "5px solid #22c55e" : td.border,
}}
          >
            <div
  style={{
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    opacity: isOutOfPeriod ? 0.55 : 1,
  }}
>
{isDetailVisible && (
  <div
    style={{
      position: "absolute",
    top: "calc(100% + 4px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: 180,
    padding: 8,
    backgroundColor: "#fff",
    border: "1px solid #94a3b8",
    borderRadius: 6,
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
    zIndex: 1100,
  }}
>
                <textarea
                className="detail-textarea"
                data-detail-key={detailKey}
                  value={textareaValue}
                  onBlur={() => {
                    setEditingDetailKey(null);
                  }}
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
                    display: "block",
                    width: "100%",
                    height: 60,
                    minHeight: 60,
                    maxHeight: 120,
                    overflowY: "auto",
                    padding: 6,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    fontSize: 12,
                    lineHeight: 1.4,
                    resize: "vertical",
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
              )}

{!isOutOfPeriod && (
              <input
                data-planned-input="true"
                data-assignment-id={assignment.id}
                data-work-date={date}
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={count}
                onKeyDown={(e) => {
                  let direction: 1 | -1 | null = null;
                
                  if (e.key === "Tab") {
                    direction = e.shiftKey ? -1 : 1;
                  } else if (e.key === "ArrowRight") {
                    direction = 1;
                  } else if (e.key === "ArrowLeft") {
                    direction = -1;
                  }
                
                  if (direction === null) return;
                
                  const nextInput = getAdjacentPlannedInput(
                    e.currentTarget,
                    direction
                  );
                
                  if (!nextInput) return;
                
                  e.preventDefault();
                  nextInput.focus();
                  nextInput.select();
                }}
                onBlur={(e) => {
                  const rawValue = e.currentTarget.value;
                  const currentValue =
                    count === "" ? "" : String(count);
                
                  if (rawValue === "") {
                    if (currentValue === "") return;
                
                    void updateDailyInfo(
                      assignment.id,
                      date,
                      "planned_count",
                      ""
                    );
                    return;
                  }
                
                  const numericValue = Number(rawValue);
                
                  if (!Number.isFinite(numericValue)) {
                    e.currentTarget.value = currentValue;
                    return;
                  }
                
                  const safeValue = String(Math.max(0, numericValue));
                  e.currentTarget.value = safeValue;
                
                  if (safeValue === currentValue) return;
                
                  void updateDailyInfo(
                    assignment.id,
                    date,
                    "planned_count",
                    safeValue
                  );
                }}
                style={{
                  width: 34,
                  padding: 2,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  textAlign: "center",
                  fontSize: 12,
                  backgroundColor: "#fff",
                  appearance: "textfield",
                  MozAppearance: "textfield",
                }}
              />
              )}
              
              {memo !== "" && editingMemoKey !== detailKey && (
  <div
    title="メモあり"
    style={{
      width: 6,
      height: 6,
      flexShrink: 0,
      borderRadius: "50%",
      backgroundColor: "#2563eb",
      pointerEvents: "none",
    }}
  />
)}
              {hoveredMemoKey === detailKey && memo === "" && (
  <button
  type="button"
  title="メモを追加"
  onClick={() => {
    setEditingMemoKey(detailKey);
  }}
  style={{
    width: 10,
    height: 18,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    backgroundColor: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 10,
    lineHeight: 1,
  }}
  >
    ＋
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