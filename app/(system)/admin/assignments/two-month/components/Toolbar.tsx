type Props = {
    baseMonth: string;
    setBaseMonth: React.Dispatch<React.SetStateAction<string>>;
    sortMode: string;
    setSortMode: React.Dispatch<React.SetStateAction<string>>;
    setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
    smallButton: React.CSSProperties;
  };
  
  export default function TwoMonthToolbar({
    baseMonth,
    setBaseMonth,
    sortMode,
    setSortMode,
    setShowAddModal,
    smallButton,
  }: Props) {
    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "nowrap",
          marginBottom: 16,
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => {
            const [year, month] = baseMonth.split("-").map(Number);
            const d = new Date(year, month - 3, 1);
  
            setBaseMonth(
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            );
          }}
          style={smallButton}
        >
          前の2ヶ月
        </button>
  
        <strong>{baseMonth.replace("-", "年")}月〜</strong>
  
        <button
          type="button"
          onClick={() => {
            const [year, month] = baseMonth.split("-").map(Number);
            const d = new Date(year, month + 1, 1);
  
            setBaseMonth(
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            );
          }}
          style={smallButton}
        >
          次の2ヶ月
        </button>
  
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontWeight: 700,
            height: 42,
          }}
        >
          <option value="manual">標準</option>
          <option value="site">現場順</option>
          <option value="contractor">元請順</option>
          <option value="manager">担当者順</option>
          <option value="construction">工事区分順</option>
          <option value="shift">昼夜順</option>
        </select>
  
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            height: 42,
          }}
        >
          ＋ 現場追加
        </button>
      </div>
    );
  }