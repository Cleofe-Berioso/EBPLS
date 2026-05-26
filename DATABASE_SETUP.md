# Database Connection Setup for EBPLS (Supabase PostgreSQL)

## Current Status

The EBPLS project uses **Supabase PostgreSQL** with **Prisma 7** + **@prisma/adapter-pg**.

### Error You're Seeing

```
PrismaClientKnownRequestError P1001:
Can't reach database server at db.xxqqxicusvhmtubjchft.supabase.co
```

This means Prisma cannot establish a TCP connection to the Supabase database server. **The code is correct, but the database is unreachable.**

---

## Prerequisites

### 1. Supabase Project Status

**Check if your Supabase project is running:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Look at the project status indicator (top-left)
4. **If the project is PAUSED**, click to resume it
5. Wait for status to show **RUNNING**

### 2. Database Credentials

**Verify your connection string is correct:**

1. In Supabase Dashboard, go to **Project Settings > Database**
2. Under "Connection Info", find **Direct Connection** (not pooler)
3. Copy the full connection string:
   ```
   postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.supabase.co:5432/postgres?schema=ebpls
   ```
4. Replace `password` placeholder if needed

### 3. Environment Variables

**In `.env`, you need both URLs:**

```bash
# Runtime connection (Prisma client + app)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.supabase.co:5432/postgres?schema=ebpls"

# Direct connection with SSL (migrations only)
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.supabase.co:5432/postgres?schema=ebpls&sslmode=require"
```

**IMPORTANT:** Both must point to the **Direct Connection**, not the pooled connection. The pooler does not work well with Prisma's migration system.

---

## How It Works

### Architecture

- **`src/lib/prisma.ts`**: Creates a Prisma Client with `@prisma/adapter-pg`, reads `DATABASE_URL`
- **`prisma.config.ts`**: Config file that loads `.env` for Prisma CLI commands
- **`prisma/schema.prisma`**: Schema definition (no URLs here in Prisma 7)
- **`.env`**: Contains `DATABASE_URL` and `DIRECT_URL`

### Connection Flow

```
npm run dev
  ↓
Next.js loads src/lib/prisma.ts
  ↓
PrismaClient initialized with PrismaPg adapter
  ↓
Adapter reads DATABASE_URL from process.env
  ↓
Connection to Supabase: postgresql://...@db.xxqqxicusvhmtubjchft.supabase.co
  ↓
If reachable: ✅ Client ready for queries
If unreachable: ❌ P1001 error
```

---

## Troubleshooting

### Step 1: Test the Connection

```bash
npx tsx scripts/check-db-connection.ts
```

This script will:
- Load `.env` safely  
- Mask secrets in output (never prints password)
- Attempt to connect using the same adapter as the app
- Run `SELECT 1` as a simple health check
- Report success or detailed error

### Step 2: Verify Supabase Project

If connection fails, check:

1. **Is the project running?**
   - Supabase Dashboard > Project Status
   - Not paused/suspended

2. **Is the password correct?**
   - Supabase Dashboard > Project Settings > Database > Connection Info
   - Copy the exact password from the Direct Connection string
   - No special characters should be URL-encoded in DATABASE_URL

3. **Is the hostname correct?**
   ```bash
   # Should match your project
   db.xxqqxicusvhmtubjchft.supabase.co  ← Your actual hostname
   ```

4. **Is the schema parameter present?**
   ```bash
   ?schema=ebpls  ← REQUIRED to target the EBPLS schema
   ```

### Step 3: Check Network Connectivity

If all credentials look right but still cannot connect:

1. **VPN or Firewall blocking?**
   - Temporarily disable VPN/antivirus
   - Test connection again

2. **Supabase Infrastructure down?**
   - Check https://status.supabase.com
   - Check your Supabase project logs (Dashboard > Logs)

3. **Postgres port 5432 blocked?**
   - Your ISP or corporate network may block port 5432
   - Consider using a Session Pooler (requires different setup)

---

## Running Commands

### Prisma Migrations

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations (requires DIRECT_URL)
npx prisma migrate deploy
```

### Regenerate Prisma Client

```bash
# After any schema.prisma changes
npx prisma generate
```

### Test Connection Locally

```bash
# Runs a simple query to verify connectivity
npx tsx scripts/check-db-connection.ts
```

### Start Development Server

```bash
# Starts dev server at http://localhost:3000
npm run dev

# Access applicant dashboard at /applicant/dashboard
```

---

## TypeScript / Type Checking

The Prisma client types are auto-generated. Run:

```bash
npm run typecheck
```

Should show **zero errors** if everything is configured correctly. Database connectivity is NOT required for TypeScript checking.

---

## Key Files Changed

| File | Purpose |
|------|---------|
| `prisma.config.ts` | Fixed: loads `.env` and uses correct Prisma 7 syntax |
| `.env.example` | Improved: added detailed comments about connection strings |
| `prisma/schema.prisma` | Schema definition (datasource without URLs for Prisma 7) |
| `scripts/check-db-connection.ts` | NEW: diagnostic script to test connectivity safely |
| `src/lib/prisma.ts` | Uses `PrismaPg` adapter (no changes) |

---

## Next Steps

1. **Resume Supabase project** if paused
2. **Update DATABASE_URL and DIRECT_URL** in `.env` with your actual credentials
3. **Test connection:**
   ```bash
   npx tsx scripts/check-db-connection.ts
   ```
4. **Start dev server:**
   ```bash
   npm run dev
   ```
5. **Visit /applicant/dashboard** - should not show P1001 error

---

## Support

If you still see P1001 after these steps:

1. **Screenshot** your Supabase Dashboard (Database > Connection Info)
2. **Check error message** for hints (copy full error from terminal)
3. **Verify credentials** are exactly as shown in Supabase (no typos)
4. **Check network** - try from a different network if possible

Do not hardcode DATABASE_URL in code. Always use environment variables.

---

## Schema: `ebpls`

The database uses a dedicated schema `ebpls` to avoid conflicts with Supabase's default public schema.

All Prisma operations automatically target this schema via the `?schema=ebpls` parameter in the connection string.

**Do not** try to manually run migrations or queries against the public schema.
