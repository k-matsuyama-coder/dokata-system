import type { Dispatch, SetStateAction } from "react";

import { addEmployeeToCellAction } from "../actions/addEmployeeToCell";
import { moveSiteMemberAction } from "../actions/moveSiteMember";
import { deleteSiteMemberAction } from "../actions/deleteSiteMember";
import { toggleForemanAction } from "../actions/toggleForeman";

import type { SiteMember } from "../types";

type Props = {
  organizationId: string;
  siteMembers: SiteMember[];
  setSiteMembers: Dispatch<SetStateAction<SiteMember[]>>;

  getCellMembers: (
    assignmentId: string,
    workDate: string
  ) => SiteMember[];

  setDraggingEmployeeName: Dispatch<SetStateAction<string | null>>;
  setDraggingSiteMemberId: Dispatch<SetStateAction<string | null>>;
  setSelectedSiteMemberId: Dispatch<SetStateAction<string | null>>;

  fetchData: () => Promise<void>;
};

export function useMonthlyAssignmentMembers({
  organizationId,
  siteMembers,
  setSiteMembers,
  getCellMembers,
  setDraggingEmployeeName,
  setDraggingSiteMemberId,
  setSelectedSiteMemberId,
  fetchData,
}: Props) {
  const addEmployeeToCell = async (
    employeeName: string,
    assignmentId: string,
    workDate: string,
    autoForeman = true
  ) => {
    const exists = siteMembers.some(
      (m) =>
        m.assignment_id === assignmentId &&
        m.work_date === workDate &&
        m.employee_name === employeeName
    );

    if (exists) return;

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

    fetchData();
  };

  const deleteSiteMember = async (id: string) => {
    const { error } = await deleteSiteMemberAction(
      organizationId,
      id
    );

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    setSiteMembers((prev) =>
      prev.filter((m) => m.id !== id)
    );
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
      prev.map((m) =>
        m.id === member.id
          ? { ...m, is_foreman: !member.is_foreman }
          : m
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