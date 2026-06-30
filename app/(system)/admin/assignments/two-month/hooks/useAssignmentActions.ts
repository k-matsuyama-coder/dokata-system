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
  ConstructionType,
  DailyInfo,
  ShiftType,
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
  shiftType: ShiftType;
  meetingTime: string;
  startDate: string;
  endDate: string;
  constructionType: ConstructionType;
  newFiles: FileList | null;
  editingAssignment: Assignment | null;
  sortedAssignments: Assignment[];

  setSiteName: React.Dispatch<React.SetStateAction<string>>;
  setContractorName: React.Dispatch<React.SetStateAction<string>>;
  setManagerName: React.Dispatch<React.SetStateAction<string>>;
  setContactPhone: React.Dispatch<React.SetStateAction<string>>;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  setShiftType: React.Dispatch<React.SetStateAction<ShiftType>>;
  setMeetingTime: React.Dispatch<React.SetStateAction<string>>;
  setConstructionType: React.Dispatch<React.SetStateAction<ConstructionType>>;
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
  constructionType,
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
  setConstructionType,
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

      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setDailyInfos((prev) => prev.filter((d) => d.assignment_id !== id));
      setSiteMembers((prev) => prev.filter((m) => m.assignment_id !== id));
      setAssignmentFiles((prev) => prev.filter((f) => f.assignment_id !== id));
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

    const fromIndex = sortedAssignments.findIndex((a) => a.id === fromAssignmentId);
    const toIndex = sortedAssignments.findIndex((a) => a.id === toAssignmentId);

    if (fromIndex === -1 || toIndex === -1) return;

    const nextAssignments = [...sortedAssignments];
    const [moved] = nextAssignments.splice(fromIndex, 1);
    nextAssignments.splice(toIndex, 0, moved);

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

      const assignmentId = await addAssignmentApi(
        {
          assignment_date: days[0],
          contractor_name: contractorName,
          site_name: siteName,
          construction_type: constructionType,
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

      await uploadAssignmentFiles(assignmentId, newFiles, safeOrganizationId);

      setSiteName("");
      setContractorName("");
      setManagerName("");
      setContactPhone("");
      setAddress("");
      setShiftType("day");
      setMeetingTime("08:00");
      setConstructionType("第一工事");
      setStartDate("");
      setEndDate("");
      setShowAddModal(false);
      setNewFiles(null);

      await fetchData();
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