import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contractor, Site } from "../../types/report";

type Props = {
  employeeName: string;
  reportDate: string;
};

export function useReportMasterData({ employeeName, reportDate }: Props) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) return;

      const res = await fetch("/api/current-organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok || !result.organizationId) {
        alert("会社情報が取得できません");
        return;
      }

      const organizationId = result.organizationId as string;

      const { data: contractorData } = await supabase
        .from("contractors")
        .select("name")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true });

      setContractors(contractorData ?? []);

      const { data: siteData } = await supabase
        .from("assignments")
        .select("id, site_name, contractor_name, manager_name")
        .eq("organization_id", organizationId)
        .not("site_name", "is", null)
        .order("site_name", { ascending: true });

      const { data: myAssignmentData } = await supabase
        .from("assignment_site_members")
        .select("assignment_id")
        .eq("organization_id", organizationId)
        .eq("employee_name", employeeName)
        .eq("work_date", reportDate);

      const myAssignmentIds = new Set(
        (myAssignmentData ?? []).map((row) => row.assignment_id)
      );

      const uniqueSites: Site[] = Array.from(
        new Map(
          (siteData ?? []).map((site) => [
            `${site.contractor_name}-${site.site_name}`,
            {
              id: site.id,
              site_name: site.site_name,
              contractor_name: site.contractor_name,
              manager_name: site.manager_name,
              is_my_assignment: myAssignmentIds.has(site.id),
            },
          ])
        ).values()
      );

      setSites(uniqueSites);
    };

    fetchMasterData();
  }, [employeeName, reportDate]);

  return {
    contractors,
    sites,
  };
}