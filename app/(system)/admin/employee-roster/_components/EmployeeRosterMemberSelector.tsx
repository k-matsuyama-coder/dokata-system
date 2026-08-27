"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type {
  EmployeeRosterMemberInput,
  EmployeeRosterRow,
} from "../employee-roster-types";

type Props = {
  candidates: EmployeeRosterRow[];
  members: EmployeeRosterMemberInput[];
  disabled: boolean;
  onChange: (members: EmployeeRosterMemberInput[]) => void;
};

export default function EmployeeRosterMemberSelector({
  candidates,
  members,
  disabled,
  onChange,
}: Props) {
  const [keyword, setKeyword] = useState("");

  const selectedIds = useMemo(
    () => new Set(members.map((member) => member.employee_id)),
    [members]
  );

  const candidateMap = useMemo(
    () =>
      new Map(
        candidates.map((candidate) => [
          candidate.id,
          candidate,
        ])
      ),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const target =
        `${candidate.name} ${candidate.company_name ?? ""}`
          .toLowerCase();

      return target.includes(normalizedKeyword);
    });
  }, [candidates, keyword]);

  const toggleCandidate = (
    candidate: EmployeeRosterRow
  ) => {
    if (disabled) {
      return;
    }

    if (selectedIds.has(candidate.id)) {
      onChange(
        members.filter(
          (member) =>
            member.employee_id !== candidate.id
        )
      );

      return;
    }

    onChange([
      ...members,
      {
        employee_id: candidate.id,
        display_order: members.length,
        roster_number: String(members.length + 1),
        role_marks: [],
        site_entry_date: "",
        acceptance_training_date: "",
      },
    ]);
  };

  const updateMember = (
    employeeId: string,
    patch: Partial<EmployeeRosterMemberInput>
  ) => {
    onChange(
      members.map((member) =>
        member.employee_id === employeeId
          ? {
              ...member,
              ...patch,
            }
          : member
      )
    );
  };

  const moveMember = (
    employeeId: string,
    direction: -1 | 1
  ) => {
    const currentIndex = members.findIndex(
      (member) => member.employee_id === employeeId
    );

    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= members.length
    ) {
      return;
    }

    const nextMembers = [...members];

    const [target] = nextMembers.splice(currentIndex, 1);
    nextMembers.splice(nextIndex, 0, target);

    onChange(nextMembers);
  };

  return (
    <section style={sectionStyle}>
      <div style={headingRowStyle}>
        <div>
          <h2 style={headingStyle}>掲載する作業員</h2>

          <p style={descriptionStyle}>
            名簿へ載せる作業員だけを選択してください。
          </p>
        </div>

        <strong>{members.length}人選択中</strong>
      </div>

      {!disabled && (
        <div style={candidateAreaStyle}>
          <input
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            placeholder="社員名・所属会社で検索"
            style={{
              ...inputStyle,
              marginBottom: 12,
            }}
          />

          <div style={candidateGridStyle}>
            {filteredCandidates.map((candidate) => {
              const selected = selectedIds.has(
                candidate.id
              );

              return (
                <label
                  key={candidate.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                    padding: 11,
                    border: selected
                      ? "1px solid #2563eb"
                      : "1px solid #d1d5db",
                    borderRadius: 9,
                    backgroundColor: selected
                      ? "#eff6ff"
                      : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleCandidate(candidate)
                    }
                    style={{ marginTop: 3 }}
                  />

                  <span>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 700,
                      }}
                    >
                      {candidate.name}
                    </span>

                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        color: "#6b7280",
                        fontSize: 12,
                      }}
                    >
                      {candidate.company_name ||
                        "所属会社未設定"}
                    </span>

                    {!candidate.privateProfile && (
                      <span
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "#b45309",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        作業員情報未登録
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div style={emptyStyle}>
          掲載する作業員が選択されていません。
        </div>
      )}

      {members.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={headerStyle}>順番</th>
                <th style={headerStyle}>番号</th>
                <th style={headerStyle}>氏名</th>
                <th style={headerStyle}>＊1記号</th>
                <th style={headerStyle}>入場年月日</th>
                <th style={headerStyle}>
                  受入教育実施年月日
                </th>
                {!disabled && (
                  <th style={headerStyle}>操作</th>
                )}
              </tr>
            </thead>

            <tbody>
              {members.map((member, index) => {
                const candidate = candidateMap.get(
                  member.employee_id
                );

                return (
                  <tr key={member.employee_id}>
                    <td style={cellStyle}>
                      {disabled ? (
                        index + 1
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              moveMember(
                                member.employee_id,
                                -1
                              )
                            }
                            disabled={index === 0}
                            style={smallButtonStyle}
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveMember(
                                member.employee_id,
                                1
                              )
                            }
                            disabled={
                              index ===
                              members.length - 1
                            }
                            style={smallButtonStyle}
                          >
                            ↓
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={cellStyle}>
                      <input
                        value={member.roster_number}
                        disabled={disabled}
                        onChange={(event) =>
                          updateMember(
                            member.employee_id,
                            {
                              roster_number:
                                event.target.value,
                            }
                          )
                        }
                        style={compactInputStyle}
                      />
                    </td>

                    <td style={cellStyle}>
                      <strong>
                        {candidate?.name ||
                          "削除された社員"}
                      </strong>

                      <div
                        style={{
                          marginTop: 3,
                          color: "#6b7280",
                          fontSize: 12,
                        }}
                      >
                        {candidate?.company_name || ""}
                      </div>
                    </td>

                    <td style={cellStyle}>
                      <input
                        value={member.role_marks.join(",")}
                        disabled={disabled}
                        onChange={(event) =>
                          updateMember(
                            member.employee_id,
                            {
                              role_marks:
                                event.target.value
                                  .split(/[,、]/)
                                  .map((value) =>
                                    value.trim()
                                  )
                                  .filter(Boolean),
                            }
                          )
                        }
                        placeholder="例：職、安"
                        style={compactInputStyle}
                      />
                    </td>

                    <td style={cellStyle}>
                      <input
                        type="date"
                        value={member.site_entry_date}
                        disabled={disabled}
                        onChange={(event) =>
                          updateMember(
                            member.employee_id,
                            {
                              site_entry_date:
                                event.target.value,
                            }
                          )
                        }
                        style={compactInputStyle}
                      />
                    </td>

                    <td style={cellStyle}>
                      <input
                        type="date"
                        value={
                          member.acceptance_training_date
                        }
                        disabled={disabled}
                        onChange={(event) =>
                          updateMember(
                            member.employee_id,
                            {
                              acceptance_training_date:
                                event.target.value,
                            }
                          )
                        }
                        style={compactInputStyle}
                      />
                    </td>

                    {!disabled && (
                      <td style={cellStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            toggleCandidate(
                              candidate ?? {
                                id: member.employee_id,
                                organization_id: "",
                                name: "",
                                company_name: null,
                                role: null,
                                privateProfile: null,
                              }
                            )
                          }
                          style={removeButtonStyle}
                        >
                          外す
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const sectionStyle: CSSProperties = {
  padding: 20,
  marginBottom: 20,
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
};

const headingRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 16,
};

const headingStyle: CSSProperties = {
  margin: 0,
  marginBottom: 5,
  fontSize: 20,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#6b7280",
  fontSize: 13,
};

const candidateAreaStyle: CSSProperties = {
  padding: 14,
  marginBottom: 20,
  backgroundColor: "#f9fafb",
  borderRadius: 10,
};

const candidateGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 8,
  maxHeight: 300,
  overflowY: "auto",
};

const emptyStyle: CSSProperties = {
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
  backgroundColor: "#f9fafb",
  borderRadius: 10,
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1000,
  borderCollapse: "collapse",
};

const headerStyle: CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #d1d5db",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const cellStyle: CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 15,
};

const compactInputStyle: CSSProperties = {
  minWidth: 110,
  boxSizing: "border-box",
  padding: 8,
  border: "1px solid #d1d5db",
  borderRadius: 7,
  fontSize: 14,
};

const smallButtonStyle: CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  backgroundColor: "#fff",
  cursor: "pointer",
};

const removeButtonStyle: CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #fecaca",
  borderRadius: 7,
  color: "#b91c1c",
  backgroundColor: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};