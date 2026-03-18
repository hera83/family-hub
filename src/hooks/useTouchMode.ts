import { useState, useEffect, useCallback, useRef } from "react";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const COOKIE_NAME = "touch_mode";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=2147483647;SameSite=Lax`;
}

export function useTouchMode() {
  const [isTouchMode, setIsTouchMode] = useState(() => getCookie(COOKIE_NAME) === "true");
  const [isDimmed, setIsDimmed] = useState(false);
  const manualDimRef = useRef(false);

  const toggleTouchMode = useCallback(() => {
    setIsTouchMode((prev) => {
      const next = !prev;
      setCookie(COOKIE_NAME, String(next));
      return next;
    });
  }, []);

  const resetTimer = useCallback(() => {
    manualDimRef.current = false;
    setIsDimmed(false);
  }, []);

  const triggerDim = useCallback(() => {
    manualDimRef.current = true;
    setIsDimmed(true);
  }, []);

  useEffect(() => {
    if (!isTouchMode) {
      document.documentElement.classList.remove("touch-mode");
      return;
    }
    document.documentElement.classList.add("touch-mode");
    return () => document.documentElement.classList.remove("touch-mode");
  }, [isTouchMode]);

  useEffect(() => {
    if (!isTouchMode) return;

    let timer: ReturnType<typeof setTimeout>;

    const startTimer = () => {
      // Don't reset if manually dimmed — the dim-overlay's own click handler will reset
      if (manualDimRef.current) return;
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

  return { isTouchMode, isDimmed, resetTimer, triggerDim, toggleTouchMode };
}
