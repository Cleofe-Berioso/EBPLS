# EBPLS Codebase UI/UX Implementation Mapping

**Date:** May 8, 2026  
**Purpose:** Comprehensive mapping of current UI/UX implementations and locations for redesign

---

## 1. STATUS BADGES - Current Implementations

### Location: `src/components/ui/status-badge.tsx`
- **Component Name:** `StatusBadge`
- **Props:** `{ status: ApplicationStatus }`
- **Styling:** Color-coded badges with borders and background
- **Status Flow:** Draft → Submitted → Under Review → Assessed → Approved for Payment → Paid → For Release → Released
- **Special Statuses:** Returned for Correction, Rejected

### Display Status Style Mapping:
```typescript
- Draft: slate-100 (gray)
- Submitted: blue-50 (blue)
- Under Review: amber-50 (amber)
- Assessed: indigo-50 (indigo)
- Approved for Payment: sky-50 (sky)
- Paid: emerald-50 (green)
- For Release: teal-50 (teal)
- Released: emerald-100 (green, darker)
- Returned for Correction: orange-50 (orange)
- Rejected: rose-50 (red)
```

### Where Badges Are Used:
1. **Applicant Dashboard** (`src/app/applicant/dashboard/page.tsx`):
   - Section Title: "Current Workflow Status" - shows badge in action area
   
2. **Applicant My Applications** (`src/app/applicant/my-applications/page.tsx`):
   - Table column: Status column (first column)
   - Mobile cards: Top-right corner with flex-shrink
   
3. **BPLO Dashboard** (`src/app/bplo/dashboard/page.tsx`):
   - Recent Submissions section - inline with app number
   - Workflow Pipeline section - with status counts
   
4. **BPLO Applications Queue** (`src/app/bplo/applications/page.tsx`):
   - Desktop table: Status column (first column)
   - Mobile cards: Flex items-start justify-between
   
5. **Super Admin Dashboard** (`src/app/superadmin/dashboard/page.tsx`):
   - Workflow Snapshot section - with count display

### Reexport Location:
- **Applicant Component:** `src/components/applicant/status-badge.tsx` (reexports from ui)

---

## 2. PAGE HEADERS & TITLES - Current Implementations

### Component: `PageHeader` (`src/components/ui/page-header.tsx`)
**Props:**
```typescript
{
  eyebrow?: string;           // Uppercase label (e.g., "Applicant", "BPLO", "Super Admin")
  title: string;              // Main page title
  description?: string;       // Subtitle/description text
  badge?: ReactNode;          // Role badge or status badge
  actions?: ReactNode;        // Action buttons (top-right)
  eyebrowClassName?: string;  // Custom eyebrow color
}
```

### Page Header Implementations:

#### Applicant Role Pages:
1. **Dashboard** (`/applicant/dashboard`)
   - Eyebrow: "Applicant" (emerald-700)
   - Title: "Dashboard"
   - Description: "Welcome, {name}. Review your next required action, latest application status, and filing updates."
   - Badge: `<RoleBadge role="APPLICANT" />`

2. **My Applications** (`/applicant/my-applications`)
   - Eyebrow: "Applicant"
   - Title: "My Applications"
   - Description: "Track all applications from submission through release. Returned and rejected records remain visible for reference."
   - Badge: `<RoleBadge role="APPLICANT" />`
   - Actions: `<Link href="/applicant/application" ...>"New filing"</Link>`

