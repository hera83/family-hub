import { createContext, useContext, useRef, useState, useCallback, type RefObject } from "react";

interface VirtualKeyboardPortalContextValue {
  containerRef: RefObject<HTMLDivElement | null>;
  register: () => void;
  unregister: () => void;
  hasContainer: boolean;
}

const VirtualKeyboardPortalContext = createContext<VirtualKeyboardPortalContextValue | null>(null);

export function useVirtualKeyboardPortal() {
  return useContext(VirtualKeyboardPortalContext);
}

/**
 * Provider that Dialog/Sheet content wraps around children.
 * Provides a container div ref for the keyboard to render into.
 */
export function VirtualKeyboardPortalProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(0);

  const register = useCallback(() => setCount((c) => c + 1), []);
  const unregister = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  return (
    <VirtualKeyboardPortalContext.Provider
      value={{ containerRef, register, unregister, hasContainer: count > 0 }}
    >
      {children}
      {/* This div lives inside DialogContent/SheetContent and serves as the keyboard mount point */}
      <div ref={containerRef} data-keyboard-portal-container />
    </VirtualKeyboardPortalContext.Provider>
  );
}
