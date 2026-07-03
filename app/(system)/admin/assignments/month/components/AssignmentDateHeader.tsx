import type {
  Assignment,
  AssignmentGroupKey,
  AssignmentGroupSetting,
  DailyInfo,
  SiteMember,
} from "../types";

type Props = {
  date: string;
  summary:
    | {
        infos: DailyInfo[];
        members: SiteMember[];
      }
    | undefined;
  assignmentMap: Map<string, Assignment>;
  enabledGroups: AssignmentGroupSetting[];
  groupNameMap: Map<AssignmentGroupKey, string>;
  getDateHeaderStyle: (date: string) => React.CSSProperties;
};

export default function AssignmentDateHeader({
  date,
  summary,
  assignmentMap,
  enabledGroups,
  groupNameMap,
  getDateHeaderStyle,
}: Props) {
  const infosOfDate = summary?.infos ?? [];
  const membersOfDate = summary?.members ?? [];

  const plannedAll = infosOfDate.reduce(
    (sum, info) => sum + (info.planned_count ?? 0),
    0
  );

  const totalAll = membersOfDate.length;

  const groupSummaries = enabledGroups.map((group) => {
    const planned = infosOfDate
      .filter((info) => {
        const assignment = assignmentMap.get(info.assignment_id);
        return (assignment?.group_key ?? "group1") === group.group_key;
      })
      .reduce((sum, info) => sum + (info.planned_count ?? 0), 0);

    const total = membersOfDate.filter((member) => {
      const assignment = assignmentMap.get(member.assignment_id);
      return (assignment?.group_key ?? "group1") === group.group_key;
    }).length;

    return {
      key: group.group_key,
      label: groupNameMap.get(group.group_key) ?? group.display_name,
      planned,
      total,
    };
  });

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
        {groupSummaries.map((group) => (
          <div key={group.key}>
            {group.label} {group.planned}/{group.total}
          </div>
        ))}
      </div>
    </th>
  );
}