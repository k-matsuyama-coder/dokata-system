"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReportForm from "@/app/components/ReportForm";

type Employee = {
  name: string;
};

export default function EditReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [reportDate, setReportDate] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [site, setSite] = useState("");
  const [work, setWork] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shiftType, setShiftType] = useState("day");
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
  const [selectedMembers, setSelectedMembers] = useState<
  { name: string; labor: string; overtime: string }[]
>([]);
  const [siteSuggestions, setSiteSuggestions] = useState<string[]>([]);
  const [driverInput, setDriverInput] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data: report, error: reportError } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (reportError || !report) {
        alert("日報が見つかりません");
        window.location.href = "/reports";
        return;
      }

      setReportDate(report.report_date ?? "");
      setContractorName(report.contractor_name ?? "");
      setSite(report.site_name ?? "");
      
      setWork(report.work_description ?? "");
      setStartTime(report.start_time ?? "");
      setEndTime(report.end_time ?? "");
      setShiftType(report.shift_type ?? "day");
      setOvertimeMinutes(String(report.overtime_minutes ?? ""));
      setNote(report.note ?? "");

      setExpresswayMain(String(report.expressway_main ?? ""));
      setExpresswaySecondary(String(report.expressway_secondary ?? ""));
      setExpresswaySubcontract(String(report.expressway_subcontract ?? ""));

      setParkingMain(String(report.parking_main ?? ""));
      setParkingSecondary(String(report.parking_secondary ?? ""));
      setParkingSubcontract(String(report.parking_subcontract ?? ""));

      setFuelGasoline(String(report.fuel_gasoline ?? ""));
      setFuelDiesel(String(report.fuel_diesel ?? ""));

      setSelectedMembers(
        Array.isArray(report.member_details)
          ? report.member_details
          : report.members
            ? String(report.members)
                .split(",")
                .map((name) => ({
                  name: name.trim(),
                  labor: "1",
                  overtime: String(Number(report.overtime_minutes || 0) / 60),
                }))
            : []
      );

      setSelectedDrivers(
        report.driver_name
          ? String(report.driver_name)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : []
      );

      const { data: employee } = await supabase
        .from("employees")
        .select("name")
        .eq("auth_user_id", user.id)
        .single();

      if (employee) {
        setEmployeeName(employee.name);
      }

      const { data: employeeList } = await supabase
        .from("employees")
        .select("name")
        .order("name", { ascending: true });

      if (employeeList) {
        setEmployees(employeeList);
      }

      const { data: sites } = await supabase
        .from("daily_reports")
        .select("site_name")
        .order("created_at", { ascending: false });

      if (sites) {
        const uniqueSites = Array.from(
          new Set(sites.map((item) => item.site_name).filter(Boolean))
        );
        setSiteSuggestions(uniqueSites);
      }
    };

    if (id) {
      fetchInitialData();
    }
  }, [id]);

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
        worker_name: employeeName,
        contractor_name: contractorName,
        site_name: site,
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
      })
      .eq("id", id)
      .eq("user_id", user.id);

      if (error) {
        alert("更新失敗: " + error.message);
        return;
      }
      
      const { error: deleteMembersError } = await supabase
        .from("report_members")
        .delete()
        .eq("report_id", id);
      
      if (deleteMembersError) {
        alert("メンバー更新失敗: " + deleteMembersError.message);
        return;
      }
      
      const reportMembersPayload = selectedMembers.map((member) => ({
        report_id: id,
        employee_name: member.name,
        labor: Number(member.labor || 0),
        overtime: Number(member.overtime || 0),
        is_driver: selectedDrivers.includes(member.name),
      }));
      
      const { error: insertMembersError } = await supabase
        .from("report_members")
        .insert(reportMembersPayload);
      
      if (insertMembersError) {
        alert("メンバー更新失敗: " + insertMembersError.message);
        return;
      }
      
      alert("更新成功");
      window.location.href = "/reports";
    };

  return (
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
      submitLabel="日報を更新"
      onSubmit={handleUpdate}
    />
  );
}