

## Problem: Number inputs ignore text selection

### Root Cause

Browser `<input type="number">` elements do **not** expose `selectionStart` or `selectionEnd` -- accessing them returns `null` (this is a browser security/spec restriction). 

The `Input` component correctly calls `e.target.select()` on focus, which visually highlights the "0", but when the VirtualKeyboard reads `el.selectionStart` it gets `null` and falls back to `el.value.length`. The keyboard then appends the new digit instead of replacing the selected text.

### Solution

Since we cannot read selection state from number inputs, we need a different approach:

**In `src/components/VirtualKeyboard.tsx`**, detect when the active element is a number input and the value hasn't been modified since focus (i.e., the first keystroke). On the first character typed into a number input, replace the entire value instead of appending.

Specifically:

1. Add a `freshFocus` ref (`useRef(false)`) that gets set to `true` whenever `onFocusIn` fires on a number input
2. In `handleKey`, when `freshFocus` is `true` and the key is a printable character (digit, dot, minus), replace the entire value with just that key
3. Set `freshFocus` to `false` after the first keystroke

### Changes

**File: `src/components/VirtualKeyboard.tsx`**

- Add `const freshFocusRef = useRef(false);`
- In the `onFocusIn` handler, set `freshFocusRef.current = true` when `isNumericInput(el)` is true
- In `handleKey`, before the normal character insertion block, add a check:

```text
if (freshFocusRef.current && isNumericInput(el)) {
  // Replace entire value on first keystroke
  nativeInputValueSetter?.call(el, key);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.setSelectionRange(key.length, key.length);
  freshFocusRef.current = false;
  return;
}
```

- Reset `freshFocusRef.current = false` on BACKSPACE too (so backspace doesn't clear everything)

This approach sidesteps the browser limitation entirely -- no need to read `selectionStart` on number inputs.

