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
        background: "#f7f7f7",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}