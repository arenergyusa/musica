# 🚀 MUSICA — Production-Ready AI Rules

> **Stack:** Next.js 14+ (App Router, SSR) · shadcn/ui · Tailwind CSS · Go · Nginx · PostgreSQL · Redis · Docker
> **Project:** RBF Investment Platform — INR only, Single Reward Wallet

---

## ⚠️ GOLDEN RULES (Read Before Everything)

1. **NEVER** use placeholder/dummy data — use realistic mock data matching business logic
2. **NEVER** skip loading states, error states, or empty states
3. **NEVER** hardcode colors — always Tailwind theme tokens
4. **NEVER** mix wallet types — single Reward Wallet only
5. **ALWAYS** gate investment routes behind KYC approval check
6. **ALWAYS** format currency as `₹1,00,000` (Indian number system)
7. **ALWAYS** use `Intl.NumberFormat('en-IN')` for currency display
8. **ALWAYS** write `"use client"` only when strictly needed (state/events/browser APIs)
9. **NEVER** expose backend URLs or secrets in client components
10. **ALWAYS** follow the exact folder structure — no deviations

---

## PART 1 — 🎨 FRONTEND (Next.js 14+)

### 1.1 Folder Structure

```
musica-frontend/
├── app/
│   ├── layout.tsx              # Root layout: ThemeProvider + Toaster + fonts
│   ├── page.tsx                # Landing page (SSR)
│   ├── globals.css             # Tailwind + shadcn CSS variables (Musica theme)
│   ├── not-found.tsx           # Branded 404
│   ├── error.tsx               # Global error boundary
│   ├── loading.tsx             # Root loading
│   ├── sitemap.ts
│   ├── robots.ts
│   │
│   ├── (auth)/                 # Public auth group
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── register/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── (user)/                 # Protected user group — requires login + KYC
│   │   ├── layout.tsx          # Sidebar + header layout
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── invest/
│   │   │   ├── page.tsx        # Browse plans
│   │   │   └── loading.tsx
│   │   ├── investments/
│   │   │   ├── page.tsx        # My investments
│   │   │   └── loading.tsx
│   │   ├── wallet/
│   │   │   ├── page.tsx        # Reward wallet + history
│   │   │   └── loading.tsx
│   │   ├── withdraw/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── team/
│   │   │   ├── page.tsx        # Downline tree + stats
│   │   │   └── loading.tsx
│   │   ├── income/
│   │   │   ├── page.tsx        # Income history (ROI / Referral / Level)
│   │   │   └── loading.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── kyc/
│   │       ├── page.tsx        # KYC upload — required before investing
│   │       └── loading.tsx
│   │
│   └── (admin)/                # Admin-only group
│       ├── layout.tsx
│       ├── admin/
│       │   ├── dashboard/page.tsx
│       │   ├── users/page.tsx
│       │   ├── investments/page.tsx
│       │   ├── withdrawals/page.tsx
│       │   ├── kyc/page.tsx
│       │   └── reports/page.tsx
│
├── components/
│   ├── ui/                     # shadcn auto-generated (DO NOT EDIT)
│   ├── layout/
│   │   ├── Navbar.tsx          # Public navbar
│   │   ├── Sidebar.tsx         # Dashboard sidebar
│   │   ├── DashboardHeader.tsx
│   │   └── Footer.tsx
│   ├── shared/
│   │   ├── RewardWalletCard.tsx
│   │   ├── CapProgressBar.tsx
│   │   ├── InvestmentCard.tsx
│   │   ├── StatCard.tsx
│   │   ├── CurrencyDisplay.tsx # Always formats INR
│   │   ├── PageHeader.tsx
│   │   ├── EmptyState.tsx
│   │   └── DataTable.tsx
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── InvestForm.tsx
│   │   ├── WithdrawForm.tsx
│   │   └── KycUploadForm.tsx
│   └── charts/
│       ├── IncomeChart.tsx     # Daily income line chart
│       ├── CapGaugeChart.tsx   # Radial cap progress
│       └── TeamVolumeChart.tsx
│
├── lib/
│   ├── utils.ts                # cn() helper
│   ├── api.ts                  # Axios/fetch client with interceptors
│   ├── auth.ts                 # Session helpers
│   ├── validators.ts           # All Zod schemas
│   ├── constants.ts            # Plans, cap rates, dates
│   └── formatters.ts           # INR formatter, date formatter
│
├── hooks/
│   ├── useWallet.ts
│   ├── useInvestments.ts
│   ├── useTeam.ts
│   └── useAuth.ts
│
├── types/
│   ├── user.ts
│   ├── investment.ts
│   ├── wallet.ts
│   ├── team.ts
│   └── api.ts                  # API response types
│
└── public/
    ├── og-image.png
    └── logo.svg
```

