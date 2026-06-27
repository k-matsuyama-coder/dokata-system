export const inputStyle = {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box" as const,
  };
  
  export const th = {
    border: "1px solid #ddd",
    padding: "4px 6px",
    height: 30,
    boxSizing: "border-box" as const,
    backgroundColor: "#f5f5f5",
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
    minWidth: 48,
  };
  
  export const td = {
    border: "1px solid #ddd",
    padding: 6,
    textAlign: "center" as const,
    minWidth: 48,
    height: 36,
  };
  
  export const stickyTh = {
    ...th,
    position: "sticky" as const,
    left: 0,
    zIndex: 2,
    minWidth: 180,
  };
  
  export const stickyTd = {
    border: "1px solid #ddd",
    padding: 8,
    position: "sticky" as const,
    left: 0,
    backgroundColor: "#fff",
    zIndex: 1,
    minWidth: 180,
  };
  
  export const smallButton = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  };
  
  export const totalTh = {
    border: "1px solid #ddd",
    padding: 6,
    backgroundColor: "#eef2ff",
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
    minWidth: 70,
    fontWeight: 800,
  };
  
  export const totalTd = {
    border: "1px solid #ddd",
    padding: 6,
    textAlign: "center" as const,
    minWidth: 70,
    fontWeight: 800,
    backgroundColor: "#f8fafc",
  };
  
  export const stickyTotalTd1 = {
    ...totalTd,
    position: "sticky" as const,
    left: 180,
    zIndex: 1,
  };
  
  export const stickyTotalTd2 = {
    ...totalTd,
    position: "sticky" as const,
    left: 250,
    zIndex: 1,
  };