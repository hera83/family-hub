
# Fix: Virtuelt tastatur lukker og skriver ikke i felterne

## Problem (rodaarsag)

Der er **to separate problemer** der tilsammen skaber fejlen:

1. **Radix Dialog's focus trap**: Naar du trykker paa en tast paa det virtuelle tastatur (som er udenfor dialogen), fanger Radix' focus trap eventet og flytter fokus vaek fra inputfeltet -- selv om dialogen ikke lukker (den fix virker). Focus flyttes typisk til dialog-containeren, ikke til inputfeltet.

2. **VirtualKeyboard's focusout-handler**: Naar inputfeltet mister fokus (pga. focus trap), koerer `onFocusOut` efter 200ms. Den tjekker om `document.activeElement` er et input -- men det er det ikke laengere (det er dialog-containeren). Derfor saetter den `visible = false` og tastaturet forsvinder.

Resultatet: Du trykker paa en tast, focus trap stjeler fokus, focusout-handleren skjuler tastaturet -- alt sker saa hurtigt at tasten aldrig naar at skrive noget.

## Loesning

### Fil 1: `src/components/VirtualKeyboard.tsx`

Tilfoej en ref-baseret "guard" der forhindrer tastaturet i at lukke under tastning:

1. Tilfoej en `isPressingRef = useRef(false)` som saettes til `true` i `onPointerDown` paa alle taster, og nulstilles efter 300ms
2. I `onFocusOut`-handleren: tjek `isPressingRef.current` -- hvis true, ignorer focusout og genfokuser inputfeltet via `activeRef.current.focus()`
3. I `handleKey`-funktionen: kald `el.focus()` EFTER vaerdien er sat (ikke kun i starten) for at sikre inputfeltet faar fokus tilbage efter focus trap

Konkret aendring i pointerDown-handleren paa alle taster:
```typescript
onPointerDown={(e) => {
  e.preventDefault();
  isPressingRef.current = true;
  setTimeout(() => { isPressingRef.current = false; }, 300);
  handleKey(key);
}}
```

Konkret aendring i onFocusOut:
```typescript
const onFocusOut = (e: FocusEvent) => {
  setTimeout(() => {
    if (isPressingRef.current) {
      activeRef.current?.focus();
      return;
    }
    const active = document.activeElement;
    if (keyboardRef.current?.contains(active as Node)) return;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    setVisible(false);
    setMinimized(false);
    activeRef.current = null;
  }, 200);
};
```

Konkret aendring i handleKey -- tilfoej `el.focus()` i slutningen af hver tast-handling (efter vaerdien er sat):
```typescript
// After setting value and dispatching input event:
requestAnimationFrame(() => el.focus());
```

### Fil 2: `src/components/ui/sheet.tsx`

Tilfoej samme `onPointerDownOutside` og `onInteractOutside` fix som i `dialog.tsx`, saa Sheet-baserede popups ogsaa fungerer med tastaturet i fremtiden.

## Resultat

- Tastaturet forbliver synligt under tastning
- Tegn skrives korrekt ind i inputfeltet
- Focus genopretttes automatisk efter hvert tastetryk
- Tastaturet lukker stadig korrekt naar brugeren klikker vaek fra et inputfelt
- Baade Dialog og Sheet er beskyttet mod utilsigtet lukning fra tastaturet
