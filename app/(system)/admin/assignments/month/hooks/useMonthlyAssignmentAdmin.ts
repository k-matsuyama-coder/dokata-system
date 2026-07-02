// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentAdmin.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";

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
  const [isAdminChecked, setIsAdminChecked] = useState(false);

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
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee || !hasRole(employee.role, "admin")) {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
        return;
      }

      setIsAdminChecked(true);
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (!isAdminChecked) return;
    void fetchData();
  }, [isAdminChecked, month, viewMode, weekStart, fetchData]);
}