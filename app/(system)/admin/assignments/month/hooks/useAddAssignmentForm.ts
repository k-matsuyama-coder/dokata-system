import { useState } from "react";

export function useAddAssignmentForm() {
  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [managerName, setManagerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [meetingTime, setMeetingTime] = useState("08:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [constructionType, setConstructionType] =
    useState("第一工事");
  const [addFiles, setAddFiles] = useState<FileList | null>(null);

  return {
    siteName,
    setSiteName,

    contractorName,
    setContractorName,

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

    constructionType,
    setConstructionType,

    addFiles,
    setAddFiles,
  };
}
