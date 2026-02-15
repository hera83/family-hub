import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Delete, CornerDownLeft, Space, ChevronUp, ChevronDown } from "lucide-react";

type KeyboardLayout = "text" | "numeric";

const TEXT_ROWS_LOWER = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "å"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "æ", "ø"],
  ["SHIFT", "z", "x", "c", "v", "b", "n", "m", "BACKSPACE"],
  ["123", "SPACE", ".", ",", "ENTER", "MINIMIZE"],
];

const TEXT_ROWS_UPPER = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Å"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Æ", "Ø"],
  ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ["123", "SPACE", ".", ",", "ENTER", "MINIMIZE"],
];

const NUMERIC_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "BACKSPACE"],
  ["ABC", "-", "ENTER", "MINIMIZE"],
];

function isNumericInput(el: HTMLElement | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLInputElement) {
    return el.type === "number" || el.inputMode === "numeric" || el.inputMode === "decimal";
  }
  return false;
}

function isSelectElement(el: HTMLElement | null): boolean {
  if (!el) return false;
  return el.tagName === "SELECT";
}

export function VirtualKeyboard({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [layout, setLayout] = useState<KeyboardLayout>("text");
  const [shifted, setShifted] = useState(false);
  const activeRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  // Block Radix DismissableLayer from detecting keyboard clicks as "outside" clicks.
  // Radix registers pointerdown/mousedown on document to detect outside interactions.
  // We intercept these in capture phase with stopImmediatePropagation when the target
  // is inside the keyboard. React's portal event delegation still works because
  // createPortal handles it through the fiber tree, not DOM event propagation.
  useEffect(() => {
    if (!visible) return;

    const blockIfKeyboard = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest?.("[data-virtual-keyboard]")) {
        e.stopImmediatePropagation();
      }
    };

    document.addEventListener("pointerdown", blockIfKeyboard, { capture: true });
    document.addEventListener("mousedown", blockIfKeyboard, { capture: true });
    document.addEventListener("touchstart", blockIfKeyboard, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", blockIfKeyboard, { capture: true });
      document.removeEventListener("mousedown", blockIfKeyboard, { capture: true });
      document.removeEventListener("touchstart", blockIfKeyboard, { capture: true });
    };
  }, [visible]);

  // Show keyboard on focusin
  useEffect(() => {
    if (!enabled) return;

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (isSelectElement(el)) return;
      if (keyboardRef.current?.contains(el)) return;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      ) {
        if (el instanceof HTMLInputElement && ["checkbox", "radio", "hidden", "file", "submit", "button", "reset", "range", "color"].includes(el.type)) return;
        activeRef.current = el;
        setLayout(isNumericInput(el) ? "numeric" : "text");
        setShifted(false);
        setVisible(true);
        setMinimized(false);

        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    };

    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [enabled]);

  // Periodic DOM check: hide keyboard if input is removed from DOM
  useEffect(() => {
    if (!visible || !enabled) return;
    const interval = setInterval(() => {
      if (activeRef.current && !document.body.contains(activeRef.current)) {
        setVisible(false);
        setMinimized(false);
        activeRef.current = null;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [visible, enabled]);

  const handleKey = useCallback((key: string) => {
    const el = activeRef.current;
    if (!el) return;

    el.focus();

    const nativeInputValueSetter =
      el instanceof HTMLTextAreaElement
        ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
        : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;

    if (key === "BACKSPACE") {
      if (start === end && start > 0) {
        const newVal = el.value.slice(0, start - 1) + el.value.slice(end);
        nativeInputValueSetter?.call(el, newVal);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.setSelectionRange(start - 1, start - 1);
      } else if (start !== end) {
        const newVal = el.value.slice(0, start) + el.value.slice(end);
        nativeInputValueSetter?.call(el, newVal);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.setSelectionRange(start, start);
      }
      requestAnimationFrame(() => el.focus());
    } else if (key === "ENTER") {
      el.blur();
      setVisible(false);
      setMinimized(false);
      activeRef.current = null;
      return;
    } else if (key === "MINIMIZE") {
      setMinimized(true);
      return;
    } else if (key === "SPACE") {
      const newVal = el.value.slice(0, start) + " " + el.value.slice(end);
      nativeInputValueSetter?.call(el, newVal);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.setSelectionRange(start + 1, start + 1);
      requestAnimationFrame(() => el.focus());
    } else if (key === "SHIFT") {
      setShifted((s) => !s);
      return;
    } else if (key === "123") {
      setLayout("numeric");
      return;
    } else if (key === "ABC") {
      setLayout("text");
      return;
    } else {
      const newVal = el.value.slice(0, start) + key + el.value.slice(end);
      nativeInputValueSetter?.call(el, newVal);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.setSelectionRange(start + 1, start + 1);
      if (shifted) setShifted(false);
      requestAnimationFrame(() => el.focus());
    }
  }, [shifted]);

  if (!enabled || !visible) return null;

  const activeStyle = "active:bg-primary active:text-primary-foreground active:scale-95 transition-all";

  const renderKey = (key: string) => {
    let content: React.ReactNode = key;
    let className = `min-h-[48px] min-w-[36px] text-base font-medium px-2 flex-1 ${activeStyle}`;

    if (key === "BACKSPACE") {
      content = <Delete className="h-5 w-5" />;
      className = `min-h-[48px] min-w-[56px] px-3 ${activeStyle}`;
    } else if (key === "ENTER") {
      content = <CornerDownLeft className="h-5 w-5" />;
      className = `min-h-[48px] min-w-[56px] px-3 ${activeStyle}`;
    } else if (key === "MINIMIZE") {
      content = <ChevronDown className="h-5 w-5" />;
      className = `min-h-[48px] min-w-[56px] px-3 ${activeStyle}`;
    } else if (key === "SPACE") {
      content = <Space className="h-5 w-5" />;
      className = `min-h-[48px] flex-[4] px-3 ${activeStyle}`;
    } else if (key === "SHIFT") {
      content = <ChevronUp className={`h-5 w-5 ${shifted ? "text-primary" : ""}`} />;
      className = `min-h-[48px] min-w-[56px] px-3 ${activeStyle}`;
    } else if (key === "123" || key === "ABC") {
      className = `min-h-[48px] min-w-[56px] px-3 text-sm font-semibold ${activeStyle}`;
    }

    return (
      <Button
        key={key}
        variant={key === "SHIFT" && shifted ? "default" : "outline"}
        className={className}
        onPointerDown={(e) => {
          e.preventDefault();
          handleKey(key);
        }}
        tabIndex={-1}
        type="button"
      >
        {content}
      </Button>
    );
  };

  const rows = layout === "numeric" ? NUMERIC_ROWS : shifted ? TEXT_ROWS_UPPER : TEXT_ROWS_LOWER;

  const keyboardContent = minimized ? (
    <div
      ref={keyboardRef}
      data-virtual-keyboard="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t shadow-lg p-2 pb-4 flex justify-center"
    >
      <Button
        variant="outline"
        size="sm"
        className={`min-h-[44px] px-6 gap-2 ${activeStyle}`}
        onPointerDown={(e) => {
          e.preventDefault();
          setMinimized(false);
        }}
        tabIndex={-1}
        type="button"
      >
        <ChevronUp className="h-4 w-4" />
        Vis tastatur
      </Button>
    </div>
  ) : (
    <div
      ref={keyboardRef}
      data-virtual-keyboard="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-background border-t shadow-lg p-2 pb-4 safe-area-bottom animate-in slide-in-from-bottom duration-200"
    >
      <div className={`max-w-2xl mx-auto space-y-1 ${layout === "numeric" ? "max-w-xs" : ""}`}>
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1 justify-center">
            {row.map((key) => renderKey(key))}
          </div>
        ))}
      </div>
    </div>
  );

  // Portal directly to document.body — NOT to a custom container.
  // Custom containers break React's portal event delegation.
  return createPortal(keyboardContent, document.body);
}
