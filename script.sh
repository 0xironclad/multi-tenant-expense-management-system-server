#!/bin/bash

# =============================================================================
# Multi-Tenant Expense Management System (MVP) — GitHub Issues Setup
# Run: chmod +x setup_issues.sh && ./setup_issues.sh OWNER/REPO
# Requires: gh CLI authenticated (gh auth login)
# =============================================================================

REPO=$1

if [ -z "$REPO" ]; then
  echo "Usage: ./setup_issues.sh OWNER/REPO"
  exit 1
fi

echo "Creating labels..."

gh label create "service:auth" --color "0075ca" --description "Auth service" --repo $REPO 2>/dev/null
gh label create "service:user-org" --color "e4e669" --description "User & Org service" --repo $REPO 2>/dev/null
gh label create "service:expense" --color "d73a4a" --description "Expense service" --repo $REPO 2>/dev/null
gh label create "service:notification" --color "a2eeef" --description "Notification service" --repo $REPO 2>/dev/null
gh label create "service:file" --color "7057ff" --description "File/Storage service" --repo $REPO 2>/dev/null
gh label create "service:gateway" --color "008672" --description "API Gateway" --repo $REPO 2>/dev/null
gh label create "aws" --color "ff9900" --description "AWS infrastructure" --repo $REPO 2>/dev/null
gh label create "infrastructure" --color "fef2c0" --description "Docker, CI/CD, config" --repo $REPO 2>/dev/null
gh label create "database" --color "c5def5" --description "Database schema & migrations" --repo $REPO 2>/dev/null
gh label create "observability" --color "bfd4f2" --description "Logging, tracing, metrics" --repo $REPO 2>/dev/null
gh label create "security" --color "b60205" --description "Auth, RBAC, secrets" --repo $REPO 2>/dev/null
gh label create "messaging" --color "f9d0c4" --description "Queues, events, brokers" --repo $REPO 2>/dev/null
gh label create "setup" --color "ededed" --description "Project scaffolding & config" --repo $REPO 2>/dev/null
gh label create "feature" --color "0e8a16" --description "Business feature" --repo $REPO 2>/dev/null
gh label create "mvp" --color "5319e7" --description "MVP scope" --repo $REPO 2>/dev/null

echo "Labels created. Creating issues..."

# =============================================================================
# PHASE 1 — REPO & LOCAL INFRASTRUCTURE
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[1] Project scaffolding: monorepo structure and shared tooling" \
  --label "setup,infrastructure,mvp" \
  --body "## 📦 Service: Root / Monorepo

**Overview**
Set up the base monorepo that will house all microservices. Each service lives in its own folder and is independently runnable. This is the foundation before any service code is written.

---

