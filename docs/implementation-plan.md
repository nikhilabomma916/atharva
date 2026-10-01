# CivicResolve AI Implementation Plan

## Current Project State

The repository is an existing Next.js 16 App Router application with TypeScript, Tailwind, shadcn-style UI components, Zod, JWT sessions, bcrypt password hashing, and route handlers for citizen, officer, and admin workflows. Most application records currently live in process-local arrays in `lib/data/store.ts`; they are demo data, not durable database records. Public registration currently accepts a caller-supplied role and only collects name, email, phone, and password. No database client, migrations, or automated test runner is configured.

## Target Architecture

- **Web/API:** Keep the existing Next.js App Router and TypeScript application. Route handlers are the trusted boundary for parsing, validation, authorization, and mutations.
- **Persistence:** PostgreSQL is the source of truth. Schema changes are versioned as SQL migrations; unique, foreign-key, check, and not-null constraints complement API validation. No important user or workflow data is considered persisted until it is written to PostgreSQL.
- **Authentication and authorization:** Hash passwords, issue HTTP-only sessions, and derive user identity and role from server-verified records. Public registration always creates a citizen; privileged accounts are provisioned administratively.
- **Validation:** Reuse Zod schemas on the client and server where appropriate. Validate again in route handlers and enforce invariants in PostgreSQL.
- **AI/workflow:** AI produces validated recommendations only. Deterministic rules provide fallback classification, priority, routing, and SLA behavior. State transitions and audit events are controlled by server-side workflow services.
- **User interfaces:** Preserve the existing citizen/officer/admin experience while replacing demo reads and writes with authenticated API/database operations. Keep citizen data scoped to its owner and officer data scoped to authorized assignments/departments.

## Delivery Sequence

1. **Foundation and registration:** PostgreSQL connection/configuration, initial user and citizen-profile migration, strict citizen registration schema and form, database-backed registration/login, uniqueness constraints, and environment setup.
2. **Authentication and profiles:** Session hardening, server-side user lookup, role checks, citizen profile persistence/read/update, audit events, and auth/authorization tests.
3. **Grievance persistence:** Relational grievance/category/department/attachment model, validated submission and detail/list APIs, owner-scoped citizen access, and durable status history.
4. **AI analysis and priority:** Structured output validation, deterministic priority fallback, persisted analyses/decisions, and safe AI-unavailable behavior.
5. **Duplicates, incidents, and routing:** Similarity persistence/search, incident linking, controlled department routing, officer recommendations, and recorded overrides.
6. **Officer workflow and SLA:** Assignment, validated status transitions, server-calculated deadlines, SLA events, escalation, notes, and citizen-safe updates.
7. **Notifications and feedback:** Durable notification lifecycle, resolution feedback, and corresponding authorization and validation.
8. **Admin, analytics, audit, and knowledge:** Database-derived dashboard queries, administration APIs, audit coverage, knowledge records, and resolution assistance.
9. **Hardening and end-to-end verification:** Rate limits, upload/storage checks, pagination/filtering, accessibility/mobile checks, test coverage, seed/demo workflow, documentation, and deployment configuration.

## Acceptance Gates

Each delivery step must pass a focused type/lint or test check before the next step. Database-backed behavior must be verified against PostgreSQL when a configured database is available; otherwise migration and code checks must pass and the unavailable integration check must be reported. No phase is considered complete solely because its UI renders.

## First Delivery Scope

Implement step 1 only: establish the database foundation and make public citizen registration and login persist and retrieve users from PostgreSQL. Registration must not accept a role from the browser. Full application data migration, officer/admin provisioning, and later workflow phases remain follow-up work and must not be described as already complete.
