import React from "react";
import type { Contractor, ContractorContact } from "../types";

type Props = {
  showAddModal: boolean;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  contractors: Contractor[];
  contractorContacts: ContractorContact[];
  contractorName: string;
  setContractorName: React.Dispatch<React.SetStateAction<string>>;
  siteName: string;
  setSiteName: React.Dispatch<React.SetStateAction<string>>;
  constructionType: string;
  setConstructionType: React.Dispatch<React.SetStateAction<string>>;
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
  constructionType,
  setConstructionType,
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
  inputStyle,
  handleAddSite,
}: Props) {
  if (!showAddModal) return null;

  return (
    <div
      onClick={() => setShowAddModal(false)}
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
          value={constructionType}
          onChange={(e) => setConstructionType(e.target.value)}
          style={inputStyle}
        >
          <option value="第一工事">第一工事</option>
          <option value="第二工事">第二工事</option>
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
  );
}