import React from "react";

type Props = React.HTMLAttributes<HTMLTableRowElement> & {
  children: React.ReactNode;
};

function AssignmentRow({ children, ...props }: Props) {
  return <tr {...props}>{children}</tr>;
}

export default React.memo(AssignmentRow);