

# Fix: Virtuelt tastatur lukker popup/dialog

## Problem

Radix UI Dialog har en indbygget "klik udenfor = luk"-mekanisme (`onPointerDownOutside`). Det virtuelle tastatur er placeret udenfor dialogens DOM-element, saa naar brugeren trykker paa en tast, opfatter Radix det som et "klik udenfor" og lukker dialogen. Naar dialogen lukker, forsvinder inputfeltet, og tastaturet skjuler sig ogsaa.

## Loesning

Tilfoej et `data-virtual-keyboard` attribut til tastaturets rod-element, og opdater `DialogContent`-komponenten til at ignorere pointer-events der rammer det virtuelle tastatur.

### Fil 1: `src/components/VirtualKeyboard.tsx`

Tilfoej `data-virtual-keyboard="true"` paa tastaturets ydre `<div>` (baade i normal- og minimeret tilstand). Dette er en simpel markering saa andre komponenter kan genkende tastaturet.

### Fil 2: `src/components/ui/dialog.tsx`

Opdater `DialogContent` til at haandtere `onPointerDownOutside` og `onInteractOutside`. Hvis eventet stammer fra et element inde i det virtuelle tastatur (tjek via `data-virtual-keyboard`), kaldes `event.preventDefault()` for at forhindre dialogen i at lukke.

```text
Logik:
1. Modtag onPointerDownOutside event
2. Tjek om event.target er inde i [data-virtual-keyboard]
3. Hvis ja: preventDefault() - dialogen forbliver aaben
4. Hvis nej: normal opfoersel (dialogen lukker)
```

### Resultat

- Tastaturet kan bruges inde i popups/dialoger uden at lukke dem
- Normal "klik udenfor lukker dialog"-opfoersel bevares for alle andre elementer
- Loesningen er generisk og virker for alle dialoger i appen

