import type { MemberEntry } from "../../types/report";

type Props = {
  selectedMembers: MemberEntry[];
  setSelectedMembers: (value: MemberEntry[]) => void;
  overtimeMinutes: string;
  setMemberInput: (value: string) => void;
};

export function useReportMembers({
  selectedMembers,
  setSelectedMembers,
  overtimeMinutes,
  setMemberInput,
}: Props) {
  const addMember = (name: string) => {
    if (selectedMembers.some((member) => member.name === name)) return;

    setSelectedMembers([
      ...selectedMembers,
      {
        name,
        labor: "1",
        overtime: overtimeMinutes || "0",
      },
    ]);

    setMemberInput("");
  };

  const removeMember = (name: string) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member.name !== name)
    );
  };

  return {
    addMember,
    removeMember,
  };
}