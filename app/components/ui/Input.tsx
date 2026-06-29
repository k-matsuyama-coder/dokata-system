import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ style, ...props }: Props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
        fontSize: 16,
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}