## Tasks
- [ ] Initialise the repo with this folder structure:
\`\`\`
/
├── services/
│   ├── auth/
│   ├── user-org/
│   ├── expense/
│   ├── notification/
│   ├── file/
│   └── gateway/
├── packages/
│   └── types/
├── infra/
│   └── init.sql
├── docker-compose.yml
├── .env.example
└── README.md
\`\`\`
- [ ] Each service folder has its own \`package.json\`, \`tsconfig.json\`, and \`Dockerfile\`
- [ ] Root \`.gitignore\` covering \`node_modules\`, \`dist\`, \`.env\`, \`*.pem\`
- [ ] \`.env.example\` listing every env var each service will need (values empty)
- [ ] Initial \`README.md\` describing the architecture, services, and use case

---

## Hints
- Don't use Turborepo/Nx yet — plain folders are simpler and you'll learn more
- Each service is a self-contained Node.js app from day one
- The \`/packages/types\` folder is for TypeScript types shared across services

## Expected Outcome
Clean repo pushed to GitHub with clear structure and architecture overview in README."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[2] Local infrastructure: Docker Compose with Postgres, Redis, RabbitMQ, MinIO" \
  --label "setup,infrastructure,database,messaging,mvp" \
  --body "## 📦 Service: Infrastructure (local dev)

**Overview**
Get all backing services running locally via Docker Compose before writing any service code. This gives every service a database, cache, message broker, and S3-compatible storage to develop against.

---

## Tasks
- [ ] Create \`docker-compose.yml\` at the root with:
  - \`postgres\` (single instance, multiple databases via init script)
  - \`redis\` (cache + sessions)
  - \`rabbitmq\` with management UI plugin (port 15672)
  - \`minio\` (S3-compatible for local dev, port 9000 + console 9001)
- [ ] Create \`/infra/init.sql\`:
\`\`\`sql
CREATE DATABASE auth_db;
CREATE DATABASE user_org_db;
CREATE DATABASE expense_db;
CREATE DATABASE notification_db;
CREATE DATABASE file_db;
\`\`\`
- [ ] Mount init script into the Postgres container at \`/docker-entrypoint-initdb.d/init.sql\`
- [ ] Add healthchecks to postgres and rabbitmq services
- [ ] Use named volumes so data persists between restarts
- [ ] Create a default bucket in MinIO at startup (use the \`minio/mc\` sidecar or document manual creation in README)
- [ ] Document all ports in \`.env.example\`

---

## Hints
- MinIO is an S3-compatible server you run locally — you write S3 SDK code once and point it at MinIO locally or real S3 in production via an endpoint env var
- RabbitMQ default creds: \`guest/guest\` — fine locally
- Test each connection from a client (TablePlus, pgAdmin) before moving on
- Run \`docker compose up -d\` and verify all containers are healthy

## Expected Outcome
\`docker compose up\` starts Postgres (5 databases), Redis, RabbitMQ, MinIO. All reachable from your host machine."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[3] Shared types package: events, enums, and DTOs" \
  --label "setup,infrastructure,mvp" \
  --body "## 📦 Service: Shared (/packages/types)

**Overview**
Define shared TypeScript types in one place so all services use the same shapes for events, roles, and statuses. Compile-time safety across service boundaries.

---

## Tasks
- [ ] Create \`/packages/types/package.json\` with name \`@app/types\` (no dependencies, just types)
- [ ] Define role enum (MVP scope — only three roles):
\`\`\`typescript
export enum Role {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}
\`\`\`
- [ ] Define expense status enum:
\`\`\`typescript
export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
\`\`\`
- [ ] Define event payloads with an \`eventId\` field for idempotency:
\`\`\`typescript
export type ExpenseApprovedEvent = {
  eventId: string;
  type: 'EXPENSE_APPROVED';
  expenseId: string;
  submittedBy: string;
  orgId: string;
  amount: string;
  currency: string;
  occurredAt: string;
};

export type ExpenseRejectedEvent = {
  eventId: string;
  type: 'EXPENSE_REJECTED';
  expenseId: string;
  submittedBy: string;
  orgId: string;
  reason: string;
  occurredAt: string;
};

export type UserInvitedEvent = {
  eventId: string;
  type: 'USER_INVITED';
  email: string;
  orgId: string;
  orgName: string;
  role: Role;
  inviteToken: string;
  occurredAt: string;
};
\`\`\`
- [ ] Reference \`@app/types\` from each service: \`\"@app/types\": \"file:../../packages/types\"\`

---

## Hints
- Types-only package — no runtime code
- The \`eventId\` is critical for consumer-side idempotency — the notification service uses it to detect and skip duplicate events
- Events do NOT include the recipient's email — the notification service looks that up via the user-org service. This keeps the expense service decoupled from user data
- Every new event type goes here FIRST before producer/consumer implementation

## Expected Outcome
Shared types package imported in all services. Every event/enum has one source of truth."

# =============================================================================
# PHASE 2 — AWS FOUNDATION
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[4] ☁️ AWS: IAM setup — users, roles, least-privilege policies" \
  --label "aws,security,setup,mvp" \
  --body "## ☁️ AWS — Before writing any service code

**Overview**
First thing for any AWS project: set up IAM correctly. Never use root credentials in code. You're doing this now so when service code starts referencing AWS SDKs, the credentials are already configured.

---

## Tasks
- [ ] Enable MFA on your AWS root account
- [ ] Create IAM user \`expense-app-dev\` (programmatic access only)
- [ ] Create policy \`ExpenseAppDevPolicy\` with permissions for:
  - S3: PutObject, GetObject, DeleteObject on receipts bucket
  - SQS: SendMessage, ReceiveMessage, DeleteMessage on app queues
  - Secrets Manager: GetSecretValue (scoped to your app's secrets)
  - ECR: GetAuthorizationToken, BatchCheckLayerAvailability, PutImage, BatchGetImage
- [ ] Attach policy to user
- [ ] Generate access keys, save to local \`.env\` (never commit)
- [ ] Create IAM Role \`ExpenseAppEC2Role\` with the same policy — for attaching to EC2 later
- [ ] Run \`aws configure\` locally with the new user's credentials
- [ ] Verify with \`aws sts get-caller-identity\`

---

## Hints
- Least privilege: only the exact permissions needed
- Local dev uses access keys; EC2 uses the IAM role (no keys on the instance)
- Region: \`eu-central-1\` (Frankfurt) since you're in Budapest

## Expected Outcome
IAM user with scoped permissions for local dev. IAM role ready for EC2. Root account secured with MFA. \`aws sts get-caller-identity\` returns your dev user."

# =============================================================================
# PHASE 3 — AUTH SERVICE
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[5] Auth service: scaffold Express app with TypeScript and health check" \
  --label "service:auth,setup,infrastructure,mvp" \
  --body "## 📦 Service: Auth Service (/services/auth)

**Overview**
The auth service owns identity. Other services never read the auth DB — they call \`/auth/verify\` to validate tokens. Start by scaffolding the app.

---

## Tasks
- [ ] Initialise Node project in \`/services/auth\`:
\`\`\`bash
npm install express drizzle-orm pg dotenv zod jsonwebtoken bcryptjs
npm install -D typescript @types/express @types/node @types/jsonwebtoken @types/bcryptjs ts-node-dev drizzle-kit
\`\`\`
- [ ] \`tsconfig.json\` with strict mode
- [ ] Folder structure:
\`\`\`
src/
├── routes/
├── controllers/
├── middleware/
├── db/
│   ├── schema.ts
│   └── index.ts
├── lib/
└── index.ts
\`\`\`
- [ ] \`src/index.ts\` with Express app + \`GET /health\` returning \`{ status: 'ok', service: 'auth' }\`
- [ ] Multi-stage Dockerfile (build stage runs tsc, production stage copies only dist + node_modules)
- [ ] Add the service to \`docker-compose.yml\`, expose port 3001
- [ ] Verify \`docker compose up auth\` boots the service and \`curl localhost:3001/health\` works

---

## Hints
- Multi-stage Dockerfile keeps the production image small
- \`/health\` is required for Docker, ALB, and Kubernetes health checks — every service needs one
- Don't connect to DB yet — just get the server running

## Expected Outcome
Express app running on port 3001 with health check responding. Multi-stage Dockerfile in place. Service added to docker-compose."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[6] Auth service: database schema with Drizzle ORM" \
  --label "service:auth,database,mvp" \
  --body "## 📦 Service: Auth Service — Database

**Overview**
Define the auth service's schema. Auth owns ONLY credentials — not profile, not org, not role. Those live in the user-org service.

---

## Tasks
- [ ] Define schema in \`src/db/schema.ts\`:
\`\`\`typescript
import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
\`\`\`
- [ ] Drizzle config (\`drizzle.config.ts\`) pointing to \`auth_db\`
- [ ] Generate migration: \`npx drizzle-kit generate\`
- [ ] Apply migration to the local Postgres
- [ ] \`src/db/index.ts\` exports the db instance

---

## Hints
- Auth has NO knowledge of orgs, roles, names — strict separation of concerns
- bcrypt with 12 rounds minimum
- Refresh tokens in DB enable server-side revocation (logout-everywhere)
- The user's profile (name, etc.) is created later in the user-org service after registration

## Expected Outcome
\`users\` and \`refresh_tokens\` tables exist in \`auth_db\`. Migrations checked into the repo."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[7] Auth service: register, login, verify, refresh, logout endpoints" \
  --label "service:auth,security,feature,mvp" \
  --body "## 📦 Service: Auth Service — Core Endpoints

**Overview**
Implement the core auth flows. Every other service depends on \`/auth/verify\` — get this right.

**Important**: registration here only creates auth credentials. The user's profile (first name, last name) is created via a separate call to the user-org service *after* the user logs in. This keeps the two services strictly decoupled.

---

## Tasks
- [ ] \`POST /auth/register\` — validate email/password with Zod, hash password (bcrypt 12 rounds), insert user, return 201 with \`{ userId, email }\`. Do NOT issue a token here — user must explicitly login
- [ ] \`POST /auth/login\` — verify credentials, issue access token (JWT, 15min, \`sub: userId\`, includes email) and refresh token (random 64-char hex string, 7 days, stored in DB)
- [ ] \`POST /auth/refresh\` — verify refresh token exists/not revoked/not expired, issue new access token, rotate refresh token (insert new, mark old revoked)
- [ ] \`POST /auth/logout\` — set \`revoked=true\` on the refresh token from the request body
- [ ] \`GET /auth/verify\` — verify Bearer token, return \`{ valid: true, userId, email }\` or 401. **Called by API gateway on every authenticated request.**

---

## Hints
- Access tokens (JWT) are stateless — verify with secret only, no DB call
- Refresh tokens are stateful — DB lookup needed (allows revocation)
- \`/verify\` is the highest-traffic endpoint in your system — keep it fast (no joins, no extra queries)
- JWT secret from \`.env\` for now; AWS Secrets Manager in production
- The frontend flow after register: POST /auth/register → POST /auth/login → POST /users/profile (next phase) → either create org or accept invite

## Expected Outcome
All 5 endpoints tested via Postman. Tokens correctly issued, verified, refreshed, revoked. Registration creates ONLY the auth record."

# =============================================================================
# PHASE 4 — USER/ORG SERVICE
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[8] User/Org service: scaffold app and database schema" \
  --label "service:user-org,setup,database,mvp" \
  --body "## 📦 Service: User/Org Service (/services/user-org)

**Overview**
Manages organisations, members, and roles. The source of truth for RBAC — when the expense service needs to know if a user can approve, it asks here. Also resolves user emails for the notification service.

---

## Tasks
- [ ] Scaffold Express app on port 3002 (same structure as auth)
- [ ] Add service to \`docker-compose.yml\`
- [ ] Define schema:
\`\`\`typescript
export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  orgId: uuid('org_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueMembership: uniqueIndex('unique_user_org').on(table.userId, table.orgId),
}));

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
\`\`\`
- [ ] Index on \`memberships.orgId\` and \`memberships.userId\` for fast role lookups
- [ ] Generate and apply migration

---

## Hints
- \`authUserId\` is the bridge to the auth service — same UUID as JWT \`sub\`
- The unique index on \`(userId, orgId)\` prevents a user from having two memberships in the same org
- Email is stored here too (denormalized from auth) so the notification service can resolve emails without crossing to the auth service

## Expected Outcome
4 tables created in \`user_org_db\` with proper indexes and foreign keys."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[9] User/Org service: profile and organisation endpoints (incl. internal lookups)" \
  --label "service:user-org,feature,mvp" \
  --body "## 📦 Service: User/Org Service — Profile & Org Endpoints

**Overview**
Implement the endpoints to create profiles and organisations, plus the internal endpoints that other services depend on.

The full flow: after a user registers and logs in, the client calls \`POST /users/profile\` to create their profile. They then either create an org (becoming OWNER) or accept an invite to join one.

---

## Tasks
- [ ] \`POST /users/profile\` — create profile for an authenticated user. Body: \`{ firstName, lastName }\`. Reads \`authUserId\` and \`email\` from \`x-user-id\` / \`x-user-email\` headers (injected by gateway). Idempotent: if profile exists, return existing
- [ ] \`GET /users/me\` — return profile + all org memberships of the authenticated user
- [ ] \`POST /organisations\` — create org. Body: \`{ name, slug }\`. The creator (from \`x-user-id\`) is automatically added as OWNER in a single transaction
- [ ] \`GET /organisations/:orgId\` — return org details (only members can access)
- [ ] \`GET /organisations/:orgId/members\` — list members with roles and profile info (members only)
- [ ] **Internal endpoints** (not exposed via gateway):
  - \`GET /internal/users/:authUserId/role?orgId=\` — returns user's role in org. Used by expense service to authorize approve/reject. Returns 404 if no membership exists
  - \`GET /internal/users/:authUserId\` — returns \`{ authUserId, email, firstName, lastName }\`. Used by notification service to resolve recipient email

---

## Hints
- The \`x-user-id\` header comes from the gateway after JWT verification — services trust it
- Internal endpoints are only accessible within the Docker network and never proxied by the gateway
- Check membership before returning org data — non-members get 403
- Use a DB transaction when creating org + first OWNER membership so partial state can't exist

## Expected Outcome
Users can create profiles, create orgs, list their orgs. Internal endpoints return role and email for service-to-service calls."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[10] User/Org service: invitation flow (create invite, accept invite)" \
  --label "service:user-org,feature,mvp" \
  --body "## 📦 Service: User/Org Service — Invitations

**Overview**
The MVP invitation flow: OWNER/MANAGER invites someone by email → invite token sent via notification service → invitee clicks link → registers (if new) → accepts → joins org with the assigned role.

---

## Tasks
- [ ] \`POST /organisations/:orgId/invitations\` — OWNER/MANAGER invites someone. Body: \`{ email, role }\`. Generates a UUID token, stores invitation with 7-day expiry. **Writes the USER_INVITED event to a local outbox** (or publishes directly to RabbitMQ — see hints)
- [ ] \`GET /invitations/:token\` — fetch invitation details (used by frontend to show 'You've been invited to {orgName} as {role}'). Public endpoint — no auth required
- [ ] \`POST /invitations/:token/accept\` — accept invitation. Requires authenticated user. Verifies the invited email matches the user's email, creates membership in a transaction, marks invitation \`acceptedAt\`
- [ ] Reject invitation if expired (\`expiresAt < NOW\`) or already accepted (\`acceptedAt IS NOT NULL\`)
- [ ] Authorization rules:
  - Only OWNER can invite another OWNER
  - OWNER or MANAGER can invite MANAGER or EMPLOYEE
  - EMPLOYEE cannot invite anyone

---

## Hints
- Don't send the email here — publish a \`USER_INVITED\` event and let the notification service handle it
- For MVP, you can publish directly to RabbitMQ here (no outbox table needed in user-org service since invite creation is a single, isolated write). The full outbox pattern is implemented in the expense service since that's where consistency matters most
- The invitee might not have an account yet — frontend should detect this from \`GET /invitations/:token\` and redirect to register, then back to accept
- Token in URL: \`https://yourapp.com/invitations/{token}\` — keep token long and random (UUID works)

## Expected Outcome
An OWNER can invite someone, a USER_INVITED event lands in RabbitMQ, the invitee can accept and become a member."

# =============================================================================
# PHASE 5 — API GATEWAY
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[11] API Gateway: reverse proxy with JWT verification" \
  --label "service:gateway,security,setup,mvp" \
  --body "## 📦 Service: API Gateway (/services/gateway)

**Overview**
The single entry point. Verifies JWT once at the edge, injects \`x-user-id\` header, forwards to the right service. Clients NEVER call services directly.

---

## Tasks
- [ ] Scaffold Express app on port 3000
- [ ] Install \`http-proxy-middleware\`
- [ ] Add to \`docker-compose.yml\`
- [ ] Routing rules:
\`\`\`
/api/auth/*          → http://auth:3001
/api/users/*         → http://user-org:3002
/api/organisations/* → http://user-org:3002
/api/invitations/*   → http://user-org:3002
/api/expenses/*      → http://expense:3003
/api/files/*         → http://file:3005
\`\`\`
- [ ] JWT verification middleware:
  - Extract Bearer token from \`Authorization\` header
  - Call \`GET /auth/verify\` on auth service
  - On success: strip any client-supplied \`x-user-*\` headers, inject \`x-user-id\` and \`x-user-email\` from the verify response, then forward
  - On failure: return 401 immediately
- [ ] Public routes (no JWT required): \`POST /api/auth/register\`, \`POST /api/auth/login\`, \`POST /api/auth/refresh\`, \`GET /api/invitations/:token\`
- [ ] **Block all \`/internal/*\` paths at the gateway** — return 404 (these are service-to-service only)
- [ ] Rate limit: 100 req/min per IP (\`express-rate-limit\`)
- [ ] Request logging middleware (method, path, status, duration)
- [ ] \`GET /health\`

---

## Hints
- Downstream services trust headers from the gateway — they don't re-verify the JWT
- **Stripping client-supplied \`x-user-*\` headers is critical** — otherwise an attacker could spoof another user's identity by setting the header manually
- Calling \`/auth/verify\` on every request adds latency — Redis caching with TTL matching JWT expiry is the optimisation (skip for MVP, note it as future work)
- Internal endpoints (\`/internal/*\`) should never be reachable from outside

## Expected Outcome
Gateway on port 3000. Unauthenticated requests to protected routes return 401. Authenticated requests are forwarded with \`x-user-id\` injected. \`/internal/*\` returns 404 from the gateway."

# =============================================================================
# PHASE 6 — EXPENSE SERVICE (CORE FEATURE)
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[12] Expense service: scaffold app and database schema" \
  --label "service:expense,setup,database,mvp" \
  --body "## 📦 Service: Expense Service (/services/expense)

**Overview**
The core domain service. Owns expense data and the approval state machine.

---

## Tasks
- [ ] Scaffold Express app on port 3003
- [ ] Add to \`docker-compose.yml\`
- [ ] Schema:
\`\`\`typescript
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  submittedBy: uuid('submitted_by').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).default('DRAFT').notNull(),
  receiptS3Key: text('receipt_s3_key'),
  submittedAt: timestamp('submitted_at'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const outbox = pgTable('outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  publishedAt: timestamp('published_at'),
  attemptCount: integer('attempt_count').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
\`\`\`
- [ ] Index on \`expenses(orgId, status, createdAt DESC)\` for fast list queries
- [ ] Index on \`expenses(submittedBy, createdAt DESC)\` for employee's own list
- [ ] Index on \`outbox(publishedAt)\` partial \`WHERE published_at IS NULL\` for fast unpublished lookups
- [ ] Generate and apply migration

---

## Hints
- \`receiptS3Key\` is just the S3 object key — not a URL. The file service generates presigned URLs on demand
- The \`outbox\` table is for the outbox pattern (next phase) — define it now so you don't have to migrate again
- \`attemptCount\` and \`lastAttemptAt\` on outbox let you build retry/backoff logic and detect stuck messages

## Expected Outcome
\`expenses\` and \`outbox\` tables exist in \`expense_db\` with proper indexes."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[13] Expense service: CRUD endpoints and state machine" \
  --label "service:expense,feature,mvp" \
  --body "## 📦 Service: Expense Service — CRUD + State Machine

**Overview**
Implement the core expense lifecycle. The state machine enforces valid transitions — random status updates aren't allowed.

---

## Tasks
- [ ] Implement state machine helper:
\`\`\`typescript
const VALID_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  DRAFT: [ExpenseStatus.PENDING],
  PENDING: [ExpenseStatus.APPROVED, ExpenseStatus.REJECTED],
  REJECTED: [ExpenseStatus.DRAFT],
  APPROVED: [],
};

export function canTransition(from: ExpenseStatus, to: ExpenseStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
\`\`\`
- [ ] Create a \`requireOrgRole\` helper that calls the user-org service's internal role endpoint and verifies the caller has one of the required roles
- [ ] Endpoints:
  - \`POST /expenses\` — body: \`{ orgId, title, description, amount, currency, receiptS3Key? }\`. Status starts as DRAFT. Verify user is a member of the org (call user-org internal endpoint)
  - \`PATCH /expenses/:id\` — update expense. Only allowed if status is DRAFT or REJECTED, only by submitter
  - \`POST /expenses/:id/submit\` — DRAFT → PENDING. Sets \`submittedAt\`. Only the submitter can submit
  - \`POST /expenses/:id/approve\` — PENDING → APPROVED. Requires MANAGER or OWNER role in the org. Sets \`reviewedBy\` and \`reviewedAt\`
  - \`POST /expenses/:id/reject\` — PENDING → REJECTED. Requires MANAGER or OWNER. Body: \`{ reason }\` (required, non-empty)
  - \`POST /expenses/:id/resubmit\` — REJECTED → DRAFT (so submitter can edit and re-submit). Only the original submitter
  - \`GET /expenses\` — list expenses for the user's org. Filters: \`status\`, \`submittedBy\`, cursor pagination. EMPLOYEEs see only their own; MANAGERs/OWNERs see all in org
  - \`GET /expenses/:id\` — single expense. Must be in same org. EMPLOYEEs can only see their own

---

## Hints
- Always check org membership before any operation — never trust client-supplied \`orgId\` without verifying the caller belongs to it
- Role check for approve/reject: call user-org service's internal endpoint \`GET /internal/users/:userId/role?orgId=\`
- Listing logic differs by role: EMPLOYEEs filtered to their own, MANAGERs/OWNERs see everything in the org
- Self-approval prevention: an employee who happens to be a MANAGER cannot approve their own expenses — add this check

## Expected Outcome
Full expense CRUD working. State machine prevents invalid transitions. Role-based access enforced on approve/reject. Self-approval blocked."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[14] Expense service: outbox pattern for reliable event publishing" \
  --label "service:expense,messaging,mvp" \
  --body "## 📦 Service: Expense Service — Outbox Pattern

**Overview**
When an expense is approved/rejected, two things must happen atomically: the DB row is updated AND an event is queued for publishing. If you do these as separate operations, a crash between them leaves you with inconsistent state. The outbox pattern solves this.

---

## Tasks
- [ ] In the approve/reject handlers, write status update + outbox row in a single transaction:
\`\`\`typescript
await db.transaction(async (tx) => {
  await tx.update(expenses)
    .set({ status: 'APPROVED', reviewedBy, reviewedAt: new Date() })
    .where(eq(expenses.id, id));

  await tx.insert(outbox).values({
    eventType: 'EXPENSE_APPROVED',
    payload: {
      eventId: crypto.randomUUID(),
      type: 'EXPENSE_APPROVED',
      expenseId: id,
      submittedBy,
      orgId,
      amount,
      currency,
      occurredAt: new Date().toISOString(),
    },
  });
});
\`\`\`
- [ ] Create a background worker (\`src/workers/outbox-publisher.ts\`):
  - Runs every 2 seconds
  - Uses \`SELECT ... FOR UPDATE SKIP LOCKED\` to claim rows so multiple worker replicas don't double-publish
  - Selects up to 10 rows where \`publishedAt IS NULL\`
  - Declares the \`expense.events\` topic exchange before publishing (idempotent)
  - Publishes each event with routing key \`expense.approved\` or \`expense.rejected\`
  - On success: sets \`publishedAt = NOW()\`
  - On failure: increments \`attemptCount\`, sets \`lastAttemptAt\`. Skip rows with \`attemptCount > 10\` (manual intervention needed)
- [ ] Run the worker as a separate process inside the same container (use a process manager like \`concurrently\` or run two entrypoints)

---

## Hints
- \`SELECT ... FOR UPDATE SKIP LOCKED\` is the key to safe concurrent processing — you used this pattern in your Task Scheduler project
- Without the outbox: server updates DB → crashes before publishing → notification never sends → forever inconsistent
- With the outbox: both writes are in one transaction. On reboot, worker finds unpublished rows and publishes them
- The publisher must declare the exchange before publishing — RabbitMQ won't auto-create exchanges
- This is one of the highest-leverage patterns in real-world microservices

## Expected Outcome
Approving an expense atomically writes status + outbox row. The publisher worker drains the outbox and publishes to the \`expense.events\` exchange. You can see messages flow in RabbitMQ management UI."

# =============================================================================
# PHASE 7 — FILE SERVICE + S3
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[15] ☁️ AWS: S3 bucket setup for receipt uploads (production)" \
  --label "aws,service:file,mvp" \
  --body "## ☁️ AWS — S3 Setup

**Overview**
Create the S3 bucket for production. Locally you've been using MinIO; this is the production target. Doing this now lets you test the SDK code against both during file service development.

---

## Tasks
- [ ] Create S3 bucket \`expense-app-receipts-{yourname}\` in \`eu-central-1\`
- [ ] Block ALL public access (receipts only accessible via presigned URLs)
- [ ] Enable versioning
- [ ] Configure CORS (origins will be your frontend URL when you have one; \`http://localhost:3000\` for the dev API gateway is fine for now):
\`\`\`json
[
  {
    \"AllowedHeaders\": [\"*\"],
    \"AllowedMethods\": [\"PUT\", \"GET\"],
    \"AllowedOrigins\": [\"http://localhost:3000\"],
    \"ExposeHeaders\": [\"ETag\"]
  }
]
\`\`\`
- [ ] Lifecycle rule: transition objects to S3 Glacier Instant Retrieval after 365 days
- [ ] Test upload via AWS CLI:
\`\`\`bash
echo 'test' > test.txt
aws s3 cp test.txt s3://expense-app-receipts-{yourname}/test.txt
aws s3 ls s3://expense-app-receipts-{yourname}/
\`\`\`

---

## Hints
- Bucket names are globally unique across all AWS accounts — add your name/random suffix
- CORS \`AllowedOrigins\` is for browser-direct uploads with presigned URLs — when you add a frontend, add its URL here
- Never make the bucket public — all access through presigned URLs only

## Expected Outcome
Private S3 bucket created with CORS configured. Test upload works via CLI."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[16] File service: presigned URL upload flow (MinIO local, S3 production)" \
  --label "service:file,aws,feature,mvp" \
  --body "## 📦 Service: File Service (/services/file)

**Overview**
The file service issues presigned URLs so clients can upload directly to S3/MinIO without the bytes passing through your server. Massive scalability win.

---

## Tasks
- [ ] Scaffold Express app on port 3005, add to \`docker-compose.yml\`
- [ ] Configure S3 client with endpoint override (so the same code works against MinIO locally and S3 in production):
\`\`\`typescript
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,             // http://minio:9000 locally, undefined in prod
  forcePathStyle: !!process.env.S3_ENDPOINT,     // required for MinIO, off for real S3
  credentials: process.env.S3_ENDPOINT
    ? { accessKeyId: process.env.MINIO_ROOT_USER!, secretAccessKey: process.env.MINIO_ROOT_PASSWORD! }
    : undefined,  // in prod, SDK picks up IAM role automatically
});
\`\`\`
- [ ] Schema for tracking uploaded files:
\`\`\`typescript
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  s3Key: text('s3_key').notNull().unique(),
  uploadedBy: uuid('uploaded_by').notNull(),
  orgId: uuid('org_id').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').defaultNow(),
});
\`\`\`
- [ ] \`POST /files/upload-url\` — body: \`{ filename, mimeType, orgId }\`. Verify org membership via user-org internal endpoint. Generate S3 key as \`receipts/{orgId}/{uuid}-{sanitisedFilename}\`. Generate presigned PUT URL (5 min expiry). Store row in \`files\` table. Return \`{ uploadUrl, s3Key }\`
- [ ] \`POST /files/download-url\` — body: \`{ s3Key }\`. Verify the file's \`orgId\` matches a user's membership. Generate presigned GET URL (5 min expiry). Return \`{ downloadUrl }\`
- [ ] Validate mime type whitelist: \`image/jpeg\`, \`image/png\`, \`application/pdf\` — reject anything else with 400
- [ ] Sanitise filename: strip path separators and special chars before building the key

---

## Hints
- Upload flow: client → file service (get URL) → S3 directly via PUT (bytes never touch your server) → client returns the \`s3Key\` to expense service which saves it on the expense
- Use POST with s3Key in the body for download (not in the URL path) because S3 keys contain slashes which break URL routing
- Presigned URLs are time-bound — 5 min is enough for upload, plenty for download
- \`forcePathStyle\` is required for MinIO; turn it off for real S3
- In prod the SDK picks up the IAM role automatically — no credentials needed

## Expected Outcome
Client can request an upload URL, upload directly to MinIO/S3, then save the \`s3Key\` to an expense. Download URLs work for viewing receipts. Works identically against MinIO and real S3."

# =============================================================================
# PHASE 8 — NOTIFICATION SERVICE
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[17] Notification service: consume events and send emails" \
  --label "service:notification,messaging,feature,mvp" \
  --body "## 📦 Service: Notification Service (/services/notification)

**Overview**
Pure consumer — listens to RabbitMQ events and sends emails. No HTTP API (just a worker process). Same pattern as your BullMQ notification system but with RabbitMQ as the transport.

---

## Tasks
- [ ] Scaffold service in \`/services/notification\`. No Express needed — \`src/index.ts\` boots the consumer directly
- [ ] Install \`amqplib\` and \`resend\` (or \`nodemailer\` if you prefer)
- [ ] Schema for idempotency tracking:
\`\`\`typescript
export const processedEvents = pgTable('processed_events', {
  eventId: uuid('event_id').primaryKey(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  processedAt: timestamp('processed_at').defaultNow(),
});
\`\`\`
- [ ] Consumer setup:
\`\`\`typescript
const conn = await amqplib.connect(process.env.RABBITMQ_URL!);
const channel = await conn.createChannel();
await channel.assertExchange('expense.events', 'topic', { durable: true });
await channel.assertQueue('notification-jobs', { durable: true });
await channel.bindQueue('notification-jobs', 'expense.events', '#');
channel.prefetch(5);

channel.consume('notification-jobs', async (msg) => {
  if (!msg) return;
  try {
    const event = JSON.parse(msg.content.toString());

    const alreadyProcessed = await checkProcessed(event.eventId);
    if (alreadyProcessed) {
      channel.ack(msg);
      return;
    }

    await handleEvent(event);
    await markProcessed(event.eventId, event.type);
    channel.ack(msg);
  } catch (err) {
    console.error('Event processing failed', err);
    channel.nack(msg, false, false);
  }
});
\`\`\`
- [ ] Handlers:
  - \`EXPENSE_APPROVED\` → call user-org internal endpoint to get submitter's email, send 'Your expense was approved' email
  - \`EXPENSE_REJECTED\` → resolve email, send 'Your expense was rejected' email with the reason
  - \`USER_INVITED\` → email already in payload, send invite email with the token link
- [ ] Email templates as simple HTML strings in \`src/templates/\` (no template engine for MVP)
- [ ] Resilience: on user-org service failure, throw and let the message be nacked → retry next time

---

## Hints
- Resend has a generous free tier and a great TypeScript SDK — recommended over Nodemailer for MVP
- \`channel.prefetch(5)\` limits how many unacked messages a consumer holds at once — prevents one slow consumer from hoarding the queue
- Idempotency: RabbitMQ guarantees at-least-once delivery, so the same message can arrive twice. The \`processedEvents\` check prevents double emails
- \`channel.nack(msg, false, false)\` sends the message to the DLQ (assuming you configure one); during MVP, this just drops it — fine for now
- For approved/rejected events you don't have the email in the payload — that's intentional (expense service stays decoupled). Look it up from user-org's internal endpoint

## Expected Outcome
Approve an expense → submitter receives an email within seconds. Invite a user → they receive an invite email. Duplicate events don't send duplicate emails."

# =============================================================================
# PHASE 9 — OBSERVABILITY
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[18] Observability: distributed tracing with OpenTelemetry and Jaeger" \
  --label "observability,infrastructure,mvp" \
  --body "## 📦 Cross-cutting: Tracing

**Overview**
With 5 services in play, debugging a failed approval means hunting through 5 separate logs. OpenTelemetry adds a trace ID that propagates across services so you can see the full request journey in Jaeger.

---

## Tasks
- [ ] Add Jaeger to \`docker-compose.yml\`:
\`\`\`yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - '16686:16686'
    - '4318:4318'
  environment:
    - COLLECTOR_OTLP_ENABLED=true
\`\`\`
- [ ] In every service, install:
\`\`\`bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
\`\`\`
- [ ] Create \`src/tracing.ts\` in each service (must be imported FIRST in \`index.ts\`, before anything else):
\`\`\`typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  serviceName: process.env.SERVICE_NAME,
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
\`\`\`
- [ ] Set \`SERVICE_NAME\` and \`OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces\` per service in docker-compose
- [ ] Test: approve an expense via the gateway, open Jaeger at \`localhost:16686\`, search for traces in the gateway service, click into one and see spans across gateway → auth verify → expense → user-org → outbox

---

## Hints
- Tracing import MUST be first — it monkey-patches Node's modules and won't catch imports that loaded before it
- \`auto-instrumentations\` automatically traces Express routes, HTTP calls, Postgres queries — no manual work needed
- Trace ID propagates via HTTP headers automatically — calls between services keep the same trace
- This is the moment microservices debugging clicks — you'll feel it the first time you trace a slow request

## Expected Outcome
Every request generates a trace in Jaeger. An expense approval shows spans across gateway → auth verify → expense service → user-org role check → outbox publish."

# =============================================================================
# PHASE 10 — AWS DEPLOYMENT
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[19] ☁️ AWS: RDS PostgreSQL instance for production" \
  --label "aws,database,mvp" \
  --body "## ☁️ AWS — RDS Setup

**Overview**
Provision the managed Postgres for production. To stay in free tier, use ONE instance with multiple databases — one per service.

---

## Tasks
- [ ] Launch RDS instance:
  - Engine: PostgreSQL 15
  - Template: Free tier
  - Class: \`db.t3.micro\`
  - Storage: 20GB gp2
  - DB name: \`expenseapp\`
  - Master user: \`appuser\`
  - Region: \`eu-central-1\`
- [ ] Security group: allow inbound 5432 ONLY from the EC2 security group (created in issue [22], or temporarily lock it to your IP for setup, then tighten later)
- [ ] After launch, connect via psql and create per-service databases:
\`\`\`sql
CREATE DATABASE auth_db;
CREATE DATABASE user_org_db;
CREATE DATABASE expense_db;
CREATE DATABASE notification_db;
CREATE DATABASE file_db;
\`\`\`
- [ ] Store connection details in AWS Secrets Manager as \`expense-app/db-credentials\` (JSON with host, port, user, password)
- [ ] Run all service migrations against RDS (you can do this from your laptop while the SG temporarily allows your IP)

---

## Hints
- Local dev still uses Docker Postgres; RDS is only for the deployed environment
- RDS security group must lock 5432 to EC2 only — never public — once EC2 exists
- Free tier: 750 hours/month of t3.micro — one running instance fits

## Expected Outcome
RDS running with 5 databases and migrations applied. Credentials in Secrets Manager. Security group ready to lock down to EC2."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[20] ☁️ AWS: SQS queues to replace RabbitMQ in production" \
  --label "aws,messaging,mvp" \
  --body "## ☁️ AWS — SQS Setup

**Overview**
In production, RabbitMQ becomes SQS — fully managed, no server to maintain. Add an SQS code path to the publisher and consumer that gets selected via a \`QUEUE_DRIVER\` env var.

---

## Tasks
- [ ] Create Standard SQS queues in \`eu-central-1\`:
  - \`expense-events\`
  - \`notification-jobs\`
  - \`expense-events-dlq\`
  - \`notification-jobs-dlq\`
- [ ] Configure each main queue: redrive policy to its DLQ after 3 receive attempts
- [ ] Visibility timeout: 30 seconds
- [ ] Note all queue URLs and store in Secrets Manager
- [ ] Add SQS-driver implementations:
  - **Expense service outbox publisher**: when \`QUEUE_DRIVER=sqs\`, call \`SendMessage\` on the \`expense-events\` queue instead of publishing to RabbitMQ
  - **Notification service consumer**: when \`QUEUE_DRIVER=sqs\`, long-poll \`notification-jobs\` queue (\`ReceiveMessage\` with \`WaitTimeSeconds=20\`), process, \`DeleteMessage\` on success
- [ ] **Important**: SQS doesn't have an exchange/routing-key concept like RabbitMQ. For MVP, send both expense events and invitation events to a single \`notification-jobs\` queue and let the consumer switch on \`event.type\`. The \`expense-events\` queue can be used later if you split consumers
- [ ] Add a small abstraction layer so handlers don't need to know which driver is active

---

## Hints
- Standard queues (at-least-once) — no need for FIFO
- DLQs catch bad messages so they don't loop forever
- SQS long-polling (up to 20s) is much more efficient than constant polling
- Test locally by setting \`QUEUE_DRIVER=sqs\` and your local services should now talk to AWS instead of RabbitMQ

## Expected Outcome
4 SQS queues with DLQ routing. Services switch between RabbitMQ and SQS via env var. End-to-end approval → notification flow works with \`QUEUE_DRIVER=sqs\`."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[21] ☁️ AWS: ECR repositories and image push" \
  --label "aws,infrastructure,mvp" \
  --body "## ☁️ AWS — Container Registry

**Overview**
ECR is your private Docker registry. Build locally (or in CI), push here, EC2 pulls from it.

---

## Tasks
- [ ] Create ECR repos:
\`\`\`bash
for svc in auth user-org expense notification file gateway; do
  aws ecr create-repository --repository-name expense-app/\$svc --region eu-central-1
done
\`\`\`
- [ ] Authenticate Docker with ECR:
\`\`\`bash
aws ecr get-login-password --region eu-central-1 | \\
  docker login --username AWS --password-stdin {ACCOUNT}.dkr.ecr.eu-central-1.amazonaws.com
\`\`\`
- [ ] Build and push each service:
\`\`\`bash
for svc in auth user-org expense notification file gateway; do
  docker build -t expense-app/\$svc ./services/\$svc
  docker tag expense-app/\$svc:latest {ACCOUNT}.dkr.ecr.eu-central-1.amazonaws.com/expense-app/\$svc:latest
  docker push {ACCOUNT}.dkr.ecr.eu-central-1.amazonaws.com/expense-app/\$svc:latest
done
\`\`\`
- [ ] ECR lifecycle policy on each repo: keep last 5 images, expire older

---

## Hints
- Automated push comes next with GitHub Actions — this is the manual baseline so you can verify the deployment works before automating
- Also tag with the short commit SHA for traceability: \`docker tag ... :\$(git rev-parse --short HEAD)\`
- EC2's IAM role grants pull access — no keys needed on EC2

## Expected Outcome
All 6 images visible in ECR with the \`latest\` tag."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[22] ☁️ AWS: EC2 instance and production deployment" \
  --label "aws,infrastructure,mvp" \
  --body "## ☁️ AWS — EC2 Deployment

**Overview**
Launch EC2, install Docker, run all services via Docker Compose pulling images from ECR. After this, lock the RDS security group down to only allow this EC2 instance.

---

## Tasks
- [ ] Launch EC2 instance:
  - AMI: Amazon Linux 2023
  - Type: \`t3.micro\` (free tier)
  - Key pair: \`expense-app.pem\` (download and store securely)
  - Security group \`expense-app-ec2-sg\`: inbound 22 (your IP only), 80, 443 from anywhere
  - IAM instance profile: \`ExpenseAppEC2Role\`
- [ ] Allocate Elastic IP, associate with the instance
- [ ] **Update the RDS security group**: now that EC2 exists, lock RDS inbound 5432 to \`expense-app-ec2-sg\` only (remove your-IP rule)
- [ ] SSH in, install Docker + Compose plugin:
\`\`\`bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable docker --now
sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \\
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
# log out and back in for docker group to take effect
\`\`\`
- [ ] Create \`docker-compose.prod.yml\` on the instance:
  - Pulls images from ECR (no local builds)
  - No \`postgres\`, \`minio\`, \`rabbitmq\` containers (services use RDS, S3, SQS)
  - Each service container fetches its env from Secrets Manager at startup (use \`aws secretsmanager get-secret-value\` in an entrypoint script, or fetch in app code on boot)
  - Sets \`QUEUE_DRIVER=sqs\`, \`AWS_REGION=eu-central-1\`, plus per-service \`SERVICE_NAME\` for tracing
- [ ] Authenticate Docker with ECR (instance profile makes this work without keys):
\`\`\`bash
aws ecr get-login-password --region eu-central-1 | \\
  docker login --username AWS --password-stdin {ACCOUNT}.dkr.ecr.eu-central-1.amazonaws.com
\`\`\`
- [ ] \`docker compose -f docker-compose.prod.yml up -d\`
- [ ] Verify: \`curl http://{elastic-ip}/health\` (gateway) returns OK
- [ ] Run an end-to-end smoke test: register → login → create org → invite → submit expense → approve → verify email received

---

## Hints
- Instance profile = no AWS keys on the instance, ever
- NEVER scp a \`.env\` to EC2 — Secrets Manager only
- Elastic IP keeps the public IP stable across reboots
- For MVP, all services on one t3.micro is fine. The architecture supports splitting later

## Expected Outcome
All services running on EC2, connected to RDS, using S3 and SQS. End-to-end flow works against the public Elastic IP. RDS locked down to EC2 SG only."

# -----------------------------------------------------------------------------

gh issue create \
  --repo $REPO \
  --title "[23] CI/CD: GitHub Actions for automated build and deploy" \
  --label "aws,infrastructure,mvp" \
  --body "## ☁️ CI/CD — Automated Deployment

**Overview**
Every push to \`main\` builds changed services, pushes to ECR, and triggers redeployment on EC2.

---

## Tasks
- [ ] Add GitHub Actions secrets:
  - \`AWS_ACCESS_KEY_ID\`, \`AWS_SECRET_ACCESS_KEY\`, \`AWS_REGION\` (use a dedicated CI IAM user with ECR push + SSM/SSH permissions, not your dev user)
  - \`ECR_REGISTRY\` (e.g. \`{ACCOUNT}.dkr.ecr.eu-central-1.amazonaws.com\`)
  - \`EC2_HOST\` (Elastic IP)
  - \`EC2_SSH_KEY\` (pem file contents)
- [ ] \`.github/workflows/deploy.yml\` steps:
  1. Checkout
  2. \`dorny/paths-filter\` — detect which service folders changed
  3. Configure AWS credentials
  4. ECR login
  5. For each changed service: build + tag with \`latest\` and commit SHA + push to ECR
  6. SSH into EC2 → \`docker login\` to ECR → \`docker compose pull\` → \`docker compose up -d\`
- [ ] Add a separate \`test.yml\` workflow that runs on PRs: typecheck (\`tsc --noEmit\`) and lint per service (Jest tests slot in here when you write them)
- [ ] Set up branch protection on \`main\`: require the test workflow to pass before merge

---

## Hints
- This pipeline mirrors what real teams use (just without ECS/K8s)
- Per-service change detection saves CI minutes — don't rebuild auth when only expense changed
- A dedicated CI IAM user with narrower permissions than your dev user is good practice — the CI user only needs ECR push, not S3 or SQS
- Roll forward, not back: if a deploy breaks, push a fix rather than reverting on EC2 manually

## Expected Outcome
Push to main → only changed services rebuilt → pushed to ECR → redeployed on EC2 automatically. PRs run typecheck before merge."

# =============================================================================
# PHASE 11 — DOCUMENTATION
# =============================================================================

gh issue create \
  --repo $REPO \
  --title "[24] Documentation: README, architecture diagram, API collection" \
  --label "setup,infrastructure,mvp" \
  --body "## 📦 Project-wide: Documentation

**Overview**
A project that isn't documented is invisible to recruiters. Make the README the best advertisement of what you built.

---

## Tasks
- [ ] Root \`README.md\` with:
  - Use case / problem statement (the multi-tenant expense management scenario)
  - Architecture diagram (Mermaid — renders natively on GitHub)
  - Service responsibility table (one row per service)
  - Tech stack list
  - Local setup (prereqs, \`docker compose up\`, env vars, where to find them)
  - AWS infrastructure diagram
  - Screenshots/GIFs of the flow (optional but high-impact)
  - Key design decisions (linked to ARCHITECTURE.md)
- [ ] \`ARCHITECTURE.md\` with deeper notes:
  - Why auth and user-org are separate services
  - The outbox pattern and why it matters here
  - RabbitMQ → SQS swap via env var
  - RBAC flow across services (sequence diagram of an approval)
  - Trade-offs: what was skipped for MVP and why (no audit log, no budgets, no policy rules)
- [ ] Postman/Insomnia collection committed at the root (\`api-collection.json\`)
- [ ] Brief \`CONTRIBUTING.md\` (how to add a new service, where shared types live)

---

## Hints
- Mermaid in a \`\`\`mermaid\`\`\` block renders right on GitHub
- The architecture section is what a senior engineer reads to evaluate your repo — make it honest and clear
- Document the AWS setup briefly — shows infrastructure literacy
- A 'Future work' section in the README is a good place to mention budgets, audit logs, circuit breaker, etc. without making it look like the MVP is incomplete

## Expected Outcome
Repo a stranger can clone, follow the README, and run locally in under 10 minutes. Clear architecture rationale documented. Strong enough to link in your resume."

echo ""
echo "✅ All 24 MVP issues created for $REPO"
echo ""
echo "Build order summary:"
echo "  Phase 1  (1-3)   Monorepo, local infra, shared types"
echo "  Phase 2  (4)     AWS IAM foundation"
echo "  Phase 3  (5-7)   Auth service"
echo "  Phase 4  (8-10)  User/Org service + invitations"
echo "  Phase 5  (11)    API Gateway"
echo "  Phase 6  (12-14) Expense service + outbox pattern"
echo "  Phase 7  (15-16) S3 bucket + File service"
echo "  Phase 8  (17)    Notification service"
echo "  Phase 9  (18)    Observability (Jaeger)"
echo "  Phase 10 (19-23) AWS deployment (RDS, SQS, ECR, EC2, CI/CD)"
echo "  Phase 11 (24)    Documentation"
