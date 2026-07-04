export const th = {
  border: "1px solid #ddd",
  padding: 4,
  backgroundColor: "#f5f5f5",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
  fontSize: 12,
};

export const td = {
  border: "1px solid #ccc",
  padding: 4,
  whiteSpace: "nowrap" as const,
  verticalAlign: "top" as const,
  backgroundColor: "#fff",
  backgroundClip: "padding-box" as const,
};

export const cellTd = {
  border: "1px solid #e5e7eb",
  padding: 6,
  minWidth: 150,
  height: 140,
  boxSizing: "border-box" as const,
  whiteSpace: "pre-wrap" as const,
  verticalAlign: "top" as const,
  backgroundColor: "#fcfcfc",
};

const stickyShadow = "2px 0 0 #d1d5db, 8px 0 14px rgba(0,0,0,0.05)";

export const stickyTd1 = {
  position: "sticky" as const,
  left: 0,
  zIndex: 60,
  backgroundColor: "#f8fafc",
  minWidth: 100,
  width: 100,
  boxShadow: stickyShadow,
};

export const stickyTd2 = {
  position: "sticky" as const,
  left: 100,
  zIndex: 61,
  backgroundColor: "#f8fafc",
  minWidth: 170,
  width: 170,
  boxShadow: stickyShadow,
};

export const stickyTd3 = {
  position: "sticky" as const,
  left: 270,
  zIndex: 62,
  backgroundColor: "#f8fafc",
  minWidth: 80,
  width: 80,
  boxShadow: stickyShadow,
};

export const stickyTd4 = {
  position: "sticky" as const,
  left: 350,
  zIndex: 63,
  backgroundColor: "#f3f4f6",
  minWidth: 40,
  width: 40,
  boxShadow: stickyShadow,
};

export const stickyTh1 = {
  position: "sticky" as const,
  left: 0,
  top: 0,
  zIndex: 90,
  backgroundColor: "#f5f5f5",
  minWidth: 100,
  width: 100,
  boxShadow: stickyShadow,
};

export const stickyTh2 = {
  position: "sticky" as const,
  left: 100,
  top: 0,
  zIndex: 91,
  backgroundColor: "#f5f5f5",
  minWidth: 170,
  width: 170,
  boxShadow: stickyShadow,
};

export const stickyTh3 = {
  position: "sticky" as const,
  left: 270,
  top: 0,
  zIndex: 92,
  backgroundColor: "#f5f5f5",
  minWidth: 80,
  width: 80,
  boxShadow: stickyShadow,
};

export const stickyTh4 = {
  position: "sticky" as const,
  left: 350,
  top: 0,
  zIndex: 93,
  backgroundColor: "#f5f5f5",
  minWidth: 40,
  width: 40,
  boxShadow: stickyShadow,
};

export const tagBlue = {
  fontSize: 10,
  padding: "1px 6px",
  borderRadius: 999,
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontWeight: 700,
};

export const tagPurple = {
  fontSize: 10,
  padding: "1px 6px",
  borderRadius: 999,
  backgroundColor: "#ede9fe",
  color: "#6d28d9",
  fontWeight: 700,
};

export const tagYellow = {
  fontSize: 10,
  padding: "1px 6px",
  borderRadius: 999,
  backgroundColor: "#fef3c7",
  color: "#b45309",
  fontWeight: 700,
};