---

### 1.2 Musica Design System (Dark Theme — Default)

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71% 4%;
    --card: 0 0% 100%;
    --card-foreground: 224 71% 4%;
    --primary: 262 83% 58%;        /* Purple — Musica brand */
    --primary-foreground: 210 40% 98%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 220 9% 46%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 142 76% 36%;         /* Green — earnings/success */
    --accent-foreground: 355 100% 97%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 220 13% 91%;
    --ring: 262 83% 58%;
    --radius: 0.75rem;
    --warning: 38 92% 50%;         /* Amber — pending states */
  }

  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --card: 224 71% 6%;
    --card-foreground: 213 31% 91%;
    --primary: 262 83% 65%;
    --primary-foreground: 224 71% 4%;
    --secondary: 223 47% 11%;
    --secondary-foreground: 215 20% 65%;
    --muted: 223 47% 11%;
    --muted-foreground: 215 20% 65%;
    --accent: 142 70% 45%;
    --accent-foreground: 224 71% 4%;
    --destructive: 0 63% 55%;
    --destructive-foreground: 210 40% 98%;
    --border: 216 34% 17%;
    --ring: 262 83% 65%;
    --warning: 38 92% 50%;
  }
}
```

**Design Principles:**
- **Dark mode by default** — `<ThemeProvider defaultTheme="dark">`
- **Brand colors:** Purple (primary), Green (income/success), Amber (pending)
- **Glassmorphism panels:** `bg-card/60 backdrop-blur-xl border border-border/40`
- **Gradient headers:** `bg-gradient-to-br from-primary/20 via-background to-accent/10`
- **Card hover:** `hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all`
- **Font:** `Inter` via `next/font/google` — no CDN
- **INR display:** ALWAYS `₹1,00,000` format (Indian system, NOT `₹100,000`)

---

### 1.3 SSR Rules

- Server Components by default — no `"use client"` unless needed
- `"use client"` ONLY for: state, events, browser APIs, shadcn interactive components
- Data fetching in Server Components via `async/await fetch()`
- `generateMetadata()` for every page (unique title + description)
- `loading.tsx` + `error.tsx` for every route segment
- `Suspense` for streaming heavy sections
- Cache: `{ next: { revalidate: 60 } }` for public data, `cache: 'no-store'` for user data

---

### 1.4 Required Libraries

| Library | Purpose |
|---------|---------|
| `shadcn/ui` (New York style) | All UI primitives |
| `sonner` | Toast notifications |
| `react-hook-form` | Form state |
| `zod` | Schema validation |
| `@hookform/resolvers` | Zod bridge |
| `framer-motion` | Animations |
| `recharts` | Income/analytics charts |
| `next-themes` | Dark/light mode |
| `lucide-react` | Icons (auto with shadcn) |
| `nuqs` | URL search params (filters, pagination) |
| `axios` | API client with interceptors |
| `date-fns` | Date formatting (Indian format) |

**shadcn init:**
```bash
npx shadcn@latest init
# Style: New York | Base color: Violet | CSS variables: Yes

