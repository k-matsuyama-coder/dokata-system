// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentData.ts
import { useCallback, useMemo, useState } from "react";

import {
  getAssignments,
  getAssignmentFiles,
  getContractorContacts,
  getContractors,
  getDailyInfos,
  getEmployees,
  getShiftRequests,
  getSiteMembers,
  getVehicles,
} from "../api";

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
  organizationId: string | null;
};

export function useMonthlyAssignmentData({ days, organizationId }: Props) {
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

  const fetchMasterData = useCallback(async () => {
    if (!organizationId) return;

    console.time("fetchMasterData");

    const [employeeData, vehicleData, contractorData, contactData] =
      await Promise.all([
        getEmployees(organizationId),
        getVehicles(organizationId),
        getContractors(organizationId),
        getContractorContacts(organizationId),
      ]);

    setEmployees(employeeData);
    setVehicles(vehicleData);
    setContractors(contractorData);
    setContractorContacts(contactData);

    console.timeEnd("fetchMasterData");
  }, [organizationId]);

  const fetchScheduleData = useCallback(async () => {
    if (!organizationId || !startDate || !endDate) {
      return;
    }

    console.time("fetchScheduleData");
    console.time("getAssignments");

    const assignmentData = await getAssignments(organizationId);

    console.log(
      "assignmentIds",
      assignmentData.map((a) => ({
        id: a.id,
        site: a.site_name,
      }))
    );
    
    const assignmentIds = (assignmentData ?? []).map((assignment) => assignment.id);

    console.timeEnd("getAssignments");

    setAssignments(assignmentData);

    if (assignmentIds.length === 0) {
      setAssignmentFiles([]);
      setSiteMembers([]);
      setDailyInfos([]);
      setShiftRequests([]);
      console.timeEnd("fetchScheduleData");
      return;
    }

    console.time("scheduleChildren");

    const [fileData, memberData, dailyInfoData, shiftRequestData] =
      await Promise.all([
        getAssignmentFiles(organizationId, assignmentIds),
        getSiteMembers(organizationId, assignmentIds, startDate, endDate),
        getDailyInfos(organizationId, assignmentIds, startDate, endDate),
        getShiftRequests(organizationId, startDate, endDate),
      ]);

      console.log("取得したメンバー", memberData);

    console.timeEnd("scheduleChildren");

    setAssignmentFiles(fileData);
    setSiteMembers(memberData);
    setDailyInfos(dailyInfoData);
    setShiftRequests(shiftRequestData);

    console.timeEnd("fetchScheduleData");
  }, [organizationId, startDate, endDate]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchMasterData(), fetchScheduleData()]);
  }, [fetchMasterData, fetchScheduleData]);

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
    fetchMasterData,
    fetchScheduleData,
    fetchData,
  };
}