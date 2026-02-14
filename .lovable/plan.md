
# Indkoebsliste-rettelser: Administration, Varekatalog, Bestilling og Visningslogik

Seks sammenhaegende aendringer til indkoebslisten, ordresystemet og madplan-synkroniseringen.

---

## 1. Tandhjul bliver til "Kategorier og Varer" administration

Det nuvaerende kategori-admin-dialog udvides til en dialog med to tabs:

**Tab 1: Kategorier** (beholdes som nu)
- Opret, rediger, slet kategorier med soegefelt oeverst

**Tab 2: Varer**
- Liste over alle varer fra `products`-tabellen med soegefelt
- Opret ny vare med felter: Varenavn, Billede URL, Beskrivelse, Enhed og maengde (f.eks. "1 L"), Pris (kroner og oere, f.eks. 11,95), Kategori, Favoritvare-markering, Naeringsindhold pr. 100g (valgfrit: kalorier, fedt, kulhydrater, protein, fibre)
- Rediger og slet eksisterende varer (kun manuelle)
- API-varer vises men kan ikke redigeres

---

## 2. Database-aendringer (products-tabellen)

Nye kolonner paa `products`:

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| description | text | Beskrivelse |
| size_label | text | Maengdebetegnelse, f.eks. "1 L", "500 g" |
| price | numeric | Pris i kroner (f.eks. 11.95) |
| is_favorite | boolean | Favoritvare |
| calories_per_100g | numeric | Kalorier pr. 100g |
| fat_per_100g | numeric | Fedt pr. 100g |
| carbs_per_100g | numeric | Kulhydrater pr. 100g |
| protein_per_100g | numeric | Protein pr. 100g |
| fiber_per_100g | numeric | Fibre pr. 100g |

Nye kolonner paa `orders`:

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| total_price | numeric | Samlet pris for ordren |

Nye kolonner paa `order_lines`:

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| price | numeric | Pris pr. vare |
| size_label | text | Maengdebetegnelse |

Ny kolonne paa `shopping_list_items`:

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| is_ordered | boolean | Markerer at varen er bestilt |

---

## 3. Tilfoej vare-popup redesign

"Plus"-knappen aabner en soegnings-popup med:

- Soegefelt med live-filtrering
- Favoritfilter-knap (toggle) der kun viser favoritvarer
- Naar soegefeltet er tomt: vis de 6 mest koebte varer (baseret paa antal gange de optaeder i `order_lines`)
- Naar en vare vaelges: angiv antal (f.eks. "2") og varen tilfoejes som "2 x Maelk 1 L"

---

## 4. Visningslogik: Grupperet pr. produkt med expand

Indkoebslistens visning aendres saa varer med samme `product_id` samles paa en linje:

- Hovedlinje viser: "2 x Maelk 1 L" (summen af alle sources)
- Hvis varen har baade "manuel" og "opskrift" kilder, vises en expand-knap
- Ved expand ses: "1 x Maelk 1 L - Manuel" og "1 x Maelk 1 L - Opskrift (Pandekager)"
- Sletteknappen fjerner kun den specifikke kilde-linje
- Naar en opskrift fjernes fra madplanen kan kun "opskrift"-linjer slettes

---

## 5. Totalpris-visning

Til venstre for tandhjulet vises en totalpris for alle varer paa indkoebslisten:

- Beregnes som sum af (antal x pris) for alle ikke-afkrydsede varer
- Vises som "Total: 1.205,95 kr"
- Opdateres live naar varer tilfoejes/fjernes

---

## 6. Bestil-knap: PDF-generering og ordrehaandtering

Naar "Bestil" klikkes:

1. Opret en ordre i `orders` med `total_price` og `total_items`
2. Opret `order_lines` med pris og stoerrelsesbetegnelse
3. Marker alle `shopping_list_items` med `is_ordered = true`
4. Slet alle varer fra indkoebslisten (toem listen)
5. Gem PDF-data som base64 i en ny kolonne paa `orders` (`pdf_data text`)
   - PDF'en genereres client-side med simpel HTML-til-canvas metode eller en letvaegtsbibliothek
   - Indhold: Bestillingsdato, samlet pris, varer grupperet pr. kategori med antal, stoerrelse og pris

**Madplan-beskyttelse**: Naar `is_ordered` saettes til true inden sletning, opdateres synkroniseringslogikken i `MealPlanPage.tsx` saa den tjekker: "Er varerne allerede bestilt?" Hvis ja, fjernes de IKKE fra indkoebslisten naar en opskrift slettes fra madplanen.

---

## 7. Ordre-viewet opdateres

`OrdersPage.tsx` aendres til:

- Kolonner: Bestillingsdato, Samlet pris, Aaben (PDF-knap)
- PDF-knappen aabner PDF'en i et nyt vindue/dialog (base64 decoded)
- Den nuvaerende detail-popup fjernes til fordel for PDF-visning

---

## Teknisk implementering

### Database migration
En migration der tilfojer alle nye kolonner til `products`, `orders`, `order_lines` og `shopping_list_items`, samt `pdf_data` paa `orders`.

### Filer der aendres

**`src/pages/ShoppingListPage.tsx`** (stoerste aendring)
- Ny admin-dialog med tabs (Kategorier + Varer)
- Ny tilfoej-popup med favorit-filter og "mest koebte" logik
- Ny visningslogik med produkt-gruppering og expand
- Totalpris-beregning
- Bestil-logik med PDF-generering og is_ordered flag

**`src/pages/MealPlanPage.tsx`**
- Opdater `syncShoppingListForRecipe("remove")` til at tjekke `is_ordered` foer sletning

**`src/pages/OrdersPage.tsx`**
- Ny tabelstruktur med pris og PDF-knap
- PDF-visning i dialog eller nyt vindue

### Ny dependency
- `jspdf` til PDF-generering client-side (letvaegtsbibliothek)
