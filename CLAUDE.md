# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

A **static HTML documentation site** for an Enterprise ERP project (Microservices · DDD).
It is documentation only — there is no backend/build step here. The conventions below
govern **every code example written into these docs** and the future backend implementation.

**Files**
- `index.html` — document index / landing.
- `erp-architecture.html` — architecture & phased plan (Executive overview).
- `core-feature.html` — SRS (Phase 3–6), includes the UC deep-dives.
- `i18n-guide.html` — bilingual (TH/EN) technical guide.
- `backend-convention.html` — **backend naming / error / response / query conventions** (this reference, rendered).
- `style.css` — the design system. `components.js` — vanilla Web Components (`<erp-docnav>`, `<erp-sidebar>`, `<erp-footer>`).

**Design system (do not break when editing docs)**
- Tailwind via CDN + `style.css` + `components.js` (defer) + Mermaid (CDN). No bundler.
- Reuse existing classes — do **not** invent new ones: `.card`, `.step/.sn`, `.rulebox/.rc(.ok)`,
  `.edge/.tag`, `.evt(.evt-emit/.evt-listen/.evt-tcp)`, `table.d`, `.code` (+ syntax spans
  `.k .s .c .d .t`), `.chip`, `.mono`, `.eyebrow`, `.section`, `.diagram`, `.part-label/.part-num`.
- Code blocks: `<div class="code p-5"><pre>…</pre></div>`. Diagrams: `<pre class="mermaid">`.
- New pages: copy the `i18n-guide.html` shell (hero + `<erp-sidebar>` + `.section`s + `<erp-footer>`)
  and register the page in the `LINKS` array of `ErpDocnav` in `components.js`.
- When editing HTML, keep it well-formed and render-check with headless Chrome before finishing.

## Crucial project rule — bilingual i18n (TH/EN)

DB stores **flat parallel columns** `*_th` / `*_en` (never JSONB for normal fields). A NestJS
`LocalizationInterceptor` collapses each `_th/_en` pair into a nested object on **response**
(`name → { th, en }`), always emitting `{ th, en }` even when null (stable contract). **Input
(DTO) and submit payloads use flat keys** (`remark_th`, `remark_en`). Nested objects are
**response-only**. See `i18n-guide.html`.

---

## Backend conventions (NestJS 11 · Fastify · TypeORM · PostgreSQL)

Authoritative summary. Full rendered version: `backend-convention.html`.

### Naming

| Category | Pattern | Examples |
|---|---|---|
| Module | `Singular` + `Module` | `PatientModule`, `MedicalVisitModule` |
| Controller | `Plural` + `Controller` | `PatientsController`, `MedicalVisitsController` |
| Service | `Plural` + `Service` | `PatientsService`, `MedicalVisitsService` |
| Entity / DTO (class) | `Singular`, `PascalCase` | `Patient`, `CreatePatientDTO` |
| Entity / DTO (property) | `snake_case` | `first_name_thai`, `birth_date`, `is_active` |
| Enum | `Singular`, `PascalCase` | `QueueStatus`, `DepartmentVisitStatus` |
| Folder | `kebab-case` | `medical-visit`, `patient-change-request` |
| Filename | `kebab-case` + `.type.ts` | `medical-visit.module.ts`, `medical-visits.controller.ts` |
| Table (DB) | `plural`, `snake_case` | `patients`, `medical_visits`, `patient_insurances` |
| Column (DB) | `snake_case` | `first_name`, `birth_date`, `is_active` |
| Primary key | `id` · constraint `pk_<table>` | `id`, `pk_patients` |
| Foreign key | `singular_table_id` | `patient_id` in `medical_visits` |
| Index | `idx_<table>_<columns>` | `idx_patients_national_id` |
| Unique constraint | `uq_<table>_<columns>` | `uq_patients_hn`, `uq_users_email` |
| Check constraint | `chk_<table>_<condition>` | `chk_visits_visit_type` |

**Property names are `snake_case` end-to-end** (entities, DTOs, request bodies, responses,
query params, event payloads) so TypeORM props map 1:1 to Postgres columns — avoiding
`@Column({ name: '…' })`. This also matches the flat i18n keys (`remark_th`).

### Boolean & status prefixes (always prefix — never a bare adjective)

- `is_` — state/identity: `is_active`, `is_deleted`, `is_verified`, `is_public`.
- `has_` — possession/existence: `has_attachment`, `has_permission`, `has_signature`.
- `can_` — ability/rights: `can_edit`, `can_delete`, `can_approve`.
- `should_` — conditional action: `should_notify`, `should_archive`, `should_refresh`.

### API responses — JSON:API envelope

Every controller carries `@ResourceType('<plural-resource>')`; the `TransformInterceptor` wraps
the returned value into a **JSON:API** envelope (without the decorator, raw data is returned).

- Envelope: `{ status: { code, message }, data | errors, meta: { timestamp }, links: { self } }`.
- **`status.code` is a 6-digit code** = HTTP status × 1000 + serial; success = `200000`
  ("Request Succeeded"). Include **either `data` or `errors`, never both**.
- Shapes: **single** → `data: { type, id, attributes }` · **collection** → `data: [ … ]` ·
  **paginated** → adds `meta.pagination`.
- `attributes` carry **snake_case** props + i18n nested objects (the `LocalizationInterceptor`
  collapses `_th/_en` → `{ th, en }`). Never hand-build `{ th, en }`.

### Error handling — specific exceptions, global filter

- **Controllers never catch** — let exceptions bubble to `AllExceptionsFilter` (which shapes the
  `errors` envelope). Only catch to add controller-specific context (e.g. file upload).
- Use the **most specific** exception. Codes: `400` BadRequest (business/state) · `400001`
  `ValidationException` (body, auto via `@Body()`) · `400002` `InvalidParameterException`
  (query, via `@ValidatedQuery`) · `401` · `403` · `404` NotFound (always null-check after DB
  reads) · `409` Conflict (duplicate/constraint) · `422` Unprocessable (semantic) · `500` · `503`.
- Wrap DB work in **`executeDbOperation()`** — it maps PG codes automatically: `23505`→409,
  `23503`/`23502`/`22P02`→400, optimistic-lock→409, else→500.
- **Never expose internals** (stack/tokens). Generic client message + full **internal** log with
  context (`service`, `userId`, ids). Never `throw new Error(...)` or bare `new HttpException(...)`.

### Query params — `@ValidatedQuery`

- Use **`@ValidatedQuery(QueryParamsDTO)`** (not `@Query()`), which is type-safe and throws the
  correct `400002` (plain `@Query()` with a typed DTO wrongly triggers the global pipe → `400001`).
- Auto type-coercion (`"123"`→`123`, `"true"`→`true`), whitelist-strips unknown props, supports
  nested validation and array filter syntax `filter[]=field||$eq||value`.

### Microservice (TCP) calls

- Use `sendWithContext(...)` — the **no-throw** pattern: returns `defaultValue`/`null` on error
  and logs consistently; the caller decides (e.g. `if (!x) throw new NotFoundException(...)`).

### Cross-context rules (from the architecture)

- Database-per-context; **reference across BCs by UUID only** — no cross-DB foreign keys.
- Transactional documents are **submittable** (`DRAFT → SUBMITTED → CANCELLED`); stock/ledger
  posts on submit, reverses on cancel. Emit domain events **after commit** via an outbox;
  consumers must be idempotent. `available_qty` carries a DB `CHECK (… >= 0)`.
