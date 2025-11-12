# Change: Remove Stripe Webhooks and Use Foreign Data Wrapper Tables

## Why

The current implementation uses webhook-based synchronization to keep local `artist_subscriptions` and `stripe_customers` tables in sync with Stripe data. This creates several problems:

1. **Data Duplication**: Stripe data is copied into local PostgreSQL tables, creating two sources of truth
2. **Sync Complexity**: Webhook handlers contain complex logic to maintain data consistency (250+ lines in `webhooks.ts`)
3. **Sync Lag**: Updates take time to propagate through webhooks, creating temporary inconsistencies
4. **Failure Points**: Network issues, webhook signature failures, or processing errors cause data drift
5. **Maintenance Burden**: Every Stripe schema change requires webhook handler updates
6. **Unnecessary Infrastructure**: Webhook endpoints, idempotency tracking, and retry logic add complexity

The Stripe Foreign Data Wrapper (FDW) integration already exists in the database and provides **always-accurate, real-time access** to Stripe data through `public.stripe_customers`, `public.stripe_subscriptions`, `public.stripe_products`, and `public.stripe_prices` tables. The existing `user_stripe_sync` view and database functions like `get_user_subscription_status()` already demonstrate this working pattern.

By removing webhooks and local replication tables, we simplify the architecture while improving data accuracy and reducing maintenance.

## What Changes

### REMOVED Infrastructure

- **Webhook endpoint**: `src/app/api/stripe/webhooks/route.ts` (150+ lines)
- **Webhook handlers**: `src/lib/stripe/webhooks.ts` (500+ lines)
- **Local replication tables**: `artist_subscriptions`, `stripe_customers` (database schema)
- **Webhook tracking table**: `stripe_webhook_events` (no longer needed)
- **Webhook-related migrations**: Clean up webhook event tracking

### MODIFIED Queries

- **Subscription queries**: `src/lib/stripe/queries.ts` - Replace `artistSubscriptions` joins with FDW views
- **Subscription functions**: `src/lib/stripe/subscriptions.ts` - Use FDW views instead of local tables
- **Analytics**: `src/lib/stripe/analytics.ts` - Query FDW tables directly
- **Customer portal**: `src/lib/stripe/portal.ts` - Get customer ID from FDW views

### ADDED Functionality

- **FDW query helpers**: Standardized functions for querying `public.stripe_*` tables
- **Metadata tracking table**: Minimal table to store `artistId` ↔ `stripeCustomerId` mapping
- **Direct Stripe writes**: Use Stripe SDK for all create/update/delete operations
- **Migration utilities**: Scripts to verify data consistency during migration

### Architecture Change

**Before (Webhook-based)**:

```
Stripe API → Webhook → Local DB Tables → Application Queries
           ↑ async, can fail
```

**After (FDW-based)**:

```
Application Queries → FDW Views → Stripe API (read-only)
Application Writes → Stripe SDK → Stripe API (direct)
```

## Impact

### Affected Specifications

- **stripe-integration**: Complete redesign of sync mechanism
- **subscription-management**: Queries and state management changes
- **payment-processing**: Simplified payment intent handling (no webhook updates needed)

### Affected Code

- `src/lib/stripe/webhooks.ts` - **DELETE** (500+ lines removed)
- `src/app/api/stripe/webhooks/route.ts` - **DELETE** (150+ lines removed)
- `src/lib/stripe/queries.ts` - **MODIFY** (replace joins with FDW views)
- `src/lib/stripe/subscriptions.ts` - **MODIFY** (use FDW, write to Stripe SDK directly)
- `src/lib/stripe/sync.ts` - **ENHANCE** (already uses FDW, add write helpers)
- `src/lib/stripe/analytics.ts` - **MODIFY** (query FDW tables)
- `src/lib/stripe/portal.ts` - **MODIFY** (get customer from FDW)
- `supabase/migrations/` - **ADD** migration to drop old tables and create metadata table

### Breaking Changes

- **BREAKING**: Webhook endpoint `/api/stripe/webhooks` removed - Stripe webhook configuration must be disabled
- **BREAKING**: `artistSubscriptions` table removed - All subscription queries must use FDW views
- **BREAKING**: `stripeCustomers` table removed - All customer lookups must use FDW views
- **BREAKING**: `stripe_webhook_events` table removed - Webhook event history is lost (audit trail change)

### Data Migration

- Export existing `artistId` ↔ `stripeCustomerId` mappings before dropping tables
- Create new `stripe_metadata` table with minimal tracking data
- Verify all active subscriptions are accessible via FDW before cutover
- No data loss for Stripe data (always in Stripe, now accessed directly)

### Performance Impact

- **Positive**: No webhook processing overhead
- **Positive**: No database writes for subscription updates
- **Neutral**: FDW queries have similar latency to local joins (Stripe API is the bottleneck either way)
- **Positive**: Reduced database storage (no duplicate Stripe data)
- **Consideration**: FDW reads hit Stripe API - existing caching patterns remain important

### Risk Mitigation

1. **Incremental rollout**: Deploy with feature flag, test FDW queries alongside webhook updates
2. **Rollback plan**: Keep old tables during transition, can restore webhook endpoint if needed
3. **Monitoring**: Add metrics for FDW query performance and Stripe API errors
4. **Testing**: Comprehensive tests comparing FDW results with current webhook data

### Developer Experience

- **Simpler mental model**: Single source of truth (Stripe)
- **Easier debugging**: No sync issues to troubleshoot
- **Less code**: 650+ lines removed, ~100 lines added
- **Clearer patterns**: Read from FDW, write to Stripe SDK

### Business Continuity

- No user-facing downtime required
- Subscription data remains accessible throughout migration
- Artists and clients see no functional changes
- Admin dashboard queries work identically (different backend)
