import React from "react";
import BackButton from "@/app/components/BackButton";

type Contractor = {
  name: string;
};

type Site = {
  id: string;
  site_name: string;
  contractor_name: string;
  manager_name: string | null;
  is_my_assignment?: boolean;
};

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  reportDate: string;
  setReportDate: (value: string) => void;

  employeeName: string;

  contractorName: string;
  setContractorName: (value: string) => void;

  site: string;
  setSite: (value: string) => void;

  shiftType: string;
  setShiftType: (value: string) => void;

  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;

  contractors: Contractor[];
  sites: Site[];

  showContractorSuggestions: boolean;
  setShowContractorSuggestions: (value: boolean) => void;

  showSiteSuggestions: boolean;
  setShowSiteSuggestions: (value: boolean) => void;

  setSelectedAssignmentId: (value: string | null) => void;
};

export default function ReportBasicSection({
  sectionStyle,
  inputStyle,
  reportDate,
  setReportDate,
  employeeName,
  contractorName,
  setContractorName,
  site,
  setSite,
  shiftType,
  setShiftType,
  setStartTime,
  setEndTime,
  contractors,
  sites,
  showContractorSuggestions,
  setShowContractorSuggestions,
  showSiteSuggestions,
  setShowSiteSuggestions,
  setSelectedAssignmentId,
}: Props) {
  return (
    <>
      <div style={sectionStyle}>
        <BackButton />
        <p>日付</p>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <p>名前</p>
        <input value={employeeName} readOnly style={inputStyle} />
      </div>

      <div style={sectionStyle}>
      <p>元請</p>

<div
  style={{
    padding: 12,
    borderRadius: 8,
    background: "#f5f5f5",
    border: "1px solid #ddd",
    color: contractorName ? "#111" : "#999",
    minHeight: 48,
    display: "flex",
    alignItems: "center",
  }}
>
  {contractorName || "現場を選択してください"}
</div>

        {showContractorSuggestions && contractorName && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
              backgroundColor: "#fff",
            }}
          >
            {contractors
              .filter((c) => c.name.includes(contractorName))
              .slice(0, 5)
              .map((c) => (
                <div
                  key={c.name}
                  onClick={() => {
                    setContractorName(c.name);
                    setShowContractorSuggestions(false);
                  }}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  {c.name}
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <p>現場名</p>
        <input
          value={site}
          onChange={(e) => {
            setSite(e.target.value);
            setShowSiteSuggestions(true);
          }}
          onFocus={() => setShowSiteSuggestions(true)}
          style={inputStyle}
          placeholder="現場を選択してください"
        />

        {showSiteSuggestions && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
              backgroundColor: "#fff",
            }}
          >
            {sites
  .filter((s) => !site || s.site_name.includes(site))
  .sort((a, b) => {
    if (a.is_my_assignment && !b.is_my_assignment) return -1;
    if (!a.is_my_assignment && b.is_my_assignment) return 1;
    return a.site_name.localeCompare(b.site_name);
  })
  .slice(0, 5)
  .map((s) => (
                <div
                  key={`${s.contractor_name}-${s.site_name}`}
                  onClick={() => {
                    setSite(s.site_name);
                    setContractorName(s.contractor_name);
                    setSelectedAssignmentId(s.id);
                    setShowSiteSuggestions(false);
                  }}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 600 }}>
  {s.is_my_assignment ? "★ " : ""}
  {s.site_name}
</div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    元請: {s.contractor_name}
                    {s.manager_name ? ` / 担当: ${s.manager_name}` : ""}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <p>昼 / 夜</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setShiftType("day");
              setStartTime("08:00");
              setEndTime("17:00");
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: shiftType === "day" ? "2px solid #111" : "1px solid #ccc",
              backgroundColor: shiftType === "day" ? "#f3f3f3" : "#fff",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            昼
          </button>

          <button
            type="button"
            onClick={() => {
              setShiftType("night");
              setStartTime("20:00");
              setEndTime("05:00");
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border:
                shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
              backgroundColor: shiftType === "night" ? "#f3f3f3" : "#fff",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            夜
          </button>
        </div>
      </div>
    </>
  );
}