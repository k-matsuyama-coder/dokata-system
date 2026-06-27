import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { hasRole } from "../../../types/auth";

type Props = {
  month: string;
  viewMode: "month" | "week";
  weekStart: string;
  fetchData: () => Promise<void>;
};

export function useMonthlyAssignmentAdmin({
  month,
  viewMode,
  weekStart,
  fetchData,
}: Props) {
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq("auth_user_id", user.id)
        .single();

        if (!employee || !hasRole(employee.role, "admin")) {
          alert("管理者のみ閲覧できます");
          window.location.href = "/home";
          return;
        }

      await fetchData();
    };

    checkAdmin();
  }, [month, viewMode, weekStart, fetchData]);
}