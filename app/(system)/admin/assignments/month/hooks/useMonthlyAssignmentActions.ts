import type { Dispatch, SetStateAction } from "react";
import type React from "react";

import { updateAssignmentAction } from "../actions/updateAssignment";
import { handleAddSiteAction } from "../actions/handleAddSite";
import { deleteAssignmentAction } from "../actions/deleteAssignment";
import { uploadFilesAction } from "../actions/uploadFiles";
import { deleteAssignmentFileAction } from "../actions/deleteAssignmentFile";
import type { AssignmentGroupKey } from "../types";

import type {
  Assignment,
  AssignmentFile,
} from "../types";

type Props = {
  month: string;

  siteName: string;
  setSiteName: Dispatch<SetStateAction<string>>;

  contractorName: string;
  setContractorName: Dispatch<SetStateAction<string>>;

  shiftType: string;
  setShiftType: Dispatch<SetStateAction<string>>;

  managerName: string;
  setManagerName: Dispatch<SetStateAction<string>>;

  contactPhone: string;
  setContactPhone: Dispatch<SetStateAction<string>>;

  address: string;
  setAddress: Dispatch<SetStateAction<string>>;

  meetingTime: string;
  setMeetingTime: Dispatch<SetStateAction<string>>;

  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;

  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;

  constructionType: string;
  setConstructionType: Dispatch<SetStateAction<string>>;

  editingAssignment: Assignment | null;
  setEditingAssignment: Dispatch<SetStateAction<Assignment | null>>;

  assignmentFiles: AssignmentFile[];
  setAssignmentFiles: Dispatch<SetStateAction<AssignmentFile[]>>;

  setAssignments: Dispatch<SetStateAction<Assignment[]>>;
  setSiteMembers: Dispatch<SetStateAction<any[]>>;

  addFiles: FileList | null;
setAddFiles: React.Dispatch<
  React.SetStateAction<FileList | null>
>;

  setShowAddModal: Dispatch<SetStateAction<boolean>>;

  groupKey: AssignmentGroupKey;
setGroupKey: Dispatch<SetStateAction<AssignmentGroupKey>>;

  fetchData: () => Promise<void>;
};

export function useMonthlyAssignmentActions({
  month,

  siteName,
  setSiteName,

  contractorName,
  setContractorName,

  shiftType,
  setShiftType,

  managerName,
  setManagerName,

  contactPhone,
  setContactPhone,

  address,
  setAddress,

  meetingTime,
  setMeetingTime,

  startDate,
  setStartDate,

  endDate,
  setEndDate,

  constructionType,
  setConstructionType,

  editingAssignment,
  setEditingAssignment,

  assignmentFiles,
  setAssignmentFiles,

  setAssignments,
  setSiteMembers,

  addFiles,
setAddFiles,

  setShowAddModal,

  groupKey,
setGroupKey,

  fetchData,
}: Props) {
  const updateAssignment = async () => {
    const { error } = await updateAssignmentAction({
      editingAssignment,
    });

    if (error) {
      alert("現場更新失敗: " + error.message);
      return;
    }

    setEditingAssignment(null);
    fetchData();
  };

  const uploadFiles = async (
    assignmentId: string,
    files: FileList | null
  ) => {
    const { error } = await uploadFilesAction(
      assignmentId,
      files
    );

    if (error) {
      alert("アップロード失敗: " + error.message);
      return;
    }

    fetchData();
  };

  const deleteAssignmentFile = async (file: AssignmentFile) => {
    const ok = window.confirm("このファイルを削除しますか？");

    if (!ok) return;

    const { error } = await deleteAssignmentFileAction({
      file,
    });

    if (error) {
      alert("ファイル削除失敗: " + error.message);
      return;
    }

    setAssignmentFiles((prev) =>
      prev.filter((item) => item.id !== file.id)
    );
  };

  const handleAddSite = async () => {
    const { data, error } = await handleAddSiteAction({
      month,
      siteName,
      contractorName,
      startDate,
      endDate,
      shiftType,
      managerName,
      contactPhone,
      address,
      meetingTime,
      groupKey,
    });

    if (error) {
      alert("現場追加失敗: " + error.message);
      return;
    }

    if (data?.id && addFiles && addFiles.length > 0) {
      const { error: uploadError } = await uploadFilesAction(
        data.id,
        addFiles
      );
    
      if (uploadError) {
        alert("現場は追加されましたが、ファイルアップロードに失敗しました: " + uploadError.message);
      }
    }

    setSiteName("");
setContractorName("");
setManagerName("");
setContactPhone("");
setAddress("");
setShiftType("day");
setGroupKey("group1");
setMeetingTime("08:00");
setStartDate("");
setEndDate("");
setAddFiles(null);
setShowAddModal(false);

    fetchData();
  };

  const deleteAssignment = async (id: string) => {
    const ok = window.confirm("この現場を削除しますか？");

    if (!ok) return;

    const { error } = await deleteAssignmentAction({
      assignmentId: id,
      assignmentFiles,
    });

    if (error) {
      alert("現場削除失敗: " + error.message);
      return;
    }

    setAssignments((prev) =>
      prev.filter((a) => a.id !== id)
    );

    setSiteMembers((prev) =>
      prev.filter((m) => m.assignment_id !== id)
    );

    setAssignmentFiles((prev) =>
      prev.filter((f) => f.assignment_id !== id)
    );
  };

  return {
    updateAssignment,
    uploadFiles,
    deleteAssignmentFile,
    handleAddSite,
    deleteAssignment,
  };
}