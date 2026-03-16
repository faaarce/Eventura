# Eventura

A pnpm monorepo for event management, built with Express, TanStack Start, and Prisma.

## Tech Stack

- **Package Manager:** pnpm (workspaces)
- **API:** Express 5 + Prisma ORM
- **Frontend:** TanStack Start + TanStack Router + React 19 + Tailwind CSS v4
- **Database:** PostgreSQL (Neon)
- **Language:** TypeScript

## Project Structure

```
eventura/
├── apps/
│   ├── api/             # Express REST API (port 8000)
│   │   ├── prisma/      # Schema & migrations
│   │   └── src/
│   │       ├── index.ts
│   │       └── utils/
│   │           └── prisma.ts
│   └── platform/        # TanStack Start frontend (port 3000)
│       └── src/
│           ├── routes/
│           └── utils/
│               └── api.ts
├── packages/            # Shared packages (future use)
├── .env                 # Environment variables (not committed)
├── package.json
└── pnpm-workspace.yaml
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10

```bash
npm install -g pnpm
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/faaarce/Eventura.git
cd Eventura
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

> Ask a team member for the Neon connection string. Never commit `.env` to Git.

### 4. Run database migrations

```bash
cd apps/api
pnpm db:migrate
```

### 5. Start development servers

From the root directory, run all apps simultaneously:

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm api:dev        # API on http://localhost:8000
pnpm platform:dev   # Frontend on http://localhost:3000
```

## Available Scripts

### Root

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all apps in parallel |
| `pnpm api:dev` | Run API only |
| `pnpm platform:dev` | Run frontend only |

### API (`apps/api`)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm build` | Compile TypeScript |

## Database

This project uses [Neon](https://neon.tech/) (serverless PostgreSQL) as a shared development database. Both team members connect to the same instance.

### Changing the schema

1. Edit `apps/api/prisma/schema.prisma`
2. Run `pnpm db:migrate` from `apps/api/`
3. Commit the migration files
4. Other team members pull and run `pnpm db:migrate`

### Viewing data

```bash
cd apps/api
pnpm prisma studio
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/users` | List all users |
