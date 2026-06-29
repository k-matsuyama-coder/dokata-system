import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

type Props = {
  children: ReactNode;
};

export default function SuperAdminLayout({ children }: Props) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f7f7f7",
      }}
    >
      <Sidebar />

      <div
  style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
  }}
>
  <Header />

  <main
    style={{
      flex: 1,
    }}
  >
    {children}
  </main>
</div>
    </div>
  );
}