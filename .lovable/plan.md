

# Ingredienser, Varekatalog og Madplan-synkronisering

Tre sammenhængende ændringer der binder opskrifter, varekatalog og indkøbsliste sammen.

---

## 1. Ingrediensliste på opskrifter

Opskrift-editoren (`RecipesPage.tsx`) udvides med en ingrediens-sektion, hvor man kan tilfoeje, redigere og slette ingredienser. Hver ingrediens linkes til en vare fra `products`-tabellen via `product_id` i `recipe_ingredients`.

- Ingrediens-felter: produkt (valgt fra varekatalog), antal, enhed
- Ved klon af en API-opskrift kopieres ingredienserne med
- Ingredienser gemmes i `recipe_ingredients`-tabellen (som allerede eksisterer med `product_id`, `quantity`, `unit`, `recipe_id`)

---

## 2. Nyt varekatalog i "Tilfoej vare"-popup (Indkoebsliste)

Den nuvaerende "Tilfoej vare"-dialog erstattes med en soege-popup der viser varer fra `products`-tabellen:

- Soegefelt med live-filtrering af produkter
- Hvert produkt vises med navn, enhed og kategori
- Badge der viser "API" eller "Manuel"
- Man vaelger en vare, angiver antal, og den tilfoejes til indkoebslisten med korrekt `product_id` og `category_id`
- Knap til at oprette en ny manuel vare hvis den ikke findes i kataloget
- Manuelle varer kan redigeres og slettes, API-varer er laasede

---

## 3. Automatisk indkoebsliste-synkronisering fra madplan

Naar en opskrift vaelges i madplanen (`MealPlanPage.tsx`), tilfoejs alle opskriftens ingredienser automatisk til indkoebslisten. Naar en opskrift fjernes, fjernes de tilhoerende varer igen -- med respekt for reglerne:

- Varer med `source_type: "recipe"` og matchende `recipe_id` tilfoejs/fjernes
- Hvis samme produkt allerede findes manuelt, reguleres kun antallet op/ned
- Manuelle varer (`source_type: "manual"`) slettes aldrig automatisk
- Hvis en vare har baade manuel og opskrift-antal, reduceres kun opskrift-delen

---

## Teknisk implementering

### Database
Ingen schema-aendringer noevendige -- alle tabeller og relationer eksisterer allerede:
- `products` (varekatalog med `category_id`, `is_manual`)
- `recipe_ingredients` (med `product_id`, `recipe_id`, `quantity`, `unit`)
- `shopping_list_items` (med `product_id`, `recipe_id`, `source_type`, `category_id`)

### Filer der aendres

**`src/pages/RecipesPage.tsx`**
- Tilfoej ingrediens-sektion i opskrift-editoren
- Hent og vis `recipe_ingredients` for den valgte opskrift
- Soeg i `products`-tabellen for at linke ingredienser
- Ved gem: indsaet/opdater/slet ingredienser i `recipe_ingredients`
- Ved klon: kopier ingredienserne til den nye opskrift

**`src/pages/ShoppingListPage.tsx`**
- Erstat "Tilfoej vare"-dialogen med en varekatalog-soege-popup
- Hent `products` med `item_categories` join
- Vis produkter med soegning, kategorivisning og API/Manuel badge
- Tilfoej "Opret ny vare"-funktion i samme popup
- Ved valg af produkt: indsaet i `shopping_list_items` med `product_id` og `category_id` fra produktet

**`src/pages/MealPlanPage.tsx`**
- Naar `setMealPlan` mutationen koerer:
  - Hent ingredienser for den valgte opskrift (`recipe_ingredients` med `products` join)
  - For hver ingrediens: tjek om produktet allerede er paa listen
    - Hvis ja med `source_type: "recipe"`: opdater antal
    - Hvis nej: indsaet ny linje med `source_type: "recipe"`, `recipe_id`, `product_id`
  - Naar en opskrift fjernes: find alle `shopping_list_items` med matchende `recipe_id`
    - Slet dem, medmindre der ogsaa er en manuel registrering af samme produkt

