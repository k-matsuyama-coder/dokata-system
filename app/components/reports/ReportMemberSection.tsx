import React from "react";

type Employee = {
  name: string;
};

type MemberEntry = {
  name: string;
  labor: string;
  overtime: string;
};

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  assignmentMembers: string[];
  editMembersMode: boolean;
  setEditMembersMode: (value: boolean) => void;

  checkedAssignmentMembers: string[];
  setCheckedAssignmentMembers: (value: string[]) => void;

  selectedMembers: MemberEntry[];
  setSelectedMembers: (value: MemberEntry[]) => void;

  memberInput: string;
  setMemberInput: (value: string) => void;

  filteredEmployees: Employee[];
  overtimeMinutes: string;

  setMembersConfirmed: (value: boolean) => void;

  addMember: (name: string) => void;
  removeMember: (name: string) => void;

  totalLabor: number;
  totalOvertime: number;

  editingLaborName: string | null;
  setEditingLaborName: (value: string | null) => void;
};

export default function ReportMemberSection({
  sectionStyle,
  inputStyle,
  assignmentMembers,
  editMembersMode,
  setEditMembersMode,
  checkedAssignmentMembers,
  setCheckedAssignmentMembers,
  selectedMembers,
  setSelectedMembers,
  memberInput,
  setMemberInput,
  filteredEmployees,
  overtimeMinutes,
  setMembersConfirmed,
  addMember,
  removeMember,
  totalLabor,
  totalOvertime,
  editingLaborName,
  setEditingLaborName,
}: Props) {
  return (
    <div style={sectionStyle}>
      <p>メンバー</p>

      {assignmentMembers.length > 0 && !editMembersMode && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#fafafa",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            番割メンバー確認
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {assignmentMembers.map((name) => (
              <label key={name} style={{ fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={checkedAssignmentMembers.includes(name)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...checkedAssignmentMembers, name]
                      : checkedAssignmentMembers.filter(
                          (member) => member !== name
                        );

                    setCheckedAssignmentMembers(next);

                    setSelectedMembers(
                      next.map((memberName) => ({
                        name: memberName,
                        labor: "1",
                        overtime: overtimeMinutes || "0",
                      }))
                    );

                    setMembersConfirmed(next.length === assignmentMembers.length);
                  }}
                  style={{ marginRight: 8 }}
                />
                {name}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setEditMembersMode(true);
              setMembersConfirmed(true);
            }}
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            メンバーを編集
          </button>
        </div>
      )}

      {(editMembersMode || assignmentMembers.length === 0) && (
        <>
          <input
            placeholder="メンバー名を入力"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            style={inputStyle}
          />

          {memberInput && filteredEmployees.length > 0 && (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 8,
                marginTop: 8,
                backgroundColor: "#fff",
              }}
            >
              {filteredEmployees.slice(0, 5).map((employee) => (
                <div
                  key={employee.name}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addMember(employee.name);
                  }}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  {employee.name}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedMembers.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 48px",
              gap: 8,
              marginBottom: 8,
              fontWeight: "bold",
              fontSize: 14,
              alignItems: "center",
            }}
          >
            <div>メンバー名</div>
            <div>人工</div>
            <div>残業</div>
            <div></div>
          </div>

          {selectedMembers.map((member) => (
            <div
              key={member.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr 48px",
                gap: 8,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <div>{member.name}</div>

              <div>
                {editingLaborName === member.name ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["0", "0.5", "1", "1.5"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setSelectedMembers(
                            selectedMembers.map((m) =>
                              m.name === member.name
                                ? { ...m, labor: val }
                                : m
                            )
                          );
                          setEditingLaborName(null);
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border:
                            member.labor === val
                              ? "2px solid #111"
                              : "1px solid #ccc",
                          backgroundColor:
                            member.labor === val ? "#f3f3f3" : "#fff",
                          cursor: "pointer",
                          minWidth: 48,
                          fontWeight: member.labor === val ? 700 : 500,
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingLaborName(member.name)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    {member.labor}
                  </button>
                )}
              </div>

              <select
                value={member.overtime}
                onChange={(e) => {
                  setSelectedMembers(
                    selectedMembers.map((m) =>
                      m.name === member.name
                        ? { ...m, overtime: e.target.value }
                        : m
                    )
                  );
                }}
                style={inputStyle}
              >
                {[
                  "0",
                  "0.5",
                  "1",
                  "1.5",
                  "2",
                  "2.5",
                  "3",
                  "3.5",
                  "4",
                  "4.5",
                  "5",
                  "5.5",
                  "6",
                  "6.5",
                  "7",
                  "7.5",
                  "8",
                  "8.5",
                  "9",
                  "9.5",
                  "10",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => removeMember(member.name)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: "#d11a2a",
                  color: "#fff",
                  cursor: "pointer",
                  padding: "10px 0",
                }}
              >
                ×
              </button>
            </div>
          ))}

          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              backgroundColor: "#fafafa",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>
              人工合計：{totalLabor}
            </div>
            <div style={{ fontWeight: "bold" }}>
              残業合計：{totalOvertime}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}