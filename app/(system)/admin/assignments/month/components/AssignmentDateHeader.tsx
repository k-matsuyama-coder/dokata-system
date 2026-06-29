import type { Assignment, DailyInfo, SiteMember } from "../types";

type Props = {
  date: string;
  summary:
    | {
        infos: DailyInfo[];
        members: SiteMember[];
      }
    | undefined;
  assignmentMap: Map<string, Assignment>;
  getDateHeaderStyle: (date: string) => React.CSSProperties;
};

export default function AssignmentDateHeader({
  date,
  summary,
  assignmentMap,
  getDateHeaderStyle,
}: Props) {
  const infosOfDate = summary?.infos ?? [];
  const membersOfDate = summary?.members ?? [];

  const plannedAll = infosOfDate.reduce(
    (sum, info) => sum + (info.planned_count ?? 0),
    0
  );

  const plannedFirst = infosOfDate
    .filter((info) => {
      const assignment = assignmentMap.get(info.assignment_id);
      return assignment?.construction_type === "第一工事";
    })
    .reduce((sum, info) => sum + (info.planned_count ?? 0), 0);

  const plannedSecond = infosOfDate
    .filter((info) => {
      const assignment = assignmentMap.get(info.assignment_id);
      return assignment?.construction_type === "第二工事";
    })
    .reduce((sum, info) => sum + (info.planned_count ?? 0), 0);

  const totalAll = membersOfDate.length;

  const totalFirst = membersOfDate.filter((member) => {
    const assignment = assignmentMap.get(member.assignment_id);
    return assignment?.construction_type === "第一工事";
  }).length;

  const totalSecond = membersOfDate.filter((member) => {
    const assignment = assignmentMap.get(member.assignment_id);
    return assignment?.construction_type === "第二工事";
  }).length;

  return (
    <th style={getDateHeaderStyle(date)}>
      <div style={{ fontSize: 14, fontWeight: 800 }}>
        {Number(date.slice(-2))}
      </div>

      <div style={{ fontSize: 11, marginTop: 2 }}>
        {["日", "月", "火", "水", "木", "金", "土"][new Date(date).getDay()]}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          lineHeight: 1.4,
          color: "#333",
          fontWeight: 800,
        }}
      >
        <div>全 {plannedAll}/{totalAll}</div>
        <div>一 {plannedFirst}/{totalFirst}</div>
        <div>二 {plannedSecond}/{totalSecond}</div>
      </div>
    </th>
  );
}