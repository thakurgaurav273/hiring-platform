# Hiring Platform — Monorepo

This is the monorepo for the Hiring Platform, containing the frontend and backend as npm workspaces.

```
hiring-platform/
├── apps/
│   ├── backend/      Node.js + Express API  (port 5000)
│   └── frontend/     Next.js app            (port 3000)
├── .github/
│   └── workflows/    CI pipeline
└── package.json      Root workspace config
```

## Prerequisites

- Node.js >= 20 (use `nvm use` if you have nvm)
- npm >= 10

## Getting started

```bash
# 1. Install all dependencies from the repo root
npm install

# 2. Set up environment files
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Start both apps in parallel
npm run dev
```

The backend health check is available at `http://localhost:5000/api/health`.

## Running apps individually

```bash
npm run dev:backend    # Express API on :5000
npm run dev:frontend   # Next.js on :3000
```

## Project conventions

- **Branches:** branch off `dev`, open PRs back to `dev`. `main` is production.
- **Commits:** use conventional commits — `feat:`, `fix:`, `chore:`, `docs:`
- **Env vars:** never commit `.env` files. Update the matching `.env.example` when you add a new variable.
- **Backend routes:** add new route files in `apps/backend/src/routes/` and register them in `apps/backend/src/routes/index.js`.
- **Frontend pages:** add pages under `apps/frontend/src/app/` following the Next.js App Router convention.

## Tech stack

| Layer     | Tech                         |
|-----------|------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend   | Node.js 20, Express 4, ES Modules |
| CI        | GitHub Actions               |
