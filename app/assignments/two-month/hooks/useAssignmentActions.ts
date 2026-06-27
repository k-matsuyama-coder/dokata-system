import type { Assignment, AssignmentFile, DailyInfo, SiteMember } from "../types";

import {
  uploadAssignmentFiles,
  deleteAssignmentApi,
  deleteAssignmentFileApi,
  updateAssignmentApi,
  addAssignmentApi,
  updateAssignmentSortOrderApi,
} from "../api";

type Props = {
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
  constructionType: string;
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
  setConstructionType: React.Dispatch<React.SetStateAction<string>>;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  setNewFiles: React.Dispatch<React.SetStateAction<FileList | null>>;
  setEditingAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;

  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  setAssignmentFiles: React.Dispatch<React.SetStateAction<AssignmentFile[]>>;
  setDailyInfos: React.Dispatch<React.SetStateAction<DailyInfo[]>>;
  setSiteMembers: React.Dispatch<React.SetStateAction<SiteMember[]>>;

  fetchData: () => void;
};

export function useAssignmentActions({
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
      await uploadAssignmentFiles(assignmentId, files);
      fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "アップロードに失敗しました");
    }
  };

  const updateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      await updateAssignmentApi(editingAssignment);

      setEditingAssignment(null);
      fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました");
    }
  };

  const deleteAssignment = async (id: string) => {
    const ok = window.confirm("この現場を削除しますか？");
    if (!ok) return;

    try {
      await deleteAssignmentApi(id);

      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setDailyInfos((prev) => prev.filter((d) => d.assignment_id !== id));
      setSiteMembers((prev) => prev.filter((m) => m.assignment_id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    }
  };

  const deleteAssignmentFile = async (file: AssignmentFile) => {
    const ok = window.confirm("この添付ファイルを削除しますか？");
    if (!ok) return;

    try {
      await deleteAssignmentFileApi(file.id);

      setAssignmentFiles((prev) =>
        prev.filter((item) => item.id !== file.id)
      );
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
      (a) => a.id === fromAssignmentId
    );
    const toIndex = sortedAssignments.findIndex(
      (a) => a.id === toAssignmentId
    );

    if (fromIndex === -1 || toIndex === -1) return;

    const nextAssignments = [...sortedAssignments];
    const [moved] = nextAssignments.splice(fromIndex, 1);
    nextAssignments.splice(toIndex, 0, moved);

    setAssignments(nextAssignments);

    try {
      await updateAssignmentSortOrderApi(nextAssignments);
    } catch (error) {
      alert(error instanceof Error ? error.message : "並び替え保存に失敗しました");
      fetchData();
    }
  };

  const handleAddSite = async () => {
    if (!siteName || !contractorName || !startDate) {
      alert("元請・現場名・工期開始を入力してください");
      return;
    }

    try {
      const assignmentId = await addAssignmentApi({
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
      });

      await uploadFiles(assignmentId, newFiles);

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

      fetchData();
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