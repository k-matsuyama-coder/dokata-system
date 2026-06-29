import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  style?: React.CSSProperties;
};

export default function Card({ children, style }: Props) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}