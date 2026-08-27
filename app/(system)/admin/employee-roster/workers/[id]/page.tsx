"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import EmployeePrivateProfileForm from "../../_components/EmployeePrivateProfileForm";
import EmployeeHealthProfileForm from "../../_components/EmployeeHealthProfileForm";
import { loadEmployeeRosterDetail } from "../../employee-roster-detail-api";
import type {
  EmployeeHealthProfile,
  EmployeePrivateProfile,
  EmployeeSummary,
} from "../../employee-roster-types";

export default function EmployeeRosterDetailPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;

  const [employee, setEmployee] =
    useState<EmployeeSummary | null>(null);

  const [profile, setProfile] =
    useState<EmployeePrivateProfile | null>(null);

  const [healthProfile, setHealthProfile] =
    useState<EmployeeHealthProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!employeeId) {
        setErrorMessage("社員IDを取得できません");
        setLoading(false);
        return;
      }

      try {
        const result =
          await loadEmployeeRosterDetail(employeeId);

        if (!active) {
          return;
        }

        setEmployee(result.employee);
        setProfile(result.profile);
        setHealthProfile(result.healthProfile);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "作業員情報を取得できませんでした"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [employeeId]);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 20,
      }}
    >
      <BackButton />

      <div style={{ marginTop: 20, marginBottom: 24 }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>
          作業員情報
        </h1>

        <p style={{ margin: 0, color: "#6b7280" }}>
          作業員名簿へ掲載する情報を管理します。
        </p>
      </div>

      {loading && <p>読み込み中...</p>}

      {!loading && errorMessage && (
        <div
          role="alert"
          style={{
            padding: 16,
            color: "#991b1b",
            backgroundColor: "#fee2e2",
            borderRadius: 10,
          }}
        >
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && employee && (
        <>
          <section
            style={{
              padding: 20,
              marginBottom: 20,
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: 4,
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  社員名
                </div>

                <div style={{ fontWeight: 700 }}>
                  {employee.name}
                </div>
              </div>

              <div>
                <div
                  style={{
                    marginBottom: 4,
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  所属会社
                </div>

                <div style={{ fontWeight: 700 }}>
                  {employee.company_name || "未設定"}
                </div>
              </div>
            </div>
          </section>

          <EmployeePrivateProfileForm
            employee={employee}
            initialProfile={profile}
          />

          <div style={{ height: 28 }} />

          <EmployeeHealthProfileForm
            employee={employee}
            initialHealthProfile={healthProfile}
          />
        </>
      )}
    </main>
  );
}