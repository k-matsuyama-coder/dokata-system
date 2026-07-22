// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentMembers.ts
import type { Dispatch, SetStateAction } from "react";

import { addEmployeeToCellAction } from "../actions/addEmployeeToCell";
import { moveSiteMemberAction } from "../actions/moveSiteMember";
import { deleteSiteMemberAction } from "../actions/deleteSiteMember";
import { toggleForemanAction } from "../actions/toggleForeman";

import type {
  Assignment,
  SiteMember,
  ShiftRequest,
} from "../types";

type Props = {
  organizationId: string;
  assignments: Assignment[];
  siteMembers: SiteMember[];
  shiftRequests: ShiftRequest[];
  setSiteMembers: Dispatch<SetStateAction<SiteMember[]>>;
  getCellMembers: (assignmentId: string, workDate: string) => SiteMember[];
  setDraggingEmployeeName: Dispatch<SetStateAction<string | null>>;
  setDraggingSiteMemberId: Dispatch<SetStateAction<string | null>>;
  setSelectedSiteMemberId: Dispatch<SetStateAction<string | null>>;
  fetchScheduleData: () => Promise<void>;
};

function normalizeShiftType(value: string | null | undefined): "day" | "night" | "other" {
  if (value === "day") return "day";
  if (value === "night") return "night";
  return "other";
}

function getShiftLabel(value: string | null | undefined) {
  return normalizeShiftType(value) === "night" ? "夜勤" : "日勤";
}

export function useMonthlyAssignmentMembers({
  organizationId,
  assignments,
  siteMembers,
  shiftRequests,
  setSiteMembers,
  getCellMembers,
  setDraggingEmployeeName,
  setDraggingSiteMemberId,
  setSelectedSiteMemberId,
  fetchScheduleData,
}: Props) {
  const getAssignmentById = (assignmentId: string) =>
    assignments.find((assignment) => assignment.id === assignmentId) ?? null;

  const hasDuplicateInSameShift = ({
    employeeName,
    assignmentId,
    workDate,
    ignoreSiteMemberId,
  }: {
    employeeName: string;
    assignmentId: string;
    workDate: string;
    ignoreSiteMemberId?: string;
  }) => {
    const targetAssignment = getAssignmentById(assignmentId);

    if (!targetAssignment) {
      return {
        duplicated: false,
        message: "",
      };
    }

    const targetShiftType = normalizeShiftType(targetAssignment.shift_type);
    const targetShiftLabel = getShiftLabel(targetAssignment.shift_type);

    for (const member of siteMembers) {
      if (ignoreSiteMemberId && member.id === ignoreSiteMemberId) {
        continue;
      }

      if (member.employee_name !== employeeName) {
        continue;
      }

      if (member.work_date !== workDate) {
        continue;
      }

      const existingAssignment = getAssignmentById(member.assignment_id);
      if (!existingAssignment) {
        continue;
      }

      const existingShiftType = normalizeShiftType(existingAssignment.shift_type);
      if (existingShiftType !== targetShiftType) {
        continue;
      }

      if (member.assignment_id === assignmentId) {
        return {
          duplicated: true,
          message: `${employeeName} は ${workDate} の${targetShiftLabel}で、すでにこの現場に入っています。`,
        };
      }

      return {
        duplicated: true,
        message: `${employeeName} は ${workDate} の${targetShiftLabel}で、すでに「${existingAssignment.site_name ?? "現場名未設定"}」に配置されています。\n同じ勤務帯には重複配置できません。`,
      };
    }

    return {
      duplicated: false,
      message: "",
    };
  };

  const addEmployeeToCell = async (
    employeeName: string,
    assignmentId: string,
    workDate: string,
    autoForeman = true
  ) => {
    const isHoliday = shiftRequests.some(
      (request) =>
        request.employee_name === employeeName &&
        request.request_date === workDate
    );
    
    if (isHoliday) {
      alert(`${employeeName} は ${workDate} は休みのため配置できません。`);
      return;
    }

    const duplicate = hasDuplicateInSameShift({
      employeeName,
      assignmentId,
      workDate,
    });

    if (duplicate.duplicated) {
      alert(duplicate.message);
      return;
    }

    const exists = siteMembers.some(
      (member) =>
        member.assignment_id === assignmentId &&
        member.work_date === workDate &&
        member.employee_name === employeeName
    );

    if (exists) {
      alert(`${employeeName} はすでにこの現場に入っています。`);
      return;
    }

    const cellMembers = getCellMembers(assignmentId, workDate);
    const isFirstMember = autoForeman && cellMembers.length === 0;

    const { data, error } = await addEmployeeToCellAction({
      employeeName,
      assignmentId,
      workDate,
      isFirstMember,
      organizationId,
    });

    if (error || !data) {
      alert("メンバー追加失敗: " + (error?.message || "取得失敗"));
      return;
    }

    setSiteMembers((prev) => [...prev, data]);
    setDraggingEmployeeName(null);
  };

  const moveSiteMember = async (
    siteMemberId: string,
    assignmentId: string,
    workDate: string
  ) => {
    const movingMember = siteMembers.find((member) => member.id === siteMemberId);

    if (!movingMember) {
      alert("移動対象メンバーが見つかりません。");
      return;
    }

    const duplicate = hasDuplicateInSameShift({
      employeeName: movingMember.employee_name,
      assignmentId,
      workDate,
      ignoreSiteMemberId: siteMemberId,
    });

    if (duplicate.duplicated) {
      alert(duplicate.message);
      return;
    }

    const { error } = await moveSiteMemberAction({
      organizationId,
      siteMemberId,
      assignmentId,
      workDate,
    });

    if (error) {
      alert("移動失敗: " + error.message);
      return;
    }

    setDraggingSiteMemberId(null);
    setSelectedSiteMemberId(null);

    await fetchScheduleData();
  };

  const deleteSiteMember = async (id: string) => {
    const { error } = await deleteSiteMemberAction({
      organizationId,
      id,
    });

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    setSiteMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const toggleForeman = async (member: SiteMember) => {
    const { error } = await toggleForemanAction({
      organizationId,
      member,
    });

    if (error) {
      alert("職長変更失敗: " + error.message);
      return;
    }

    setSiteMembers((prev) =>
      prev.map((current) =>
        current.id === member.id
          ? { ...current, is_foreman: !member.is_foreman }
          : current
      )
    );
  };

  return {
    addEmployeeToCell,
    moveSiteMember,
    deleteSiteMember,
    toggleForeman,
  };
}