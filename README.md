# Familiens Assistent

Familiekalender, madplan, opskrifter, indkøbsliste og ordrehåndtering – alt samlet i én app.

## Dual-mode arkitektur

Projektet understøtter to driftsformer fra **samme kodebase**:

| | **Lovable / Cloud** | **Lokal / Self-hosted** |
|---|---|---|
| Frontend | Lovable preview/publish | Docker (Nginx) |
| Backend | Supabase (Lovable Cloud) | Express + PostgreSQL (Docker) |
| Database | Supabase PostgreSQL | Lokal PostgreSQL container |
| Fil-upload | Supabase Storage | Lokal disk via backend |
| Skift via | `VITE_APP_MODE=supabase` | `VITE_APP_MODE=local` |

---

## Lovable / Cloud mode

Projektet fungerer som normalt i Lovable. Ingen ændringer er nødvendige.

- Alle data gemmes i Lovable Cloud (Supabase).
- Preview og publish virker som sædvanligt.
- Miljøvariablen `VITE_APP_MODE` er **ikke sat** (default = `supabase`).

---

## Lokal / Self-hosted mode

### Forudsætninger

- Docker + Docker Compose
- Git

### Hurtig start

```bash
git clone <repo-url>
cd <projekt>

# Kopiér og tilpas env
cp .env.example .env

# Start alle services
docker compose up -d
```

Appen kører nu på **http://localhost:8080**

### Hvad der startes

| Service | Port | Beskrivelse |
|---|---|---|
| `frontend` | 8080 | Nginx med den byggede React-app |
| `backend` | 3001 | Express TypeScript API |
| `db` | 5432 | PostgreSQL 16 |

### Databasen

Skemaet oprettes automatisk fra `backend/init.sql` ved første start.  
Data persisteres i et Docker volume (`pgdata`).

---

## Miljøvariabler

| Variabel | Beskrivelse | Bruges i |
|---|---|---|
| `VITE_APP_MODE` | `supabase` eller `local` | Frontend |
| `VITE_SUPABASE_URL` | Supabase projekt-URL | Frontend (supabase mode) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Frontend (supabase mode) |
| `VITE_API_BASE_URL` | Backend API URL (default `/api`) | Frontend (local mode) |
| `VITE_API_KEY` | Valgfri API-nøgle til backend | Frontend (local mode) |
| `DATABASE_URL` | PostgreSQL connection string | Backend |
| `PORT` | Backend port (default 3001) | Backend |
| `API_KEY` | Valgfri API-nøgle (matcher `VITE_API_KEY`) | Backend |

---

## Projektstruktur

```
├── src/                    # React frontend (Lovable-kompatibel)
│   ├── config/env.ts       # Mode-detektion (supabase vs local)
│   ├── lib/api/            # Service layer (abstraktion over Supabase/REST)
│   ├── pages/              # Alle sider (bruger lib/api, IKKE supabase direkte)
│   └── integrations/       # Supabase klient (auto-genereret, bruges kun i supabase mode)
├── backend/                # Express TypeScript backend (kun til lokal drift)
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── db.ts           # PostgreSQL forbindelse
│   │   └── routes/         # REST API routes
│   ├── init.sql            # Database-skema
│   ├── Dockerfile
│   └── package.json
├── docker/
│   ├── Dockerfile.frontend # Multi-stage build af frontend
│   └── nginx.conf          # Nginx konfiguration med API proxy
├── docker-compose.yml      # Komplet lokal stack
└── .env.example            # Skabelon for miljøvariabler
```

## Sådan virker abstraktionen

Alle sider importerer fra `src/lib/api/` i stedet for at kalde Supabase direkte.

Hver service-funktion tjekker `VITE_APP_MODE`:
- **supabase**: Kalder Supabase klienten (lazy-loaded)
- **local**: Kalder REST API via `fetch`

Dette gør at **samme frontend-kode** kan køre i begge modes.

---

## Teknologi

- **Frontend**: React, Vite, Tailwind CSS, TypeScript, shadcn/ui
- **Backend (lokal)**: Express, pg (node-postgres), TypeScript
- **Database**: PostgreSQL 16
- **Containerisering**: Docker, Docker Compose, Nginx
