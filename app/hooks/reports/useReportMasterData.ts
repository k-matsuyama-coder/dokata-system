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
      const { data: contractorData } = await supabase
        .from("contractors")
        .select("name")
        .order("name", { ascending: true });

      setContractors(contractorData ?? []);

      const { data: siteData } = await supabase
        .from("assignments")
        .select("id, site_name, contractor_name, manager_name")
        .not("site_name", "is", null)
        .order("site_name", { ascending: true });

      const { data: myAssignmentData } = await supabase
        .from("assignment_site_members")
        .select("assignment_id")
        .eq("employee_name", employeeName)
        .eq("work_date", reportDate);

      const myAssignmentIds = new Set(
        (myAssignmentData ?? []).map((row) => row.assignment_id)
      );

      const uniqueSites: Site[] = Array.from(
        new Map(
          (siteData ?? []).map((s) => [
            `${s.contractor_name}-${s.site_name}`,
            {
              id: s.id,
              site_name: s.site_name,
              contractor_name: s.contractor_name,
              manager_name: s.manager_name,
              is_my_assignment: myAssignmentIds.has(s.id),
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