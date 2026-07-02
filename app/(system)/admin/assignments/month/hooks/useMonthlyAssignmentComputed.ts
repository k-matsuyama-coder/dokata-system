import { useMemo } from "react";
import type {
  Assignment,
  DailyInfo,
  Employee,
  ShiftRequest,
  SiteMember,
} from "../types";

type Props = {
  month: string;
  days: string[];
  assignments: Assignment[];
  siteMembers: SiteMember[];
  dailyInfos: DailyInfo[];
  employees: Employee[];
  shiftRequests: ShiftRequest[];
};

export function useMonthlyAssignmentComputed({
  month,
  days,
  assignments,
  siteMembers,
  dailyInfos,
  employees,
  shiftRequests,
}: Props) {
  const assignmentMap = useMemo(() => {
    return new Map(assignments.map((a) => [a.id, a]));
  }, [assignments]);

  const cellMembersMap = useMemo(() => {
    const map = new Map<string, SiteMember[]>();

    siteMembers.forEach((member) => {
      const key = `${member.assignment_id}_${member.work_date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(member);
    });

    return map;
  }, [siteMembers]);

  const getCellMembers = (assignmentId: string, workDate: string) => {
    return cellMembersMap.get(`${assignmentId}_${workDate}`) ?? [];
  };

  const dailySummaryMap = useMemo(() => {
    const map = new Map<
      string,
      {
        infos: DailyInfo[];
        members: SiteMember[];
      }
    >();

    days.forEach((date) => {
      map.set(date, { infos: [], members: [] });
    });

    dailyInfos.forEach((info) => {
      map.get(info.work_date)?.infos.push(info);
    });

    siteMembers.forEach((member) => {
      map.get(member.work_date)?.members.push(member);
    });

    return map;
  }, [days, dailyInfos, siteMembers]);

  const assignmentCountMap = useMemo(() => {
    const map = new Map<string, number>();
  
    siteMembers.forEach((member) => {
      if (!member.work_date.startsWith(`${month}-`)) {
        return;
      }
  
      map.set(
        member.employee_name,
        (map.get(member.employee_name) ?? 0) + 1
      );
    });
  
    return map;
  }, [siteMembers, month]);

  const getAssignmentCount = (employeeName: string) =>
    assignmentCountMap.get(employeeName) ?? 0;

  const unassignedEmployeesMap = useMemo(() => {
    const map = new Map<string, Employee[]>();

    days.forEach((date) => {
      ["day", "night"].forEach((shift) => {
        const assignedNames = new Set(
          siteMembers
            .filter((m) => {
              if (m.work_date !== date) return false;

              const assignment = assignmentMap.get(m.assignment_id);

              return (assignment?.shift_type ?? "day") === shift;
            })
            .map((m) => m.employee_name)
        );

        const holidayNames = new Set(
          shiftRequests
            .filter((r) => r.request_date === date)
            .map((r) => r.employee_name)
        );

        map.set(
          `${date}_${shift}`,
          employees.filter(
            (employee) =>
              !assignedNames.has(employee.name) &&
              !holidayNames.has(employee.name)
          )
        );
      });
    });

    return map;
  }, [days, employees, siteMembers, shiftRequests, assignmentMap]);

  const getUnassignedEmployeesByDate = (
    workDate: string,
    shiftType: string | null
  ) => {
    return unassignedEmployeesMap.get(`${workDate}_${shiftType ?? "day"}`) ?? [];
  };

  const isAssignedSameDateDifferentShift = (
    employeeName: string,
    workDate: string,
    currentShiftType: string | null
  ) => {
    return siteMembers.some((member) => {
      if (member.work_date !== workDate) return false;
      if (member.employee_name !== employeeName) return false;

      const assignment = assignmentMap.get(member.assignment_id);

      return (
        (assignment?.shift_type ?? "day") !==
        (currentShiftType ?? "day")
      );
    });
  };

  return {
    assignmentMap,
    getCellMembers,
    dailySummaryMap,
    getAssignmentCount,
    getUnassignedEmployeesByDate,
    isAssignedSameDateDifferentShift,
  };
}