npx shadcn@latest add button card dialog input label select
npx shadcn@latest add table tabs separator badge avatar
npx shadcn@latest add form skeleton alert-dialog tooltip
npx shadcn@latest add dropdown-menu sheet popover progress
npx shadcn@latest add sonner
```

---

### 1.5 Musica-Specific Component Rules

**Currency Display — MANDATORY:**
```typescript
// lib/formatters.ts
export const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
// Output: ₹1,00,000.00
```

**Cap Progress Bar:**
```typescript
// Always show: earned / cap_limit with color coding
// < 70%  → green (accent)
// 70-90% → amber (warning)
// > 90%  → red (destructive)
```

**KYC Gate (Investment routes):**
```typescript
// middleware.ts or layout.tsx
// If user.kyc_status !== 'APPROVED' → redirect to /kyc
// Show banner: "Complete KYC to start investing"
```

**Wallet Card:**
- Show balance with eye icon toggle (hide/show)
- Show total earned, total withdrawn
- Show next withdrawal date

**Investment Status Badge:**
```typescript
// ACTIVE  → green badge
// CLOSED  → muted badge
// CAPPED  → amber badge with "Cap Reached"
```

---

### 1.6 Form Pattern (All Forms Must Follow)

```typescript
// 1. Zod schema in lib/validators.ts
export const investSchema = z.object({
  plan_id: z.string().uuid(),
  amount: z.number().min(10000, "Minimum ₹10,000"),
});

// 2. Form component
const form = useForm<z.infer<typeof investSchema>>({
  resolver: zodResolver(investSchema),
  defaultValues: { plan_id: "", amount: 0 },
});

