# Change: Add Pricing Navigation and Complete Subscription Management UI

## Why

The platform has a comprehensive subscription backend (tiers, Stripe integration, webhooks) but lacks critical user-facing components:

1. **No pricing visibility**: Users cannot discover subscription options without navigating to a hidden URL (`/subscription-plans`)
2. **No header navigation**: The pricing page exists but isn't linked in the main navigation
3. **Incomplete subscription management**: Artists cannot easily upgrade, downgrade, or manage their subscriptions
4. **Missing feature gates**: No enforcement of subscription limits (bookings, portfolio items)
5. **Poor upgrade prompts**: No guidance when artists hit tier limits

This creates friction in the subscription funnel and reduces conversion from free to paid tiers.

## What Changes

### 1. Header Navigation Enhancement

- Add "Prețuri" (Pricing) link to main navigation between "Categorii" and "Despre Noi"
- Apply consistent styling and animations
- Include on both desktop and mobile menus
- Make it accessible to all users (authenticated and non-authenticated)

### 2. Subscription Management UI Completion

- Create current subscription status card showing:
  - Active tier name and badge
  - Billing period (monthly/annual)
  - Next billing date
  - Usage stats (bookings used, portfolio items)
- Single "Gestionează Abonamentul" button that redirects to Stripe Customer Portal
- All subscription changes (upgrade, downgrade, cancellation, payment methods) handled via Stripe Customer Portal
- Display subscription analytics (total spent, days remaining)

### 3. Feature Access Control

- Implement tier limit enforcement:
  - Block booking creation at monthly limit
  - Block portfolio upload at item limit
  - Hide premium features for lower tiers
- Add upgrade prompts when limits reached
- Show usage indicators throughout app
- Add progress bars for approaching limits

### 4. Email Notifications

- Subscription welcome email on first purchase
- Subscription renewal confirmation
- Payment failure notifications
- Feature limit warning emails (80% usage)

## Impact

### Affected Capabilities

- **navigation** (new) - Header navigation with pricing link
- **subscription-management** (new) - Artist subscription management UI
- **feature-access** (new) - Tier-based feature gating

### Affected Files

**Header & Navigation**:

- `src/components/Header.tsx` - Add pricing link
- `src/components/SimpleMobileMenu.tsx` - Add pricing link

**Subscription Management**:

- `src/components/subscription/SubscriptionStatusCard.tsx` (new)
- `src/components/subscription/UsageIndicator.tsx` (new)
- `src/components/artist/dashboard/SubscriptionSection.tsx` (enhance)
- `src/app/artist/dashboard/page.tsx` - Add subscription section

**API Routes**:

- `src/app/api/artist/subscription/route.ts` (new) - Get current subscription
- `src/app/api/bookings/route.ts` - Add tier limit checks
- `src/app/api/media/upload/route.ts` - Add tier limit checks

**Feature Gates**:

- `src/lib/stripe/feature-gates.ts` (enhance) - Tier limit validation
- `src/middleware.ts` - Server-side feature enforcement

**Email Templates**:

- `src/lib/email/templates/subscription-welcome.tsx` (new)
- `src/lib/email/templates/feature-limit-warning.tsx` (new)

### Breaking Changes

None. This is purely additive functionality.

## User Experience Impact

**Before**:

- Artists discover subscriptions by accident or never
- No clear path from free to paid
- Artists hit limits without warning
- Manual Stripe dashboard access needed for billing

**After**:

- Pricing prominently displayed in header
- Clear upgrade path with benefits explained
- Proactive limit warnings at 80% usage
- One-click access to Stripe Customer Portal for all subscription management
- Stripe handles all tier changes, cancellations, and billing updates

## Success Criteria

1. Header shows "Prețuri" link in navigation
2. Clicking pricing navigates to `/subscription-plans`
3. Artists can view current subscription status
4. Artists can access Stripe Customer Portal to manage subscriptions
5. All tier changes handled via Stripe Customer Portal
6. Feature limits are enforced (bookings, portfolio)
7. Upgrade prompts appear when limits approached
8. Welcome email sent on first subscription purchase
9. Usage indicators display throughout artist dashboard
10. Mobile navigation includes pricing link
