import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

type Props = {
  children: ReactNode;
};

export default function SuperAdminLayout({ children }: Props) {
  return (
    <>
      <div className="super-admin-layout">
        <Sidebar />

        <div className="super-admin-content">
          <Header />

          <main className="super-admin-main">
            {children}
          </main>
        </div>
      </div>

      <style jsx>{`
        .super-admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f7f7f7;
          width: 100%;
          overflow-x: hidden;
        }

        .super-admin-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .super-admin-main {
          flex: 1;
          min-width: 0;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          .super-admin-layout {
            display: block;
          }

          .super-admin-content {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}