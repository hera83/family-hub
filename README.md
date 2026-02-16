# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## Two environments

### A) Hosted mode (Lovable Cloud – default)

This is the default. Uses the hosted Supabase backend via `.env`.

```sh
npm i
npm run dev
```

Or with Docker (production build):
```sh
docker compose up -d
# App on http://localhost:3000
```

### B) Local Docker mode (self-contained)

Runs **everything** locally: frontend (Vite dev server with HMR) + full Supabase stack (Postgres, Auth, REST, Realtime, Storage, Studio).

#### Quick start

```sh
# 1. Create your local env file (one-time)
cp .env.local.example .env.local

# 2. Start the full stack
docker compose -f docker-compose.local.yml --env-file .env.local up -d

# 3. Open the app
#    App:             http://localhost:5173
#    Supabase Studio:  http://localhost:54323
```

On first start the `db-init` service automatically applies all migrations from `supabase/migrations/`.

#### Stop

```sh
docker compose -f docker-compose.local.yml --env-file .env.local down
```

#### Reset database

```sh
docker compose -f docker-compose.local.yml --env-file .env.local down -v
# Then start again – migrations will re-run
```

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

## What technologies are used for this project?

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes! Navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
