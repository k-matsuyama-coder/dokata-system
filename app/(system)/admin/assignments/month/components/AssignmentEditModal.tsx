import React, { useState } from "react";
import type {
  Assignment,
  AssignmentFile,
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "../types";

type Props = {
  editingAssignment: Assignment | null;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  inputStyle: React.CSSProperties;
  assignmentFiles: AssignmentFile[];
  enabledGroups: AssignmentGroupSetting[];
  updateAssignment: () => void;
  uploadFiles: (assignmentId: string, files: FileList | null) => void;
  deleteAssignmentFile: (file: AssignmentFile) => void;
  deleteAssignment: (id: string) => void;
};

export default function AssignmentEditModal({
  editingAssignment,
  setEditingAssignment,
  inputStyle,
  assignmentFiles,
  enabledGroups,
  updateAssignment,
  uploadFiles,
  deleteAssignmentFile,
  deleteAssignment,
}: Props) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!editingAssignment) return null;

  const files = assignmentFiles.filter(
    (file) => file.assignment_id === editingAssignment.id
  );

  const isImageFile = (fileName: string) =>
    /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(fileName);

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
          maxHeight: "90vh",
          overflowY: "auto",
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
          value={editingAssignment.group_key ?? "group1"}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              group_key: e.target.value as AssignmentGroupKey,
            })
          }
          style={inputStyle}
        >
          {enabledGroups.map((group) => (
            <option key={group.group_key} value={group.group_key}>
              {group.display_name}
            </option>
          ))}
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              工期開始
            </div>

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
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              工期終了
            </div>

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
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border:
                editingAssignment.shift_type !== "night"
                  ? "2px solid #111"
                  : "1px solid #ccc",
              backgroundColor:
                editingAssignment.shift_type !== "night" ? "#f3f3f3" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
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
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border:
                editingAssignment.shift_type === "night"
                  ? "2px solid #111"
                  : "1px solid #ccc",
              backgroundColor:
                editingAssignment.shift_type === "night" ? "#f3f3f3" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
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

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>添付ファイル</div>

          <input
  type="file"
  multiple
  accept="image/*,.pdf,.xlsx,.xls,.doc,.docx"
  onChange={(e) => {
    console.log("edit modal file selected", {
      assignmentId: editingAssignment.id,
      fileCount: e.target.files?.length ?? 0,
      fileNames: e.target.files
        ? Array.from(e.target.files).map((file) => file.name)
        : [],
    });

    void uploadFiles(editingAssignment.id, e.target.files);
  }}
/>

          {files.length > 0 && (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 8,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    backgroundColor: "#f9fafb",
                  }}
                >
                  {isImageFile(file.file_name) ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      onClick={() => setPreviewImage(file.file_url)}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        cursor: "zoom-in",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 6,
                        backgroundColor: "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      📄
                    </div>
                  )}

                  <a
                    href={isImageFile(file.file_name) ? "#" : file.file_url}
                    onClick={(e) => {
                      if (isImageFile(file.file_name)) {
                        e.preventDefault();
                        setPreviewImage(file.file_url);
                      }
                    }}
                    target={isImageFile(file.file_name) ? undefined : "_blank"}
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      color: "#111",
                      textDecoration: "none",
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {file.file_name}
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteAssignmentFile(file)}
                    style={{
                      border: "none",
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      borderRadius: 999,
                      width: 32,
                      height: 32,
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const ok = window.confirm(
              "この現場を削除しますか？\n配置メンバーや添付ファイルも削除されます。"
            );

            if (!ok) return;

            deleteAssignment(editingAssignment.id);
            setEditingAssignment(null);
          }}
          style={{
            width: "100%",
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#dc2626",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          この現場を削除
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setEditingAssignment(null)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              backgroundColor: "#fff",
            }}
          >
            キャンセル
          </button>

          <button
            type="button"
            onClick={updateAssignment}
            style={{
              flex: 1,
              padding: 12,
              border: "none",
              borderRadius: 8,
              backgroundColor: "#111",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            保存
          </button>
        </div>
      </div>

      {previewImage && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: 20,
          }}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              border: "none",
              backgroundColor: "#fff",
              color: "#111",
              borderRadius: 999,
              width: 40,
              height: 40,
              fontSize: 22,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <img
            src={previewImage}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 12,
              backgroundColor: "#fff",
            }}
          />
        </div>
      )}
    </div>
  );
}