#### BPLO Role Pages:
1. **Dashboard** (`/bplo/dashboard`)
   - Eyebrow: "BPLO" (text-[#1f3a5f] - custom blue)
   - Title: "Dashboard"
   - Description: "Monitor application intake, assessment, payment verification, issuance, and release."
   - Badge: `<RoleBadge role="BPLO" />`

2. **Applications Queue** (`/bplo/applications`)
   - Eyebrow: "BPLO"
   - Title: "Applications Queue"
   - Description: "Search, review, and route applications across BPLO workflow stages."
   - Badge: `<RoleBadge role="BPLO" />`

3. **Payment Verification** (`/bplo/payment-verification`)
   - Eyebrow: "BPLO"
   - Title: "Payment Verification"
   - Badge: `<RoleBadge role="BPLO" />`

4. **Permit Issuance** (`/bplo/permit-issuance`)
   - Eyebrow: "BPLO"
   - Title: "Permit Issuance"
   - Description: "Prepare and release business permits or closure certificates for paid applications..."
   - Badge: `<RoleBadge role="BPLO" />`

#### Super Admin Role Pages:
1. **Oversight Dashboard** (`/superadmin/dashboard`)
   - Eyebrow: "Super Admin" (text-slate-600 - muted gray)
   - Title: "Oversight Dashboard"
   - Description: "View-only monitoring across applicant submissions, BPLO processing, payment verification, and permit issuance."
   - Badge: `<RoleBadge role="VIEW_ONLY" label="View-Only Monitoring" />`

---

## 3. EMPTY STATES - Current Implementations

### Component: `EmptyState` (`src/components/ui/empty-state.tsx`)
**Props:**
```typescript
{
  title: string;          // Main message
  description: string;    // Detailed explanation
  action?: ReactNode;     // CTA button
}
```

**Styling:** `rounded-2xl border border-dashed border-slate-300 bg-slate-50/85 px-6 py-10 text-center`

### Empty State Implementations:

#### Applicant Pages:
1. **My Applications - Current Workflow Section** (when no latest app)
   - Title: "No records available yet"
   - Description: "This section will populate as applications are processed. Start a new, renewal, or closure filing to begin."
   - Action: `<Link href="/applicant/application">"Start application"</Link>`

2. **My Applications - Application Records Table** (when empty)
   - Table fallback text: `<td colSpan={6}>"No records available yet. This table will populate as applications are processed."</td>`
   - Mobile card fallback: Full EmptyState component (same as #1)

#### BPLO Pages:
1. **Applications Queue - Review Queue Section** (when filters return no results)
   - Title: "No applications found."
   - Description: "Try adjusting the search keyword, application type, or workflow status."
   - Action: `<Link href="/bplo/applications">"Reset Filters"</Link>`

2. **Permit Issuance - Blocked Applications** (when section is empty)
   - Text fallback: `<div className="px-6 py-8 text-sm text-slate-500">No blocked applications at the moment.</div>`

3. **Permit Issuance - Paid Applications** (when section is empty)
   - Text: "No records available yet in this section. Paid applications will appear here once payment verification is completed."

4. **Permit Issuance - For Release** (when section is empty)
   - Text: "No records available yet in this section."

#### Dashboard Sections (if empty):
1. **BPLO Dashboard - Recent Submissions** (when list is empty)
   - Custom card with icon: `<CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-400" />`
   - Text: "No recent submissions"
   - Subtext: "Newly filed applications will appear here"

#### TOP (Tax Order of Payment) Page:
1. **No Application Selected**
   - Uses EmptyState pattern (if applicable)

---

## 4. BUTTON LABELS - Current Implementations

### Action Button Variants: `src/components/ui/action-button.tsx`
```typescript
type ActionButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning" | "readOnly";
type ActionButtonSize = "sm" | "md";
```

### Primary Action Buttons (Full CTA):

#### Applicant Pages:
1. **Dashboard → Next Required Action Section**
   - Button text varies by status (examples):
     - "Continue draft" (Draft status)
     - "Correct and resubmit" (Returned for Correction)
     - "Open Tax Order of Payment" (Approved for Payment)
     - "Open Business Location" (Released)
     - "Start application" (New user)

2. **My Applications → Header**
   - Label: "New filing"
   - Variant: secondary
   - Links to: `/applicant/application`

3. **My Applications → Table Actions**
   - Primary: "View" (secondary variant, sm)
   - Conditional: "Correct and Resubmit" (warning variant, sm) - only if status === "Returned for Correction"

#### BPLO Pages:
1. **Dashboard → Action Required Cards**
   - Label: "View Queue"
   - Variant: primary
   - Size: sm
   - Width: w-full

2. **Dashboard → Operational Shortcuts**
   - Button 1: "Review Applications" → `/bplo/applications`
   - Button 2: "Assessment & Fees" → `/bplo/assessment-fees`
   - Button 3: "Payment Verification" → `/bplo/payment-verification`
   - Button 4: "Permit Issuance" → `/bplo/permit-issuance`
   - Variant: primary
   - Size: md
   - Width: w-full

3. **Applications Queue → Filters**
   - Primary: "Apply Filters" (primary variant)
   - Secondary (conditional): "Reset" (secondary variant) - only if hasActiveFilters

4. **Applications Queue → Table Actions**
   - Label: "View / Review"
   - Variant: secondary
   - Size: sm

5. **Permit Issuance → Paid Applications Table**
   - Label: "Prepare Permit" (inferred from context)
   - Variant: primary
   - Size: sm

6. **Permit Issuance → Blocked Applications**
   - Label: "Awaiting Payment" (disabled state)
   - Variant: secondary
   - State: disabled

#### Super Admin Pages:
- No primary action buttons (view-only dashboard)

---

## 5. RESULT COUNTS & LIST DISPLAYS

### Applicant Pages:

#### My Applications - Table Header:
```typescript
// Within ResponsiveDataTable component
<span>Application Records</span> // title
<span>Review status, submission date, and available actions for each application.</span> // description
```

#### Dashboard - Summary Cards (Counts):
1. "Pending" count - applications.filter(s !== "Released" && s !== "Rejected").length
2. "Needs Action" count - applications.filter(s === "Returned for Correction").length
3. "Active Permits" count - applications.filter(s === "Released").length

### BPLO Pages:

#### Applications Queue - Result Count Display:
```typescript
// In SectionCard description
description={`${rows.length} application${rows.length === 1 ? "" : "s"} matches the current filters.`}
```

#### Dashboard - Pipeline Section:
```typescript
// Grid of status boxes showing:
pipelineRows = [
  { status: "Submitted", value: summary.submittedApplications },
  { status: "Under Review", value: summary.underReview },
  // ... more statuses
];
// Display: "Submitted [COUNT]" + "applications" label
```

#### Dashboard - Action Required Queue Card:
```typescript
// Shows count prominently:
<p className="mb-3 text-2xl font-bold {colors.text}">{queue.count}</p>
```

#### Permit Issuance - Section Titles with Counts:
```typescript
title={`Blocked / Awaiting Payment (${data.blocked.length})`}
title={`Paid Applications (${data.paid.length})`}
title={`For Release (${data.forRelease.length})`}
```

### Super Admin Pages:

#### Dashboard - Summary Cards:
```typescript
// Seven stat cards showing:
- Total New (count)
- Total Renewal (count)
- Total Closure (count)
- Total Applications (count)
- Released Applications (count)
- Total Users (count)
- BPLO Activity Count (count)
```

#### Dashboard - Workflow Snapshot:
```typescript
// Grid of status rows, each showing:
<StatusBadge status={row.status} />
<span>{row.value.toLocaleString("en-PH")}</span>
```

---

## 6. DASHBOARD SHORTCUT BUTTONS - Current Implementations

### Applicant Dashboard (`/applicant/dashboard`):
- **Section:** "Next Required Action"
  - No shortcut buttons (status-specific CTAs only)

- **Navigation:** Sidebar (not in dashboard code)

### BPLO Dashboard (`/bplo/dashboard`):
- **Section:** "Operational Shortcuts"
- **Location:** Right column (lg:col-span-1, on lg screens)
- **Buttons (4 total):**
  1. "Review Applications" → `/bplo/applications`
  2. "Assessment & Fees" → `/bplo/assessment-fees`
  3. "Payment Verification" → `/bplo/payment-verification`
  4. "Permit Issuance" → `/bplo/permit-issuance`
- **Styling:** 
  - Variant: primary
  - Size: md
  - Layout: space-y-3 (vertical stack)
  - Full width: w-full

### Super Admin Dashboard (`/superadmin/dashboard`):
- **No shortcut buttons** (view-only oversight)
- **Navigation Notes:** Sidebar provides main navigation

---

## 7. UTILITY COMPONENTS & PATTERNS

### Core Components Location:
```
src/components/
├── ui/
│   ├── page-header.tsx          # Page titles + eyebrow + description
│   ├── status-badge.tsx         # Status color badges
│   ├── empty-state.tsx          # Empty state + CTA
│   ├── section-card.tsx         # Container with title/desc/action
│   ├── stat-card.tsx            # KPI card with tone color
│   ├── info-banner.tsx          # Info/warning/success/danger banners
│   ├── action-button.tsx        # Button style utilities
│   ├── responsive-data-table.tsx # Desktop/mobile table wrapper
│   ├── table-container.tsx       # Table with header
│   ├── role-badge.tsx           # Role display badge
│   └── ...
├── applicant/
│   ├── status-badge.tsx         # Reexports from ui/status-badge
│   ├── dashboard-summary-card.tsx # Wraps stat-card
│   ├── status-tracker.tsx       # Visual workflow progress
│   └── ...
└── bplo/
    └── ...
```

### Section Card Pattern: `src/components/ui/section-card.tsx`
**Used for:** Content containers with optional header and footer actions
**Props:**
```typescript
{
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}
```

### Info Banner Pattern: `src/components/ui/info-banner.tsx`
**Variants:** info | success | warning | danger | readOnly
**Used for:** Status messages, instructions, alerts
**Props:**
```typescript
{
  title: string;
  description?: string;
  variant?: BannerVariant;
  action?: ReactNode;
}
```

---

## 8. CHANGE MAPPING - Where Redesigns Should Be Applied

### HIGH PRIORITY CHANGES:

#### 1. Status Badges
- **Files:** `src/components/ui/status-badge.tsx`, `src/components/applicant/status-badge.tsx`
- **Used in:** 12+ locations across all dashboards and queue pages
- **Change Scope:** 
  - Update color palette
  - Modify shape/styling
  - Adapt display text if needed

#### 2. Page Headers
- **Files:** `src/components/ui/page-header.tsx`
- **Used in:** 8 main pages + all sub-pages
- **Change Scope:**
  - Update typography
  - Adjust spacing/layout
  - Modify eyebrow styling
  - Update badge integration

#### 3. Dashboard Shortcut Buttons (BPLO)
- **Files:** `src/app/bplo/dashboard/page.tsx` (lines 195-210)
- **Used in:** BPLO Dashboard only
- **Change Scope:**
  - Add icons
  - Update button styling
  - Modify layout/spacing
  - Consider cards instead of buttons

#### 4. Empty States
- **Files:** `src/components/ui/empty-state.tsx`, inline patterns
- **Used in:** 6+ queue and list pages
- **Change Scope:**
  - Add icons
  - Update messaging
  - Modify styling/layout
  - Enhance CTA visibility

### MEDIUM PRIORITY CHANGES:

#### 5. Section Cards
- **Files:** `src/components/ui/section-card.tsx`
- **Used in:** 15+ page sections
- **Change Scope:**
  - Update border/shadow styles
  - Adjust padding/spacing
  - Modify header styling

#### 6. Info Banners
- **Files:** `src/components/ui/info-banner.tsx`
- **Used in:** 20+ locations
- **Change Scope:**
  - Add icons for each variant
  - Update color system
  - Improve accessibility

#### 7. Action Buttons
- **Files:** `src/components/ui/action-button.tsx`
- **Used in:** All pages
- **Change Scope:**
  - Update variant colors
  - Modify hover/focus states
  - Add icons if desired
  - Update disabled state styling

#### 8. Stat Cards (KPI Cards)
- **Files:** `src/components/ui/stat-card.tsx`
- **Used in:** All dashboards
- **Change Scope:**
  - Update color scheme
  - Modify layout
  - Enhance typography

### LOW PRIORITY CHANGES:

#### 9. Role Badges
- **Files:** `src/components/ui/role-badge.tsx`
- **Used in:** Page headers
- **Change Scope:** Minor styling

#### 10. Result Count Displays
- **Files:** Multiple page files (inline)
- **Used in:** Queue pages, dashboards
- **Change Scope:** Update messaging/styling

---

## 9. FILES TO EDIT FOR REDESIGN

### Component Files (First Edit):
1. `src/components/ui/status-badge.tsx` - Primary status display
2. `src/components/ui/page-header.tsx` - Page titles/headers
3. `src/components/ui/empty-state.tsx` - No data states
4. `src/components/ui/section-card.tsx` - Content containers
5. `src/components/ui/info-banner.tsx` - Messages/alerts
6. `src/components/ui/action-button.tsx` - Button styling
7. `src/components/ui/stat-card.tsx` - KPI displays
8. `src/components/ui/role-badge.tsx` - Role indicators

### Page Files (Second Edit - if needed):
1. `src/app/applicant/dashboard/page.tsx` - Layout/structure
2. `src/app/applicant/my-applications/page.tsx` - Table/layout
3. `src/app/bplo/dashboard/page.tsx` - Layout/shortcuts
4. `src/app/bplo/applications/page.tsx` - Queue layout
5. `src/app/bplo/payment-verification/page.tsx` - Tab layout
6. `src/app/bplo/permit-issuance/page.tsx` - Filter/list layout
7. `src/app/superadmin/dashboard/page.tsx` - Grid layout

### Application Component Files (If Needed):
1. `src/components/applicant/status-tracker.tsx` - Progress display
2. `src/components/applicant/dashboard-summary-card.tsx` - Wrapper
3. `src/components/applicant/status-badge.tsx` - Reexport

---

## 10. STYLING CONFIGURATION

### Current Color System (Tailwind):
- **Primary:** emerald (green)
- **Secondary:** slate (gray)
- **Status Colors:** 
  - Draft: slate, Blue: blue, Amber: amber
  - Indigo: indigo, Sky: sky
  - Teal: teal, Rose: rose
  - Green variants: emerald

### Button Variants Defined:
- **Primary:** emerald-700 bg, white text
- **Secondary:** slate border, white bg, slate text
- **Warning:** amber-600 bg, white text
- **Danger:** rose-700 bg, white text
- **Ghost:** transparent bg, slate text
- **ReadOnly:** slate-100 bg, slate text

### Spacing System:
- Section padding: `px-5 py-5 sm:px-6 sm:py-6`
- Gap sizes: gap-2, gap-3, gap-4, gap-6
- Border radius: rounded-xl, rounded-2xl

---

## Summary of Recommendations

### For UI/UX Redesign:
1. **Start with:** Status badges and page headers (most visible)
2. **Then update:** Button styling and empty states
3. **Follow with:** Section cards and info banners
4. **Finish with:** Supporting components

### Testing Locations:
- Pages to test after changes:
  1. `/applicant/dashboard`
  2. `/applicant/my-applications`
  3. `/bplo/dashboard`
  4. `/bplo/applications`
  5. `/bplo/payment-verification`
  6. `/bplo/permit-issuance`
  7. `/superadmin/dashboard`

---

**Document Version:** 1.0  
**Last Updated:** May 8, 2026
