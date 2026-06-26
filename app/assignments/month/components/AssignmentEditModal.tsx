import React from "react";
import type { Assignment, AssignmentFile } from "./types";

type Props = {
  editingAssignment: Assignment | null;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  inputStyle: React.CSSProperties;
  assignmentFiles: AssignmentFile[];
  updateAssignment: () => void;
  uploadFiles: (assignmentId: string, files: FileList | null) => void;
  deleteAssignmentFile: (file: AssignmentFile) => void;
};

export default function AssignmentEditModal({
  editingAssignment,
  setEditingAssignment,
  inputStyle,
  assignmentFiles,
  updateAssignment,
  uploadFiles,
  deleteAssignmentFile,
}: Props) {
  if (!editingAssignment) return null;

  return (
    <div
      onClick={() => setEditingAssignment(null)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          display: "grid",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>現場編集</h2>

        <input
          value={editingAssignment.contractor_name ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              contractor_name: e.target.value,
            })
          }
          placeholder="元請"
          style={inputStyle}
        />

        <input
          value={editingAssignment.site_name ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              site_name: e.target.value,
            })
          }
          placeholder="現場名"
          style={inputStyle}
        />

        <select
          value={editingAssignment.construction_type ?? "第一工事"}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              construction_type: e.target.value,
            })
          }
          style={inputStyle}
        >
          <option value="第一工事">第一工事</option>
          <option value="第二工事">第二工事</option>
        </select>

        <input
          value={editingAssignment.manager_name ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              manager_name: e.target.value,
            })
          }
          placeholder="担当者"
          style={inputStyle}
        />

        <input
          value={editingAssignment.contact_phone ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              contact_phone: e.target.value,
            })
          }
          placeholder="連絡先"
          style={inputStyle}
        />

        <input
          value={editingAssignment.address ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              address: e.target.value,
            })
          }
          placeholder="住所"
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="date"
            value={editingAssignment.start_date ?? ""}
            onChange={(e) =>
              setEditingAssignment({
                ...editingAssignment,
                start_date: e.target.value,
              })
            }
            style={inputStyle}
          />

          <input
            type="date"
            value={editingAssignment.end_date ?? ""}
            onChange={(e) =>
              setEditingAssignment({
                ...editingAssignment,
                end_date: e.target.value,
              })
            }
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() =>
              setEditingAssignment({
                ...editingAssignment,
                shift_type: "day",
                meeting_time: "08:00",
              })
            }
          >
            昼
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingAssignment({
                ...editingAssignment,
                shift_type: "night",
                meeting_time: "20:00",
              })
            }
          >
            夜
          </button>
        </div>

        <input
          type="time"
          value={editingAssignment.meeting_time ?? "08:00"}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              meeting_time: e.target.value,
            })
          }
          style={inputStyle}
        />

        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            添付ファイル
          </div>

          <input
            type="file"
            multiple
            onChange={(e) => uploadFiles(editingAssignment.id, e.target.files)}
            style={inputStyle}
          />

          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {assignmentFiles
              .filter((file) => file.assignment_id === editingAssignment.id)
              .map((file) => (
                <div key={file.id} style={{ display: "flex", gap: 8 }}>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      padding: 8,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      color: "#111",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    📎 {file.file_name}
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteAssignmentFile(file)}
                  >
                    削除
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setEditingAssignment(null)}>
            キャンセル
          </button>

          <button type="button" onClick={updateAssignment}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}