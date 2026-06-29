import PasswordBox from "./PasswordBox";

type Props = {
  organizationName: string;
  setOrganizationName: (value: string) => void;
  adminLastName: string;
  setAdminLastName: (value: string) => void;
  adminFirstName: string;
  setAdminFirstName: (value: string) => void;
  adminEmail: string;
  setAdminEmail: (value: string) => void;
  createdPassword: string;
  loading: boolean;
  onCreate: () => void;
};

export default function OrganizationCreateForm({
  organizationName,
  setOrganizationName,
  adminLastName,
  setAdminLastName,
  adminFirstName,
  setAdminFirstName,
  adminEmail,
  setAdminEmail,
  createdPassword,
  loading,
  onCreate,
}: Props) {
  const inputStyle = {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        display: "grid",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <h2 style={{ margin: 0 }}>会社追加</h2>

      <input
        placeholder="会社名"
        value={organizationName}
        onChange={(e) => setOrganizationName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="管理者 苗字"
        value={adminLastName}
        onChange={(e) => setAdminLastName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="管理者 名前"
        value={adminFirstName}
        onChange={(e) => setAdminFirstName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="管理者メールアドレス"
        value={adminEmail}
        onChange={(e) => setAdminEmail(e.target.value)}
        style={inputStyle}
      />

      <button
        type="button"
        onClick={onCreate}
        disabled={loading}
        style={{
          padding: 14,
          border: "none",
          borderRadius: 8,
          backgroundColor: loading ? "#999" : "#111",
          color: "#fff",
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "作成中..." : "会社と初期管理者を作成"}
      </button>

      <PasswordBox password={createdPassword} />
    </div>
  );
}