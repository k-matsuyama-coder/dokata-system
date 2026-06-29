import type { ReactNode } from "react";
import BackButton from "@/app/components/BackButton";

type Props = {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
};

export default function Page({
  title,
  children,
  showBackButton = true,
}: Props) {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 16,
      }}
    >
      {showBackButton && <BackButton />}

      <h1 style={{ marginBottom: 24 }}>{title}</h1>

      {children}
    </div>
  );
}