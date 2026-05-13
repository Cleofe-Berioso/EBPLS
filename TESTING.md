Testing
=======

This project uses Vitest for unit tests.

Commands
- Install dev dependencies (after package.json updated):

```bash
npm install
```

- Run tests:

```bash
npm test
```

- Run tests in watch mode:

```bash
npm run test:watch
```

- Run typecheck:

```bash
npm run typecheck
```

Notes
- Minimal, safe production changes were made to export a few helper functions from `src/lib/bplo-assessment.ts` to enable unit testing without changing runtime behavior.
- Tests focus on numeric/fee logic and do not touch Prisma or DB.
