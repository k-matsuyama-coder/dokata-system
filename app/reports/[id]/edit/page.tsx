"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState("");
  const [site, setSite] = useState("");
  const [work, setWork] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [overtimeMinutes, setOvertimeMinutes] = useState("");
  const [vehicleCount, setVehicleCount] = useState("");
  const [driverName, setDriverName] = useState("");
  const [note, setNote] = useState("");

  const [expresswayMain, setExpresswayMain] = useState("");
  const [expresswaySecondary, setExpresswaySecondary] = useState("");
  const [expresswaySubcontract, setExpresswaySubcontract] = useState("");

  const [parkingMain, setParkingMain] = useState("");
  const [parkingSecondary, setParkingSecondary] = useState("");
  const [parkingSubcontract, setParkingSubcontract] = useState("");

  const [fuelGasoline, setFuelGasoline] = useState("");
  const [fuelDiesel, setFuelDiesel] = useState("");
  const [memberInput, setMemberInput] = useState("");
const [employees, setEmployees] = useState<{ name: string }[]>([]);
const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
const [driverInput, setDriverInput] = useState("");
const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
const timeOptions = [
    "00:00","00:30",
    "01:00","01:30",
    "02:00","02:30",
    "03:00","03:30",
    "04:00","04:30",
    "05:00","05:30",
    "06:00","06:30",
    "07:00","07:30",
    "08:00","08:30",
    "09:00","09:30",
    "10:00","10:30",
    "11:00","11:30",
    "12:00","12:30",
    "13:00","13:30",
    "14:00","14:30",
    "15:00","15:30",
    "16:00","16:30",
    "17:00","17:30",
    "18:00","18:30",
    "19:00","19:30",
    "20:00","20:30",
    "21:00","21:30",
    "22:00","22:30",
    "23:00","23:30",
  ];

useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from("employees")
        .select("name")
        .order("name", { ascending: true });
  
      if (data) {
        setEmployees(data);
      }
    };
  
    fetchEmployees();
  }, []);

  const inputStyle = {
    width: "100%",
    padding: 12,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };

  const handleUpdate = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    const { error } = await supabase
      .from("daily_reports")
      .update({
        report_date: reportDate,
        site_name: site,
        work_description: work,
        start_time: startTime,
        end_time: endTime,
        shift_type: shiftType,
        overtime_minutes: Number(overtimeMinutes || 0),
        vehicle_count: selectedDrivers.length,
driver_name: selectedDrivers.join(", "),
        expressway_main: Number(expresswayMain || 0),
        expressway_secondary: Number(expresswaySecondary || 0),
        expressway_subcontract: Number(expresswaySubcontract || 0),
        parking_main: Number(parkingMain || 0),
        parking_secondary: Number(parkingSecondary || 0),
        parking_subcontract: Number(parkingSubcontract || 0),
        fuel_gasoline: Number(fuelGasoline || 0),
        fuel_diesel: Number(fuelDiesel || 0),
        note: note,
        members: selectedMembers.join(", "),
worker_count: selectedMembers.length,
        
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert("更新失敗: " + error.message);
      return;
    }

    alert("更新成功");
    window.location.href = "/reports";
  };

  useEffect(() => {
    const fetchReport = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        alert("日報が見つかりません");
        window.location.href = "/reports";
        return;
      }

      setReportDate(data.report_date ?? "");
      setSite(data.site_name ?? "");
      setWork(data.work_description ?? "");
      setStartTime(data.start_time ?? "");
      setEndTime(data.end_time ?? "");
      setShiftType(data.shift_type ?? "day");
      setOvertimeMinutes(String(data.overtime_minutes ?? 0));
      setVehicleCount(String(data.vehicle_count ?? 0));
      if (data.driver_name) {
        const driverArray = data.driver_name.split(",").map((d: string) => d.trim());
        setSelectedDrivers(driverArray);
      }
      setExpresswayMain(String(data.expressway_main ?? 0));
      setExpresswaySecondary(String(data.expressway_secondary ?? 0));
      setExpresswaySubcontract(String(data.expressway_subcontract ?? 0));
      setParkingMain(String(data.parking_main ?? 0));
      setParkingSecondary(String(data.parking_secondary ?? 0));
      setParkingSubcontract(String(data.parking_subcontract ?? 0));
      setFuelGasoline(String(data.fuel_gasoline ?? 0));
      setFuelDiesel(String(data.fuel_diesel ?? 0));
      setNote(data.note ?? "");
      if (data.members) {
        const memberArray = data.members.split(",").map((m: string) => m.trim());
        setSelectedMembers(memberArray);
      }
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return <p style={{ padding: 16 }}>読み込み中...</p>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <h1>日報編集</h1>

      <p>日付</p>
      <input
        type="date"
        value={reportDate}
        onChange={(e) => setReportDate(e.target.value)}
        style={inputStyle}
      />

      <p>現場名</p>
      <input
        value={site}
        onChange={(e) => setSite(e.target.value)}
        style={inputStyle}
      />

      <p>昼 / 夜</p>
      <select
        value={shiftType}
        onChange={(e) => setShiftType(e.target.value)}
        style={inputStyle}
      >
        <option value="day">昼</option>
        <option value="night">夜</option>
      </select>

      <p>作業内容</p>
      <textarea
        value={work}
        onChange={(e) => setWork(e.target.value)}
        style={inputStyle}
      />

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

<p>車両台数</p>
<input
  type="number"
  value={selectedDrivers.length}
  readOnly
  style={inputStyle}
/>

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
      padding: 8,
      marginTop: 8,
      marginBottom: 8,
    }}
  >
    {employees
      .filter((employee) => employee.name.includes(driverInput))
      .slice(0, 5)
      .map((employee) => (
        <div
          key={employee.name}
          onClick={() => {
            if (!selectedDrivers.includes(employee.name)) {
              setSelectedDrivers([...selectedDrivers, employee.name]);
            }
            setDriverInput("");
          }}
          style={{ padding: 6, cursor: "pointer" }}
        >
          {employee.name}
        </div>
      ))}
  </div>
)}

