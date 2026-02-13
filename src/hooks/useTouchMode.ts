import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function useTouchMode() {
  const [searchParams] = useSearchParams();
  const isTouchMode = searchParams.get("touch") === "true";
  const [isDimmed, setIsDimmed] = useState(false);

  const resetTimer = useCallback(() => {
    setIsDimmed(false);
  }, []);

  useEffect(() => {
    if (!isTouchMode) return;
    document.documentElement.classList.add("touch-mode");
    return () => document.documentElement.classList.remove("touch-mode");
  }, [isTouchMode]);

  useEffect(() => {
    if (!isTouchMode) return;

    let timer: ReturnType<typeof setTimeout>;

    const startTimer = () => {
      clearTimeout(timer);
      setIsDimmed(false);
      timer = setTimeout(() => setIsDimmed(true), INACTIVITY_TIMEOUT);
    };

    const events = ["touchstart", "touchmove", "click", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, startTimer, { passive: true }));
    startTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, startTimer));
    };
  }, [isTouchMode]);

  return { isTouchMode, isDimmed, resetTimer };
}