// 3. Submit with Sonner toast.promise()
const onSubmit = (data: z.infer<typeof investSchema>) => {
  toast.promise(createInvestment(data), {
    loading: "Processing investment...",
    success: "Investment created successfully!",
    error: (err) => err.message || "Something went wrong",
  });
};
```

---

### 1.7 API Client

```typescript
// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Auto-attach JWT
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await refreshToken();
      return api(err.config);
    }
    return Promise.reject(err);
  }
);
```

---

### 1.8 Page Rules (ALL pages must have)

- ✅ Unique `generateMetadata()` with title + description
- ✅ `<main>` semantic wrapper
- ✅ `loading.tsx` with `<Skeleton>` matching page layout
- ✅ `error.tsx` with retry button
- ✅ Empty state component when no data
- ✅ Responsive: mobile (320px) → desktop (1920px)
- ✅ Framer Motion page entrance: `opacity: 0→1, y: 20→0, duration: 0.3s`
- ✅ Toast for all async actions
- ✅ No raw error messages to user

---

### 1.9 Animation Standards

```typescript
// Page entrance (every page)
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Stagger children (lists/cards)
const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// Card entrance
const cardVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};
```

---

### 1.10 SEO (Every Page)

```typescript
export const metadata: Metadata = {
  metadataBase: new URL("https://musica.in"),
  title: { default: "Musica — RBF Investment Platform", template: "%s | Musica" },
  description: "Invest in entertainment production via RBF agreements. Earn daily rewards up to 3x.",
  keywords: ["RBF investment", "revenue based financing", "music investment India", "daily ROI"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Musica",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Musica RBF Platform" }],
  },
  twitter: { card: "summary_large_image", creator: "@musicainvest" },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://musica.in" },
};
```

**SEO Rules (MANDATORY):**
- Every page → unique `title` + `description` via `generateMetadata()` — no duplicates
- Single `<h1>` per page, proper `h1 > h2 > h3` hierarchy — NEVER skip levels
- Semantic HTML: `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`, `<aside>`
- All `<Image>` tags → descriptive `alt` text (not "image" or empty for content images)
- `app/sitemap.ts` → auto-generate XML sitemap with lastModified dates
- `app/robots.ts` → block `/admin/*`, allow `/` crawl
- Canonical URL on every page to prevent duplicate content
- JSON-LD structured data on landing page (Organization schema)
- Lazy load below-fold images → `loading="lazy"` / `priority` only for LCP image
- Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 🎨 PART 1B — DESIGNER SKILLS

### 1.11 UI/UX Design Standards

**Visual Hierarchy:**
- Use 4-level type scale: `text-xs` (helper), `text-sm` (body), `text-base` (default), `text-lg+` (headings)
- Font weight rhythm: 400 (body), 500 (label/caption), 600 (subheading), 700 (heading), 800 (hero)
- Spacing scale: 4px base unit → use `p-2(8px)`, `p-4(16px)`, `p-6(24px)`, `p-8(32px)` consistently
- Visual flow: F-pattern for dashboards, Z-pattern for marketing pages
- Color contrast must meet WCAG AA minimum (4.5:1 for text)

**Musica Design Language:**
```typescript
// Premium card style (use for all data cards)
const cardClass = "bg-card/60 backdrop-blur-xl border border-border/40 rounded-xl p-6 "
  + "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300";

// Gradient backgrounds (use for page/section headers)
const heroGradient = "bg-gradient-to-br from-primary/20 via-background to-accent/10";

// Stat numbers (income/investment amounts)
const statClass = "text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent";

// Status pills
const pills = {
  active:  "bg-accent/15 text-accent border border-accent/30",
  pending: "bg-warning/15 text-warning border border-warning/30",
  capped:  "bg-destructive/15 text-destructive border border-destructive/30",
  closed:  "bg-muted text-muted-foreground",
};
```

**Component Design Rules:**
- **Buttons:** Primary (solid purple), Secondary (outline), Destructive (red outline) — no custom button styles
- **Forms:** Label above input, helper text below, error message in destructive color, 44px min height
- **Tables:** Striped rows (`bg-muted/30` on even), sticky header, sortable columns with icon indicator
- **Charts:** Use Musica color palette (primary/accent/warning), legend below on mobile, tooltips on hover
- **Modals:** Max-width `max-w-md`, backdrop blur, focus trap, close on Escape + outside click
- **Empty States:** Illustrated SVG icon + title + description + CTA button — never just text
- **Loading States:** Skeleton matching exact layout shape — not generic spinner for full pages

**Responsive Design Grid:**
```typescript
// Dashboard layout pattern
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">  // Stat cards
<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">              // Main + sidebar
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">              // Two-column forms
```
- Mobile (320-639px): Single column, bottom navigation, collapsed sidebar
- Tablet (640-1023px): 2-column grids, condensed sidebar
- Desktop (1024px+): Full sidebar, 4-column stat grid, data-dense layouts
- Touch targets: min `44×44px` on all interactive elements
- No horizontal scroll on ANY viewport

**Micro-Interactions (MANDATORY):**
```typescript
// Button press feedback
"active:scale-[0.98] transition-transform"

// Card hover lift
"hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"

// Input focus ring (already in shadcn via --ring)
"focus-visible:ring-2 focus-visible:ring-primary"

// Number counter animation (for stats)
import { useEffect, useRef } from 'react';
// Animate from 0 to target value on mount

// Copy to clipboard feedback
toast.success("Copied!", { duration: 1500 });
```

**Dark Mode Design Checklist:**
- [ ] All shadows use `shadow-primary/10` (colored) not `shadow-black`
- [ ] Icons: `text-muted-foreground` for secondary, `text-primary` for active
- [ ] Borders: `border-border/40` (subtle) for cards, `border-border` for inputs
- [ ] Backgrounds: card-on-card → `bg-muted/30` for nested containers
- [ ] Code/data: monospace font (`font-mono`) with `text-accent` tint

---

## ⚡ PART 1C — PERFORMANCE SKILLS

### 1.12 Performance Optimization Rules

**Lighthouse Targets (non-negotiable):**
| Metric | Target |
|--------|--------|
| Performance | ≥ 90 |
| SEO | ≥ 95 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| LCP | < 2.5s |
| CLS | < 0.1 |
| FID/INP | < 100ms |

**Bundle Optimization:**
```typescript
// next.config.ts — mandatory config
const nextConfig = {
  experimental: { optimizePackageImports: ["lucide-react", "recharts", "framer-motion"] },
  images: { formats: ["image/avif", "image/webp"] },
  compress: true,
};

// Dynamic import heavy components
const IncomeChart = dynamic(() => import("@/components/charts/IncomeChart"), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});

const DataTable = dynamic(() => import("@/components/shared/DataTable"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});
```

**Image Optimization:**
```typescript
// Always use next/image — NEVER <img> tag
<Image
  src="/og-image.png"
  alt="Musica Dashboard"
  width={1200}
  height={630}
  priority          // Only for above-fold LCP image
  placeholder="blur"
  blurDataURL="data:image/..."
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Font Loading:**
```typescript
// app/layout.tsx — preload critical font
import { Inter } from "next/font/google";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",     // Prevent FOIT
  variable: "--font-inter",
  preload: true,
});
```

**Data Fetching Performance:**
```typescript
// Parallel fetching (do NOT waterfall)
const [user, wallet, investments] = await Promise.all([
  fetchUser(userId),
  fetchWallet(userId),
  fetchInvestments(userId),
]);

// Cache public/rarely-changed data
fetch(url, { next: { revalidate: 300 } });  // 5 min cache

// No cache for user-specific financial data
fetch(url, { cache: 'no-store' });
```

**React Performance:**
```typescript
// Memoize ONLY for measurable bottlenecks (DataTable rows, Chart data)
const processedData = useMemo(() => transformInvestments(raw), [raw]);

// Virtualize long lists (> 100 items)
import { useVirtualizer } from '@tanstack/react-virtual';

// Debounce search inputs
const debouncedSearch = useDebounce(searchTerm, 300);
```

**API Performance:**
- Paginate ALL list endpoints — max 50 items/page for dashboard tables
- Use `nuqs` for URL-driven filters/pagination (zero extra API calls on filter)
- Optimistic UI updates for toggle/status actions (update cache first, revert on error)
- Prefetch next page data on user hover of "Next" button

---

## 🔒 PART 1D — SECURITY SKILLS

### 1.13 Frontend Security Rules

**Input Sanitization & Validation:**
```typescript
// ALWAYS validate on both client (UX) AND server (security)
// lib/validators.ts — Zod schemas used for both

export const withdrawSchema = z.object({
  amount: z.number()
    .min(1000, "Minimum ₹1,000")
    .max(1000000, "Maximum ₹10,00,000 per request")
    .int("Must be whole number"),
  bank_account_id: z.string().uuid("Invalid account"),
});

// Never trust server response — validate with safeParse
const result = WalletResponseSchema.safeParse(apiResponse);
if (!result.success) {
  toast.error("Data integrity error — contact support");
  return;
}
```

**Authentication Security:**
```typescript
// Auto-logout on token expiry (interceptor in lib/api.ts)
api.interceptors.response.use(null, async (err) => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true;
    try {
      await refreshToken();
      return api(err.config);
    } catch {
      clearSession(); // Clear tokens
      router.push('/login?expired=true');
    }
  }
  return Promise.reject(err);
});

// NEVER store JWT in localStorage — use httpOnly cookies via backend
// Session token in memory only (zustand store, cleared on tab close)
```

**XSS Prevention:**
```typescript
// NEVER use dangerouslySetInnerHTML unless sanitized
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userContent);
<div dangerouslySetInnerHTML={{ __html: clean }} />

// Never render user input directly in URLs
const safeUrl = encodeURIComponent(userInput);

// Never eval() user data — use JSON.parse() with try-catch
```

**Content Security Policy (via next.config.ts):**
```typescript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';  // Next.js requires these
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  font-src 'self' fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self' https://api.musica.in;
`;
```

**Sensitive Data Handling:**
- Balance amounts → blur/hide behind eye-icon toggle by default
- PAN / Aadhaar → mask display (`XXXX-XXXX-1234`)
- Bank account → show last 4 digits only in UI
- NEVER log user financial data to console in production
- Clear clipboard after 30s if user copies sensitive data
- `autocomplete="off"` on OTP/PIN inputs

**CSRF & Request Security:**
```typescript
// Include CSRF token on all state-changing requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  const csrfToken = getCsrfToken(); // From cookie set by server
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  return config;
});
```

**KYC Security Rules:**
- KYC document previews → signed URLs only (15min expiry)
- Never store KYC images in browser localStorage or IndexedDB
- File upload → validate type + size on client before upload
- Show progress but mask file name after successful upload
- Admin KYC pages → additional PIN confirmation before approve/reject

**Route Protection (middleware.ts):**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const path = request.nextUrl.pathname;

  // Auth check
  if (path.startsWith('/(user)') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin check
  if (path.startsWith('/(admin)') && !isAdmin(token)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // KYC gate (for investment routes)
  if (path.includes('/invest') && !isKycApproved(token)) {
    return NextResponse.redirect(new URL('/kyc', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(user)/:path*', '/(admin)/:path*'],
};
```

---

## ♿ PART 1E — ACCESSIBILITY SKILLS

### 1.14 Accessibility (WCAG 2.1 AA) Rules

**Color & Contrast:**
- Text on background: ≥ 4.5:1 contrast ratio (WCAG AA)
- Large text (18px+ or 14px bold): ≥ 3:1 ratio
- UI components (buttons, inputs, focus rings): ≥ 3:1
- NEVER convey meaning through color alone (add icon/text)
- Check all Musica theme colors in dark AND light mode

**Keyboard Navigation:**
```typescript
// Every interactive element must be keyboard reachable
// shadcn handles this for: Dialog, DropdownMenu, Select, Tooltip, etc.

// Skip-to-content link (MANDATORY — add to root layout)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
             focus:rounded-md focus:outline-none"
>
  Skip to main content
</a>
<main id="main-content">{children}</main>

// Focus trap in modals (shadcn Dialog does this automatically)
// Tab order follows visual order — no tabIndex > 0
// Escape closes all modals/dropdowns
```

**Semantic HTML (MANDATORY):**
```typescript
// Correct structure for every dashboard page
<>
  <header role="banner">    {/* DashboardHeader */}
  <nav aria-label="Main navigation">{/* Sidebar */}</nav>
  <main id="main-content" aria-label="Dashboard">  {/* Page content */}
    <h1>Dashboard</h1>  {/* ONE h1 only */}
    <section aria-labelledby="wallet-heading">
      <h2 id="wallet-heading">Reward Wallet</h2>
    </section>
  </main>
  <footer role="contentinfo">{/* Footer */}</footer>
