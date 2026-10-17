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

    const consecutiveCountMap = useMemo(() => {
      const slotsByEmployee = new Map<string, Set<number>>();
      const dayMilliseconds = 24 * 60 * 60 * 1000;
  
      const toDayNumber = (date: string) => {
        const [year, monthNumber, day] = date.split("-").map(Number);
        return Date.UTC(year, monthNumber - 1, day) / dayMilliseconds;
      };
  
      siteMembers.forEach((member) => {
        const assignment = assignmentMap.get(member.assignment_id);
        if (!assignment) return;
  
        const shift = assignment.shift_type ?? "day";
        if (shift !== "day" && shift !== "night") return;
  
        const slot =
          toDayNumber(member.work_date) * 2 + (shift === "night" ? 1 : 0);
  
        let slots = slotsByEmployee.get(member.employee_name);
        if (!slots) {
          slots = new Set<number>();
          slotsByEmployee.set(member.employee_name, slots);
        }
  
        // 同じ日の同じ勤務帯は、複数現場にいても１勤務として扱う
        slots.add(slot);
      });
  
      const [year, monthNumber] = month.split("-").map(Number);
      const monthStartSlot =
        (Date.UTC(year, monthNumber - 1, 1) / dayMilliseconds) * 2;
      const nextMonthStartSlot =
        (Date.UTC(year, monthNumber, 1) / dayMilliseconds) * 2;
  
      const counts = new Map<string, number>();
  
      slotsByEmployee.forEach((slots, employeeName) => {
        let count = 0;
  
        slots.forEach((slot) => {
          if (
            slot >= monthStartSlot &&
            slot < nextMonthStartSlot &&
            slots.has(slot - 1)
          ) {
            count += 1;
          }
        });
  
        counts.set(employeeName, count);
      });
  
      return counts;
    }, [siteMembers, assignmentMap, month]);
  
    const getConsecutiveCount = (employeeName: string) =>
      consecutiveCountMap.get(employeeName) ?? 0;

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
    getConsecutiveCount,
    getUnassignedEmployeesByDate,
    isAssignedSameDateDifferentShift,
  };
}