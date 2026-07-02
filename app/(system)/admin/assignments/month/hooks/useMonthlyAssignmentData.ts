// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentData.ts
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAssignments,
  getAssignmentFiles,
  getContractorContacts,
  getContractors,
  getCurrentOrganization,
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
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const startDate = useMemo(() => days[0] ?? "", [days]);
  const endDate = useMemo(() => days[days.length - 1] ?? "", [days]);

  useEffect(() => {
    let active = true;

    const loadOrganizationId = async () => {
      const currentOrganizationId = await getCurrentOrganization();
      if (!active) return;
      setOrganizationId(currentOrganizationId);
    };

    void loadOrganizationId();

    return () => {
      active = false;
    };
  }, []);

  const fetchMasterData = useCallback(async () => {
    if (!organizationId) return;

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
  }, [organizationId]);

  const fetchScheduleData = useCallback(async () => {
    if (!organizationId || !startDate || !endDate) {
      return;
    }

    const assignmentData = await getAssignments(organizationId);
    const assignmentIds = (assignmentData ?? []).map((assignment) => assignment.id);

    setAssignments(assignmentData);

    if (assignmentIds.length === 0) {
      setAssignmentFiles([]);
      setSiteMembers([]);
      setDailyInfos([]);
      setShiftRequests([]);
      return;
    }

    const [fileData, memberData, dailyInfoData, shiftRequestData] =
      await Promise.all([
        getAssignmentFiles(organizationId, assignmentIds),
        getSiteMembers(organizationId, assignmentIds, startDate, endDate),
        getDailyInfos(organizationId, assignmentIds, startDate, endDate),
        getShiftRequests(organizationId, startDate, endDate),
      ]);

    setAssignmentFiles(fileData);
    setSiteMembers(memberData);
    setDailyInfos(dailyInfoData);
    setShiftRequests(shiftRequestData);
  }, [organizationId, startDate, endDate]);

  const fetchData = useCallback(async () => {
    await fetchMasterData();
    await fetchScheduleData();
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