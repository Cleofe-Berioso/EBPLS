# AGENTS.md

## Purpose

This file gives rules to any AI coding assistant working on this project.

The AI must work carefully, edit only what is requested, stop after each checkpoint, and wait for review before continuing.

---

## Core Workflow

For every task, follow this process:

1. Understand the request.
2. Inspect the related files before editing.
3. Make a short implementation plan.
4. Edit only the required files.
5. Run the safest available verification command.
6. Stop and report the result.
7. Wait for user approval before continuing.

Do not skip the inspection and planning step.

---

## Read Before Editing

Before changing code, inspect the files related to the task.

Usually check:

- `package.json`
- the related page/component files
- the related API/server files
- the related database/schema files, if the task affects data
- the related utility/helper files

Do not guess the project structure.

---

## Planning Rule

Before editing, explain:

- what the problem is
- which files will likely be changed
- what the exact fix will be
- what will not be touched

Keep the plan small and specific.

---

## Small Change Rule

Implement only the requested fix or feature.

Do not:

- rewrite unrelated files
- change unrelated UI
- change authentication unless requested
- change database schema unless requested
- remove existing business logic
- rename routes or files unless required
- add new packages unless clearly necessary

---

## Stop and Review Rule

After one logical fix or phase, stop.

Do not continue automatically.

End every implementation with:

> Checkpoint reached. Please review the changes before I continue.

Continue only when the user says:

- continue
- proceed
- next phase
- approved
- go on

---

## Error Handling Rule

If an error appears:

1. Do not randomly patch many files.
2. Explain the likely cause.
3. Identify the exact file or logic involved.
4. Propose a small fix.
5. Apply only that fix.
6. Run verification again.
7. Stop and report the result.

---

## Verification Rule

After changes, check `package.json` and run only commands that exist.

Common examples:

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

If the project uses Prisma and the schema was touched, run:

```bash
npx prisma generate
```

Do not invent commands that are not in the project.

---

## Database Safety Rule

Do not reset, delete, or force-push the database unless the user clearly approves.

Do not run these commands without explicit permission:

```bash
prisma migrate reset
prisma db push --force-reset
rm -rf prisma/dev.db
```

For schema changes:

1. Explain why the schema needs to change.
2. Prefer additive and non-destructive changes.
3. Preserve existing data whenever possible.
4. Stop for review before destructive changes.

---

## UI Safety Rule

When editing UI:

- preserve the existing design style
- do not redesign unrelated sections
- do not remove existing buttons or links unless requested
- keep role-based navigation intact
- keep existing validation intact
- match screenshots carefully when provided

---

## API Safety Rule

When editing API routes:

- preserve authorization checks
- validate request data
- do not trust client-side values
- keep server-side validation as the source of truth
- return clear error messages
- do not expose private files or private data

---

## Authentication Safety Rule

Do not change login, registration, middleware, session handling, or role guards unless the task is specifically about authentication.

If authentication must be changed, explain the risk first and keep the change minimal.

---

## File Upload Safety Rule

When working with uploads:

- validate file type
- validate file size
- do not save incomplete or invalid submissions
- do not create database records until the full submission is valid
- clean up temporary files when necessary
- protect uploaded files from unauthorized access

---

## Coding Style

Follow the existing project style.

Prefer:

- small functions
- readable names
- clear validation
- server-side checks
- reusable helpers only when helpful

Avoid:

- massive rewrites
- duplicate logic
- hidden behavior
- hardcoded sensitive values
- fake data in production code

---

## Required Checkpoint Report

After every implementation, respond with this format:

```md
## Checkpoint Report

### Summary
Briefly explain what was completed.

### Files Changed
- `path/to/file.tsx` — what changed
- `path/to/file.ts` — what changed

### Verification
- Command run: `npm run typecheck`
- Result: Passed/Failed
- Notes: Explain any errors

### What Was Not Touched
- Authentication
- Database schema
- Unrelated pages/routes

### Next Suggested Step
Explain the next safe step, but do not implement it yet.

Checkpoint reached. Please review the changes before I continue.
```

---

## Continue Rule

Only continue after clear approval from the user.

If the user gives a new instruction, treat it as a new checkpoint cycle.
