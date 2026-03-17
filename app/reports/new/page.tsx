"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReportForm from "@/components/ReportForm";

type Employee = {
  name: string;
};

export default function NewReportPage() {
  const [reportDate, setReportDate] = useState("");
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [siteSuggestions, setSiteSuggestions] = useState<string[]>([]);
  const [driverInput, setDriverInput] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

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

  const handleSubmit = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    const { error } = await supabase.from("daily_reports").insert([
      {
        worker_name: employeeName,
        site_name: site,
        work_description: work,
        report_date: reportDate,
        shift_type: shiftType,
        start_time: startTime,
        end_time: endTime,
        overtime_minutes: Number(overtimeMinutes || 0),
        worker_count: selectedMembers.length,
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
        members: selectedMembers.join(", "),
        note,
        user_id: user.id,
      },
    ]);

    if (error) {
      alert("保存失敗: " + error.message);
      console.error(error);
      return;
    }

    alert("保存成功");

    setReportDate("");
    setSite("");
    setWork("");
    setStartTime("");
    setEndTime("");
    setShiftType("day");
    setOvertimeMinutes("");
    setExpresswayMain("");
    setExpresswaySecondary("");
    setExpresswaySubcontract("");
    setParkingMain("");
    setParkingSecondary("");
    setParkingSubcontract("");
    setFuelGasoline("");
    setFuelDiesel("");
    setMemberInput("");
    setSelectedMembers([]);
    setDriverInput("");
    setSelectedDrivers([]);
    setNote("");
  };

  return (
    <ReportForm
      reportDate={reportDate}
      setReportDate={setReportDate}
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
  );
}