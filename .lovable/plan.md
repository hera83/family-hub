

## Plan: Centraliseret Indstillinger-side

### Oversigt
Flytte al administration (varekategorier, produkter, opskriftkategorier, familiemedlemmer) ud af de enkelte sider og samle det i en ny **Indstillinger**-side tilgængelig via sidebar med et tandhjulsikon i bunden.

### Struktur

```text
/indstillinger
├── Tabs
│   ├── Varekategorier    (fra ShoppingListPage)
│   ├── Varer/Produkter   (fra ShoppingListPage)
│   ├── Opskriftkategorier (fra RecipesPage)
│   └── Familiemedlemmer  (fra CalendarPage)
```

### Ændringer

**1. Ny fil: `src/pages/SettingsPage.tsx`**
- Opretter en side med 4 tabs (Varekategorier, Varer, Opskriftkategorier, Familiemedlemmer)
- Flytter al CRUD-logik og UI fra de eksisterende admin-dialogs hertil
- Inkluderer ProductForm-komponenten (flyttes eller genbruges)
- Samme søgefunktionalitet, inline-redigering og oprettelse som i dag

**2. Opdater `src/App.tsx`**
- Tilføj route: `/indstillinger` → `SettingsPage`

**3. Opdater `src/components/AppSidebar.tsx`**
- Tilføj "Indstillinger" med `Settings`-ikon i bunden af menuen (adskilt fra de øvrige menupunkter)

**4. Oprydning i eksisterende sider**
- **ShoppingListPage**: Fjern admin-dialog (kategorier + varer tabs), Settings-knap, ProductForm-komponent, og al tilhørende state/mutations for admin
- **RecipesPage**: Fjern kategori-admin-dialog, Settings-knap og tilhørende state
- **CalendarPage**: Fjern familiemedlem-admin-dialog og tilhørende state; behold familiemedlemmer som data til kalender-funktionalitet

### Design
- Tabs-layout på selve siden (ikke i en dialog) for bedre plads og overblik
- Konsistent med eksisterende styling (min-h-[44px] touch targets, søgefelter, inline edit/delete)
- Sidebar-ikonet placeres nederst med en separator for visuel adskillelse

### Teknisk
- Alle API-funktioner genbruges uændret (getProducts, getItemCategories, etc.)
- QueryClient-invalidation forbliver den samme
- ProductForm-komponenten flyttes til `src/components/ProductForm.tsx` for genbrug