{selectedDrivers.length > 0 && (
  <div style={{ marginTop: 8, marginBottom: 16 }}>
    {selectedDrivers.map((driver) => (
      <span
        key={driver}
        style={{
          display: "inline-block",
          border: "1px solid #999",
          borderRadius: 12,
          padding: "4px 8px",
          marginRight: 8,
          marginBottom: 8,
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
      <p>高速料金（本体）</p>
      <input
        type="number"
        value={expresswayMain}
        onChange={(e) => setExpresswayMain(e.target.value)}
        style={inputStyle}
      />

      <p>高速料金（二次受け）</p>
      <input
        type="number"
        value={expresswaySecondary}
        onChange={(e) => setExpresswaySecondary(e.target.value)}
        style={inputStyle}
      />

      <p>高速料金（下請け）</p>
      <input
        type="number"
        value={expresswaySubcontract}
        onChange={(e) => setExpresswaySubcontract(e.target.value)}
        style={inputStyle}
      />

      <p>駐車場料金（本体）</p>
      <input
        type="number"
        value={parkingMain}
        onChange={(e) => setParkingMain(e.target.value)}
        style={inputStyle}
      />

      <p>駐車場料金（二次受け）</p>
      <input
        type="number"
        value={parkingSecondary}
        onChange={(e) => setParkingSecondary(e.target.value)}
        style={inputStyle}
      />

      <p>駐車場料金（下請け）</p>
      <input
        type="number"
        value={parkingSubcontract}
        onChange={(e) => setParkingSubcontract(e.target.value)}
        style={inputStyle}
      />

      <p>燃料代（ガソリン）</p>
      <input
  type="number"
  step="20"
  min="0"
  value={fuelGasoline}
  onChange={(e) => setFuelGasoline(e.target.value)}
  style={inputStyle}
/>

      <p>燃料代（軽油）</p>
      <input
  type="number"
  step="20"
  min="0"
  value={fuelDiesel}
  onChange={(e) => setFuelDiesel(e.target.value)}
  style={inputStyle}
/>
      <p>メンバー</p>

<input
  placeholder="メンバー名を入力"
  value={memberInput}
  onChange={(e) => setMemberInput(e.target.value)}
  style={inputStyle}
/>

{memberInput && (
  <div
    style={{
      border: "1px solid #ccc",
      padding: 8,
      marginTop: 8,
      marginBottom: 8,
    }}
  >
    {employees
      .filter((employee) => employee.name.includes(memberInput))
      .slice(0, 5)
      .map((employee) => (
        <div
          key={employee.name}
          onClick={() => {
            if (!selectedMembers.includes(employee.name)) {
              setSelectedMembers([...selectedMembers, employee.name]);
            }
            setMemberInput("");
          }}
          style={{ padding: 6, cursor: "pointer" }}
        >
          {employee.name}
        </div>
      ))}
  </div>
)}{selectedMembers.length > 0 && (
    <div style={{ marginTop: 8, marginBottom: 16 }}>
      {selectedMembers.map((member) => (
        <span
          key={member}
          style={{
            display: "inline-block",
            border: "1px solid #999",
            borderRadius: 12,
            padding: "4px 8px",
            marginRight: 8,
            marginBottom: 8,
          }}
        >
          {member}
          <button
            type="button"
            onClick={() =>
              setSelectedMembers(
                selectedMembers.filter((m) => m !== member)
              )
            }
            style={{ marginLeft: 8, cursor: "pointer" }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )}

      <p>備考</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={handleUpdate}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          marginTop: 20,
          border: "none",
          borderRadius: 8,
          backgroundColor: "#111",
          color: "#fff",
        }}
      >
        更新する
      </button>
    </div>
  );
}