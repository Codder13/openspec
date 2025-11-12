# Project Context

## Purpose

**Alex-Test** is a Romanian artist booking platform that connects Romanian artists (musicians, DJs, bands) with clients for events like weddings (nuntă), baptisms (botez), anniversaries, and other celebrations. The platform provides:

- Artist discovery and search with filters (location, price, event type)
- Artist profiles with portfolios, availability calendars, and packages
- Booking management and payment processing
- Admin dashboard for platform management
- Google Calendar integration for artist availability
- Email notifications for bookings and updates

**Key Goals:**

- Simplify artist-client connections in the Romanian event market
- Provide transparent pricing and availability
- Enable seamless booking and payment flow
- Support Romanian localization (dates, currency, event types)

## Tech Stack

### Core Framework

- **Next.js 15.4.6** - App Router with React Server Components
- **React 19.1.0** - Latest React with strict TypeScript
- **TypeScript 5** - Strict mode enabled
- **Bun** - Package manager and runtime

### Database & ORM

- **PostgreSQL** - Primary database (via Supabase)
- **Drizzle ORM 0.44.6** - Type-safe database queries and schema management
- **Drizzle Kit** - Schema migrations and Drizzle Studio

### Authentication & Storage

- **Supabase** - Used ONLY for:
  - Authentication (sign up, sign in, sessions, password reset)
  - File storage (avatars, media uploads)
- **@supabase/ssr** - Server-side auth helpers

### UI & Styling

- **Tailwind CSS 4** - Utility-first styling with OKLCH color space
- **shadcn/ui** - Radix UI components (Alert Dialog, Avatar, Dialog, Select, Tabs, etc.)
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **next-themes** - Dark/light theme support

### Forms & Validation

- **React Hook Form** - Form state management
- **Zod 4.0.17** - Schema validation
- **@hookform/resolvers** - Form validation integration

### External Integrations

- **Stripe** - Payment processing (primary)
- **Google Calendar API** - Artist availability management
- **Resend** - Transactional emails with React Email templates
- **@aws-sdk/client-s3** - File uploads to S3-compatible storage

### Development Tools

- **Biome 2.2.4** - Linting and formatting (replaces ESLint + Prettier)
- **Vitest** - Unit testing with React Testing Library
- **Playwright** - E2E testing
- **Drizzle Studio** - Database GUI
- **Sentry** - Error tracking and monitoring
- **Vercel Analytics & Speed Insights** - Performance monitoring

### Build & Deploy

- **Turbopack** - Fast dev server bundler
- **Vercel** - Hosting and deployment
- **@next/bundle-analyzer** - Bundle size analysis

## Project Conventions

### Code Style

**Formatter: Biome**

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Line length**: No strict limit, but prefer readability
- **Semicolons**: Required
- **Import organization**: Manual (auto-organize disabled)

**Naming Conventions:**

