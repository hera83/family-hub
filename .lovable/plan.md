

# Stabilt virtuelt tastatur med Enter-knap og highlight

## Problem

Tastaturet lukker stadig fordi `focusout`-logikken er for aggressiv. Hver gang fokus flyttes (f.eks. af Radix focus trap), forsoeges tastaturet skjult. Guard-mekanismen med `isPressingRef` er ikke palidelig nok.

## Ny strategi: Tastaturet lukker KUN eksplicit

I stedet for at lytte paa `focusout` for at skjule tastaturet, aendres logikken saa tastaturet **kun** lukker naar:

1. Brugeren trykker paa **Enter**-knappen (ny knap) -- lukker tastaturet og trigger form submit/blur
2. Brugeren trykker paa **Minimer**-knappen (eksisterende)
3. Inputfeltet **forsvinder fra DOM** (tjekkes via MutationObserver eller periodisk check)
4. Touch-mode slaas fra (`enabled` bliver false)

`focusout`-lytteren fjernes helt som mekanisme til at skjule tastaturet.

## Aendringer

### `src/components/VirtualKeyboard.tsx`

**1. Fjern focusout-baseret skjulning**
- Behold `focusin`-lytteren (til at vise tastaturet og saette activeRef)
- Fjern `focusout`-lytteren helt
- Tilfoej i stedet en `MutationObserver` eller `setInterval` (hver 500ms) der tjekker om `activeRef.current` stadig er i DOM -- hvis ikke, skjul tastaturet

**2. Tilfoej ENTER-tast**
- Tilfoej "ENTER" til tastaturlayouts:
  - Text: Erstat "MINIMIZE" med "ENTER" i sidste raekke, tilfoej "MINIMIZE" som separat knap
  - Eller: Laeg "ENTER" ved siden af "MINIMIZE" i bunden
- Layout bliver: `["123", "SPACE", "ENTER", "MINIMIZE"]`
- Numeric: `["ABC", "ENTER", "MINIMIZE"]`
- ENTER-knappens handling: blur inputfeltet, skjul tastaturet

**3. Tilfoej active/pressed styling paa knapper**
- Tilfoej `active:` Tailwind-klasser paa alle tastatur-knapper for visuelt feedback
- Brug `active:bg-primary active:text-primary-foreground active:scale-95` saa knapperne tydeligt reagerer ved klik/tryk
- Dette virker baade med mus og touch

### Konkret layout-aendring

```text
Text-tastatur (foer):
  [123] [________SPACE________] [.] [,] [v MINIMIZE]

Text-tastatur (efter):
  [123] [________SPACE________] [.] [,] [ENTER] [v MINIMIZE]

Numerisk (foer):
  [ABC] [-] [v MINIMIZE]

Numerisk (efter):
  [ABC] [-] [ENTER] [v MINIMIZE]
```

### Konkret styling for highlight

Alle taster faar disse ekstra Tailwind-klasser:
```
active:bg-primary active:text-primary-foreground active:scale-95 transition-all
```

Dette giver en tydelig visuel feedback naar en knap trykkes -- baade med mus og touch.

## Teknisk oversigt

- `focusout`-lytteren erstattes af en periodisk DOM-check (interval) der skjuler tastaturet hvis inputfeltet er fjernet
- `isPressingRef` kan fjernes da den ikke laengere er noedvendig
- ENTER-tasten kalder `el.blur()` og `setVisible(false)`
- Ingen aendringer i dialog.tsx eller sheet.tsx -- de eksisterende fixes forbliver

## Filer der aendres

- `src/components/VirtualKeyboard.tsx` (layout, logik, styling)

