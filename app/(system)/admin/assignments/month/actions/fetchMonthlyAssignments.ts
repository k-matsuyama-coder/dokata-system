import {
  getCurrentOrganization,
  getEmployees,
  getVehicles,
  getContractors,
  getContractorContacts,
  getAssignments,
  getAssignmentFiles,
  getSiteMembers,
  getDailyInfos,
  getShiftRequests,
} from "../api";

type Props = {
  startDate: string;
  endDate: string;
};

export async function fetchMonthlyAssignmentsAction({
  startDate,
  endDate,
}: Props) {
  const organizationId = await getCurrentOrganization();

  const [
    employeeData,
    vehicleData,
    contractorData,
    contactData,
    assignmentData,
  ] = await Promise.all([
    getEmployees(organizationId),
    getVehicles(organizationId),
    getContractors(organizationId),
    getContractorContacts(organizationId),
    getAssignments(organizationId),
  ]);

  const assignmentIds = (assignmentData ?? []).map((a) => a.id);

  if (assignmentIds.length === 0) {
    return {
      employeeData,
      vehicleData,
      contractorData,
      contactData,
      assignmentData,
      fileData: [],
      memberData: [],
      dailyInfoData: [],
      shiftRequestData: [],
    };
  }

  const [fileData, memberData, dailyInfoData, shiftRequestData] =
    await Promise.all([
      getAssignmentFiles(organizationId, assignmentIds),
      getSiteMembers(organizationId, assignmentIds, startDate, endDate),
      getDailyInfos(organizationId, assignmentIds, startDate, endDate),
      getShiftRequests(organizationId, startDate, endDate),
    ]);

  return {
    employeeData,
    vehicleData,
    contractorData,
    contactData,
    assignmentData,
    fileData,
    memberData,
    dailyInfoData,
    shiftRequestData,
  };
}