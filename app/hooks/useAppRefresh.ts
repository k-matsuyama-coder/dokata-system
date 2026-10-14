"use client";

import { createContext, useContext } from "react";

export const AppRefreshContext = createContext(0);

// 復帰時の認証確認が成功すると、この値が増える
export function useAppRefresh() {
  return useContext(AppRefreshContext);
}