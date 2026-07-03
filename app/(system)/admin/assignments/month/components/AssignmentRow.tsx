import React from "react";
import { getDateAccentColors } from "../../month/utils/dateColors";

type Props = React.HTMLAttributes<HTMLTableRowElement> & {
  children: React.ReactNode;
};

function AssignmentRow({ children, ...props }: Props) {
  return <tr {...props}>{children}</tr>;
}

export default React.memo(AssignmentRow);