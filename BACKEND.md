# Backend foundation

The same Node process serves the static site and the versioned JSON API. It uses only Node built-ins, so the repository has no runtime dependencies.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface the HTTP server binds to |
| `PORT` | `4173` | HTTP port |
| `DATA_FILE` | `data/store.json` | Persistent JSON database location |

PowerShell example:

```powershell
$env:PORT = "8080"
$env:DATA_FILE = "D:\data\kcard-store.json"
npm run start
```

## API routes

All request and response bodies use JSON.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Readiness/health check |
| `GET` | `/api/v1/listings` | Active listings |
| `GET` | `/api/v1/listings?includeInactive=true` | All listings |
| `POST` | `/api/v1/listings` | Create a validated listing |
| `GET` | `/api/v1/listings/:id` | Fetch one listing |
| `PATCH` | `/api/v1/listings/:id` | Update a listing |
| `DELETE` | `/api/v1/listings/:id` | Delete an owned listing |
| `POST` | `/api/v1/auth/signup` | Create an account and session |
| `POST` | `/api/v1/auth/login` | Start a session |
| `POST` | `/api/v1/auth/logout` | End a session |
| `GET` | `/api/v1/auth/me` | Read the current session user |
| `PATCH` | `/api/v1/profile` | Update the authenticated profile |
| `GET` | `/api/v1/requests` | Requests involving the authenticated user |
| `POST` | `/api/v1/requests` | Create a buy request; price and seller are derived server-side |
| `PATCH` | `/api/v1/requests/:id/status` | Change request status and update listing availability |

Errors use `{ "error": "message" }` with an appropriate 4xx or 5xx status. Request bodies are limited to 1 MB. Data writes use a temporary file and atomic rename to avoid partially written JSON.

## Production migration

The API enforces authenticated ownership for writes, but it is still an MVP. Before exposing it publicly:

1. Replace the JSON store with PostgreSQL or another transactional database.
2. Move the in-memory session registry to a shared durable session store and enable `Secure` cookies behind HTTPS.
3. Add email verification, password reset, session rotation, and optional external identity providers.
4. Add rate limiting, explicit CSRF tokens, structured request logging, and centralized error monitoring.
5. Move uploaded images to object storage and validate file content server-side.
6. Add database-backed integration tests and deployment health/readiness probes.
7. Add transactional handling so accepting one request prevents competing requests from being accepted.
