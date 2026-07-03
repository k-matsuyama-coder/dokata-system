import React, { useState } from "react";
import type {
  Contractor,
  ContractorContact,
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "../types";

type Props = {
  showAddModal: boolean;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  contractors: Contractor[];
  contractorContacts: ContractorContact[];
  contractorName: string;
  setContractorName: React.Dispatch<React.SetStateAction<string>>;
  siteName: string;
  setSiteName: React.Dispatch<React.SetStateAction<string>>;
  groupKey: AssignmentGroupKey;
  setGroupKey: React.Dispatch<React.SetStateAction<AssignmentGroupKey>>;
  enabledGroups: AssignmentGroupSetting[];
  managerName: string;
  setManagerName: React.Dispatch<React.SetStateAction<string>>;
  contactPhone: string;
  setContactPhone: React.Dispatch<React.SetStateAction<string>>;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  shiftType: string;
  setShiftType: React.Dispatch<React.SetStateAction<string>>;
  meetingTime: string;
  setMeetingTime: React.Dispatch<React.SetStateAction<string>>;
  addFiles: FileList | null;
  setAddFiles: React.Dispatch<React.SetStateAction<FileList | null>>;
  inputStyle: React.CSSProperties;
  handleAddSite: () => void;
};

export default function AddAssignmentModal({
  showAddModal,
  setShowAddModal,
  contractors,
  contractorContacts,
  contractorName,
  setContractorName,
  siteName,
  setSiteName,
  groupKey,
  setGroupKey,
  enabledGroups,
  managerName,
  setManagerName,
  contactPhone,
  setContactPhone,
  address,
  setAddress,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  shiftType,
  setShiftType,
  meetingTime,
  setMeetingTime,
  addFiles,
  setAddFiles,
  inputStyle,
  handleAddSite,
}: Props) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!showAddModal) return null;

  return (
    <>
      <div
    onClick={() => {
      setAddFiles(null);
      setShowAddModal(false);
    }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
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
        <h2 style={{ margin: 0 }}>現場追加</h2>

        <div>
          <input
            list="contractors"
            value={contractorName}
            onChange={(e) => {
              setContractorName(e.target.value);
              setManagerName("");
              setContactPhone("");
            }}
            placeholder="元請"
            style={inputStyle}
          />

          <datalist id="contractors">
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.name} />
            ))}
          </datalist>
        </div>

        <input
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="現場名"
          style={inputStyle}
        />

<select
  value={groupKey}
  onChange={(e) => setGroupKey(e.target.value as AssignmentGroupKey)}
  style={inputStyle}
>
  {enabledGroups.map((group) => (
    <option key={group.group_key} value={group.group_key}>
      {group.display_name}
    </option>
  ))}
</select>

        <div>
          <input
            list="manager-list"
            value={managerName}
            onChange={(e) => {
              const value = e.target.value;
              setManagerName(value);

              const contractor = contractors.find(
                (c) => c.name === contractorName
              );

              if (!contractor) return;

              const contact = contractorContacts.find(
                (c) =>
                  c.contractor_id === contractor.id &&
                  c.manager_name === value
              );

              if (contact) {
                setContactPhone(contact.contact_phone ?? "");
              }
            }}
            placeholder="担当者"
            style={inputStyle}
          />

          <datalist id="manager-list">
            {contractorContacts
              .filter((contact) => {
                const contractor = contractors.find(
                  (c) => c.id === contact.contractor_id
                );

                return contractor?.name === contractorName;
              })
              .map((contact) => (
                <option key={contact.id} value={contact.manager_name} />
              ))}
          </datalist>
        </div>

        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="連絡先"
          style={inputStyle}
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              工期終了
            </div>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setShiftType("day");
              setMeetingTime("08:00");
            }}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: shiftType === "day" ? "2px solid #111" : "1px solid #ccc",
              backgroundColor: shiftType === "day" ? "#f3f3f3" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            昼
          </button>

          <button
            type="button"
            onClick={() => {
              setShiftType("night");
              setMeetingTime("20:00");
            }}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border:
                shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
              backgroundColor: shiftType === "night" ? "#f3f3f3" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            夜
          </button>
        </div>

        <input
          type="time"
          value={meetingTime}
          onChange={(e) => setMeetingTime(e.target.value)}
          style={inputStyle}
        />

<div style={{ marginTop: 12 }}>
  <div
    style={{
      fontWeight: 700,
      marginBottom: 6,
    }}
  >
    添付ファイル
  </div>

  <input
  type="file"
  multiple
  accept="image/*,.pdf,.xlsx,.xls,.doc,.docx"
  onChange={(e) => setAddFiles(e.target.files)}
/>

{addFiles && addFiles.length > 0 && (
  <div
    style={{
      marginTop: 10,
      display: "grid",
      gap: 8,
    }}
  >
    {Array.from(addFiles).map((file, index) => {
      const isImage = file.type.startsWith("image/");

      return (
        <div
          key={`${file.name}-${index}`}
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
          {isImage ? (
            <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            onClick={() => setPreviewImage(URL.createObjectURL(file))}
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

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {file.name}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#666",
                marginTop: 2,
              }}
            >
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <button
  type="button"
  onClick={() => {
    const dt = new DataTransfer();

    Array.from(addFiles)
      .filter((_, fileIndex) => fileIndex !== index)
      .forEach((file) => dt.items.add(file));

    setAddFiles(dt.files.length > 0 ? dt.files : null);
  }}
  style={{
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 999,
    width: 28,
    height: 28,
    cursor: "pointer",
    fontWeight: 900,
  }}
>
  ×
</button>
        </div>
      );
    })}
  </div>
)}
</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
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
            onClick={handleAddSite}
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
            追加
          </button>
        </div>
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

</>
  );
}