import { useState } from "react";
import type { AssignmentGroupKey } from "../types";

export function useAddAssignmentForm() {
  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [groupKey, setGroupKey] = useState<AssignmentGroupKey>("group1");
  const [shiftType, setShiftType] = useState("day");
  const [managerName, setManagerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [meetingTime, setMeetingTime] = useState("08:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addFiles, setAddFiles] = useState<FileList | null>(null);

  return {
    siteName,
    setSiteName,
    contractorName,
    setContractorName,
    groupKey,
    setGroupKey,
    shiftType,
    setShiftType,
    managerName,
    setManagerName,
    contactPhone,
    setContactPhone,
    address,
    setAddress,
    meetingTime,
    setMeetingTime,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    addFiles,
    setAddFiles,
  };
}