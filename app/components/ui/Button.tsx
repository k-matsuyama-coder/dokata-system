import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "danger" | "secondary";
};

export default function Button({
  children,
  variant = "primary",
  disabled,
  style,
  ...props
}: Props) {
  const backgroundColor =
    variant === "danger" ? "#d32f2f" : variant === "secondary" ? "#fff" : "#111";

  const color = variant === "secondary" ? "#111" : "#fff";

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        padding: 14,
        border: variant === "secondary" ? "1px solid #ccc" : "none",
        borderRadius: 8,
        backgroundColor: disabled ? "#999" : backgroundColor,
        color,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}