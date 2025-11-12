# Stripe Integration Specification Changes

## REMOVED Requirements

### Requirement: Webhook Event Processing

**Reason**: Replaced with direct FDW queries, eliminating need for asynchronous event processing

**Migration**: All webhook endpoints and handlers removed. Stripe webhook configuration must be disabled in Stripe dashboard.

### Requirement: Webhook Signature Verification

**Reason**: No webhooks means no signature verification needed

**Migration**: Security now handled through database RLS policies and Stripe SDK authentication.

### Requirement: Idempotent Event Handling

**Reason**: FDW provides idempotent reads by nature; writes go directly through Stripe SDK

**Migration**: `stripe_webhook_events` table dropped. No webhook event history retention.

### Requirement: Local Subscription Data Replication

[text](../../../../../supabase/migrations/relations.ts) [text](../../../../../supabase/migrations/schema.ts)
**Reason**: FDW provides real-time access to Stripe subscription data without replication

**Migration**: `artist_subscriptions` table dropped. All queries migrated to use `public.stripe_subscriptions` via FDW views.

### Requirement: Local Customer Data Replication

**Reason**: FDW provides real-time access to Stripe customer data without replication

**Migration**: `stripe_customers` table dropped. All queries migrated to use `public.stripe_customers` via FDW views.

## ADDED Requirements

### Requirement: Foreign Data Wrapper Queries

The system SHALL query Stripe data through PostgreSQL Foreign Data Wrapper (FDW) tables instead of local replication tables.

#### Scenario: Read subscription status

- **WHEN** application needs current subscription status for an artist
- **THEN** query `user_stripe_sync` view or `get_user_subscription_status()` function
- **AND** data is always current from Stripe API

#### Scenario: List active subscriptions

- **WHEN** admin dashboard needs to display active subscriptions
- **THEN** query `active_subscriptions` view
- **AND** results reflect real-time Stripe data

#### Scenario: Get customer by email

- **WHEN** creating a Stripe checkout session for a user
- **THEN** call `get_stripe_customer_by_email()` function
- **AND** customer data comes directly from `public.stripe_customers` FDW table

### Requirement: Direct Stripe SDK Writes

The system SHALL use the Stripe SDK to perform all create, update, and delete operations on Stripe resources.

#### Scenario: Create subscription

- **WHEN** artist subscribes to a tier
- **THEN** call `stripe.subscriptions.create()` with metadata including `artistId`
- **AND** subscription immediately appears in FDW queries

#### Scenario: Cancel subscription

- **WHEN** artist cancels their subscription
- **THEN** call `stripe.subscriptions.update()` with `cancel_at_period_end: true`
- **AND** cancellation status immediately reflects in FDW queries

#### Scenario: Update subscription metadata

- **WHEN** artist metadata needs updating
- **THEN** call `stripe.subscriptions.update()` with new metadata
- **AND** changes are immediately queryable via FDW

### Requirement: Minimal Metadata Tracking

The system SHALL maintain a minimal `stripe_metadata` table to track artist-to-customer relationships for quick lookups.

#### Scenario: Store artist subscription mapping

- **WHEN** artist creates a subscription via Stripe
- **THEN** insert record into `stripe_metadata` with `artistId`, `stripeCustomerId`, `stripeSubscriptionId`
- **AND** use this for fast local lookups before querying FDW

#### Scenario: Clean up stale metadata

- **WHEN** subscription is canceled and period has ended
- **THEN** optionally remove from `stripe_metadata` or mark as inactive
- **AND** FDW remains source of truth

### Requirement: FDW Query Optimization

The system SHALL cache FDW query results using Next.js `unstable_cache` to minimize Stripe API calls.

#### Scenario: Cache subscription status

- **WHEN** multiple components need subscription status in a request
- **THEN** cache result for 5 minutes using `getCachedArtistSubscription()`
- **AND** subsequent calls use cached data

#### Scenario: Cache product list

- **WHEN** displaying subscription tier options
- **THEN** cache `get_active_products()` result for 1 hour
- **AND** reduce Stripe API calls for public pages

### Requirement: FDW Error Handling

The system SHALL handle FDW query failures gracefully with fallbacks and clear error messages.

#### Scenario: FDW query timeout

- **WHEN** Stripe API is slow or unavailable
- **THEN** return cached data if available OR show user-friendly error message
- **AND** log error for monitoring

#### Scenario: FDW permission error

- **WHEN** RLS policy blocks FDW access
- **THEN** return appropriate HTTP 403 status
- **AND** log security event

## MODIFIED Requirements

### Requirement: Subscription Status Queries

The system SHALL query subscription status through FDW views and functions instead of local tables.

#### Scenario: Get artist subscription

- **WHEN** dashboard needs to show artist's current subscription
- **THEN** call `getUserSubscriptionStatus(artistId)` or query `user_stripe_sync` view
- **AND** receive real-time status including `status`, `product_name`, `current_period_end`, `cancel_at_period_end`

#### Scenario: Check subscription permissions

- **WHEN** validating if artist can access premium features
- **THEN** call `userHasActiveSubscription(artistId)`
- **AND** decision is based on current Stripe data

### Requirement: Payment Transaction Logging

The system SHALL log payment transactions when creating payment intents, not via webhooks.

#### Scenario: Log payment intent creation

- **WHEN** creating a Stripe PaymentIntent for a booking
- **THEN** insert into `payment_transactions` with `status: 'pending'`
- **AND** store `stripe_payment_intent_id` for later reconciliation

#### Scenario: Verify payment success

- **WHEN** user returns from Stripe checkout
- **THEN** call `stripe.paymentIntents.retrieve()` to verify status
- **AND** update `payment_transactions` based on current Stripe state

#### Scenario: Manual payment reconciliation

- **WHEN** admin needs to audit payments
- **THEN** query Stripe API directly for payment history
- **AND** compare with `payment_transactions` table for discrepancies

### Requirement: Subscription Analytics

The system SHALL compute analytics by querying FDW tables and joining with local artist data.

#### Scenario: Monthly recurring revenue

- **WHEN** admin dashboard displays MRR
- **THEN** query `active_subscriptions` view and sum `price_ron`
- **AND** join with artists table for additional context

#### Scenario: Churn analysis

- **WHEN** analyzing canceled subscriptions
- **THEN** query `public.stripe_subscriptions` where `status = 'canceled'`
- **AND** compare with active artist count

## Database Schema Changes

### Tables to Drop

- `artist_subscriptions` - Replaced by `public.stripe_subscriptions` FDW + metadata table
- `stripe_customers` - Replaced by `public.stripe_customers` FDW
- `stripe_webhook_events` - No longer needed without webhooks

### Tables to Add

```sql
CREATE TABLE stripe_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artist_id),
  UNIQUE(stripe_subscription_id)
);

CREATE INDEX idx_stripe_metadata_customer ON stripe_metadata(stripe_customer_id);
CREATE INDEX idx_stripe_metadata_subscription ON stripe_metadata(stripe_subscription_id);
```

### Views to Enhance

- `user_stripe_sync` - Already exists, continue using
- `active_subscriptions` - Already exists, continue using
- Consider adding view for canceled subscriptions analytics
