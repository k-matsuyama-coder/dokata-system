import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contractor = {
  name: string;
};

type Site = {
  id: string;
  site_name: string;
  contractor_name: string;
  manager_name: string | null;
};

export function useReportMasterData() {
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

      const uniqueSites: Site[] = Array.from(
        new Map(
          (siteData ?? []).map((s) => [
            `${s.contractor_name}-${s.site_name}`,
            {
              id: s.id,
              site_name: s.site_name,
              contractor_name: s.contractor_name,
              manager_name: s.manager_name,
            },
          ])
        ).values()
      );

      setSites(uniqueSites);
    };

    fetchMasterData();
  }, []);

  return {
    contractors,
    sites,
  };
}