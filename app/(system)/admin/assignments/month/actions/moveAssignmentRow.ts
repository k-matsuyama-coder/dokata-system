import { supabase } from "@/lib/supabase";
import type { Assignment } from "../types";

type Props = {
  assignments: Assignment[];
  fromAssignmentId: string;
  toAssignmentId: string;
  organizationId: string;
};

export async function moveAssignmentRowAction({
  assignments,
  fromAssignmentId,
  toAssignmentId,
  organizationId,
}: Props) {
  if (fromAssignmentId === toAssignmentId) {
    return { nextAssignments: assignments, error: null };
  }

  const fromIndex = assignments.findIndex((a) => a.id === fromAssignmentId);
  const toIndex = assignments.findIndex((a) => a.id === toAssignmentId);

  if (fromIndex === -1 || toIndex === -1) {
    return { nextAssignments: assignments, error: null };
  }

  const nextAssignments = [...assignments];
  const [moved] = nextAssignments.splice(fromIndex, 1);
  nextAssignments.splice(toIndex, 0, moved);

  const updates = nextAssignments.map((assignment, index) =>
    supabase
      .from("assignments")
      .update({ sort_order: index })
      .eq("organization_id", organizationId)
      .eq("id", assignment.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  return {
    nextAssignments,
    error: failed?.error ?? null,
  };
}