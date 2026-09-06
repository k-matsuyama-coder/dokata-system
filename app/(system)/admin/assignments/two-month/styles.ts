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
    minWidth: 140,
    width: 140,
    maxWidth: 140,
    padding: "4px 5px",
  };
  
  export const stickyTd = {
    border: "1px solid #ddd",
    padding: 5,
    position: "sticky" as const,
    left: 0,
    backgroundColor: "#fff",
    zIndex: 22,
    minWidth: 140,
    width: 140,
    maxWidth: 140,
    overflow: "hidden",
    wordBreak: "break-word" as const,
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
    padding: "4px 2px",
    backgroundColor: "#eef2ff",
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
    minWidth: 60,
    fontWeight: 800,
    width: 60,
maxWidth: 60,
fontSize: 12,
boxSizing: "border-box" as const,
  };
  
  export const totalTd = {
    border: "1px solid #ddd",
    padding: "4px 2px",
    textAlign: "center" as const,
    minWidth: 60,
    fontWeight: 800,
    backgroundColor: "#f8fafc",
    width: 60,
maxWidth: 60,
fontSize: 12,
boxSizing: "border-box" as const,
  };
  
  export const stickyTotalTd1 = {
    ...totalTd,
    position: "sticky" as const,
    left: 140,
    zIndex: 21,
  };
  
  export const stickyTotalTd2 = {
    ...totalTd,
    position: "sticky" as const,
    left: 200,
    zIndex: 21,
  };