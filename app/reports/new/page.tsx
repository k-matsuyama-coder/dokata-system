"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReportForm from "@/app/components/ReportForm";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Employee = {
  name: string;
};

type MemberEntry = {
  name: string;
  labor: string;
  overtime: string;
};

export default function NewReportPage() {
  const [reportDate, setReportDate] = useState("");
  const [site, setSite] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [work, setWork] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [overtimeMinutes, setOvertimeMinutes] = useState("");
  const [note, setNote] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const [expresswayMain, setExpresswayMain] = useState("");
  const [expresswaySecondary, setExpresswaySecondary] = useState("");
  const [expresswaySubcontract, setExpresswaySubcontract] = useState("");

  const [parkingMain, setParkingMain] = useState("");
  const [parkingSecondary, setParkingSecondary] = useState("");
  const [parkingSubcontract, setParkingSubcontract] = useState("");

  const [fuelGasoline, setFuelGasoline] = useState("");
  const [fuelDiesel, setFuelDiesel] = useState("");

  const [memberInput, setMemberInput] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberEntry[]>([]);
  const [siteSuggestions, setSiteSuggestions] = useState<string[]>([]);
  const [driverInput, setDriverInput] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchSiteSuggestions = async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("site_name")
        .order("created_at", { ascending: false });

      if (error || !data) return;

      const uniqueSites = Array.from(
        new Set(data.map((item) => item.site_name).filter(Boolean))
      );

      setSiteSuggestions(uniqueSites);
    };

    fetchSiteSuggestions();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (user) {
        const { data: employee } = await supabase
          .from("employees")
          .select("name")
          .eq("auth_user_id", user.id)
          .single();

        if (employee) {
          setEmployeeName(employee.name);
        }
      }

      const { data: employeeList } = await supabase
        .from("employees")
        .select("name")
        .order("name", { ascending: true });

      if (employeeList) {
        setEmployees(employeeList);
      }
    };

    fetchInitialData();
  }, []);

  const handleCopyPreviousReport = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
  
    if (!user) {
      alert("ログインしてください");
      return;
    }
  
    const { data: previousReport, error } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
  
    if (error || !previousReport) {
      alert("前回の日報が見つかりません");
      return;
    }

    useEffect(() => {
      if (searchParams.get("copy") === "1") {
        handleCopyPreviousReport();
      }
    }, [searchParams]);

    const today = new Date().toISOString().slice(0, 10);
setReportDate(today);

const startHour = Number((previousReport.start_time ?? "08:00").split(":")[0]);

if (startHour >= 18 || startHour <= 5) {
  setShiftType("night");
} else {
  setShiftType("day");
}
  
    setSite(previousReport.site_name ?? "");
    setContractorName(previousReport.contractor_name ?? "");
    setWork(previousReport.work_description ?? "");
    setShiftType(previousReport.shift_type ?? "day");
    setStartTime(previousReport.start_time ?? "08:00");
    setEndTime(previousReport.end_time ?? "17:00");
    setOvertimeMinutes(String(previousReport.overtime_minutes ?? "0"));
  
    setExpresswayMain(String(previousReport.expressway_main ?? ""));
    setExpresswaySecondary(String(previousReport.expressway_secondary ?? ""));
    setExpresswaySubcontract(String(previousReport.expressway_subcontract ?? ""));
  
    setParkingMain(String(previousReport.parking_main ?? ""));
    setParkingSecondary(String(previousReport.parking_secondary ?? ""));
    setParkingSubcontract(String(previousReport.parking_subcontract ?? ""));
  
    setFuelGasoline(String(previousReport.fuel_gasoline ?? ""));
    setFuelDiesel(String(previousReport.fuel_diesel ?? ""));
  
    setNote(previousReport.note ?? "");
  
    setSelectedDrivers(
      previousReport.driver_name
        ? String(previousReport.driver_name)
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
        : []
    );
  
    setSelectedMembers(
      Array.isArray(previousReport.member_details)
        ? previousReport.member_details
        : previousReport.members
          ? String(previousReport.members)
              .split(",")
              .map((name) => ({
                name: name.trim(),
                labor: "1",
                overtime: "0",
              }))
          : []
    );
  
    toast.success("前回の日報をコピーしました");
  };

  const handleSubmit = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    const payload = {
      worker_name: employeeName,
      site_name: site,
      contractor_name: contractorName,
      work_description: work,
      report_date: reportDate,
      shift_type: shiftType,
      start_time: startTime,
      end_time: endTime,
      overtime_minutes: Number(overtimeMinutes || 0),
      worker_count: selectedMembers.reduce(
        (sum, member) => sum + Number(member.labor || 0),
        0
      ),
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
      members: selectedMembers.map((member) => member.name).join(", "),
      member_details: selectedMembers,
      note,
      user_id: user.id,
    };

    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .insert([payload])
      .select("id")
      .single();

    if (reportError || !reportData) {
      alert("日報保存失敗: " + (reportError?.message || "id取得失敗"));
      return;
    }

    const reportMembersPayload = selectedMembers.map((member) => ({
      report_id: reportData.id,
      employee_name: member.name,
      labor: Number(member.labor || 0),
      overtime: Number(member.overtime || 0),
      is_driver: selectedDrivers.includes(member.name),
    }));

    const { error: membersError } = await supabase
      .from("report_members")
      .insert(reportMembersPayload);

    if (membersError) {
      alert("メンバー保存失敗: " + membersError.message);
      return;
    }

    toast.success("保存しました");
router.replace("/home");
return;
  };

  return (
    <div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 0" }}>
        <button
          type="button"
          onClick={handleCopyPreviousReport}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          前回の日報をコピー
        </button>
      </div>
  
      <ReportForm
      reportDate={reportDate}
      setReportDate={setReportDate}
      contractorName={contractorName}
      setContractorName={setContractorName}
      site={site}
      setSite={setSite}
      work={work}
      setWork={setWork}
      startTime={startTime}
      setStartTime={setStartTime}
      endTime={endTime}
      setEndTime={setEndTime}
      shiftType={shiftType}
      setShiftType={setShiftType}
      overtimeMinutes={overtimeMinutes}
      setOvertimeMinutes={setOvertimeMinutes}
      employeeName={employeeName}
      selectedDrivers={selectedDrivers}
      setSelectedDrivers={setSelectedDrivers}
      driverInput={driverInput}
      setDriverInput={setDriverInput}
      selectedMembers={selectedMembers}
      setSelectedMembers={setSelectedMembers}
      memberInput={memberInput}
      setMemberInput={setMemberInput}
      employees={employees}
      siteSuggestions={siteSuggestions}
      expresswayMain={expresswayMain}
      setExpresswayMain={setExpresswayMain}
      expresswaySecondary={expresswaySecondary}
      setExpresswaySecondary={setExpresswaySecondary}
      expresswaySubcontract={expresswaySubcontract}
      setExpresswaySubcontract={setExpresswaySubcontract}
      parkingMain={parkingMain}
      setParkingMain={setParkingMain}
      parkingSecondary={parkingSecondary}
      setParkingSecondary={setParkingSecondary}
      parkingSubcontract={parkingSubcontract}
      setParkingSubcontract={setParkingSubcontract}
      fuelGasoline={fuelGasoline}
      setFuelGasoline={setFuelGasoline}
      fuelDiesel={fuelDiesel}
      setFuelDiesel={setFuelDiesel}
      note={note}
      setNote={setNote}
      submitLabel="日報を保存"
      onSubmit={handleSubmit}
      />
      </div>
      );
    }