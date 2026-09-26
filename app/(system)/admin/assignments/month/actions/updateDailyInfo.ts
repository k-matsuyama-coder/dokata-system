import { supabase } from "@/lib/supabase";
import type { DailyInfo } from "../types";

type Field = "planned_count" | "detail" | "memo" | "vehicle_names";

type Props = {
  assignmentId: string;
  workDate: string;
  field: Field;
  value: string;
  organizationId: string;
  existing?: DailyInfo;
};

export async function updateDailyInfoAction({
  assignmentId,
  workDate,
  field,
  value,
  organizationId,
}: Props) {
  if (!organizationId || !assignmentId || !workDate) {
    return {
      data: null,
      error: { message: "会社・現場・日付を確認できません。" },
    };
  }

  let savedValue: number | string | string[] | null;

  if (field === "planned_count") {
    savedValue = value.trim() === "" ? null : Number(value);

    if (
      savedValue !== null &&
      (!Number.isFinite(savedValue) || savedValue < 0)
    ) {
      return {
        data: null,
        error: { message: "人数は0以上の数値で入力してください。" },
      };
    }
  } else if (field === "vehicle_names") {
    savedValue = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  } else {
    savedValue = value.trim() === "" ? null : value;
  }

  // 編集した項目だけ送る。
  // 画面に残っている古いメモなどは送らない。
  const payload = {
    organization_id: organizationId,
    assignment_id: assignmentId,
    work_date: workDate,
    [field]: savedValue,
  };

  const { data, error } = await supabase
    .from("assignment_site_daily_infos")
    .upsert([payload], {
      onConflict: "organization_id,assignment_id,work_date",
      defaultToNull: false,
    })
    .select(
      "id, assignment_id, work_date, planned_count, detail, memo, vehicle_names"
    )
    .single();

  return { data, error };
}