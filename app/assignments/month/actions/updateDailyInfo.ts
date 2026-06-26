import { supabase } from "@/lib/supabase";
import type { DailyInfo } from "../types";

type Field = "planned_count" | "detail" | "vehicle_names";

type Props = {
  assignmentId: string;
  workDate: string;
  field: Field;
  value: string;
  existing?: DailyInfo;
};

export async function updateDailyInfoAction({
  assignmentId,
  workDate,
  field,
  value,
  existing,
}: Props) {
  const payload = {
    assignment_id: assignmentId,
    work_date: workDate,
    planned_count:
      field === "planned_count"
        ? value === ""
          ? null
          : Number(value)
        : existing?.planned_count ?? null,

    detail:
      field === "detail"
        ? value
        : existing?.detail ?? null,

    vehicle_names:
      field === "vehicle_names"
        ? value
          ? value.split(",").filter(Boolean)
          : []
        : existing?.vehicle_names ?? [],
  };

  const { data, error } = await supabase
    .from("assignment_site_daily_infos")
    .upsert(payload, {
      onConflict: "assignment_id,work_date",
    })
    .select(
      "id, assignment_id, work_date, planned_count, detail, vehicle_names"
    )
    .single();

  return { data, error };
}