"use client";

type Employee = {
  name: string;
};

type ReportFormProps = {
  reportDate: string;
  setReportDate: (value: string) => void;
  site: string;
  setSite: (value: string) => void;
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

  selectedMembers: string[];
  setSelectedMembers: (value: string[]) => void;
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
    if (selectedMembers.includes(name)) return;
    setSelectedMembers([...selectedMembers, name]);
    setMemberInput("");
  };

  const removeMember = (name: string) => {
    setSelectedMembers(selectedMembers.filter((member) => member !== name));
  };

  const expresswayTotal =
  Number(expresswayMain || 0) +
  Number(expresswaySecondary || 0) +
  Number(expresswaySubcontract || 0);

const parkingTotal =
  Number(parkingMain || 0) +
  Number(parkingSecondary || 0) +
  Number(parkingSubcontract || 0);

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      <div style={sectionStyle}>
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
        <p>現場名</p>
        <input
          value={site}
          onChange={(e) => setSite(e.target.value)}
          style={inputStyle}
        />

        {site && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
              backgroundColor: "#fff",
            }}
          >
            {siteSuggestions
              .filter((siteName) => siteName.includes(site))
              .slice(0, 5)
              .map((siteName) => (
                <div
                  key={siteName}
                  onClick={() => setSite(siteName)}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  {siteName}
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <p>昼 / 夜</p>
        <select
          value={shiftType}
          onChange={(e) => setShiftType(e.target.value)}
          style={inputStyle}
        >
          <option value="day">昼</option>
          <option value="night">夜</option>
        </select>
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
          <option value="30">0.5</option>
          <option value="60">1</option>
          <option value="90">1.5</option>
          <option value="120">2</option>
          <option value="150">2.5</option>
          <option value="180">3</option>
          <option value="210">3.5</option>
          <option value="240">4</option>
          <option value="270">4.5</option>
          <option value="300">5</option>
          <option value="330">5.5</option>
          <option value="360">6</option>
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
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      flexWrap: "wrap",
      gap: 8,
    }}
  >
    <p style={{ margin: 0, fontWeight: "bold" }}>高速料金</p>
    <p style={{ margin: 0, fontWeight: "bold" }}>合計 ¥{expresswayTotal}</p>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 12,
    }}
  >
    <div>
      <p style={{ marginBottom: 6 }}>本体</p>
      <input
        type="number"
        value={expresswayMain}
        onChange={(e) => setExpresswayMain(e.target.value)}
        style={inputStyle}
      />
    </div>

    <div>
      <p style={{ marginBottom: 6 }}>2次請け</p>
      <input
        type="number"
        value={expresswaySecondary}
        onChange={(e) => setExpresswaySecondary(e.target.value)}
        style={inputStyle}
      />
    </div>

    <div>
      <p style={{ marginBottom: 6 }}>下請け</p>
      <input
        type="number"
        value={expresswaySubcontract}
        onChange={(e) => setExpresswaySubcontract(e.target.value)}
        style={inputStyle}
      />
    </div>
  </div>
</div>

<div style={sectionStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      flexWrap: "wrap",
      gap: 8,
    }}
  >
    <p style={{ margin: 0, fontWeight: "bold" }}>駐車場料金</p>
    <p style={{ margin: 0, fontWeight: "bold" }}>合計 ¥{parkingTotal}</p>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 12,
    }}
  >
    <div>
      <p style={{ marginBottom: 6 }}>本体</p>
      <input
        type="number"
        value={parkingMain}
        onChange={(e) => setParkingMain(e.target.value)}
        style={inputStyle}
      />
    </div>

    <div>
      <p style={{ marginBottom: 6 }}>2次請け</p>
      <input
        type="number"
        value={parkingSecondary}
        onChange={(e) => setParkingSecondary(e.target.value)}
        style={inputStyle}
      />
    </div>

    <div>
      <p style={{ marginBottom: 6 }}>下請け</p>
      <input
        type="number"
        value={parkingSubcontract}
        onChange={(e) => setParkingSubcontract(e.target.value)}
        style={inputStyle}
      />
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
        <input type="number" value={selectedMembers.length} readOnly style={inputStyle} />
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
          <div style={{ marginTop: 8 }}>
            {selectedMembers.map((member) => (
              <span
                key={member}
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
                {member}
                <button
                  type="button"
                  onClick={() => removeMember(member)}
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
        <p>備考</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ ...inputStyle, minHeight: 100 }}
        />
      </div>

      <button
        onClick={onSubmit}
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