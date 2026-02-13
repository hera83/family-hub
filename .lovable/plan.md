

# 🏠 Familiens Digitale Assistent

En touch-venlig familieapp med simpelt design, sidebar-navigation og Supabase backend. Kører i to modes: touch-skærm (kiosk) og standard (laptop/tablet).

---

## 🎨 Design & Layout

- **Simpelt, touch-venligt design** med store klikbare elementer og dæmpede farver
- **Light/Dark mode** toggle i øverste højre hjørne
- **Sidebar med ikoner** til navigation mellem moduler (Kalender, Madplan, Indkøbsliste, Ordrer, Opskrifter)
- **Touch-mode** aktiveres via `?touch=true` i URL'en:
  - Musemarkør skjules
  - On-screen keyboard vises ved tekstinput
  - Skærmen nedtones 50% efter 10 minutters inaktivitet
- **Docker & Docker Compose filer** medfølger til self-hosting

---

## 📅 1. Digital Kalender

- **Uge-visning** som standard, med mulighed for at skifte til månedsvisning
- Navigering frem/tilbage mellem uger og måneder
- Hvert familiemedlem har sin egen **dæmpede farve**
- På store skærme vises aktivitetstitler direkte – på små skærme grupperes de pr. medlem med tap-to-expand popup
- **Familiemedlem-administration** (opret, rediger, slet) i en diskret popup/dialog
- Fælles "Familie"-gruppe til delte aktiviteter

---

## 🍽️ 2. Madplan

- **7-kolonners ugeplan** (mandag–søndag) med billede, titel og metadata for hver ret
- **Drag-and-swap**: Flyt en ret til en anden dag – retterne bytter plads. Flyttes til en tom dag, tømmes den oprindelige
- **Vælg ret-popup** med tabs: Favoritter og Alle opskrifter
- Billedvisning med søgning og kategorifiltre (Forret, Dessert, Pasta, Vegetarisk osv.)
- **Automatisk ingrediens-synkronisering**: Tilføj/fjern opskrift opdaterer indkøbslisten med korrekt antal-håndtering

---

## 🛒 3. Indkøbsliste

- Varer grupperet i kategorier (Kød, Mejeri, Frost, Frugt osv.)
- **Kategori-administration** popup til opret/rediger/slet grupper
- To stempler pr. vare: **"Fra opskrift"** og **"Manuel"**
  - Manuelle varer beskyttes mod automatisk fjernelse
  - Antal reguleres intelligent ved opskriftændringer
- **Tilføj vare-popup** med søgefunktion + mulighed for at oprette manuelle varer
- Varer fra API (Bilka) kan ikke redigeres, men manuelle kan
- **Bestil-funktion** der gemmer ordren i databasen (API-integration senere)

---

## 📦 4. Ordre-oversigt

- **Tabelvisning** med nyeste ordrer øverst
- Klik på ordre åbner popup med **indkøbsliste-lignende visning** (grupperet) for genkendelig UX
- Ordrestatus vises (API-integration senere)

---

## 📖 5. Opskrifter

- **Søgeside** inspireret af Google med de 10 nyeste opskrifter markeret som "Nye"
- **Pagination** (side 1 af 5) for hurtig indlæsning
- **Ny opskrift**-knap (+) i øverste højre hjørne
- Rediger-knap på hver opskrift-kort
- Opskrifter fra API kan ikke redigeres men kan **klones** til en manuel version
- Felter: Titel, billede, beskrivelse, ingredienser (med mængde/enhed), kategori, tilberedningstid, fremgangsmåde

---

## 🗄️ Supabase Database

Tabeller til: familiemedlemmer, kalenderbegivenheder, opskrifter, ingredienser, madplan, indkøbsliste-varer, varegrupper, produktkatalog (manuelt), ordrer og ordrelinjer.

---

## 🐳 Docker

- Dockerfile og docker-compose.yml til self-hosting af frontend
- Konfiguration via environment variables

