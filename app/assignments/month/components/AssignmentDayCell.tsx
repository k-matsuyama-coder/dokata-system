import React from "react";

type Props = {
  children: React.ReactNode;
};

function AssignmentDayCell({ children }: Props) {
  return <>{children}</>;
}

export default React.memo(AssignmentDayCell);