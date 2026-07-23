// app/(system)/admin/assignments/two-month/hooks/useAssignmentActions.ts
import {
  uploadAssignmentFiles,
  deleteAssignmentApi,
  deleteAssignmentFileApi,
  updateAssignmentApi,
  addAssignmentApi,
  updateAssignmentSortOrderApi,
} from "../api";

import type {
  Assignment,
  AssignmentFile,
  AssignmentGroupKey,
  DailyInfo,
  SiteMember,
} from "../types";

type Props = {
  organizationId: string | null;
  days: string[];

  siteName: string;
  contractorName: string;
  managerName: string;
  contactPhone: string;
  address: string;
  shiftType: string;
  meetingTime: string;
  startDate: string;
  endDate: string;
  groupKey: AssignmentGroupKey;
  newFiles: FileList | null;
  editingAssignment: Assignment | null;
  sortedAssignments: Assignment[];

  setSiteName: React.Dispatch<React.SetStateAction<string>>;
  setContractorName: React.Dispatch<React.SetStateAction<string>>;
  setManagerName: React.Dispatch<React.SetStateAction<string>>;
  setContactPhone: React.Dispatch<React.SetStateAction<string>>;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  setShiftType: React.Dispatch<React.SetStateAction<string>>;
  setMeetingTime: React.Dispatch<React.SetStateAction<string>>;
  setGroupKey: React.Dispatch<React.SetStateAction<AssignmentGroupKey>>;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  setNewFiles: React.Dispatch<React.SetStateAction<FileList | null>>;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;

  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  setAssignmentFiles: React.Dispatch<React.SetStateAction<AssignmentFile[]>>;
  setDailyInfos: React.Dispatch<React.SetStateAction<DailyInfo[]>>;
  setSiteMembers: React.Dispatch<React.SetStateAction<SiteMember[]>>;

  fetchData: () => void | Promise<void>;
};

function ensureOrganizationId(organizationId: string | null): string {
  if (!organizationId) {
    throw new Error("会社情報が取得できません");
  }
  return organizationId;
}

export function useAssignmentActions({
  organizationId,
  days,
  siteName,
  contractorName,
  managerName,
  contactPhone,
  address,
  shiftType,
  meetingTime,
  startDate,
  endDate,
  groupKey,
  newFiles,
  editingAssignment,
  sortedAssignments,
  setSiteName,
  setContractorName,
  setManagerName,
  setContactPhone,
  setAddress,
  setShiftType,
  setMeetingTime,
  setGroupKey,
  setStartDate,
  setEndDate,
  setShowAddModal,
  setNewFiles,
  setEditingAssignment,
  setAssignments,
  setAssignmentFiles,
  setDailyInfos,
  setSiteMembers,
  fetchData,
}: Props) {
  const uploadFiles = async (
    assignmentId: string,
    files: FileList | null
  ) => {
    try {
      const safeOrganizationId = ensureOrganizationId(organizationId);
      await uploadAssignmentFiles(assignmentId, files, safeOrganizationId);
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "アップロードに失敗しました");
    }
  };

  const updateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      const safeOrganizationId = ensureOrganizationId(organizationId);
      await updateAssignmentApi(editingAssignment, safeOrganizationId);
      setEditingAssignment(null);
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました");
    }
  };

  const deleteAssignment = async (id: string) => {
    const ok = window.confirm("この現場を削除しますか？");
    if (!ok) return;

    try {
      const safeOrganizationId = ensureOrganizationId(organizationId);
      await deleteAssignmentApi(id, safeOrganizationId);

      setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
      setDailyInfos((prev) => prev.filter((dailyInfo) => dailyInfo.assignment_id !== id));
      setSiteMembers((prev) => prev.filter((member) => member.assignment_id !== id));
      setAssignmentFiles((prev) => prev.filter((file) => file.assignment_id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    }
  };

  const deleteAssignmentFile = async (file: AssignmentFile) => {
    const ok = window.confirm("この添付ファイルを削除しますか？");
    if (!ok) return;

    try {
      const safeOrganizationId = ensureOrganizationId(organizationId);
      await deleteAssignmentFileApi(file.id, safeOrganizationId);
      setAssignmentFiles((prev) => prev.filter((item) => item.id !== file.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "ファイル削除に失敗しました");
    }
  };

  const moveAssignmentRow = async (
    fromAssignmentId: string,
    toAssignmentId: string
  ) => {
    if (fromAssignmentId === toAssignmentId) return;

    const fromIndex = sortedAssignments.findIndex(
      (assignment) => assignment.id === fromAssignmentId
    );
    const toIndex = sortedAssignments.findIndex(
      (assignment) => assignment.id === toAssignmentId
    );

    if (fromIndex === -1 || toIndex === -1) return;

    const nextAssignments = [...sortedAssignments];
    const [movedAssignment] = nextAssignments.splice(fromIndex, 1);
    nextAssignments.splice(toIndex, 0, movedAssignment);

    setAssignments(nextAssignments);

    try {
      const safeOrganizationId = ensureOrganizationId(organizationId);
      await updateAssignmentSortOrderApi(nextAssignments, safeOrganizationId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "並び替え保存に失敗しました");
      await fetchData();
    }
  };

  const handleAddSite = async () => {
    if (!siteName || !contractorName || !startDate) {
      alert("元請・現場名・工期開始を入力してください");
      return;
    }

    try {
      const safeOrganizationId = ensureOrganizationId(organizationId);

      const assignment = await addAssignmentApi(
        {
          assignment_date: days[0],
          contractor_name: contractorName,
          site_name: siteName,
          group_key: groupKey,
          manager_name: managerName,
          contact_phone: contactPhone,
          address,
          shift_type: shiftType,
          meeting_time: meetingTime,
          start_date: startDate,
          end_date: endDate || null,
        },
        safeOrganizationId
      );

      await uploadAssignmentFiles(assignment.id, newFiles, safeOrganizationId);

      setSiteName("");
      setContractorName("");
      setManagerName("");
      setContactPhone("");
      setAddress("");
      setShiftType("day");
      setMeetingTime("08:00");
      setGroupKey("group1");
      setStartDate("");
      setEndDate("");
      setShowAddModal(false);
      setNewFiles(null);

      setAssignments((prev) => [assignment, ...prev]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "現場追加に失敗しました");
    }
  };

  return {
    uploadFiles,
    updateAssignment,
    deleteAssignment,
    deleteAssignmentFile,
    moveAssignmentRow,
    handleAddSite,
  };
}