"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReportMemberSection from "./ReportMemberSection";
import ReportDriverSection from "./ReportDriverSection";
import ReportHeavyEquipmentSection from "./ReportHeavyEquipmentSection";
import ReportCostSection from "./ReportCostSection";
import ReportBasicSection from "./ReportBasicSection";
import ReportTimeSection from "./ReportTimeSection";
import ReportNoteSection from "./ReportNoteSection";
import { useReportMasterData } from "../../hooks/reports/useReportMasterData";
import { useAssignmentMembers } from "../../hooks/reports/useAssignmentMembers";
import { useReportValidation } from "../../hooks/reports/useReportValidation";
import { useReportMembers } from "../../hooks/reports/useReportMembers";

type Employee = {
  name: string;
};

type MemberEntry = {
  name: string;
  labor: string;
  overtime: string;
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
  heavyEquipment: string;
setHeavyEquipment: (value: string) => void;

operatorName: string;
setOperatorName: (value: string) => void;
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
    heavyEquipment,
setHeavyEquipment,

operatorName,
setOperatorName,
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
const [showHeavyEquipment, setShowHeavyEquipment] = useState(false);

const [showContractorSuggestions, setShowContractorSuggestions] = useState(false);
const [showSiteSuggestions, setShowSiteSuggestions] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
const [checkedAssignmentMembers, setCheckedAssignmentMembers] = useState<string[]>([]);
const [editMembersMode, setEditMembersMode] = useState(false);
const [membersConfirmed, setMembersConfirmed] = useState(false);
const { contractors, sites } = useReportMasterData({
  employeeName,
  reportDate,
});

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

  const { addMember, removeMember } = useReportMembers({
    selectedMembers,
    setSelectedMembers,
    overtimeMinutes,
    setMemberInput,
  });

  const assignmentMembers = useAssignmentMembers({
    assignmentId: selectedAssignmentId,
    reportDate,
  });

  useEffect(() => {
    setMembersConfirmed(false);
    setCheckedAssignmentMembers([]);
    setSelectedMembers([]);
    setEditMembersMode(false);
  }, [selectedAssignmentId, reportDate]);

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

  const { handleValidatedSubmit } = useReportValidation({
    reportDate,
    contractorName,
    site,
    work,
    startTime,
    endTime,
    shiftType,
    selectedMembers,
    assignmentMembers,
    membersConfirmed,
    isSubmitting,
    setIsSubmitting,
    onSubmit,
  });
  


  return (
    <div
      style={{
        padding: 16,
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      <ReportBasicSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  reportDate={reportDate}
  setReportDate={setReportDate}
  employeeName={employeeName}
  contractorName={contractorName}
  setContractorName={setContractorName}
  site={site}
  setSite={setSite}
  shiftType={shiftType}
  setShiftType={setShiftType}
  setStartTime={setStartTime}
  setEndTime={setEndTime}
  contractors={contractors}
  sites={sites}
  showContractorSuggestions={showContractorSuggestions}
  setShowContractorSuggestions={setShowContractorSuggestions}
  showSiteSuggestions={showSiteSuggestions}
  setShowSiteSuggestions={setShowSiteSuggestions}
  setSelectedAssignmentId={setSelectedAssignmentId}
/>

<ReportTimeSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  work={work}
  setWork={setWork}
  startTime={startTime}
  setStartTime={setStartTime}
  endTime={endTime}
  setEndTime={setEndTime}
  overtimeMinutes={overtimeMinutes}
  setOvertimeMinutes={setOvertimeMinutes}
  selectedMembers={selectedMembers}
  setSelectedMembers={setSelectedMembers}
  timeOptions={timeOptions}
/>

      <ReportDriverSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  selectedDrivers={selectedDrivers}
  setSelectedDrivers={setSelectedDrivers}
  driverInput={driverInput}
  setDriverInput={setDriverInput}
  filteredDrivers={filteredDrivers}
/>

<ReportHeavyEquipmentSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  showHeavyEquipment={showHeavyEquipment}
  setShowHeavyEquipment={setShowHeavyEquipment}
  heavyEquipment={heavyEquipment}
  setHeavyEquipment={setHeavyEquipment}
  operatorName={operatorName}
  setOperatorName={setOperatorName}
  employees={employees}
/>

<ReportCostSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  showExpressway={showExpressway}
  setShowExpressway={setShowExpressway}
  showParking={showParking}
  setShowParking={setShowParking}
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
  fuelOptions={fuelOptions}
  expresswayTotal={expresswayTotal}
  parkingTotal={parkingTotal}
/>

      <div style={sectionStyle}>
        <p>稼働人数</p>
        <input type="number" value={totalLabor} readOnly style={inputStyle} />
      </div>

      <ReportMemberSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  assignmentMembers={assignmentMembers}
  editMembersMode={editMembersMode}
  setEditMembersMode={setEditMembersMode}
  checkedAssignmentMembers={checkedAssignmentMembers}
  setCheckedAssignmentMembers={setCheckedAssignmentMembers}
  selectedMembers={selectedMembers}
  setSelectedMembers={setSelectedMembers}
  memberInput={memberInput}
  setMemberInput={setMemberInput}
  filteredEmployees={filteredEmployees}
  overtimeMinutes={overtimeMinutes}
  setMembersConfirmed={setMembersConfirmed}
  addMember={addMember}
  removeMember={removeMember}
  totalLabor={totalLabor}
  totalOvertime={totalOvertime}
  editingLaborName={editingLaborName}
  setEditingLaborName={setEditingLaborName}
/>

<ReportNoteSection
  sectionStyle={sectionStyle}
  inputStyle={inputStyle}
  note={note}
  setNote={setNote}
  submitLabel={submitLabel}
  isSubmitting={isSubmitting}
  handleValidatedSubmit={handleValidatedSubmit}
/>
</div>
);
}