"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Employee = {
  name: string;
};

type MemberEntry = {
  name: string;
  labor: string;
  overtime: string;
};

type Contractor = {
  name: string;
};

type Site = {
  site_name: string;
  contractor_name: string;
  manager_name: string | null;
};

type ReportFormProps = {
  reportDate: string;
  setReportDate: (value: string) => void;
  site: string;
  setSite: (value: string) => void;
  contractorName: string;
  setContractorName: (value: string) => void;
  work: string;
  setWork: (value: string) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  shiftType: string;
  setShiftType: (value: string) => void;
  overtimeMinutes: string;
  setOvertimeMinutes: (value: string) => void;
  employeeName: string;

  selectedDrivers: string[];
  setSelectedDrivers: (value: string[]) => void;
  driverInput: string;
  setDriverInput: (value: string) => void;

  selectedMembers: MemberEntry[];
  setSelectedMembers: (value: MemberEntry[]) => void;
  memberInput: string;
  setMemberInput: (value: string) => void;

  employees: Employee[];
  siteSuggestions: string[];

  expresswayMain: string;
  setExpresswayMain: (value: string) => void;
  expresswaySecondary: string;
  setExpresswaySecondary: (value: string) => void;
  expresswaySubcontract: string;
  setExpresswaySubcontract: (value: string) => void;

  parkingMain: string;
  setParkingMain: (value: string) => void;
  parkingSecondary: string;
  setParkingSecondary: (value: string) => void;
  parkingSubcontract: string;
  setParkingSubcontract: (value: string) => void;

  fuelGasoline: string;
  setFuelGasoline: (value: string) => void;
  fuelDiesel: string;
  setFuelDiesel: (value: string) => void;

  note: string;
  setNote: (value: string) => void;

  submitLabel: string;
  onSubmit: () => void;
};