- **Files**: kebab-case for all files (`artist-profile.tsx`, `booking-form.ts`)
- **Components**: PascalCase (`ArtistCard`, `ProfileHeader`)
- **Functions/Variables**: camelCase (`getUserProfile`, `bookingData`)
- **Types/Interfaces**: PascalCase (`User`, `BookingRequest`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_ROUTES`)
- **Database tables**: snake_case (`user_profiles`, `artist_packages`)

**Commands:**

```bash
bun lint    # Lint and auto-fix
bun format  # Format code
bun check   # Check without fixing
bun fix     # Lint and format together
```

### Architecture Patterns

**Core Principle: SIMPLE IS BEST**

- Prefer simple solutions over complex ones
- Remove complexity instead of adding band-aids
- Debug root causes, not symptoms
- **400-line limit per file** - Split larger files into focused modules

**Database Layer Architecture:**

- **ALL business logic queries use Drizzle ORM** - No direct SQL
- **Queries organized in domain modules** at `src/lib/db/queries/`
  - `artists.ts`, `bookings.ts`, `users.ts`, `profile.ts`, etc.
- **Supabase ONLY for auth and storage** - Never for business queries
- **No database queries in React components** - Use server actions or API routes
- **Schema defined in** `src/lib/drizzle/schema.ts`
- **Type-safe queries** with full TypeScript inference

**Query Organization Pattern:**

```typescript
// src/lib/db/queries/artists.ts
export async function getArtistById(id: string) {
  return db.query.artists.findFirst({
    where: eq(artists.id, id),
    with: { packages: true, reviews: true },
  });
}
```

**Component Structure:**

- **Server Components by default** - Use `"use client"` only when needed
- **Co-locate related files** - Group by feature, not by type
- **Modular components** - Single responsibility principle
- **UI components in** `src/components/ui/` (shadcn/ui)
- **Feature components** in feature folders (`admin/`, `profile/`, etc.)

**API Routes:**

- **RESTful conventions** where applicable
- **CSRF protection** for mutating operations (POST, PUT, DELETE)
- **Caching headers** for performance:
  - `NO_CACHE` - Real-time data (CSRF tokens)
  - `DYNAMIC` - User-specific data (availability)
  - `PRIVATE` - Authenticated data (user profiles)
- **Role-based access control** with middleware
- **Consistent error responses** with proper status codes

**State Management:**

- **Server state** - React Server Components and Server Actions
- **Client state** - React hooks (useState, useReducer)
- **Global auth state** - Context API (`AuthContext`)
- **Form state** - React Hook Form
- **URL state** - Next.js searchParams

### Testing Strategy

**Unit Tests (Vitest):**

- Test utility functions and business logic
- Mock database queries
- Run with `bun test:vi`
- Coverage reports with `bun test:coverage`
- UI available with `bun test:ui`

**E2E Tests (Playwright):**

- Test critical user flows (auth, booking, profile)
- Run against development server
- Multi-browser testing (Chromium, Firefox, WebKit)
- Commands:
  - `bun test:e2e` - Run all tests
  - `bun test:e2e:ui` - Interactive UI
  - `bun test:e2e:debug` - Debug mode
  - `bun test:e2e:headed` - Watch tests run
  - `bun test:e2e:codegen` - Generate test code

**Testing Priorities:**

1. Authentication flows (sign up, login, password reset)
2. Booking creation and management
3. Profile updates and avatar uploads
4. Admin CRUD operations
5. Search and filtering
6. Payment flows (when integrated)

**Testing Conventions:**

- Tests alongside source files or in `tests/` directory
- Descriptive test names explaining what's being tested
- Arrange-Act-Assert pattern
- Mock external services (Stripe, Google Calendar)

### Git Workflow

**Branch Strategy:**

- `master` - Production branch (deployed to Vercel)
- Feature branches for development work
- Direct commits to master for small fixes (currently)

**Commit Conventions:**

- Clear, descriptive commit messages
- Reference issue/task numbers when applicable
- Atomic commits (one logical change per commit)

**Development Workflow:**

1. Pull latest changes
2. Make changes following conventions
3. Run `bun check` to verify code quality
4. Test changes locally
5. Commit and push
6. Deploy via Vercel (automatic on push to master)

## Domain Context

**Romanian Event Market:**

- **Event Types**: nuntă (wedding), botez (baptism), aniversare (anniversary), petrecere (party), eveniment corporate (corporate event)
- **Artist Types**: DJ, formație (band), muzică live (live music), solist (soloist)
- **Regions**: Counties (județe) - București, Ilfov, Prahova, Brașov, etc.
- **Currency**: RON (Romanian Leu) - format: 1.500 RON or 1500 lei
- **Date Format**: DD.MM.YYYY or DD Month YYYY in Romanian

**User Roles:**

1. **Client** - Books artists for events, manages bookings
2. **Artist** - Creates profile, manages packages/availability, receives bookings
3. **Admin** - Manages platform, reviews artists, handles disputes

**Artist Profile Components:**

- Basic info (name, type, location, bio)
- Packages (different service tiers with pricing)
- Availability calendar (Google Calendar integration)
- Portfolio (photos, videos, demo tracks)
- Reviews and ratings
- Contact preferences

**Booking Flow:**

1. Client searches for artists
2. Client views artist profile and availability
3. Client selects package and date
4. Client submits booking request
5. Payment processing (Stripe/Netopia)
6. Artist receives notification
7. Booking confirmed or declined

**Admin Capabilities:**

- User management (view, edit, disable accounts)
- Artist verification and approval
- Category/event type management
- Review moderation
- Platform statistics and analytics
- Email template management

## Important Constraints

**Technical Constraints:**

- **400-line file limit** - Enforce by splitting large files
- **No database queries in client components** - Use server actions/API routes
- **Drizzle ORM required** - No raw SQL or Supabase client for business logic
- **CSRF tokens required** - For all mutating operations
- **Type safety** - Strict TypeScript, no `any` types
- **Bundle size** - Monitor with analyzer, code-split large dependencies

**Business Constraints:**

- **Romanian market only** - All content and localization in Romanian
- **Event-based booking** - Not a general marketplace
- **Payment integration required** - Cannot launch without payment processing
- **Artist verification** - Artists need approval before going live
- **Legal compliance** - GDPR compliance for user data

**Performance Constraints:**

- **First Contentful Paint** < 1.5s
- **Time to Interactive** < 3s
- **Lighthouse score** > 90
- **API response times** < 500ms for critical paths
- **Database query optimization** - Use indexes, avoid N+1 queries

**Security Constraints:**

- **Row Level Security (RLS)** enabled on all Supabase tables
- **CSRF protection** on all POST/PUT/DELETE endpoints
- **API rate limiting** for public endpoints
- **Input validation** with Zod schemas
- **Secure password handling** via Supabase Auth
- **Protected CRON endpoints** with secret validation

**Deployment Constraints:**

- **Vercel hosting** - Serverless functions
- **Environment variables** - Never commit secrets
- **Build memory** - 4GB max-old-space-size
- **Edge runtime** - Some routes use edge for lower latency
- **Database migrations** - Must be backwards compatible

## External Dependencies

**Critical Services:**

1. **Supabase** (Authentication & Storage)
   - Sign up, sign in, password reset
   - Session management with SSR
   - Avatar and media file storage
   - RLS policies for data security
   - Required for: User auth, file uploads

2. **Stripe** (Payment Processing)
   - Payment intent creation
   - Webhook handling for payment events
   - Customer and subscription management
   - Required for: Booking payments, artist payouts
   - Status: UI ready, backend integration needed

3. **Google Calendar API** (Artist Availability)
   - OAuth 2.0 authentication
   - Calendar event creation/updates
   - Free/busy time queries
   - Required for: Artist availability management
   - Credentials: OAuth client ID and secret

4. **Resend** (Email Service)
   - Transactional emails
   - React Email templates
   - Email tracking and analytics
   - Required for: Booking confirmations, notifications, password resets

5. **AWS S3** (File Storage - Optional)
   - Alternative to Supabase storage
   - Larger file support
   - CDN integration
   - Status: SDK included, not currently active

**Monitoring & Analytics:**

6. **Sentry** (Error Tracking)
   - Error and exception tracking
   - Performance monitoring
   - Release tracking
   - Optional but recommended for production

7. **Vercel Analytics & Speed Insights**
   - Real user monitoring
   - Core Web Vitals tracking
   - Deployment analytics
   - Included with Vercel hosting

**Development Services:**

8. **Drizzle Studio** (Database GUI)
   - Visual database browser
   - Query testing
   - Schema visualization
   - Run with: `bun db:studio`

9. **Biome** (Linting & Formatting)
   - Code quality checks
   - Auto-formatting
   - Import organization
   - Local tool, no external service

**API Rate Limits & Quotas:**

- **Google Calendar API**: 1,000,000 queries/day
- **Resend**: Based on plan (10,000 emails/month free tier)
- **Stripe**: No hard limits, but monitor for fraud
- **Supabase**: Based on plan (500MB database on free tier)

**Fallback Strategies:**

- **Email**: Log to console in development if Resend fails
- **Calendar**: Graceful degradation if Google Calendar unavailable
- **Payment**: Show error message, queue for retry
- **File Upload**: Fallback to base64 if S3/Supabase fails
