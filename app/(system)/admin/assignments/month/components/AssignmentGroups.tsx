"use client";

import React, { Fragment } from "react";
import AssignmentRowContent from "./AssignmentRowContent";

import type { Assignment } from "../types";
import { td } from "../styles";

type Group = {
  label: string;
  rows: Assignment[];
  color: string;
};

type Props = {
  groupedAssignments: Group[];
};

function AssignmentGroups({ groupedAssignments }: Props) {
  return (
    <>
      {groupedAssignments.map((group) => (
        <Fragment key={group.label}>
          <tr>
            <td
              colSpan={100}
              style={{
                ...td,
                backgroundColor: group.color,
                color: "#111",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              {group.label}
            </td>
          </tr>

          {group.rows.map((assignment) => (
            <AssignmentRowContent
              key={assignment.id}
              assignment={assignment}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
}

export default React.memo(AssignmentGroups);