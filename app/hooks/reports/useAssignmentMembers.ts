import { fetchAllRows } from "@/lib/fetchAllRows";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  assignmentId: string | null;
  reportDate: string;
};

export function useAssignmentMembers({
  assignmentId,
  reportDate,
}: Props) {
  const [assignmentMembers, setAssignmentMembers] = useState<string[]>([]);

  useEffect(() => {
    if (!assignmentId || !reportDate) {
      setAssignmentMembers([]);
      return;
    }

    const fetchMembers = async () => {
      const { data, error } = await fetchAllRows((pageFrom, pageTo) => supabase
        .from("assignment_site_members")
        .select("employee_name")
        .eq("assignment_id", assignmentId)
        .eq("work_date", reportDate)
.order("id", { ascending: true }).range(pageFrom, pageTo));

      if (error) {
        console.error(error);
        return;
      }

      setAssignmentMembers(
        (data ?? []).map((row) => row.employee_name)
      );
    };

    fetchMembers();
  }, [assignmentId, reportDate]);

  return assignmentMembers;
}