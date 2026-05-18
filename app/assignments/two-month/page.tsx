"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type DailyInfo = {
  id: string;
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
};

type Assignment = {
  id: string;
  site_name: string | null;
  contractor_name: string | null;
};

export default function TwoMonthPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);

  const days = useMemo(() => {
    const start = new Date();

    return Array.from({ length: 62 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return d.toISOString().slice(0, 10);
    });
  }, []);

  const fetchData = async () => {
    const startDate = days[0];
    const endDate = days[days.length - 1];

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, site_name, contractor_name")
      .order("created_at", { ascending: true });

    if (assignmentError) {
      alert("現場取得失敗: " + assignmentError.message);
      return;
    }

    const assignmentIds = assignmentData?.map((a) => a.id) ?? [];

    if (assignmentIds.length === 0) {
      setAssignments([]);
      setDailyInfos([]);
      return;
    }

    const { data: dailyInfoData, error: dailyInfoError } = await supabase
      .from("assignment_site_daily_infos")
      .select("id, assignment_id, work_date, planned_count")
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    if (dailyInfoError) {
      alert("工程表取得失敗: " + dailyInfoError.message);
      return;
    }

    setAssignments(assignmentData ?? []);
    setDailyInfos(dailyInfoData ?? []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPlannedCount = (assignmentId: string, workDate: string) => {
    return (
      dailyInfos.find(
        (d) => d.assignment_id === assignmentId && d.work_date === workDate
      )?.planned_count ?? ""
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <BackButton />

      <h1>2ヶ月工程表</h1>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #ddd",
          borderRadius: 12,
          backgroundColor: "#fff",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            minWidth: 2200,
            width: "100%",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={stickyTh}>現場名</th>

              {days.map((date) => (
                <th key={date} style={th}>
                  {date.slice(5).replace("-", "/")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td style={stickyTd}>
                  <div style={{ fontWeight: 800 }}>
                    {assignment.site_name || "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "#666" }}>
                    {assignment.contractor_name || "-"}
                  </div>
                </td>

                {days.map((date) => {
                  const count = getPlannedCount(assignment.id, date);

                  return (
                    <td key={date} style={td}>
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 6,
  backgroundColor: "#f5f5f5",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
  minWidth: 48,
};

const td = {
  border: "1px solid #ddd",
  padding: 6,
  textAlign: "center" as const,
  minWidth: 48,
  height: 36,
};

const stickyTh = {
  ...th,
  position: "sticky" as const,
  left: 0,
  zIndex: 2,
  minWidth: 180,
};

const stickyTd = {
  border: "1px solid #ddd",
  padding: 8,
  position: "sticky" as const,
  left: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  minWidth: 180,
};
          {assignment.site_name}
        </td>

        {days.map((date) => (
          <td key={date}>
            {getPlannedCount(
              assignment.id,
              date
            )}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>