

## Plan: Data Tab med Import/Eksport i Indstillinger

### Oversigt
Tilføje et "Data" tab i højre side af indstillingssiden med import/eksport-funktionalitet for alle datakilder. De eksisterende 4 tabs forbliver i venstre side.

### Layout
```text
┌─────────────────────────────────────────────────────┐
│ Indstillinger                                       │
├────────────────────────────┬────────────────────────┤
│ Varekategorier | Varer |   │                  Data  │
│ Opskriftkategorier |       │                        │
│ Familiemedlemmer           │                        │
├────────────────────────────┼────────────────────────┤
│                            │ Individuel eksport/    │
│  (eksisterende indhold)    │ import (Excel):        │
│                            │  - Varekategorier      │
│                            │  - Varer               │
│                            │  - Opskriftkategorier  │
│                            │  - Opskrifter          │
│                            │  - Familiemedlemmer    │
│                            │  - Kalenderbegivenheder│
│                            │  - Madplaner           │
│                            │                        │
│                            │ Samlet backup (JSON):  │
│                            │  - Eksportér alt       │
│                            │  - Importér alt        │
└────────────────────────────┴────────────────────────┘
```

### Datakilder der dækkes
1. **Varekategorier** (item_categories)
2. **Varer/Produkter** (products)
3. **Opskriftkategorier** (recipe_categories)
4. **Opskrifter** (recipes + recipe_ingredients)
5. **Familiemedlemmer** (family_members)
6. **Kalenderbegivenheder** (calendar_events)
7. **Madplaner** (meal_plans)

### Funktionalitet

**Individuel Excel eksport/import:**
- Hver datakilde har en "Eksportér" og "Importér" knap
- Eksport genererer en `.xlsx` fil via `xlsx` npm-pakken (klientside)
- Import parser uploadet `.xlsx` og upsert'er data via eksisterende API-funktioner
- Validering af kolonner ved import med fejlrapportering

**Samlet JSON backup:**
- "Eksportér alt" henter alle tabeller og downloader som én `.json` fil
- "Importér alt" uploader `.json` og indsætter data i korrekt rækkefølge (kategorier først, derefter afhængige data)

### Tekniske ændringer

**1. Installer `xlsx` pakke** til klientside Excel-parsing/generering

**2. Opdater `src/pages/SettingsPage.tsx`**
- Omstrukturér layout: to-kolonne grid med tabs i venstre og Data-panel i højre
- På mobil stacker de vertikalt (Data-panelet under)

**3. Ny fil: `src/components/DataImportExport.tsx`**
- Selvstændig komponent med al import/eksport-logik
- Bruger eksisterende API-funktioner fra `src/lib/api/`
- Sektion for individuel Excel import/eksport per datakilde
- Sektion for samlet JSON backup
- Progress-indikator ved import
- Toast-feedback ved succes/fejl

**4. Tilføj manglende API-funktioner**
- `getCalendarEventsAll()` - hent alle events uden datofilter (til eksport)
- `getMealPlansAll()` - hent alle madplaner (til eksport)

