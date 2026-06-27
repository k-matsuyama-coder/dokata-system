"use client";

import type { SiteMember } from "../types";
import AssignmentMemberChip from "./AssignmentMemberChip";

type Props = {
  isMobile: boolean;
  cellMembers: SiteMember[];
  copiedEmployeeNames: string[];
  setDraggingSiteMemberId: (id: string | null) => void;
  setCopiedEmployeeNames: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSiteMemberId: (id: string | null) => void;
  setSelectedEmployeeName: (name: string | null) => void;
  deleteSiteMember: (id: string) => void;
  toggleForeman: (member: SiteMember) => void;
};

export default function AssignmentMemberSection({
  isMobile,
  cellMembers,
  copiedEmployeeNames,
  setDraggingSiteMemberId,
  setCopiedEmployeeNames,
  setSelectedSiteMemberId,
  setSelectedEmployeeName,
  deleteSiteMember,
  toggleForeman,
}: Props) {
  const hasForeman = cellMembers.some((member) => member.is_foreman);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        alignItems: "center",
        marginTop: 4,
      }}
    >
      {[...cellMembers]
        .sort((a, b) => Number(b.is_foreman) - Number(a.is_foreman))
        .map((member) => (
          <AssignmentMemberChip
            key={member.id}
            member={member}
            isMobile={isMobile}
            isCopied={copiedEmployeeNames.includes(member.employee_name)}
            hasForeman={hasForeman}
            setDraggingSiteMemberId={setDraggingSiteMemberId}
            setCopiedEmployeeNames={setCopiedEmployeeNames}
            setSelectedSiteMemberId={setSelectedSiteMemberId}
            setSelectedEmployeeName={setSelectedEmployeeName}
            deleteSiteMember={deleteSiteMember}
            toggleForeman={toggleForeman}
          />
        ))}
    </div>
  );
}