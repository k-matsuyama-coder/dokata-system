// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentData.ts
import { useCallback, useMemo, useState } from "react";

import { fetchMonthlyAssignmentsAction } from "../actions/fetchMonthlyAssignments";

import type {
  Assignment,
  AssignmentFile,
  Contractor,
  ContractorContact,
  DailyInfo,
  Employee,
  ShiftRequest,
  SiteMember,
} from "../types";

type Vehicle = {
  id: string;
  vehicle_name: string;
  vehicle_type: string | null;
};

type Props = {
  days: string[];
};

export function useMonthlyAssignmentData({ days }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorContacts, setContractorContacts] = useState<
    ContractorContact[]
  >([]);

  const startDate = useMemo(() => days[0] ?? "", [days]);
  const endDate = useMemo(() => days[days.length - 1] ?? "", [days]);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    const {
      employeeData,
      vehicleData,
      contractorData,
      contactData,
      assignmentData,
      fileData,
      memberData,
      dailyInfoData,
      shiftRequestData,
    } = await fetchMonthlyAssignmentsAction({
      startDate,
      endDate,
    });

    setEmployees(employeeData);
    setVehicles(vehicleData);
    setContractors(contractorData);
    setContractorContacts(contactData);
    setAssignments(assignmentData);
    setAssignmentFiles(fileData);
    setSiteMembers(memberData);
    setDailyInfos(dailyInfoData);
    setShiftRequests(shiftRequestData);
  }, [startDate, endDate]);

  return {
    assignments,
    setAssignments,
    assignmentFiles,
    setAssignmentFiles,
    siteMembers,
    setSiteMembers,
    dailyInfos,
    setDailyInfos,
    shiftRequests,
    setShiftRequests,
    employees,
    setEmployees,
    vehicles,
    setVehicles,
    contractors,
    setContractors,
    contractorContacts,
    setContractorContacts,
    fetchData,
  };
}