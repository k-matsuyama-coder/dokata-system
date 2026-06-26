import {
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
    const [
      employeeData,
      vehicleData,
      contractorData,
      contactData,
      assignmentData,
    ] = await Promise.all([
      getEmployees(),
      getVehicles(),
      getContractors(),
      getContractorContacts(),
      getAssignments(),
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
  
    const [
      fileData,
      memberData,
      dailyInfoData,
      shiftRequestData,
    ] = await Promise.all([
      getAssignmentFiles(assignmentIds),
      getSiteMembers(assignmentIds, startDate, endDate),
      getDailyInfos(assignmentIds, startDate, endDate),
      getShiftRequests(startDate, endDate),
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