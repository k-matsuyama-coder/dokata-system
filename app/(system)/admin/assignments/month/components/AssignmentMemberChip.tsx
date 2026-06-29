"use client";

import type { SiteMember } from "../types";
import { tagBlue, tagPurple, tagYellow } from "../styles";

type Props = {
  member: SiteMember;
  isMobile: boolean;
  isCopied: boolean;
  hasForeman: boolean;
  setDraggingSiteMemberId: (id: string | null) => void;
  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSiteMemberId: (id: string | null) => void;
  setSelectedEmployeeName: (name: string | null) => void;
  deleteSiteMember: (id: string) => void;
  toggleForeman: (member: SiteMember) => void;
};

export default function AssignmentMemberChip({
  member,
  isMobile,
  isCopied,
  hasForeman,
  setDraggingSiteMemberId,
  setCopiedEmployeeNames,
  setSelectedSiteMemberId,
  setSelectedEmployeeName,
  deleteSiteMember,
  toggleForeman,
}: Props) {
  return (
    <div
      draggable={!isMobile}
      onDragStart={() => setDraggingSiteMemberId(member.id)}
      onDragEnd={() => setDraggingSiteMemberId(null)}
      onClick={(e) => {
        e.stopPropagation();
        setCopiedEmployeeNames((prev) =>
          prev.includes(member.employee_name)
            ? prev.filter((name) => name !== member.employee_name)
            : [...prev, member.employee_name]
        );
        setSelectedSiteMemberId(null);
        setSelectedEmployeeName(null);
      }}
      onDoubleClick={() => deleteSiteMember(member.id)}
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        backgroundColor: isCopied
          ? "#dbeafe"
          : member.is_foreman
          ? "#fef3c7"
          : "#eef2ff",
        border: isCopied
          ? "2px solid #2563eb"
          : member.is_foreman
          ? "2px solid #f59e0b"
          : "1px solid #c7d2fe",
        color: isCopied ? "#1d4ed8" : "#111",
        cursor: "grab",
        fontWeight: 700,
        fontSize: 11,
        width: "fit-content",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        {member.is_foreman && <span style={tagYellow}>職長</span>}
        {member.is_driver && <span style={tagBlue}>運転</span>}
        {member.is_operator && <span style={tagPurple}>OP</span>}
        {member.heavy_equipment && (
          <span style={tagYellow}>{member.heavy_equipment}</span>
        )}
      </div>

      <span>{member.employee_name}</span>

      {member.is_foreman ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleForeman(member);
          }}
          style={{
            marginTop: 3,
            border: "none",
            borderRadius: 6,
            padding: "2px 6px",
            backgroundColor: "#f59e0b",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          職長解除
        </button>
      ) : !hasForeman ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleForeman(member);
          }}
          style={{
            marginTop: 3,
            border: "none",
            borderRadius: 6,
            padding: "2px 6px",
            backgroundColor: "#e5e7eb",
            color: "#111",
            fontSize: 10,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          職長
        </button>
      ) : null}
    </div>
  );
}