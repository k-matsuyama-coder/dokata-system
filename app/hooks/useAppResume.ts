"use client";

import { useEffect, useRef } from "react";
import { getJapanDate } from "@/lib/japanDate";

const STALE_AFTER_MS = 5 * 60 * 1000;
const EVENT_COOLDOWN_MS = 5 * 1000;

export function useAppResume(
  onResume: () => Promise<void>
) {
  const callbackRef = useRef(onResume);

  useEffect(() => {
    callbackRef.current = onResume;
  }, [onResume]);

  useEffect(() => {
    let disposed = false;
    let running = false;
    let hiddenAt: number | null =
      document.visibilityState === "hidden" ? Date.now() : null;
    let lastDate = getJapanDate();
    let lastAttemptAt = 0;
    let reconnectPending = false;

    const checkResume = async () => {
      if (
        disposed ||
        running ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
      ) {
        return;
      }

      const now = Date.now();
      const today = getJapanDate();

      const wasAway =
        hiddenAt !== null &&
        now - hiddenAt >= STALE_AFTER_MS;
      const dateChanged = today !== lastDate;

      if (!wasAway && !dateChanged && !reconnectPending) {
        hiddenAt = null;
        return;
      }

      // pageshow・visibilitychange・online の重複を抑える
      if (now - lastAttemptAt < EVENT_COOLDOWN_MS) {
        return;
      }

      running = true;
      lastAttemptAt = now;
      lastDate = today;
      hiddenAt = null;
      reconnectPending = false;

      try {
        await callbackRef.current();
      } catch (error) {
        // 画面側でもエラー表示と再試行を用意する
        console.error("アプリ復帰時の確認に失敗:", error);
      } finally {
        running = false;
      }
    };

    const markHidden = () => {
      hiddenAt ??= Date.now();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        markHidden();
      } else {
        void checkResume();
      }
    };

    const handleOnline = () => {
      reconnectPending = true;
      void checkResume();
    };

    const handlePageShow = () => {
      void checkResume();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", markHidden);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("online", handleOnline);

    // 開いたまま日付が変わった場合も検知する。
    // 通常は日付を比較するだけで、通信は行わない。
    const timer = window.setInterval(() => {
      void checkResume();
    }, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
      window.removeEventListener("pagehide", markHidden);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}