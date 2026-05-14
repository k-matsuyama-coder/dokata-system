"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Vehicle = {
  id: string;
  vehicle_name: string;
  vehicle_type: string | null;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, vehicle_name, vehicle_type")
      .order("vehicle_name", { ascending: true });

    if (error) {
      alert("車両取得失敗: " + error.message);
      return;
    }

    setVehicles(data ?? []);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAdd = async () => {
    if (!vehicleName) {
      alert("車両名を入力してください");
      return;
    }

    const { error } = await supabase.from("vehicles").insert({
      vehicle_name: vehicleName,
      vehicle_type: vehicleType,
    });

    if (error) {
      alert("車両追加失敗: " + error.message);
      return;
    }

    setVehicleName("");
    setVehicleType("");
    fetchVehicles();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("この車両を削除しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      alert("車両削除失敗: " + error.message);
      return;
    }

    fetchVehicles();
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>車両管理</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "#fff",
          display: "grid",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>車両追加</h2>

        <input
          value={vehicleName}
          onChange={(e) => setVehicleName(e.target.value)}
          placeholder="車両名 例：3tダンプ"
          style={inputStyle}
        />

        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          style={inputStyle}
        >
          <option value="">分類を選択</option>
          <option value="ダンプ">ダンプ</option>
          <option value="重機">重機</option>
          <option value="ローラー">ローラー</option>
          <option value="フィニッシャー">フィニッシャー</option>
          <option value="特殊車両">特殊車両</option>
          <option value="その他">その他</option>
        </select>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ＋ 車両追加
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {vehicles.length === 0 ? (
          <p>車両が登録されていません</p>
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                backgroundColor: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>
                  {vehicle.vehicle_name}
                </div>
                <div style={{ fontSize: 13, color: "#666" }}>
                  {vehicle.vehicle_type || "分類なし"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(vehicle.id)}
                style={{
                  backgroundColor: "#d11a2a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                削除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}