</>
```

**ARIA Labels & Roles:**
```typescript
// Icon-only buttons MUST have aria-label
<Button variant="ghost" size="icon" aria-label="Hide wallet balance">
  <EyeOff className="h-4 w-4" aria-hidden="true" />
</Button>

// Dynamic content updates — announce to screen readers
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Loading states
<div role="status" aria-label="Loading investments...">
  <Skeleton className="h-64 w-full" />
</div>

// Data tables
<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Date</TableHead>
      <TableHead scope="col">Amount</TableHead>
    </TableRow>
  </TableHeader>
</Table>

// Progress bars
<div
  role="progressbar"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Cap progress: 75%"
>
  <CapProgressBar value={75} />
</div>
```

**Forms Accessibility:**
```typescript
// Every input MUST have associated label (shadcn FormLabel does this)
<FormField name="amount" render={({ field }) => (
  <FormItem>
    <FormLabel htmlFor="invest-amount">Investment Amount</FormLabel>
    <FormControl>
      <Input
        id="invest-amount"
        type="number"
        aria-describedby="amount-hint amount-error"
        aria-invalid={!!form.formState.errors.amount}
        {...field}
      />
    </FormControl>
    <p id="amount-hint" className="text-xs text-muted-foreground">
      Minimum ₹10,000
    </p>
    <FormMessage id="amount-error" />
  </FormItem>
)} />

