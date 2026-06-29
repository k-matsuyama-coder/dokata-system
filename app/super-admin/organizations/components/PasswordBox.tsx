import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";

type Props = {
  password: string;
};

export default function PasswordBox({ password }: Props) {
  if (!password) return null;

  return (
    <Card style={{ backgroundColor: "#f9fafb" }}>
      <div style={{ fontWeight: 800 }}>初期パスワード</div>

      <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
        {password}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() => navigator.clipboard.writeText(password)}
        style={{ marginTop: 10 }}
      >
        コピー
      </Button>
    </Card>
  );
}