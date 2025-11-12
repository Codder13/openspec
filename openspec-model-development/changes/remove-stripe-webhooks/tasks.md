# Implementation Tasks

## Phase 1: Preparation and Analysis

- [x] 1.1 Review all current webhook handler logic in `src/lib/stripe/webhooks.ts`
- [x] 1.2 Document all current queries that use `artist_subscriptions` and `stripe_customers` tables
- [ ] 1.3 Export current `artist_subscriptions` data to verify FDW consistency
- [x] 1.4 Test all existing FDW views and functions for correctness (sync.ts already has these)
- [ ] 1.5 Identify any custom fields in local tables not available via FDW
- [ ] 1.6 Create mapping document: old queries → new FDW queries

## Phase 2: Create New Infrastructure

- [x] 2.1 Create migration: Add `stripe_metadata` table with indexes (0004_motionless_lightspeed.sql)
- [x] 2.2 Write helper functions in `src/lib/stripe/fdw-helpers.ts` for common FDW patterns
- [ ] 2.3 Add caching wrappers for FDW query functions
- [ ] 2.4 Create data migration script to populate `stripe_metadata` from existing tables
- [ ] 2.5 Write consistency validation script to compare local vs FDW data
- [ ] 2.6 Add monitoring/logging for FDW query performance

## Phase 3: Update Query Layer

- [ ] 3.1 Update `src/lib/stripe/queries.ts`:
  - [x] 3.1.1 Replace imports to remove deleted tables
  - [ ] 3.1.2 Replace `getCachedArtistSubscription()` to query via `stripe_metadata` + FDW
  - [ ] 3.1.3 Update subscription status queries to use `getUserSubscriptionStatus()`
  - [ ] 3.1.4 Update customer queries to use `get_stripe_customer_by_email()`
- [ ] 3.2 Update `src/lib/stripe/subscriptions.ts`:
  - [x] 3.2.1 Remove imports of deleted tables
  - [ ] 3.2.2 Add direct Stripe SDK writes after creating subscriptions
  - [ ] 3.2.3 Insert into `stripe_metadata` after successful Stripe operations
  - [ ] 3.2.4 Update subscription cancellation to write to Stripe + verify via FDW
  - [ ] 3.2.5 Update subscription upgrade/downgrade to write to Stripe + verify via FDW
- [ ] 3.3 Update `src/lib/stripe/analytics.ts`:
  - [x] 3.3.1 Remove imports of deleted tables, add FDW imports
  - [ ] 3.3.2 Update MRR calculation to use `active_subscriptions` view
  - [ ] 3.3.3 Update churn metrics to query `public.stripe_subscriptions` directly
- [ ] 3.4 Update `src/lib/stripe/portal.ts`:
  - [x] 3.4.1 Replace imports to use `stripe_metadata` and FDW
  - [ ] 3.4.2 Fallback to `get_stripe_customer_by_email()` if not in metadata

## Phase 4: Update Subscription Management

- [ ] 4.1 Update subscription creation flow:
  - [ ] 4.1.1 Modify checkout session creation to include artistId in metadata
  - [ ] 4.1.2 After successful checkout, insert into `stripe_metadata`
  - [ ] 4.1.3 Verify subscription via `getUserSubscriptionStatus()` instead of webhook
  - [ ] 4.1.4 Remove webhook dependency from success flow
- [ ] 4.2 Update subscription cancellation:
  - [ ] 4.2.1 Call Stripe SDK `subscriptions.update()` with `cancel_at_period_end`
  - [ ] 4.2.2 Immediately query FDW to confirm cancellation flag
  - [ ] 4.2.3 Update `stripe_metadata` with cancellation timestamp
  - [ ] 4.2.4 Remove webhook handler call
- [ ] 4.3 Update subscription status checks in API routes and middleware:
  - [ ] 4.3.1 Replace database queries with FDW function calls
  - [ ] 4.3.2 Use cached FDW results where appropriate
  - [ ] 4.3.3 Update error handling for FDW query failures

## Phase 5: Update Payment Processing

- [ ] 5.1 Update payment intent creation:
  - [ ] 5.1.1 Insert into `payment_transactions` when creating PaymentIntent
  - [ ] 5.1.2 Store `stripe_payment_intent_id` for reconciliation
- [ ] 5.2 Update payment verification:
  - [ ] 5.2.1 Replace webhook-based status updates with direct Stripe API calls
  - [ ] 5.2.2 Call `stripe.paymentIntents.retrieve()` on return from checkout
  - [ ] 5.2.3 Update `payment_transactions` based on retrieved status
- [ ] 5.3 Keep minimal `payment_transactions` table for audit trail:
  - [ ] 5.3.1 Store payment intent ID, amount, status
  - [ ] 5.3.2 Remove fields that duplicate Stripe data (rely on FDW for details)

## Phase 6: Remove Webhook Infrastructure

- [ ] 6.1 Disable webhooks in Stripe dashboard (do this AFTER verification)
- [x] 6.2 Delete `src/app/api/stripe/webhooks/route.ts`
- [x] 6.3 Delete `src/lib/stripe/webhooks.ts`
- [ ] 6.4 Remove webhook secret from environment variables
- [ ] 6.5 Remove webhook-related types from `src/lib/stripe/types.ts`
- [ ] 6.6 Update API route tests to remove webhook test cases

## Phase 7: Database Cleanup

