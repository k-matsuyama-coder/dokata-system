import React from "react";

type Props = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
};

function AssignmentCell({ children, ...props }: Props) {
  return <td {...props}>{children}</td>;
}

export default React.memo(AssignmentCell);