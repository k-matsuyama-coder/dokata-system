import React from "react";

type Props = {
  children: React.ReactNode;
};

function AssignmentCell({ children }: Props) {
  return <>{children}</>;
}

export default React.memo(AssignmentCell);