- [x] 7.1 Create migration: Drop `stripe_webhook_events` table (included in 0004_motionless_lightspeed.sql)
- [x] 7.2 Create migration: Drop `artist_subscriptions` table (included in 0004_motionless_lightspeed.sql)
- [x] 7.3 Create migration: Drop `stripe_customers` table (included in 0004_motionless_lightspeed.sql)
- [x] 7.4 Remove dropped tables from Drizzle schema (already not in schema.ts)
- [ ] 7.5 Run `drizzle-kit generate` to sync schema with migrations (completed)
- [ ] 7.6 Update RLS policies if needed (removed policies for dropped tables)

- [ ] 7.1 Create migration: Drop `stripe_webhook_events` table
- [ ] 7.2 Create migration: Drop `artist_subscriptions` table (after verification period)
- [ ] 7.3 Create migration: Drop `stripe_customers` table (after verification period)
- [ ] 7.4 Remove dropped tables from Drizzle schema (`src/lib/drizzle/schema.ts`)
- [ ] 7.5 Run `drizzle-kit generate` to sync schema with migrations
- [ ] 7.6 Update RLS policies if needed (remove policies for dropped tables)

## Phase 8: Testing and Verification

- [ ] 8.1 Unit tests:
  - [ ] 8.1.1 Test FDW query helper functions
  - [ ] 8.1.2 Test subscription creation with metadata insert
  - [ ] 8.1.3 Test subscription cancellation and verification
  - [ ] 8.1.4 Test payment intent flow without webhooks
- [ ] 8.2 Integration tests:
  - [ ] 8.2.1 Test complete subscription flow (create, verify, cancel)
  - [ ] 8.2.2 Test upgrade/downgrade flow
  - [ ] 8.2.3 Test trial period creation and expiration
  - [ ] 8.2.4 Test customer portal access
- [ ] 8.3 E2E tests:
  - [ ] 8.3.1 Test artist dashboard displays correct subscription status
  - [ ] 8.3.2 Test subscription tier selection and checkout
  - [ ] 8.3.3 Test subscription management (cancel, reactivate)
  - [ ] 8.3.4 Test admin dashboard subscription analytics
- [ ] 8.4 Data consistency validation:
  - [ ] 8.4.1 Run consistency check script comparing FDW with old tables
  - [ ] 8.4.2 Verify all active subscriptions are accessible via FDW
  - [ ] 8.4.3 Verify `stripe_metadata` has correct mappings
  - [ ] 8.4.4 Test edge cases (expired subscriptions, trials, canceled)

## Phase 9: Deployment and Monitoring

- [ ] 9.1 Deploy with feature flag (dual-write mode for safety):
  - [ ] 9.1.1 Write to both old tables and Stripe SDK
  - [ ] 9.1.2 Read from FDW but log discrepancies
  - [ ] 9.1.3 Monitor error rates and query performance
- [ ] 9.2 Gradual rollout:
  - [ ] 9.2.1 Enable FDW reads for 10% of traffic
  - [ ] 9.2.2 Monitor for errors and performance issues
  - [ ] 9.2.3 Scale to 50%, then 100% over 2-3 days
- [ ] 9.3 Post-deployment verification:
  - [ ] 9.3.1 Verify no webhook errors in logs (endpoint should be disabled)
  - [ ] 9.3.2 Verify FDW queries performing within acceptable latency
  - [ ] 9.3.3 Verify subscription operations working correctly
  - [ ] 9.3.4 Verify admin analytics displaying accurate data
- [ ] 9.4 Monitoring setup:
  - [ ] 9.4.1 Add metrics for FDW query latency
  - [ ] 9.4.2 Add alerts for Stripe API errors
  - [ ] 9.4.3 Add alerts for consistency validation failures
  - [ ] 9.4.4 Dashboard for subscription operations (create, cancel, upgrade)

## Phase 10: Documentation and Cleanup

- [ ] 10.1 Update `docs/stripe-sync-integration-guide.md`:
  - [ ] 10.1.1 Remove webhook references
  - [ ] 10.1.2 Update examples to show direct Stripe writes
  - [ ] 10.1.3 Document `stripe_metadata` table purpose
  - [ ] 10.1.4 Update troubleshooting section
- [ ] 10.2 Update API documentation:
  - [ ] 10.2.1 Remove webhook endpoint from API docs
  - [ ] 10.2.2 Document new subscription management patterns
- [ ] 10.3 Update README or developer onboarding docs:
  - [ ] 10.3.1 Explain FDW-based architecture
  - [ ] 10.3.2 Document when to use FDW vs Stripe SDK
- [ ] 10.4 Archive webhook-related documentation
- [ ] 10.5 Update Stripe dashboard configuration guide (disable webhooks)

## Dependencies

- Phase 2 must complete before Phase 3
- Phase 3 must complete before Phase 4 and 5
- Phase 4 and 5 can run in parallel
- Phase 6 requires Phase 4 and 5 completion + verification
- Phase 7 requires Phase 6 completion + extended verification period (1-2 weeks)
- Phase 8 should overlap with Phases 3-7 (test as you go)
- Phase 9 requires all previous phases complete
- Phase 10 can start during Phase 9

## Rollback Plan

If issues arise during deployment:

1. Re-enable Stripe webhooks in dashboard
2. Revert application code to use `artist_subscriptions` table queries
3. Keep webhook handlers in git history for quick restore
4. `stripe_metadata` table is additive, so it can remain
5. FDW views remain functional, can be re-enabled later