// Required fields
<FormLabel>
  Amount <span aria-hidden="true" className="text-destructive">*</span>
  <span className="sr-only">(required)</span>
</FormLabel>
```

**Motion & Animation Accessibility:**
```typescript
// Respect prefers-reduced-motion (MANDATORY in all animated components)
import { useReducedMotion } from 'framer-motion';

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Also add to globals.css as fallback:
// @media (prefers-reduced-motion: reduce) {
//   *, *::before, *::after { animation-duration: 0.01ms !important; }
// }
```

**Images & Media:**
```typescript
// Content images — descriptive alt
<Image src="/kyc-guide.png" alt="KYC document upload guide showing front and back of ID" />

// Decorative images — empty alt (screen reader skips)
<Image src="/decoration.svg" alt="" role="presentation" />

// Charts — text alternative for data
<figure aria-label="Income chart">
  <IncomeChart data={incomeData} />
  <figcaption className="sr-only">
    Monthly income from January to {currentMonth}: total ₹{totalIncome}
  </figcaption>
</figure>
```

**Accessibility Testing Checklist (before every PR):**
- [ ] Keyboard tab through entire page — focus visible at all times
- [ ] All modals/dialogs trap focus and close on Escape
- [ ] Screen reader test: VoiceOver (Mac) or NVDA (Windows)
- [ ] No color-only information conveyance
- [ ] `axe-core` / Lighthouse accessibility audit → 0 critical issues
- [ ] All form fields have labels and error messages
- [ ] Skip-to-content link present in root layout
- [ ] All images have appropriate alt text
- [ ] ARIA live regions for dynamic content
- [ ] Reduced motion respected

---

## PART 2 — ⚙️ BACKEND (Go)

### 2.1 Folder Structure

```
musica-backend/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go
│   ├── handler/
│   │   ├── auth.go
│   │   ├── user.go
│   │   ├── investment.go
│   │   ├── wallet.go
│   │   ├── withdrawal.go
│   │   ├── team.go
│   │   ├── income.go
│   │   └── admin.go
│   ├── middleware/
│   │   ├── auth.go        # JWT validation
│   │   ├── kyc.go         # KYC gate middleware
│   │   ├── admin.go       # Admin role check
│   │   ├── ratelimit.go
│   │   └── logger.go
│   ├── model/             # DB structs
│   ├── repository/        # DB queries only
│   ├── service/           # Business logic
│   ├── cache/             # Redis ops
│   ├── cron/              # All cron jobs
│   │   ├── daily_roi.go
│   │   ├── level_income.go
│   │   ├── cap_check.go
│   │   ├── volume_sync.go
│   │   └── withdrawal_process.go
│   └── validator/
├── pkg/
│   ├── response/          # Standard envelope
│   ├── errors/
│   └── utils/
├── migrations/
└── Dockerfile
```

### 2.2 Architecture: Handler → Service → Repository

- **Handler:** Parse request → validate → call service → return response
- **Service:** Business logic only — NO DB calls, NO HTTP
- **Repository:** DB queries only — NO business logic
- **Interfaces** for DI — testable with mocks

### 2.3 API Response Format

```json
{ "success": true, "data": {}, "meta": { "page": 1, "total": 150 } }
{ "success": false, "error": { "code": "KYC_REQUIRED", "message": "Complete KYC to invest" } }
```

**Error Codes (Musica-specific):**
```
KYC_REQUIRED        → 403 (user tries to invest without KYC)
CAP_REACHED         → 400 (investment already capped)
REFERRAL_INVALID    → 400 (invalid referral code on register)
WITHDRAWAL_DATE     → 400 (withdrawal outside 10th/20th/30th)
MIN_WITHDRAWAL      → 400 (amount < ₹1000)
```

### 2.4 Security

- JWT RS256: 15min access + 7d refresh
- KYC middleware gate on all `/investment/*` routes
- Admin middleware on all `/admin/*` routes
- `bcrypt` cost=12 for passwords
- Rate limit: auth 5/min, general 100/min (Redis sliding window)
- All KYC files stored in MinIO with signed URLs (not public)
- PAN + Aadhaar encrypted at rest (AES-256)

### 2.5 Cron Jobs (Go Cron)

```go
// Using robfig/cron
c := cron.New()
c.AddFunc("0 0 * * *",   dailyROIJob)       // 12:00 AM
c.AddFunc("5 0 * * *",   levelIncomeJob)    // 12:05 AM
c.AddFunc("10 0 * * *",  capCheckJob)       // 12:10 AM
c.AddFunc("15 0 * * *",  volumeSyncJob)     // 12:15 AM
c.AddFunc("20 0 * * *",  workingStatusJob)  // 12:20 AM
c.AddFunc("0 9 10,20,30 * *", withdrawalJob) // 9 AM on 10/20/30
```

---

## PART 3 — 🗄️ DATABASE (PostgreSQL)

### Rules
- UUID v4 for all PKs
- All tables: `id, created_at, updated_at, deleted_at(nullable)`
- `TIMESTAMPTZ` only — never bare `TIMESTAMP`
- FK with explicit `ON DELETE` (RESTRICT for financial records)
- Parameterized queries: `$1, $2, $3`
- Transactions for: invest, reward distribution, withdrawal
- Index: all FKs, `status` columns, `date` columns
- Statement timeout: 5s

### Migration Naming
```
001_create_users.up.sql / .down.sql
002_create_investment_plans.up.sql
003_create_investments.up.sql
004_create_reward_wallet.up.sql
005_create_transactions.up.sql
006_create_referral_tree.up.sql
007_create_income_logs.up.sql
008_create_withdrawals.up.sql
009_create_cap_tracker.up.sql
010_create_kyc_documents.up.sql
```

---

## PART 4 — ⚡ REDIS

- Key pattern: `musica:{entity}:{id}`
- Sessions: `musica:session:{user_id}` TTL 7d
- Rate limit: `musica:rate:{ip}:{endpoint}` TTL 60s
- Downline volume cache: `musica:volume:{user_id}` TTL 24h (invalidate after cron)
- Wallet balance cache: `musica:wallet:{user_id}` TTL 60s
- Eviction: `allkeys-lru`
- Redis failure: gracefully fallback to DB

---

## PART 5 — 🌐 NGINX

- HTTPS enforced (HTTP → HTTPS redirect)
- HTTP/2 enabled
- Gzip on text/json responses
- `client_max_body_size 10M` (KYC document uploads)
- Rate limiting layer (defense in depth)
- Block `/.env`, `/.git`, `/admin` (non-admin IPs)
- Security headers on all responses
- Separate upstreams: `frontend:3000`, `backend:8080`

---

## PART 6 — 🐳 DOCKER

### docker-compose.yml structure
```yaml
services:
  nginx:       # Port 80/443 → routes to frontend/backend
  frontend:    # Next.js (port 3000, internal)
  backend:     # Go API (port 8080, internal)
  postgres:    # PostgreSQL 16 (port 5432, dbnet only)
  redis:       # Redis 7 (port 6379, dbnet only)
  minio:       # MinIO S3 (port 9000, internal)

networks:
  webnet:      # nginx ↔ frontend ↔ backend
  dbnet:       # backend ↔ postgres ↔ redis ↔ minio

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

- Multi-stage builds: Go < 50MB, Next.js < 200MB
- Non-root user in all containers
- Health checks on all services
- `restart: always`
- `.env` file only — no hardcoded secrets

---

## PART 7 — 🔒 ENVIRONMENT & SECRETS

```env
# .env.example (commit this)
DATABASE_URL=postgres://user:pass@postgres:5432/musica
REDIS_URL=redis://redis:6379
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
NEXT_PUBLIC_API_URL=https://api.musica.in
```

- Never commit `.env`
- 32+ char random passwords
- Rotate JWT keys every 90 days
- Different creds per environment

---

## PART 8 — 🧪 TESTING

### Frontend
- Vitest + React Testing Library for components
- Playwright for E2E: login → KYC → invest → withdraw flow
- MSW for API mocking
- Test: loading state, error state, empty state, success state

### Backend
- Table-driven unit tests for all service functions
- Integration tests with testcontainers (real PG + Redis)
- Test all business logic: cap calculation, level income, working status
- Test middleware: no KYC → 403, no admin role → 403

---

## PART 9 — 📦 GIT & CI/CD

```
main      → production
develop   → staging
feature/* → new features
fix/*     → bug fixes
hotfix/*  → production emergency
```

**Commit format:**
```
feat(invest): add multi-plan investment support
fix(cron): fix level income for L11-L15 range
chore(db): add index on investments.status
```

**GitHub Actions stages:**
1. Lint (ESLint + golangci-lint)
2. Unit tests (parallel)
3. Build Docker images
4. Integration tests
5. Push to registry
6. Deploy staging (auto) → production (manual)

---

## PART 10 — 📊 MONITORING

- Prometheus metrics: `/metrics` (backend)
- Grafana dashboards: daily ROI distributed, withdrawals processed, cap breaches
- Alert: error rate > 5% for 5min, p95 latency > 2s
- Cron job success/failure logged and alerted
- SSL expiry alert < 14 days

---

> **Follow these rules strictly for every file generated in the Musica project.**
> **Part 1 (Frontend) is the first deliverable — complete all pages before backend.**
