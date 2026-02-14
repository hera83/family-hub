

# Fix: Virtuelt tastatur lukker stadig popup/dialog

## Problem

Den nuvaerende fix virker ikke fordi Radix UI's `onPointerDownOutside` og `onInteractOutside` sender et **special event** hvor den faktiske DOM-target (dvs. tastaturtasten der blev trykket paa) ligger paa `event.detail.originalEvent.target` - ikke paa `event.target` som koden tjekker nu. Derfor finder `closest('[data-virtual-keyboard]')` aldrig tastaturet, og dialogen lukker alligevel.

## Loesning

Ret `handleOutsideEvent` i `src/components/ui/dialog.tsx` til at laese target fra det rigtige sted.

### Aendring i `src/components/ui/dialog.tsx`

Opdater funktionen `handleOutsideEvent` til at tjekke baade `e.target` og `e.detail.originalEvent.target`:

```text
Foer (virker ikke):
  const target = e.target as Element | null;

Efter (virker):
  const target = (e as any).detail?.originalEvent?.target as Element | null;
```

Den fulde funktion bliver:

```typescript
const handleOutsideEvent = (e: Event) => {
  const target = (e as any).detail?.originalEvent?.target as Element | null;
  if (target?.closest?.("[data-virtual-keyboard]")) {
    e.preventDefault();
  }
};
```

## Teknisk forklaring

Radix UI wrapper DOM pointer-events i et custom event-objekt. Det originale klik-target (tastaturtasten) gemmes under `event.detail.originalEvent.target`. Ved at laese derfra kan vi korrekt identificere at klikket kom fra det virtuelle tastatur og forhindre dialogen i at lukke.

Ingen andre filer behoever aendringer - `data-virtual-keyboard="true"` attributten paa `VirtualKeyboard` er allerede korrekt sat op.

