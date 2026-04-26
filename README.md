# 🏛️ Online Business Permit System

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js->=18.0.0-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-blue.svg)](https://nextjs.org/)
[![Postgres](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)

A comprehensive web-based Business Permit Application & Management System designed for Philippine Local Government Units (LGUs). The system digitizes the entire business permit lifecycle from application to issuance.

---

## 🚀 Quick Start

Get the system running in 5 minutes:

```bash
# 1. Navigate to the project
cd ONLINE-BUSINESS-PERMIT

# 2. Start infrastructure services (PostgreSQL, Redis, MinIO)
docker compose up -d postgres redis minio

# 3. Enter the web directory
cd web

# 4. Install dependencies
npm install

# 5. Setup environment variables
cp .env.backup .env  # Update values as needed

# 6. Initialize database
npm run db:generate
npm run db:push

# 7. Run development server
npm run dev
```

**App will be available at:** `http://localhost:8000`

---

## 📋 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 9.x | Included with Node.js |
| **Docker & Docker Compose** | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **PostgreSQL** | 15+ | [postgresql.org](https://www.postgresql.org/download/) (or via Docker) |

**Verify your setup:**
```bash
node --version     # Should be v18+
npm --version      # Should be v9+
docker --version   # Should have Docker
```

---

## ⚙️ Setup Options

### Option 1: Docker (Recommended) ✅

**Fastest setup with all services included:**

```bash
cd web

# Start all services
docker compose up -d

# Initialize database
npm run db:generate && npm run db:push

# Start app
npm run dev
```

**Services included:**
- PostgreSQL (database)
- Redis (caching, queues)
- MinIO (file storage)
- ClamAV (document scanning)

### Option 2: Manual Setup

**If you prefer local installation:**

```bash
# Install & start PostgreSQL locally
# Ensure it's running on postgresql://localhost:5432

# Create .env file with your LOCAL_DATABASE_URL
cp .env.backup .env

# Install dependencies & setup database
npm install
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

---

## 📚 Environment Setup

### Copy Environment Template
```bash
cd web
cp .env.backup .env
```

### Critical Variables to Update

```env
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/business_permits
DIRECT_URL=postgresql://user:password@localhost:5432/business_permits

# Authentication (min 32 characters)
AUTH_SECRET=your-secure-random-string-min-32-chars

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:8000

# Email (SMTP) - for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage (S3/MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

**Full environment reference:** See [web/.env](web/.env) with all available options.

---

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start dev server (PORT 8000)
npm run build           # Production build
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Sync schema to database
npm run db:migrate:dev  # Create & run migration
npm run db:studio       # Open Prisma Studio (GUI)
npm run db:seed         # Seed database with test data

# Testing
npm run test            # Run unit tests
npm run test:watch      # Watch mode
npm run test:e2e        # Run E2E tests (Playwright)
npm run test:coverage   # Coverage report

# Code Quality
npm run lint            # Lint code
npm run typecheck       # TypeScript type checking
npm run typecheck       # Full diagnostic

# Production
npm run prod            # Build and start production
```

---

## 🧪 Test Accounts

Default test accounts (after seeding):

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Applicant** | applicant1@example.com | password123 | Submit permit applications |
| **Staff (BPLO)** | staff1@example.com | password123 | Review documents |
| **Reviewer (BPLO Officer)** | reviewer1@example.com | password123 | Approve/reject applications |
| **Admin** | admin1@example.com | password123 | System administration |

**Seed database with test accounts:**
```bash
npm run db:seed
```

---

## 📂 Project Structure

```
ONLINE-BUSINESS-PERMIT/
├── web/                          # Main application (Next.js)
│   ├── src/
│   │   ├── app/                 # App router & pages
│   │   │   ├── (dashboard)/     # Protected routes
│   │   │   ├── api/             # API routes
│   │   │   └── auth/            # Authentication pages
│   │   ├── components/          # React components
│   │   ├── lib/                 # Utilities & helpers
│   │   ├── styles/              # Tailwind CSS
│   │   └── types/               # TypeScript types
│   ├── prisma/                  # Database schema & migrations
│   ├── e2e/                     # End-to-end tests (Playwright)
│   ├── public/                  # Static assets
│   ├── .env                     # Environment variables
│   ├── docker-compose.yml       # Service definitions
│   ├── next.config.js           # Next.js configuration
│   └── package.json             # Dependencies
│
├── START_HERE.md                # Detailed setup guide
├── PROJECT-PLAN.md              # Architecture & specifications
├── README.md                     # This file
└── docs/                        # Additional documentation

```

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **[START_HERE.md](START_HERE.md)** | Complete setup guide with walkthroughs & troubleshooting |
| **[PROJECT-PLAN.md](PROJECT-PLAN.md)** | Architecture, database schema, API specifications |
| **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** | PostgreSQL database configuration |
| **[DFD's and data template](DFD's%20and%20data%20template/)** | Business requirements & data models |

---

## 🏗️ Core Features

### 1. **User & Access Management**
- 4 Role-Based Access Control (RBAC): Applicant, Staff, Reviewer, Admin
- OTP & 2FA authentication
- Session management & audit logs

### 2. **Permit Application Management**
- NEW: New business permit applications
- RENEWAL: Permit renewal process
- CLOSURE: Business closure permit
- Full status lifecycle tracking

### 3. **Digital Document Management**
- Document upload & versioning
- Virus scanning (ClamAV)
- Document verification workflows
- Per-type document requirements

### 4. **Real-Time Tracking**
- Server-Sent Events (SSE) for live status updates
- Application dashboards
- Status history timeline

### 5. **Claim Scheduling**
- Time slot management with capacity limits
- Rescheduling & cancellation
- QR code permit verification

### 6. **Reporting & Analytics**
- CSV/PDF export
- Permit reference numbers
- LGU-level analytics

### 7. **Permit Issuance**
- PDF generation with QR codes
- Digital permit certificates
- Mayor signing workflow

---

## 🔧 Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL 15+, Prisma ORM
- **Authentication:** NextAuth.js (Auth.js)
- **File Storage:** AWS S3 / MinIO
- **Email:** Nodemailer (SMTP)
- **Document Scanning:** ClamAV
- **Caching & Queues:** Redis, BullMQ
- **Testing:** Vitest, Playwright

---

## 🚨 Troubleshooting

### Docker Services Won't Start
```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Kill process if needed (be careful!)
kill -9 <PID>
```

### Database Connection Error
```bash
# Verify database is running
docker compose ps

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Port Already in Use
```bash
# Next.js on different port
npm run dev -- -p 3001

# Or update docker-compose.yml ports
```

### Clear Cache & Rebuild
```bash
rm -rf .next node_modules
npm install
npm run build
npm run dev
```

---

## 📞 Support & Contact

For issues, questions, or feature requests:
- **Documentation:** See [START_HERE.md](START_HERE.md)
- **Issues:** Check project documentation files
- **Email:** bplo@sample.gov.ph (update in .env)

---

## 📄 License

UNLICENSED - This project is proprietary software for Philippine LGUs.

---

## 📋 Quick Reference

| Need | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Check for TypeScript errors | `npm run typecheck` |
| Run database migrations | `npm run db:migrate:dev` |
| Open database GUI | `npm run db:studio` |
| Run all tests | `npm run test` |
| Lint code | `npm run lint` |

---

**Last Updated:** April 18, 2026
**Version:** 1.0.0

For detailed walkthroughs, see [START_HERE.md](START_HERE.md) 👈
