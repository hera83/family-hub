
# Ny tilgang: Deaktiver overlay pointer-events via CSS

## Problemet
Radix UI's overlay-element (den morklagte baggrund bag popups) er et `fixed inset-0` element der daekker hele skaermen og fanger alle pointer-events -- **ogsaa dem der er rettet mod tastaturet**. Uanset z-index og DOM-raekkefoelge, saa skaber Radix-portalen sin egen stacking context, som blokerer klik og hover paa tastaturet.

De tidligere forsog har proevet at loese det med:
- DOM-order manipulation (MutationObserver) -- virker ikke pga. stacking contexts
- stopImmediatePropagation -- draeber Reacts event-system
- Event re-dispatch -- skaber uendelige loops

## Den nye tilgang

I stedet for at kaempe mod portalerne, **slaar vi pointer-events fra paa overlay-elementerne** naar tastaturet er synligt. Tastaturet faar saa automatisk alle events.

### Trin 1: Body-klasse som signal
Naar tastaturet er synligt, tilfoej klassen `vkb-active` paa `document.body`. Naar det skjules, fjern klassen.

### Trin 2: Data-attribut paa overlays
Tilfoej `data-keyboard-overlay` attributten paa `DialogOverlay` og `SheetOverlay` komponenterne, saa de kan targeteres praecist med CSS.

### Trin 3: Global CSS-regel
Tilfoej i `src/index.css`:
```css
body.vkb-active [data-keyboard-overlay] {
  pointer-events: none;
}
```

Dette goer at den moerke baggrund bag popups ikke laengere fanger museklik/hover naar tastaturet er fremme -- men selve popup-indholdet (dialog-boksen) beholder sine pointer-events.

### Trin 4: Fjern den custom portal-container
Gaa tilbage til at bruge `createPortal(content, document.body)` direkte. Fjern MutationObserver-logikken og den dedikerede container. Med overlay pointer-events deaktiveret er det ikke noedvendigt at manipulere DOM-raekkefoelge laengere.

## Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/VirtualKeyboard.tsx` | Tilfoej/fjern `vkb-active` klasse paa body. Fjern portal-container logik, brug `document.body` direkte. |
| `src/components/ui/dialog.tsx` | Tilfoej `data-keyboard-overlay` paa `DialogOverlay`. |
| `src/components/ui/sheet.tsx` | Tilfoej `data-keyboard-overlay` paa `SheetOverlay`. |
| `src/index.css` | Tilfoej CSS-regel for `body.vkb-active [data-keyboard-overlay]`. |

## Hvorfor dette virker
- Overlay-elementet er det eneste der blokerer -- ved at saette `pointer-events: none` paa det, naar tastaturet er aktivt, kan events naa tastaturet uanset stacking context.
- Ingen manipulation af event-propagation, saa React og Radix fungerer normalt.
- Popup-indholdet (selve dialogen) beholder sine pointer-events, saa man stadig kan interagere med inputs inde i popuppen.
