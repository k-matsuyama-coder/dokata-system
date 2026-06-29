import { useMemo } from "react";
import { presetDetails } from "../constants";
import type { DailyInfo } from "../types";

export function useDetailHistory(dailyInfos: DailyInfo[]) {
  return useMemo(() => {
    const history = dailyInfos
      .flatMap((d) =>
        (d.detail ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      );

    return Array.from(
      new Set([
        ...presetDetails,
        ...history,
      ])
    );
  }, [dailyInfos]);
}