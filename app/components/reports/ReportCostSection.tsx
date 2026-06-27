import React from "react";

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  showExpressway: boolean;
  setShowExpressway: (value: boolean) => void;

  showParking: boolean;
  setShowParking: (value: boolean) => void;

  expresswayMain: string;
  setExpresswayMain: (value: string) => void;
  expresswaySecondary: string;
  setExpresswaySecondary: (value: string) => void;
  expresswaySubcontract: string;
  setExpresswaySubcontract: (value: string) => void;

  parkingMain: string;
  setParkingMain: (value: string) => void;
  parkingSecondary: string;
  setParkingSecondary: (value: string) => void;
  parkingSubcontract: string;
  setParkingSubcontract: (value: string) => void;

  fuelGasoline: string;
  setFuelGasoline: (value: string) => void;
  fuelDiesel: string;
  setFuelDiesel: (value: string) => void;

  fuelOptions: string[];

  expresswayTotal: number;
  parkingTotal: number;
};

export default function ReportCostSection({
  sectionStyle,
  inputStyle,
  showExpressway,
  setShowExpressway,
  showParking,
  setShowParking,
  expresswayMain,
  setExpresswayMain,
  expresswaySecondary,
  setExpresswaySecondary,
  expresswaySubcontract,
  setExpresswaySubcontract,
  parkingMain,
  setParkingMain,
  parkingSecondary,
  setParkingSecondary,
  parkingSubcontract,
  setParkingSubcontract,
  fuelGasoline,
  setFuelGasoline,
  fuelDiesel,
  setFuelDiesel,
  fuelOptions,
  expresswayTotal,
  parkingTotal,
}: Props) {
  return (
    <>
      <div style={sectionStyle}>
        <div
          onClick={() => setShowExpressway(!showExpressway)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            backgroundColor: "#fafafa",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                transition: "transform 0.25s ease",
                transform: showExpressway ? "rotate(90deg)" : "rotate(0deg)",
                fontSize: 14,
              }}
            >
              ▶
            </span>
            <p style={{ margin: 0, fontWeight: "bold" }}>高速料金</p>
          </div>

          <p style={{ margin: 0, fontWeight: "bold" }}>¥{expresswayTotal}</p>
        </div>

        <div
          style={{
            maxHeight: showExpressway ? "500px" : "0",
            opacity: showExpressway ? 1 : 0,
            overflow: "hidden",
            transition:
              "max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease",
            marginTop: showExpressway ? 12 : 0,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <p>本体</p>
              <input
                type="number"
                value={expresswayMain}
                onChange={(e) => setExpresswayMain(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <p>2次請け</p>
              <input
                type="number"
                value={expresswaySecondary}
                onChange={(e) => setExpresswaySecondary(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <p>下請け</p>
              <input
                type="number"
                value={expresswaySubcontract}
                onChange={(e) => setExpresswaySubcontract(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div
          onClick={() => setShowParking(!showParking)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            backgroundColor: "#fafafa",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                transition: "transform 0.25s ease",
                transform: showParking ? "rotate(90deg)" : "rotate(0deg)",
                fontSize: 14,
              }}
            >
              ▶
            </span>
            <p style={{ margin: 0, fontWeight: "bold" }}>駐車場料金</p>
          </div>

          <p style={{ margin: 0, fontWeight: "bold" }}>¥{parkingTotal}</p>
        </div>

        <div
          style={{
            maxHeight: showParking ? "500px" : "0",
            opacity: showParking ? 1 : 0,
            overflow: "hidden",
            transition:
              "max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease",
            marginTop: showParking ? 12 : 0,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <p>本体</p>
              <input
                type="number"
                value={parkingMain}
                onChange={(e) => setParkingMain(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <p>2次請け</p>
              <input
                type="number"
                value={parkingSecondary}
                onChange={(e) => setParkingSecondary(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <p>下請け</p>
              <input
                type="number"
                value={parkingSubcontract}
                onChange={(e) => setParkingSubcontract(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <p>燃料代（ガソリン）</p>
        <select
          value={fuelGasoline}
          onChange={(e) => setFuelGasoline(e.target.value)}
          style={inputStyle}
        >
          {fuelOptions.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}L
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>燃料代（軽油）</p>
        <select
          value={fuelDiesel}
          onChange={(e) => setFuelDiesel(e.target.value)}
          style={inputStyle}
        >
          {fuelOptions.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}L
            </option>
          ))}
        </select>
      </div>
    </>
  );
}