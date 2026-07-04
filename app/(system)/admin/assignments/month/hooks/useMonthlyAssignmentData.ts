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

    const startedAt = performance.now();

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

    console.log("fetchMasterData ms", performance.now() - startedAt);
  }, [organizationId]);

  const fetchScheduleData = useCallback(async () => {
    if (!organizationId || !startDate || !endDate) {
      return;
    }

    const scheduleStartedAt = performance.now();

    const assignmentsStartedAt = performance.now();
    const assignmentData = await getAssignments(organizationId);
    const assignmentIds = (assignmentData ?? []).map((assignment) => assignment.id);
    console.log("getAssignments ms", performance.now() - assignmentsStartedAt);

    setAssignments(assignmentData);

    if (assignmentIds.length === 0) {
      setAssignmentFiles([]);
      setSiteMembers([]);
      setDailyInfos([]);
      setShiftRequests([]);
      console.log("fetchScheduleData ms", performance.now() - scheduleStartedAt);
      return;
    }

    const filesStartedAt = performance.now();
    const filesPromise = getAssignmentFiles(organizationId, assignmentIds).then((data) => {
      console.log("getAssignmentFiles ms", performance.now() - filesStartedAt);
      return data;
    });

    const membersStartedAt = performance.now();
    const membersPromise = getSiteMembers(
      organizationId,
      assignmentIds,
      startDate,
      endDate
    ).then((data) => {
      console.log("getSiteMembers ms", performance.now() - membersStartedAt);
      return data;
    });

    const dailyInfosStartedAt = performance.now();
    const dailyInfosPromise = getDailyInfos(
      organizationId,
      assignmentIds,
      startDate,
      endDate
    ).then((data) => {
      console.log("getDailyInfos ms", performance.now() - dailyInfosStartedAt);
      return data;
    });

    const shiftRequestsStartedAt = performance.now();
    const shiftRequestsPromise = getShiftRequests(
      organizationId,
      startDate,
      endDate
    ).then((data) => {
      console.log("getShiftRequests ms", performance.now() - shiftRequestsStartedAt);
      return data;
    });

    const [fileData, memberData, dailyInfoData, shiftRequestData] =
      await Promise.all([
        filesPromise,
        membersPromise,
        dailyInfosPromise,
        shiftRequestsPromise,
      ]);

    setAssignmentFiles(fileData);
    setSiteMembers(memberData);
    setDailyInfos(dailyInfoData);
    setShiftRequests(shiftRequestData);

    console.log("fetchScheduleData ms", performance.now() - scheduleStartedAt);
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