# Dependency Advisory Plan

Do not run `npm audit fix --force` without a compatibility branch and regression testing.

Remaining production advisories from `npm audit --omit=dev` require breaking upgrades:

- `next-intl`
  - Current installed line: `3.x`
  - Advisory fix requires `4.9.1` or newer.
  - Plan: migrate i18n usage to `next-intl` v4 in a dedicated branch, verify locale routing and redirects.

- `next-auth` / `@auth/core` / `nodemailer`
  - Current app uses NextAuth v5 beta and Nodemailer for email delivery.
  - Advisory is inherited through Nodemailer usage.
  - Plan: test compatible Auth.js/NextAuth and Nodemailer upgrades together; verify login, OTP, password reset, and all mail flows.

- `bullmq` / `uuid`
  - Current queue stack uses BullMQ.
  - Advisory is inherited through BullMQ's UUID dependency.
  - Plan: upgrade BullMQ only when an upstream-compatible release resolves the UUID advisory; verify Redis-backed queues and worker startup.
