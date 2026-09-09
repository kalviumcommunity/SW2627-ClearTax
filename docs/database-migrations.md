# Database Migrations

ClearTax manages database schema changes with version-controlled Prisma migrations. The Prisma schema and migration history must stay synchronized so a fresh PostgreSQL database can be recreated from the files in this repository.

## Current Baseline

The repository already has a valid migration history under `prisma/migrations/`:

- `20260824083107_add_core_recociliation_models` creates the MVP reconciliation schema.
- `20260903000000_add_user_password_hash` adds password hash storage used by credentials authentication.

Together these migrations represent the current `prisma/schema.prisma`, including the `User`, `Business`, `ReferenceImport`, `ReferenceInvoice`, `UploadBatch`, and `ReconciliationRow` models.

The baseline migration creates the core tables, lifecycle enums, primary keys, foreign keys, Decimal-compatible PostgreSQL money columns, indexes, and unique constraints needed by the MVP. The password-hash migration brings the versioned database history in line with the current authentication fields.

## Local Development Workflow

Use a local development PostgreSQL database. Do not point normal development commands at production or a shared database.

```bash
# 1. Modify the Prisma schema

npx prisma format
npx prisma validate

# 2. Generate and apply a development migration
npx prisma migrate dev --name <descriptive_migration_name>

# 3. Regenerate Prisma Client if required
npx prisma generate
```

Before committing, inspect the generated SQL:

```text
prisma/migrations/<timestamp>_<descriptive_migration_name>/migration.sql
```

Normally commit both:

```text
prisma/schema.prisma
prisma/migrations/
```

## Migration Naming

Use lowercase, descriptive, intent-focused names with underscores.

Good examples:

```text
add_business_gstin
add_batch_status
create_reference_invoice
add_reconciliation_indexes
```

Avoid vague names:

```text
update
changes
fix
migration2
```

## Preview, Staging, And Production

Preview, staging, and production environments should apply already-committed migrations. They should not create new migration history.

Use:

```bash
npx prisma migrate deploy
```

Do not use this in production:

```bash
npx prisma migrate dev
```

Production lifecycle:

```text
Developer changes schema
        ↓
migrate dev generates migration
        ↓
migration SQL reviewed
        ↓
schema + migration committed
        ↓
CI/CD deploys application
        ↓
prisma migrate deploy applies pending migrations
```

Production should never create migrations interactively, reset the database, or rely on manual schema edits.

## prisma db push

`npx prisma db push` is not the normal schema-evolution workflow for this project.

It can be useful for temporary prototyping in isolated disposable databases, but it must not replace version-controlled migrations for project development, preview, staging, or production. Use `prisma migrate dev` during development and `prisma migrate deploy` during deployment.

## Environment Separation

Database URLs come from environment variables. Real `.env` files must not be committed.

- Local development uses each developer's development database and normally runs `npx prisma migrate dev`.
- Preview or staging databases, if used, apply committed migrations with `npx prisma migrate deploy`.
- Production applies reviewed, committed migrations with `npx prisma migrate deploy`.

Development, preview/staging, and production must use separate credentials and separate databases. `.env.example` may document variable names with placeholders, but it must not contain real credentials.

## Schema Evolution Safety

### Adding A Nullable Field

Adding a nullable field is generally safe:

```prisma
description String?
```

Generate and review a migration normally.

### Adding A Required Field

Do not blindly add a required field to a populated table:

```prisma
newField String
```

Use a safer multi-step approach:

```text
1. Add the field as nullable or with a safe default.
2. Deploy the migration.
3. Backfill existing records.
4. Verify the data.
5. Make the field required in a later migration.
```

### Adding Indexes

Add indexes through Prisma where supported:

```prisma
@@index([businessId])
```

Generate and review the migration before deployment. Index creation can still affect large production tables, so review lock and runtime impact.

### Changing Enums

Enum changes can have production consequences. Adding a new enum value is generally simpler than removing or renaming one.

Before removing or renaming enum values, check existing records, update application code, migrate existing data, and review the generated SQL carefully.

### Adding Relations

New required foreign keys can fail when existing rows do not satisfy the relation. Prefer introducing the relationship safely, backfilling existing records, verifying referential integrity, and making the relation required in a later migration if needed.

### Renaming Fields

A naive Prisma rename can generate SQL that drops one column and creates another, which can lose data. For data-preserving renames, inspect the generated migration SQL and adjust it carefully when appropriate.

### Removing Fields Or Tables

Treat removal as destructive. Before deployment:

- Verify the field or table is unused.
- Migrate or backfill data if needed.
- Remove application dependencies first.
- Review generated SQL.
- Deploy only after confirming data loss is acceptable.

## Applied Migration Rules

- Never modify a migration that has already been applied to shared or production environments.
- Never delete migration history after it has been shared or deployed.
- Future schema changes require new migrations.
- Migration files belong in version control.
- Review SQL before deployment.
- Keep `prisma/schema.prisma` and `prisma/migrations/` synchronized.
- Do not manually modify production schema objects behind Prisma's back.

## Rollback And Recovery

Prisma does not provide a universal automatic rollback command that safely undoes any migration.

For production failures, recovery may involve:

- Fixing the issue with a forward migration.
- Restoring from a database backup.
- Manually resolving migration state only when the team fully understands the consequences.

Do not use `prisma migrate reset` as a production rollback mechanism.

## Useful Checks

Run these before opening a pull request:

```bash
npx prisma format
npx prisma validate
npx prisma migrate status
```

Only run `migrate status` against an environment where it is acceptable for Prisma to connect and inspect migration state. Do not run destructive commands against shared or production databases.

## Demo Seed Data

After applying migrations to a local development database, populate the ClearTax demo workspace with:

```bash
npm run db:seed
```

The seed creates one development-only credentials user, one owned business, one active GSTR-2B-like reference import, ten reference invoices, and one completed reconciliation demo batch with matched, mismatched, and row-error results. It uses fixed demo values and fixed demo record IDs for the reference import, upload batch, invoices, and reconciliation rows.

Rerunning the command is intentional and idempotent: the demo user and business are upserted, reference invoices and batch metadata are upserted by deterministic IDs, and only rows belonging to the deterministic demo batch are replaced before being recreated. It does not globally clear tables or delete unrelated local records.

The command requires `DATABASE_URL` to point at a migrated local development PostgreSQL database. The seeded login is `demo@cleartax.local` with password `ClearTaxDemo#2026`; do not use these values outside development or demos.
