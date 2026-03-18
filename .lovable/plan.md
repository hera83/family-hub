

## Plan: Strømbesparende knap i header (kun i kiosk mode)

### Hvad der skal bygges
En knap med et strømbesparelses-ikon (f.eks. `MonitorOff` eller `PowerOff`) til venstre for tastatur-ikonet i headeren. Knappen vises **kun** når touch/kiosk mode er aktiv. Ved tryk aktiverer den den eksisterende dim-overlay med det samme.

### Ændringer

**`src/hooks/useTouchMode.ts`**
- Tilføj en `triggerDim` funktion der sætter `isDimmed` til `true` manuelt.
- Eksportér `triggerDim` fra hooket.

**`src/components/AppLayout.tsx`**
- Importér `MonitorOff` fra lucide-react.
- Destrukturér `triggerDim` fra `useTouchMode()`.
- Tilføj en ny `Button` til venstre for tastatur-knappen, kun vist når `isTouchMode === true`.
- Knappen kalder `triggerDim` ved klik.

### Teknisk detalje
`triggerDim` er simpelthen `() => setIsDimmed(true)`. Den eksisterende dim-overlay (`resetTimer`) håndterer allerede at vække skærmen igen ved berøring.

