// app/(system)/admin/assignments/month/actions/updateDailyInfoAction.ts
import { supabase } from "@/lib/supabase";
import type { DailyInfo } from "../types";

type Field = "planned_count" | "detail" | "vehicle_names";

type Props = {
  assignmentId: string;
  workDate: string;
  field: Field;
  value: string;
  organizationId: string;
  existing?: DailyInfo;
};

const toNullableDetail = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : value;
};

const toVehicleNames = (value: string) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export async function updateDailyInfoAction({
  assignmentId,
  workDate,
  field,
  value,
  organizationId,
  existing,
}: Props) {
  const payload = {
    organization_id: organizationId,
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
        ? toNullableDetail(value)
        : existing?.detail ?? null,
    vehicle_names:
      field === "vehicle_names"
        ? toVehicleNames(value)
        : existing?.vehicle_names ?? [],
  };

  const { data, error } = await supabase
    .from("assignment_site_daily_infos")
    .upsert(payload, {
      onConflict: "organization_id,assignment_id,work_date",
    })
    .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
    .single();

  return { data, error };
}
