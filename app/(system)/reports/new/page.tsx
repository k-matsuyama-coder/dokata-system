"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReportForm from "@/app/components/reports/ReportForm";
import { useRouter } from "next/navigation";
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
  const [heavyEquipment, setHeavyEquipment] = useState("");
const [operatorName, setOperatorName] = useState("");

  const router = useRouter();
  const getCurrentOrganization = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
  
    if (!token) {
      return null;
    }
  
    const res = await fetch("/api/current-organization", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const result = await res.json();
  
    if (!res.ok) {
      console.error(result.error || "organization取得失敗");
      return null;
    }
  
    return result.organizationId as string | null;
  };

  const copyPreviousReport = async (targetEmployeeName?: string) => {
    const nameForSearch = targetEmployeeName || employeeName;

    if (!nameForSearch) {
      alert("社員名の取得後にもう一度押してください");
      return;
    }
    const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

const { data: previousReport, error } = await supabase
.from("daily_reports")
.select("*")
.eq("organization_id", currentOrganizationId)
.eq("worker_name", nameForSearch)
.order("created_at", { ascending: false })
.limit(1)
.maybeSingle();

    if (error || !previousReport) {
      alert("前回の日報が見つかりません");
      return;
    }

    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date());
    setReportDate(today);

    setSite(previousReport.site_name ?? "");
    setContractorName(previousReport.contractor_name ?? "");
    setWork(previousReport.work_description ?? "");

    const start = previousReport.start_time ?? "08:00";
    const startHour = Number(start.split(":")[0]);

    if (startHour >= 18 || startHour <= 5) {
      setShiftType("night");
    } else {
      setShiftType("day");
    }

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

  useEffect(() => {
    const fetchSiteSuggestions = async () => {
      const currentOrganizationId = await getCurrentOrganization();
  
      if (!currentOrganizationId) {
        return;
      }
  
      const { data, error } = await supabase
        .from("daily_reports")
        .select("site_name")
        .eq("organization_id", currentOrganizationId)
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

      if (!user) {
        window.location.href = "/login";
        return;
      }
      const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}

      let fetchedEmployeeName = "";

      const { data: employee } = await supabase
        .from("employees")
        .select("name")
        .eq("auth_user_id", user.id)
        .single();

      if (employee) {
        fetchedEmployeeName = employee.name;
        setEmployeeName(employee.name);
      }

      const { data: employeeList } = await supabase
  .from("employees")
  .select("name")
  .eq("organization_id", currentOrganizationId)
  .order("name", { ascending: true });

      if (employeeList) {
        setEmployees(employeeList);
      }

      const params = new URLSearchParams(window.location.search);

      const assignmentIdParam = params.get("assignment_id");
const siteParam = params.get("site");
const dateParam = params.get("date");

if (siteParam) {
  setSite(siteParam);
}

if (dateParam) {
  setReportDate(dateParam);
}

if (assignmentIdParam && dateParam) {
  const { data: assignment } = await supabase
    .from("assignments")
    .select("site_name, contractor_name, shift_type, start_time, end_time")
    .eq("id", assignmentIdParam)
    .eq("organization_id", currentOrganizationId)
    .single();

  if (assignment) {
    setSite(assignment.site_name ?? "");
    setContractorName(assignment.contractor_name ?? "");
    setShiftType(assignment.shift_type ?? "day");
    setStartTime(assignment.start_time ?? "08:00");
    setEndTime(assignment.end_time ?? "17:00");
  }

  const { data: assignmentMembers } = await supabase
    .from("assignment_site_members")
    .select("employee_name, is_driver, is_operator, heavy_equipment")
    .eq("organization_id", currentOrganizationId)
    .eq("assignment_id", assignmentIdParam)
    .eq("work_date", dateParam);

  setSelectedMembers(
    (assignmentMembers ?? []).map((member) => ({
      name: member.employee_name,
      labor: "1",
      overtime: "0",
    }))
  );

  setSelectedDrivers(
    (assignmentMembers ?? [])
      .filter((member) => member.is_driver)
      .map((member) => member.employee_name)
  );

  const operator = (assignmentMembers ?? []).find(
    (member) => member.is_operator
  );

  if (operator) {
    setOperatorName(operator.employee_name);
    setHeavyEquipment(operator.heavy_equipment ?? "");
  }
}

      if (params.get("copy") === "1") {
        setTimeout(() => {
          copyPreviousReport(fetchedEmployeeName);
        }, 300);
      }
    };

    fetchInitialData();
  }, []);

  const handleCopyPreviousReport = async () => {
    await copyPreviousReport();
  };

  const handleSubmit = async () => {
    console.log({
      employeeName,
      reportDate,
      site,
    });

    const currentOrganizationId = await getCurrentOrganization();

if (!currentOrganizationId) {
  alert("会社情報が取得できません");
  return;
}
    
const { data: existingReport } = await supabase
.from("daily_reports")
.select("id")
.eq("organization_id", currentOrganizationId)
.eq("worker_name", employeeName)
.eq("report_date", reportDate)
.eq("site_name", site)
.maybeSingle();

  console.log("existingReport", existingReport);

if (existingReport) {
  alert("この日の日報は既に登録されています");
  return;
}
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    const payload = {
      organization_id: currentOrganizationId,
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
      heavy_equipment: heavyEquipment,
operator_name: operatorName,
    };

    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .insert([payload])
      .select("id")
      .single();

      console.log("reportError", reportError);

      if (reportError || !reportData) {
        if (
          reportError?.message.includes("duplicate") ||
          reportError?.message.includes("daily_reports_unique_daily")
        ) {
          alert("この日報は既に登録されています");
          return;
        }
      
        alert("日報保存失敗: " + (reportError?.message || "id取得失敗"));
        return;
      }

      const reportMembersPayload = selectedMembers.map((member) => ({
        organization_id: currentOrganizationId,
        report_id: reportData.id,
        employee_name: member.name,
        labor: Number(member.labor || 0),
        overtime: Number(member.overtime || 0),
        is_driver: selectedDrivers.includes(member.name),
      }));

    let membersError = null;

if (reportMembersPayload.length > 0) {
  const result = await supabase
    .from("report_members")
    .insert(reportMembersPayload);

  membersError = result.error;
}

if (membersError) {
  await supabase
    .from("daily_reports")
    .delete()
    .eq("id", reportData.id);

  alert("メンバー保存失敗: " + membersError.message);
  return;
      }

      toast.success("日報を登録しました", {
        duration: 1200,
      });
      
      setTimeout(() => {
        router.replace("/home");
      }, 900);
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
        heavyEquipment={heavyEquipment}
setHeavyEquipment={setHeavyEquipment}
operatorName={operatorName}
setOperatorName={setOperatorName}
        
      />
    </div>
  );
}