export default function ReportForm(props: ReportFormProps) {
  const {
    reportDate,
    setReportDate,
    site,
    setSite,
    contractorName,
    setContractorName,
    work,
    setWork,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    shiftType,
    setShiftType,
    overtimeMinutes,
    setOvertimeMinutes,
    employeeName,
    selectedDrivers,
    setSelectedDrivers,
    driverInput,
    setDriverInput,
    selectedMembers,
    setSelectedMembers,
    memberInput,
    setMemberInput,
    employees,
    siteSuggestions,
    expresswayMain,
    setExpresswayMain,
    expresswaySecondary,
    setExpresswaySecondary,
    expresswaySubcontract,
    setExpresswaySubcontract,
    parkingMain,
    setParkingMain,
    parkingSecondary,
    setParkingSecondary,
    parkingSubcontract,
    setParkingSubcontract,
    fuelGasoline,
    setFuelGasoline,
    fuelDiesel,
    setFuelDiesel,
    note,
    setNote,
    submitLabel,
    onSubmit,
  } = props;

  const timeOptions = [
    "00:00", "00:30",
    "01:00", "01:30",
    "02:00", "02:30",
    "03:00", "03:30",
    "04:00", "04:30",
    "05:00", "05:30",
    "06:00", "06:30",
    "07:00", "07:30",
    "08:00", "08:30",
    "09:00", "09:30",
    "10:00", "10:30",
    "11:00", "11:30",
    "12:00", "12:30",
    "13:00", "13:30",
    "14:00", "14:30",
    "15:00", "15:30",
    "16:00", "16:30",
    "17:00", "17:30",
    "18:00", "18:30",
    "19:00", "19:30",
    "20:00", "20:30",
    "21:00", "21:30",
    "22:00", "22:30",
    "23:00", "23:30",
  ];

  const fuelOptions = [
    "0",
    "20",
    "40",
    "60",
    "80",
    "100",
    "120",
    "140",
    "160",
    "180",
    "200",
  ];

  const [showExpressway, setShowExpressway] = useState(false);
const [showParking, setShowParking] = useState(false);

const [contractors, setContractors] = useState<Contractor[]>([]);
const [sites, setSites] = useState<Site[]>([]);
const [showContractorSuggestions, setShowContractorSuggestions] = useState(false);
const [showSiteSuggestions, setShowSiteSuggestions] = useState(false);

useEffect(() => {
  const fetchMasterData = async () => {
    const { data: contractorData } = await supabase
      .from("contractors")
      .select("name")
      .order("name", { ascending: true });

    const { data: siteData } = await supabase
      .from("sites")
      .select("site_name, contractor_name, manager_name")
      .order("site_name", { ascending: true });

    setContractors(contractorData ?? []);
    setSites(siteData ?? []);
  };

  fetchMasterData();
}, []);

  const inputStyle = {
    width: "100%",
    padding: 12,
    fontSize: 16,
    boxSizing: "border-box" as const,
    border: "1px solid #ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  };

  const sectionStyle = {
    marginBottom: 16,
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.includes(memberInput)
  );

  const filteredDrivers = employees.filter((employee) =>
    employee.name.includes(driverInput)
  );

  const addMember = (name: string) => {
    if (selectedMembers.some((member) => member.name === name)) return;
  
    const overtimeHour = String(Number(overtimeMinutes || 0) / 60);
  
    setSelectedMembers([
      ...selectedMembers,
      {
        name,
        labor: "1",
        overtime: overtimeHour,
      },
    ]);
  
    setMemberInput("");
  };
  
  const removeMember = (name: string) => {
    setSelectedMembers(selectedMembers.filter((member) => member.name !== name));
  };

  const totalLabor = selectedMembers.reduce(
    (sum, member) => sum + Number(member.labor || 0),
    0
  );
  
  const totalOvertime = selectedMembers.reduce(
    (sum, member) => sum + Number(member.overtime || 0),
    0
  );
  
  const expresswayTotal =
    Number(expresswayMain || 0) +
    Number(expresswaySecondary || 0) +
    Number(expresswaySubcontract || 0);
  
  const parkingTotal =
    Number(parkingMain || 0) +
    Number(parkingSecondary || 0) +
    Number(parkingSubcontract || 0);
  
  useEffect(() => {
    if (expresswayTotal > 0) {
      setShowExpressway(true);
    }
  }, [expresswayTotal]);
  
  useEffect(() => {
    if (parkingTotal > 0) {
      setShowParking(true);
    }
  }, [parkingTotal]);

  const [editingLaborName, setEditingLaborName] = useState<string | null>(null);

  const validate = () => {
    if (!reportDate) return "日付を入力してください";
    if (!contractorName) return "元請を入力してください";
    if (!site) return "現場名を入力してください";
    if (!work) return "作業内容を入力してください";
    if (!startTime) return "開始時間を選択してください";
    if (!endTime) return "終了時間を選択してください";
    if (selectedMembers.length === 0) return "メンバーを追加してください";
  
    if (startTime === endTime) {
      return "開始時間と終了時間が同じです";
    }
  
    return null;
  };
  
  const handleValidatedSubmit = () => {
    const errorMessage = validate();
  
    if (errorMessage) {
      alert(errorMessage);
      return;
    }
  
    const startHour = Number(startTime.split(":")[0]);
    const endHour = Number(endTime.split(":")[0]);
  
    if (
      shiftType === "day" &&
      (startHour >= 20 || endHour >= 20 || startHour <= 4 || endHour <= 4)
    ) {
      const ok = window.confirm(
        "昼勤務になっていますが、時間が夜勤帯に見えます。このまま保存しますか？"
      );
      if (!ok) return;
    }
  
    if (
      shiftType === "night" &&
      startHour >= 6 &&
      startHour <= 17 &&
      endHour >= 6 &&
      endHour <= 17
    ) {
      const ok = window.confirm(
        "夜勤務になっていますが、時間が昼勤帯に見えます。このまま保存しますか？"
      );
      if (!ok) return;
    }
  
    onSubmit();
  };

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
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
  <input
    value={contractorName}
    onChange={(e) => {
      setContractorName(e.target.value);
      setShowContractorSuggestions(true);
    }}
    onFocus={() => setShowContractorSuggestions(true)}
    style={inputStyle}
    placeholder="元請会社名を入力"
  />

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
    placeholder="現場名を入力"
  />

  {showSiteSuggestions && site && (
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
        .filter((s) => s.site_name.includes(site))
        .slice(0, 5)
        .map((s) => (
          <div
            key={`${s.contractor_name}-${s.site_name}`}
            onClick={() => {
              setSite(s.site_name);
              setContractorName(s.contractor_name);
              setShowSiteSuggestions(false);
            }}
            style={{ padding: 8, cursor: "pointer" }}
          >
            <div style={{ fontWeight: 600 }}>{s.site_name}</div>
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
        border: shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
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

      <div style={sectionStyle}>
        <p>作業内容</p>
        <textarea
          value={work}
          onChange={(e) => setWork(e.target.value)}
          style={{ ...inputStyle, minHeight: 100 }}
        />
      </div>

      <div style={sectionStyle}>
        <p>開始時間</p>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>終了時間</p>
        <select
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>残業（時間）</p>
        <select
          value={overtimeMinutes}
          onChange={(e) => setOvertimeMinutes(e.target.value)}
          style={inputStyle}
        >
          <option value="0">0</option>
  <option value="0.5">0.5</option>
  <option value="1">1</option>
  <option value="1.5">1.5</option>
  <option value="2">2</option>
  <option value="2.5">2.5</option>
  <option value="3">3</option>
  <option value="3.5">3.5</option>
  <option value="4">4</option>
  <option value="4.5">4.5</option>
  <option value="5">5</option>
  <option value="5.5">5.5</option>
  <option value="6">6</option>
  <option value="6.5">6.5</option>
  <option value="7">7</option>
  <option value="7.5">7.5</option>
  <option value="8">8</option>
  <option value="8.5">8.5</option>
  <option value="9">9</option>
  <option value="9.5">9.5</option>
  <option value="10">10</option>
        </select>
      </div>

      <div style={sectionStyle}>
        <p>車両台数</p>
        <input type="number" value={selectedDrivers.length} readOnly style={inputStyle} />
      </div>

      <div style={sectionStyle}>
        <p>車両運転手</p>
        <input
          type="text"
          placeholder="運転手名を入力"
          value={driverInput}
          onChange={(e) => setDriverInput(e.target.value)}
          style={inputStyle}
        />

        {driverInput && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
              backgroundColor: "#fff",
            }}
          >
            {filteredDrivers.slice(0, 5).map((employee) => (
              <div
                key={employee.name}
                onClick={() => {
                  if (!selectedDrivers.includes(employee.name)) {
                    setSelectedDrivers([...selectedDrivers, employee.name]);
                  }
                  setDriverInput("");
                }}
                style={{ padding: 8, cursor: "pointer" }}
              >
                {employee.name}
              </div>
            ))}
          </div>
        )}

        {selectedDrivers.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {selectedDrivers.map((driver) => (
              <span
                key={driver}
                style={{
                  display: "inline-block",
                  border: "1px solid #999",
                  borderRadius: 12,
                  padding: "6px 10px",
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: "#fff",
                }}
              >
                {driver}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDrivers(selectedDrivers.filter((d) => d !== driver))
                  }
                  style={{ marginLeft: 8, cursor: "pointer" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
  <div
    onClick={() => setShowExpressway(!showExpressway)}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: 8,
      backgroundColor: "#fafafa",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          display: "inline-block",
          transition: "transform 0.25s ease",
          transform: showExpressway ? "rotate(90deg)" : "rotate(0deg)",
          fontSize: 14,
        }}
      >
        ▶
      </span>
      <p style={{ margin: 0, fontWeight: "bold" }}>高速料金</p>
    </div>

    <p style={{ margin: 0, fontWeight: "bold" }}>¥{expresswayTotal}</p>
  </div>

  <div
    style={{
      maxHeight: showExpressway ? "500px" : "0",
      opacity: showExpressway ? 1 : 0,
      overflow: "hidden",
      transition:
        "max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease",
      marginTop: showExpressway ? 12 : 0,
    }}
  >
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <p>本体</p>
        <input
          type="number"
          value={expresswayMain}
          onChange={(e) => setExpresswayMain(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <p>2次請け</p>
        <input
          type="number"
          value={expresswaySecondary}
          onChange={(e) => setExpresswaySecondary(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <p>下請け</p>
        <input
          type="number"
          value={expresswaySubcontract}
          onChange={(e) => setExpresswaySubcontract(e.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  </div>
</div>

<div style={sectionStyle}>
  <div
    onClick={() => setShowParking(!showParking)}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: 8,
      backgroundColor: "#fafafa",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          display: "inline-block",
          transition: "transform 0.25s ease",
          transform: showParking ? "rotate(90deg)" : "rotate(0deg)",
          fontSize: 14,
        }}
      >
        ▶
      </span>
      <p style={{ margin: 0, fontWeight: "bold" }}>駐車場料金</p>
    </div>

    <p style={{ margin: 0, fontWeight: "bold" }}>¥{parkingTotal}</p>
  </div>

  <div
    style={{
      maxHeight: showParking ? "500px" : "0",
      opacity: showParking ? 1 : 0,
      overflow: "hidden",
      transition:
        "max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease",
      marginTop: showParking ? 12 : 0,
    }}
  >
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <p>本体</p>
        <input
          type="number"
          value={parkingMain}
          onChange={(e) => setParkingMain(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <p>2次請け</p>
        <input
          type="number"
          value={parkingSecondary}
          onChange={(e) => setParkingSecondary(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <p>下請け</p>
        <input
          type="number"
          value={parkingSubcontract}
          onChange={(e) => setParkingSubcontract(e.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  </div>
</div>

      <div style={sectionStyle}>
        <p>燃料代（ガソリン）</p>
        <select
          value={fuelGasoline}
          onChange={(e) => setFuelGasoline(e.target.value)}
          style={inputStyle}
        >
          {fuelOptions.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}L
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>燃料代（軽油）</p>
        <select
          value={fuelDiesel}
          onChange={(e) => setFuelDiesel(e.target.value)}
          style={inputStyle}
        >
          {fuelOptions.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}L
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>稼働人数</p>
        <input type="number" value={totalLabor} readOnly style={inputStyle} />
      </div>

      <div style={sectionStyle}>
  <p>メンバー</p>
  <input
    placeholder="メンバー名を入力"
    value={memberInput}
    onChange={(e) => setMemberInput(e.target.value)}
    style={inputStyle}
  />

  {memberInput && filteredEmployees.length > 0 && (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 8,
        marginTop: 8,
        backgroundColor: "#fff",
      }}
    >
      {filteredEmployees.slice(0, 5).map((employee) => (
        <div
          key={employee.name}
          onClick={() => addMember(employee.name)}
          style={{ padding: 8, cursor: "pointer" }}
        >
          {employee.name}
        </div>
      ))}
    </div>
  )}

{selectedMembers.length > 0 && (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 48px",
          gap: 8,
          marginBottom: 8,
          fontWeight: "bold",
          fontSize: 14,
          alignItems: "center",
        }}
      >
        <div>メンバー名</div>
        <div>人工</div>
        <div>残業</div>
        <div></div>
      </div>

      {selectedMembers.map((member) => (
        <div
          key={member.name}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 48px",
            gap: 8,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <div>{member.name}</div>

          <div>
            {editingLaborName === member.name ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["0", "0.5", "1", "1.5"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSelectedMembers(
                        selectedMembers.map((m) =>
                          m.name === member.name ? { ...m, labor: val } : m
                        )
                      );
                      setEditingLaborName(null);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border:
                        member.labor === val ? "2px solid #111" : "1px solid #ccc",
                      backgroundColor: member.labor === val ? "#f3f3f3" : "#fff",
                      cursor: "pointer",
                      minWidth: 48,
                      fontWeight: member.labor === val ? 700 : 500,
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingLaborName(member.name)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {member.labor}
              </button>
            )}
          </div>

          <select
  value={member.overtime}
  onChange={(e) => {
    setSelectedMembers(
      selectedMembers.map((m) =>
        m.name === member.name ? { ...m, overtime: e.target.value } : m
      )
    );
  }}
  style={inputStyle}
>
  <option value="0">0</option>
  <option value="0.5">0.5</option>
  <option value="1">1</option>
  <option value="1.5">1.5</option>
  <option value="2">2</option>
  <option value="2.5">2.5</option>
  <option value="3">3</option>
  <option value="3.5">3.5</option>
  <option value="4">4</option>
  <option value="4.5">4.5</option>
  <option value="5">5</option>
  <option value="5.5">5.5</option>
  <option value="6">6</option>
  <option value="6.5">6.5</option>
  <option value="7">7</option>
  <option value="7.5">7.5</option>
  <option value="8">8</option>
  <option value="8.5">8.5</option>
  <option value="9">9</option>
  <option value="9.5">9.5</option>
  <option value="10">10</option>
</select>

          <button
            type="button"
            onClick={() => removeMember(member.name)}
            style={{
              border: "none",
              borderRadius: 8,
              backgroundColor: "#d11a2a",
              color: "#fff",
              cursor: "pointer",
              padding: "10px 0",
            }}
          >
            ×
          </button>
        </div>
      ))}

      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          人工合計：{totalLabor}
        </div>
        <div style={{ fontWeight: "bold" }}>
          残業合計：{totalOvertime}
        </div>
      </div>
    </div>
  )}
  </div>

  <div style={sectionStyle}>
    <p>備考</p>
    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      style={{ ...inputStyle, minHeight: 100 }}
    />
  </div>

  <button
  onClick={handleValidatedSubmit}
    style={{
      width: "100%",
      padding: 14,
      fontSize: 16,
      marginTop: 12,
      border: "none",
      borderRadius: 8,
      backgroundColor: "#111",
      color: "#fff",
    }}
  >
    {submitLabel}
  </button>
</div>
);
}