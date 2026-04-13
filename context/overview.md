# TornTools - Codebase Overview

TornTools is a full-stack market analysis tool for the browser game **Torn City**. It aggregates
pricing data from three external sources (Torn API, Weav3r bazaar, Yata foreign stock) and presents
profitable arbitrage opportunities to players.

## Stack

| Layer           | Technology                                                           |
| --------------- | -------------------------------------------------------------------- |
| Backend         | .NET 9, ASP.NET Core, EF Core, PostgreSQL                            |
| Background jobs | Hangfire + custom queue processor                                    |
| Frontend        | React 19, TypeScript, Vite, Material UI v7, Recharts                 |
| Migrations      | Flyway (SQL, versioned + repeatable)                                 |
| Infrastructure  | Terraform + Azure (App Service, PostgreSQL Flexible Server, Storage) |
| CI/CD           | GitHub Actions                                                       |

## Repository Layout

```txt
TornTools/
├── api/                   # .NET solution (5 projects)
├── client/                # React SPA
├── .docker/flyway/sql/    # Database migrations
│   ├── Versioned/         # V1.x__ migrations
│   └── Repeatable/        # R__ views and functions
├── infra/                 # Terraform configs
├── .github/workflows/     # build-code.yml, deploy-all.yml
├── backlog/               # Trello cards as markdown
├── context/               # Codebase navigation docs (this folder)
└── docs/
```

## Backend Projects

| Project                 | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `TornTools.Api`         | ASP.NET Core app - controllers, JWT auth, Hangfire dashboard, startup |
| `TornTools.Application` | Business logic - service layer, API callers, call handlers, resolvers |
| `TornTools.Core`        | Shared - DTOs, enums, constants, external API models, input models    |
| `TornTools.Persistence` | EF Core DbContext, entities, repositories                             |
| `TornTools.Cron`        | Background job processor (`QueueProcessor`), Hangfire job scheduler   |

## Frontend Structure

```txt
client/src/
├── contexts/      # React Context providers (UserContext, ItemsContext, ThemeContext)
├── hooks/         # useUser, useItems, useThemeSettings (wrappers around contexts)
├── pages/         # Route components (10 pages)
├── components/    # 30+ reusable UI components
├── lib/           # API wrappers (dotnetapi.ts, tornapi.ts, weav3rapi.ts), utilities
├── types/         # TypeScript interfaces
└── constants/     # API base URLs, etc.
```

## Key Data Flows

**Market scan cycle:**

```txt
QueueProcessor dequeues item
  → resolves ApiCaller (TornApiMultiKeyCaller / WeaveApiCaller / YataApiCaller)
  → fetches external API with correct auth + rate limiting
  → resolves ApiCallHandler
  → handler parses response → writes to DB
  → queue repopulates when exhausted
```

**User authentication:**

```txt
Frontend: user enters API key
  → validate against Torn API (fetchTornKeyInfo)
  → show preview (name, level, gender)
  → user confirms → POST /auth/login
  → backend re-validates key against Torn → upserts user → issues JWT in httpOnly cookie
  → subsequent requests use cookie; JWT expiry = 30 days
```

**Frontend data loading:**

```txt
App mounts → getMe() checks JWT cookie → restores session if valid
Items loaded in ItemsContext → cached in localStorage (1h TTL)
Torn profile cached in localStorage (24h TTL)
```

## Environments

`dev` / `staging` / `prod` - selectable at deploy time via `TerraformEnvironmentName` enum.
`EnvironmentConfiguration.RunQueueProcessor` and `PopulateQueue` flags gate background job startup.
