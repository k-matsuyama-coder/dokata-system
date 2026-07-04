"use client";

import type { Employee, SiteMember } from "../types";
import AssignmentMemberChip from "./AssignmentMemberChip";

type Props = {
  isMobile: boolean;
  cellMembers: SiteMember[];
  employees: Employee[];
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
  employees,
  copiedEmployeeNames,
  setDraggingSiteMemberId,
  setCopiedEmployeeNames,
  setSelectedSiteMemberId,
  setSelectedEmployeeName,
  deleteSiteMember,
  toggleForeman,
}: Props) {
  const hasForeman = cellMembers.some((member) => member.is_foreman);

  const employeeOrderMap = new Map(
    employees.map((employee, index) => [employee.name, index])
  );

  const sortedMembers = [...cellMembers].sort((a, b) => {
    if (a.is_foreman !== b.is_foreman) {
      return a.is_foreman ? -1 : 1;
    }

    const aOrder = employeeOrderMap.get(a.employee_name) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = employeeOrderMap.get(b.employee_name) ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.employee_name.localeCompare(b.employee_name, "ja");
  });

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
      {sortedMembers.map((member) => (
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