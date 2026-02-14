

# Fejlrettelser: Fokustab, PDF-visning og Mængdeberegning

Tre uafhængige fejl der skal rettes.

---

## 1. Fokustab i produktformularen

**Problem**: `ProductForm`-komponenten er defineret som en funktion INDE i `ShoppingListPage`-komponenten (linje 387-424). Hver gang React gengiver siden (f.eks. ved tastetryk), oprettes en ny komponent-reference, og React mountes den forfra -- hvilket fjerner fokus fra inputfeltet.

**Loesning**: Flyt `ProductForm` ud af `ShoppingListPage`-funktionen, saa den bliver en selvstaendig komponent defineret paa modul-niveau. Den modtager `values`, `onChange`, `categories` og `isEdit` som props.

**Fil**: `src/pages/ShoppingListPage.tsx`

---

## 2. PDF-visningsfejl i Ordrer

**Problem**: `jsPDF.output("datauristring")` returnerer en data-URI med et ekstra `filename`-segment: `data:application/pdf;filename=generated.pdf;base64,...`. Mange browsere kan ikke haandtere dette format i en iframe `src`.

**Loesning**: Brug `doc.output("datauristring")` men strip `filename`-segmentet inden det gemmes, saa det bliver en standard data-URI: `data:application/pdf;base64,...`. Alternativt brug `doc.output("blob")`, opret en blob-URL og gem den. Den enkleste fix er at rense strengen foer den gemmes.

Derudover tilfoejes en `DialogDescription` til dialogen for at fjerne den `aria-describedby` advarsel der ogsaa ses i konsollen.

**Fil**: `src/pages/ShoppingListPage.tsx` (placeOrder mutation), `src/pages/OrdersPage.tsx` (PDF-visning)

---

## 3. Maengdeberegning: Pakker vs. Raavaegt

**Problem**: Systemet gemmer opskriftens raavaegt (f.eks. 1 kg kyllingefars) direkte som `quantity` i indkoebslisten. Men produktet saelges i pakker af f.eks. 500 g. Resultatet er forkert visning som "500 x Killingefars af 500 g" i stedet for "2 x Killingefars 500 g".

**Loesning**: Indfoejer en konverteringslogik i `syncShoppingListForRecipe` (MealPlanPage.tsx) der:

1. Henter opskriftens ingrediens-maengde og enhed (f.eks. 1 kg)
2. Henter produktets `size_label` og `unit` (f.eks. "500", "g")
3. Konverterer til samme enhed (1 kg = 1000 g)
4. Beregner antal pakker: `Math.ceil(1000 / 500) = 2`
5. Gemmer `quantity: 2` i `shopping_list_items` (2 pakker)

**Konverteringstabel** (haandteres i en hjaelpefunktion):
- 1 kg = 1000 g
- 1 l = 10 dl = 100 cl = 1000 ml
- Hvis enheder ikke kan konverteres, bruges raavaerdien direkte

Samme logik anvendes i indkoebslistens "Tilfoej vare"-popup, saa brugeren altid ser "X x Produkt Stoerrelse".

**Filer**: `src/pages/MealPlanPage.tsx` (syncShoppingListForRecipe), `src/pages/ShoppingListPage.tsx` (visning)

---

## Teknisk implementering

### Fil 1: `src/pages/ShoppingListPage.tsx`
- Flyt `ProductForm` ud af komponenten (linje 387-424) til modul-niveau
- Tilfoej `categories` som prop til `ProductForm`
- Ret PDF data-URI generering i `placeOrder`

### Fil 2: `src/pages/MealPlanPage.tsx`
- Tilfoej hjaelpefunktion `convertToPackages(recipeQty, recipeUnit, productSizeLabel, productUnit)` der returnerer antal pakker
- Opdater `syncShoppingListForRecipe` til at bruge denne konvertering

### Fil 3: `src/pages/OrdersPage.tsx`
- Tilfoej `DialogDescription` for at fjerne aria-advarsel
- Haandter potentielt ugyldige PDF data-URIs

