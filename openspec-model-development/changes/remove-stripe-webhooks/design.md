# Design: Stripe Foreign Data Wrapper Migration

## Context

The current Stripe integration uses a webhook-based synchronization pattern where Stripe events trigger updates to local PostgreSQL tables (`artist_subscriptions`, `stripe_customers`). While this pattern is common, it introduces several operational challenges:

- **Data consistency issues**: Webhooks can fail, be delayed, or arrive out-of-order
- **Code complexity**: 650+ lines of webhook handling and state management logic
- **Debugging difficulty**: Tracking down sync issues requires correlating webhook logs with database state
- **Operational burden**: Webhook endpoint must be maintained, secured, and monitored

The database already has Stripe Foreign Data Wrapper (FDW) integration via Supabase's Wrappers extension, which provides:

- Real-time, read-only access to Stripe data through SQL queries
- No synchronization lag or failure modes
- Single source of truth (Stripe's API)
- Existing views and functions (`user_stripe_sync`, `get_user_subscription_status()`)

This migration removes the webhook layer entirely and standardizes on FDW for reads, Stripe SDK for writes.

## Goals / Non-Goals

### Goals

- **Remove webhook infrastructure**: Delete webhook endpoint, handlers, and event tracking
- **Eliminate data duplication**: Drop local `artist_subscriptions` and `stripe_customers` tables
- **Simplify architecture**: Single pattern for Stripe data access (FDW reads, SDK writes)
- **Improve data accuracy**: Always-current subscription status without sync lag
- **Reduce code complexity**: Remove 650+ lines of synchronization logic
- **Maintain performance**: Leverage caching to minimize Stripe API calls

### Non-Goals

- **Not changing payment flow**: PaymentIntents creation/verification remains similar
- **Not removing all local tracking**: `payment_transactions` table remains for audit trail
- **Not real-time webhooks for alerts**: If future use cases need instant notifications (e.g., failed payments), can add minimal webhook for logging only
- **Not optimizing FDW performance**: Using existing FDW setup; not tuning Stripe API response times
- **Not migrating to different payment provider**: This is specifically about better Stripe integration

## Decisions

### Decision 1: FDW for All Subscription Reads

**Choice**: Query Stripe data through FDW views and functions exclusively

**Alternatives considered**:

1. **Hybrid approach** (webhooks + FDW): Keep webhooks for writes, add FDW queries
   - _Rejected_: Maintains complexity and dual-source-of-truth problem
2. **Polling pattern**: Periodically sync Stripe data to local tables
   - _Rejected_: Still has sync lag, adds scheduled job complexity
3. **Full FDW adoption** (chosen): Read from FDW, write through Stripe SDK
   - _Benefits_: Simplest model, no sync logic, always accurate
   - _Trade-offs_: Dependent on Stripe API availability (mitigated by caching)

**Rationale**: The FDW pattern provides the simplest mental model (Stripe is the database) and eliminates entire classes of bugs (sync failures, stale data, event ordering).

### Decision 2: Minimal Metadata Table

**Choice**: Create `stripe_metadata` table with only IDs and timestamps

**Alternatives considered**:

1. **No local tracking**: Query FDW entirely by email
   - _Rejected_: Email-based joins are slower than ID lookups
2. **Full subscription data replication**: Keep all fields locally
   - _Rejected_: Defeats the purpose of removing duplication
3. **Minimal ID mapping** (chosen): Store `artistId ↔ stripeCustomerId ↔ stripeSubscriptionId`
   - _Benefits_: Fast local lookups, then direct FDW queries by ID
   - _Trade-offs_: Extra table to maintain (but simple insert/update logic)

**Rationale**: The metadata table serves as an index for fast lookups without duplicating Stripe data. It's write-once-per-subscription with minimal update burden.

### Decision 3: Direct Stripe SDK Writes

**Choice**: All create/update/delete operations go directly through Stripe SDK, no webhook intermediate

**Alternatives considered**:

1. **Webhook-confirmed writes**: Write to Stripe, wait for webhook before confirming
   - _Rejected_: Adds latency and failure modes
2. **Optimistic local updates**: Write to local DB first, sync to Stripe
   - _Rejected_: Creates inconsistency if Stripe write fails
3. **Synchronous SDK writes** (chosen): Write to Stripe, immediately verify via FDW
   - _Benefits_: Immediate confirmation, clear error handling
   - _Trade-offs_: Slightly higher latency (mitigated by showing "processing" state)

**Rationale**: Synchronous writes provide clear success/failure feedback and eliminate the need for webhook-based confirmation flows.

### Decision 4: Cache FDW Query Results

**Choice**: Use Next.js `unstable_cache` with 1-5 minute TTLs for FDW queries

**Alternatives considered**:

1. **No caching**: Query FDW on every request
   - _Rejected_: Excessive Stripe API calls, slower responses
2. **Redis caching**: External cache layer
   - _Rejected_: Adds infrastructure complexity for minimal benefit
3. **Next.js built-in caching** (chosen): `unstable_cache` with TTLs
   - _Benefits_: No extra infrastructure, automatic cache invalidation
   - _Trade-offs_: Cache tied to deployment, not shared across instances (acceptable for this use case)

**Rationale**: Built-in caching provides 80% of the benefit with minimal complexity. For high-traffic scenarios, can add Redis later without architectural changes.

### Decision 5: Gradual Migration Strategy

**Choice**: Deploy with feature flag, run dual-read mode, then cutover

**Migration phases**:

1. **Phase 1**: Deploy FDW query functions, test alongside existing code
2. **Phase 2**: Add `stripe_metadata` table, populate from existing data
3. **Phase 3**: Update application code to use FDW, keep webhook writes for safety
4. **Phase 4**: Verify data consistency over 1-2 weeks
5. **Phase 5**: Disable webhooks, remove local tables
6. **Phase 6**: Delete webhook handler code

**Rationale**: Incremental approach reduces risk. Can roll back at any phase if issues arise. Dual-read mode provides validation before committing to the new architecture.

## Architecture Diagrams

### Current Architecture (Webhook-based)

```
┌─────────────────────────────────────────────┐
│              Application Code               │
└───────────────────┬─────────────────────────┘
                    │
         ┌──────────┴─────────────┐
         │                        │
    Read from local DB       Write to Stripe
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌────────────────┐
│ artist_         │      │  Stripe API    │
│ subscriptions   │      │                │
│ (local copy)    │      │  subscriptions │
└─────────────────┘      └────────┬───────┘
         ▲                         │
         │                         │ webhook
         │                         ▼
         │               ┌─────────────────────┐
         └───────────────│ Webhook Handler     │
            sync update  │ (650 lines)         │
                        └─────────────────────┘
        Async, can fail, creates lag
```

### New Architecture (FDW-based)

```
┌─────────────────────────────────────────────┐
│              Application Code               │
└───────────┬─────────────────────┬───────────┘
            │                     │
       Read from FDW         Write to Stripe
            │                     │
            ▼                     ▼
┌─────────────────────┐  ┌────────────────┐
│ FDW Views/Functions │  │  Stripe API    │
│ (always current)    │  │                │
│                     │  │  subscriptions │
└──────────┬──────────┘  └────────────────┘
           │
           │ queries Stripe API
           ▼
   ┌────────────────┐
   │  Stripe API    │
   └────────────────┘

Local metadata table:
┌─────────────────────────┐
│ stripe_metadata         │
│ (IDs only, for lookups) │
└─────────────────────────┘
```

## Data Flow Examples

### Example 1: Artist Views Dashboard

```
1. User request → Dashboard page
2. Server component calls: getUserSubscriptionStatus(artistId)
3. Check unstable_cache for cached result
4. If miss: Query FDW view → Stripe API → return data
5. Cache result for 5 minutes
6. Render dashboard with subscription info
```

### Example 2: Artist Subscribes to Tier

```
1. User selects tier → Checkout page
2. Create Stripe checkout session with metadata: { artistId, tierId }
3. User completes payment on Stripe
4. Stripe redirects back to success page
5. Server action:
   a. Insert into stripe_metadata (artistId, stripeCustomerId, stripeSubscriptionId)
   b. Query getUserSubscriptionStatus(artistId) to verify
   c. Display success message with tier details
6. No webhook needed - subscription immediately available via FDW
```

### Example 3: Artist Cancels Subscription

```
1. User clicks "Cancel subscription"
2. Confirm dialog → Server action
3. Call stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
4. On success:
   a. Query getUserSubscriptionStatus(artistId) to confirm cancellation flag
   b. Update stripe_metadata.updated_at = now()
   c. Invalidate cache for this user
5. Display: "Subscription will cancel on [date]"
```

## Risks / Trade-offs

### Risk 1: FDW Query Latency

**Risk**: FDW queries hit Stripe API, may be slower than local DB queries

**Mitigation**:

- Cache aggressively (5-minute TTL for status checks)
- Use `stripe_metadata` for ID lookups before querying FDW
- Monitor P95 latency and adjust caching strategy if needed
- FDW queries are similar latency to webhook processing anyway

**Acceptable because**: Webhook-based system has async lag (seconds to minutes), so slightly higher query latency (100-200ms) for always-accurate data is a good trade-off.

### Risk 2: Stripe API Availability

**Risk**: If Stripe API is down, FDW queries fail

**Mitigation**:

- Return cached data if available (even if expired)
- Display clear error message: "Unable to load subscription status, please try again"
- Log errors for monitoring
- Keep minimal local metadata to show basic status (e.g., "You have an active subscription")

**Acceptable because**: Webhook system also depends on Stripe API availability for writes. FDW failure is obvious (query fails) vs webhook failure being silent (data goes stale).

### Risk 3: Data Migration Errors

**Risk**: Data loss or inconsistency during migration from local tables to FDW

**Mitigation**:

- Export full data backup before migration
- Run consistency validation: compare FDW data with local tables before cutover
- Gradual rollout with feature flag (dual-read mode)
- Keep old tables for 2 weeks after cutover as safety net

**Rollback plan**: If critical issues arise, can re-enable webhooks and restore local tables from backup within hours.

### Risk 4: Breaking Existing Queries

**Risk**: Application code assumes local table schema, breaks when querying FDW

**Mitigation**:

- Comprehensive test coverage for subscription queries
- Search codebase for all uses of `artist_subscriptions` and `stripe_customers`
- Update TypeScript types to match FDW view schemas
- Staged deployment: test in development, then staging, then production

**Verification**: Run integration tests comparing FDW query results with current local table queries before cutover.

## Migration Plan

### Pre-Migration (1-2 days)

1. Review all current webhook handlers and document behavior
2. Identify all queries that use `artist_subscriptions` or `stripe_customers`
3. Export current data for consistency validation
4. Write migration scripts and test in development environment

### Migration Phase 1: Add FDW Infrastructure (1 day)

1. Create `stripe_metadata` table migration
2. Write FDW helper functions in `src/lib/stripe/fdw-helpers.ts`
3. Add caching wrappers for common queries
4. Deploy to production (no behavior change yet)

### Migration Phase 2: Update Application Code (3-4 days)

1. Update `queries.ts`, `subscriptions.ts`, `analytics.ts` to use FDW
2. Update API routes to call new FDW functions
3. Add `stripe_metadata` inserts after Stripe SDK writes
4. Deploy with feature flag OFF (code deployed but not active)

### Migration Phase 3: Validation (1-2 weeks)

1. Enable feature flag for 10% of traffic
2. Run dual-read mode: query both FDW and local tables, log differences
3. Monitor for errors, performance issues, data inconsistencies
4. Scale to 50%, then 100% over 1 week

### Migration Phase 4: Cutover (1 day)

1. Verify all subscriptions accessible via FDW
2. Disable Stripe webhooks in Stripe dashboard
3. Remove webhook endpoint from application
4. Mark old tables as deprecated (keep for 2 weeks)

### Migration Phase 5: Cleanup (1 day)

After 2 weeks of stable operation:

1. Drop `artist_subscriptions`, `stripe_customers`, `stripe_webhook_events` tables
2. Delete webhook handler code
3. Update documentation
4. Remove deprecated code paths

## Open Questions

1. **Webhook removal impact on audit trail**: Currently `stripe_webhook_events` provides event history.
   - **Answer**: Use Stripe Dashboard events or API for audit trail. Can add minimal webhook for logging only (no DB writes) if needed.

2. **FDW query rate limits**: Does Supabase FDW have separate rate limits from direct Stripe API?
   - **Answer**: FDW queries count toward Stripe API rate limits. Monitor via Stripe dashboard.

3. **Real-time notification requirements**: Do we need instant alerts for payment failures?
   - **Answer**: Current webhook system doesn't provide instant alerts anyway (async processing). Can poll FDW for `past_due` status periodically. If instant alerts needed later, can add webhook for logging only.

4. **Caching strategy for admin dashboard**: Should admin analytics use different cache TTL?
   - **Answer**: Use shorter TTL (1 minute) for admin views where data freshness matters. Can make configurable if needed.

## Success Metrics

### Code Complexity

- **Target**: Remove 650+ lines of webhook handling code
- **Measure**: Line count of deleted files

### Data Accuracy

- **Target**: Zero sync lag (FDW always current)
- **Measure**: Query FDW vs Stripe API directly, compare results

### Performance

- **Target**: P95 subscription status query < 500ms
- **Measure**: APM metrics for `getUserSubscriptionStatus()` calls

### Reliability

- **Target**: Zero sync-related bugs reported
- **Measure**: Issue tracker tags for "stripe sync" or "subscription inconsistency"

### Operational Burden

- **Target**: Zero webhook processing errors
- **Measure**: Error logs for webhook signature verification, idempotency failures, retry exhaustion

## Monitoring & Rollback

### Monitoring During Migration

- Dashboard showing: FDW query latency (P50, P95, P99)
- Alert if: FDW query failure rate > 1%
- Dashboard showing: Cache hit rate for subscription queries
- Alert if: Cache hit rate < 60%
- Log comparison: FDW results vs local table results (dual-read mode)

### Rollback Triggers

Rollback if any of:

- FDW query failure rate > 5% sustained for > 10 minutes
- Data inconsistencies detected in > 1% of dual-read comparisons
- Critical subscription feature broken (cannot create, cancel, or verify subscriptions)
- Stripe API rate limit exceeded

### Rollback Procedure

1. Set feature flag to OFF (revert to local table queries)
2. Re-enable Stripe webhooks in dashboard
3. Verify webhook handler still processing events
4. Investigate root cause before re-attempting migration

---

**Last Updated**: 2025-11-12  
**Status**: Design approved, ready for implementation  
**Reviewers**: [To be filled]
