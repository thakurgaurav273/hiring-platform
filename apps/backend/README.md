# Grovyn Talent - ATS Backend

Welcome to the **Grovyn Talent** backend project! This is an internal Applicant Tracking System (ATS) backend built with **Express.js**, **TypeScript**, and **Prisma ORM** (targeting **PostgreSQL**).

This project has been structured according to clean architecture and modular design principles, enabling you to build a secure, highly scalable, and production-ready application.

---

## 📂 Folder Structure Overview

```text
grovyn-talent-backend/
├── src/
│   ├── server.ts                 # Server entry point (starts HTTP server, connects to DB)
│   ├── app.ts                    # Express application configuration (middlewares, route registration)
│
│   ├── config/                   # Configuration loaders (validates and exports typed environment variables)
│   │   ├── env.ts                # Validates process.env via Zod
│   │   ├── database.ts
│   │   ├── jwt.config.ts
│   │   ├── storage.config.ts
│   │   ├── email.config.ts
│   │   └── swagger.config.ts
│
│   ├── common/                   # Core application-wide sharing
│   │   ├── middlewares/          # Express global/reusable middlewares (auth, logging, error, validator)
│   │   ├── errors/               # Custom operational exception classes (AppError, NotFound, etc.)
│   │   ├── enums/                # TypeScript enums (Roles, Stage, Events)
│   │   ├── interfaces/           # Generic repository and return types
│   │   ├── utils/                # General utility helper functions (jwt, bcrypt, pagination, async wrapper)
│   │   └── validators/           # Common Zod validation rules
│
│   ├── database/                 # Prisma configuration and migration controls
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Complete database models & relationships
│   │   │   └── seed.ts           # Development seed script
│   │   └── prisma-client.ts      # Singleton PrismaClient instance
│
│   ├── modules/                  # Business logic partitioned by feature modules
│   │   ├── auth/                 # Login, session refresh, and passwords
│   │   ├── users/                # Recruiters, managers, and permissions
│   │   ├── jobs/                 # Job listings and details
│   │   ├── candidates/           # Candidate profile details and tagging
│   │   ├── resumes/              # Resume file upload handlers and storage providers
│   │   ├── pipeline/             # Workflow stage transitions and configuration
│   │   ├── timeline/             # Audit trail events
│   │   ├── notes-feedback/       # Interviwer ratings and feedback notes
│   │   ├── email/                # Mail sending templates (Resend & SMTP providers)
│   │   ├── webhooks/             # Inbound mail parser webhooks
│   │   └── dashboard/            # Statistics, aggregates, and charts
│
│   └── routes/
│       └── index.ts              # Combines all module routers, mounts them on /api/v1
│
├── test/                         # Unit, integration, and End-to-End tests
├── docker/                       # Container environments
├── postman/                      # Postman collections for testing endpoints
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database running locally or in Docker
- [NPM](https://www.npmjs.com/) (bundled with Node)

### Installation

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Make sure your local `.env` values are correctly set up (especially `DATABASE_URL`).

3. Generate the Prisma Client types:
   ```bash
   npx prisma generate --schema=src/database/prisma/schema.prisma
   ```

4. Run the database migrations (creates the database tables in PostgreSQL):
   ```bash
   npx prisma migrate dev --name init --schema=src/database/prisma/schema.prisma
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```
   The API will be available at: `http://localhost:5000/api/v1`

---

## 🛠️ Step-by-Step Learning Guide

To help you write the code yourself, here is a recommended order to tackle the files:

### Step 1: Enums & Base Interfaces (`src/common/`)
- Implement enums inside `src/common/enums/` (e.g., `role.enum.ts` with `ADMIN`, `RECRUITER`, etc.).
- Build the `base-repository.interface.ts` which declares CRUD operations (`findMany`, `findById`, `create`, `update`, `delete`).

### Step 2: Core Express Setup (`src/app.ts` & `src/server.ts`)
- In `app.ts`, instantiate Express, register standard middleware (`cors()`, `helmet()`, `express.json()`), and import your central router.
- In `server.ts`, import `app`, import `prisma` client, establish connection, and start listening on `PORT`.

### Step 3: Logger & Health Module (`src/shared/`)
- Set up a logger using `winston` or `pino` inside `src/shared/logger/logger.ts`.
- Set up a simple health check route `/api/v1/health` that returns server and database connectivity status.

### Step 4: Utilities & General Middleware (`src/common/utils/` & `src/common/middlewares/`)
- Write password hashing and comparison using `bcryptjs` inside `hash.util.ts`.
- Write JWT signing and verification in `jwt.util.ts`.
- Implement `async-handler.util.ts`: a wrapper to capture asynchronous errors in Express routes and pass them to your error middleware.
- Build the `error-handler.middleware.ts` to catch exceptions and return neat JSON errors (e.g. `{ error: "Not Found", message: "..." }`).

### Step 5: Authentication Module (`src/modules/auth/`)
- Define Zod validations in `auth.validation.ts` for login and registration inputs.
- Create Express validation middleware `src/common/middlewares/validate.middleware.ts` that parses incoming `req.body` against Zod schemas.
- Write the logic inside `auth.service.ts` for validating passwords, generating access/refresh tokens, and saving them.
- Map endpoints inside `auth.routes.ts` connecting them to `auth.controller.ts`.

### Step 6: Users & Jobs Modules (`src/modules/users/` & `src/modules/jobs/`)
- Implement repository patterns to decouple Prisma queries from the controllers.
- Apply JWT check middleware (`auth.middleware.ts`) and RBAC checks (`roles.middleware.ts`) to secure routes.

### Step 7: Core Candidates & Resumes Storage (`src/modules/candidates/` & `src/modules/resumes/`)
- Create standard candidate CRUD.
- Build a generic interface `storage-provider.interface.ts` and write implementations for local storage, AWS S3, and Cloudflare R2, using the settings loaded from `src/config/storage.config.ts`.
