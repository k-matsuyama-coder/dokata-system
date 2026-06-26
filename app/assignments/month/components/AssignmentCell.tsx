import React from "react";

type Props = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
};

function AssignmentCell({
  children,
  ...tdProps
}: Props) {
  return <td {...tdProps}>{children}</td>;
}

export default React.memo(AssignmentCell);