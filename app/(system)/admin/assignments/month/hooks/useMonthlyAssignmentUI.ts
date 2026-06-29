import { useState } from "react";
import type { Assignment } from "../types";

export function useMonthlyAssignmentUI() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [editingAssignment, setEditingAssignment] =
    useState<Assignment | null>(null);

  const [sortMode, setSortMode] = useState("manual");
  const [showFinished, setShowFinished] = useState(false);

  return {
    showAddModal,
    setShowAddModal,

    showMemberModal,
    setShowMemberModal,

    editingAssignment,
    setEditingAssignment,

    sortMode,
    setSortMode,

    showFinished,
    setShowFinished,
  };
}