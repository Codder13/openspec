# Subscription Management Specification Changes

## MODIFIED Requirements

### Requirement: Artist Subscription Creation

The system SHALL create subscriptions through Stripe SDK and immediately query via FDW for confirmation.

#### Scenario: Artist subscribes to tier

- **WHEN** artist selects a subscription tier and completes checkout
- **THEN** create Stripe subscription via `stripe.subscriptions.create()` with metadata `{ artistId, tierId }`
- **AND** insert minimal record into `stripe_metadata` table
- **AND** subscription is immediately available via `getUserSubscriptionStatus(artistId)`

#### Scenario: Verify subscription creation

- **WHEN** subscription creation returns successfully
- **THEN** query `get_user_subscription_status(artistId)` to confirm
- **AND** display confirmation to artist with subscription details

### Requirement: Subscription Cancellation

The system SHALL cancel subscriptions via Stripe SDK and verify via FDW queries.

#### Scenario: Artist cancels subscription

- **WHEN** artist requests subscription cancellation
- **THEN** call `stripe.subscriptions.update()` with `cancel_at_period_end: true`
- **AND** immediately verify via `getUserSubscriptionStatus(artistId)` that `cancel_at_period_end = true`
- **AND** display confirmation showing access until period end

#### Scenario: Immediate cancellation

- **WHEN** admin performs immediate cancellation
- **THEN** call `stripe.subscriptions.cancel()` with `prorate: true`
- **AND** verify via FDW that `status = 'canceled'`
- **AND** update `stripe_metadata` with `canceled_at` timestamp

### Requirement: Subscription Status Checks

The system SHALL check subscription status through FDW views for always-current data.

#### Scenario: Dashboard subscription status

- **WHEN** artist views their dashboard
- **THEN** call `getUserSubscriptionStatus(artistId)`
- **AND** display current tier, status, and renewal date
- **AND** show "Cancels at period end" banner if `cancel_at_period_end = true`

#### Scenario: Feature access validation

- **WHEN** artist attempts to access premium feature
- **THEN** call `userHasActiveSubscription(artistId)` to check boolean status
- **AND** grant access only if `status = 'active'` or `status = 'trialing'`

#### Scenario: Subscription expired check

- **WHEN** validating subscription during API request
- **THEN** query FDW to check `current_period_end` is in the future
- **AND** verify `status` is active
- **AND** reject request if subscription is expired

### Requirement: Subscription Upgrade/Downgrade

The system SHALL modify subscriptions via Stripe SDK and immediately reflect changes via FDW.

#### Scenario: Upgrade subscription tier

- **WHEN** artist upgrades to higher tier
- **THEN** call `stripe.subscriptions.update()` with new `price_id` and `proration_behavior: 'always_invoice'`
- **AND** query `getUserSubscriptionStatus(artistId)` to confirm new tier
- **AND** display prorated invoice details

#### Scenario: Downgrade subscription tier

- **WHEN** artist downgrades to lower tier
- **THEN** call `stripe.subscriptions.update()` with new `price_id` and `proration_behavior: 'none'`
- **AND** set `proration_date` to end of current period
- **AND** verify via FDW that downgrade is scheduled
- **AND** notify artist that change takes effect at period end

### Requirement: Subscription Renewal Handling

The system SHALL query FDW for current period information; no local updates needed for renewals.

#### Scenario: Check next renewal date

- **WHEN** artist checks subscription renewal
- **THEN** query `getUserSubscriptionStatus(artistId)` for `current_period_end`
- **AND** display human-readable date and amount
- **AND** data is always current from Stripe

#### Scenario: Renewal failure detection

- **WHEN** checking for payment issues
- **THEN** query FDW where `status = 'past_due'`
- **AND** display payment update prompt to artist
- **AND** provide link to customer portal for payment method update

### Requirement: Trial Period Management

The system SHALL read trial period information from FDW; Stripe manages trial logic.

#### Scenario: Start trial subscription

- **WHEN** artist starts trial
- **THEN** create subscription with `trial_period_days` parameter
- **AND** query `getUserSubscriptionStatus(artistId)` to get `trial_end` date
- **AND** display trial countdown in dashboard

#### Scenario: Trial expiration check

- **WHEN** validating trial status
- **THEN** query FDW for `status = 'trialing'` and `trial_end` date
- **AND** show trial ending warning 3 days before expiration
- **AND** automatically convert to paid when Stripe trial ends

## ADDED Requirements

### Requirement: Subscription Metadata Synchronization

The system SHALL keep `stripe_metadata` table synchronized with Stripe subscription state for fast local lookups.

#### Scenario: Update metadata on subscription change

- **WHEN** Stripe subscription is created or updated
- **THEN** upsert record in `stripe_metadata` with current IDs
- **AND** store minimal data: `artistId`, `stripeCustomerId`, `stripeSubscriptionId`, timestamps

#### Scenario: Query optimization with metadata

- **WHEN** fetching subscription for artist
- **THEN** first lookup `stripe_metadata` for `stripeSubscriptionId`
- **AND** then query FDW with specific subscription ID (faster than join)
- **AND** fallback to email-based lookup if metadata missing

### Requirement: Subscription Data Consistency Validation

The system SHALL provide tools to validate consistency between `stripe_metadata` and actual Stripe state.

#### Scenario: Admin consistency check

- **WHEN** admin runs data validation script
- **THEN** query all records in `stripe_metadata`
- **AND** verify each `stripeSubscriptionId` exists in FDW
- **AND** report any orphaned metadata records

#### Scenario: Auto-cleanup stale metadata

- **WHEN** scheduled cleanup job runs
- **THEN** identify subscriptions in `stripe_metadata` where FDW shows `status = 'canceled'` and `current_period_end` < 30 days ago
- **AND** optionally archive or delete these metadata records
- **AND** log cleanup actions for audit

## REMOVED Requirements

### Requirement: Webhook-based Subscription Sync

**Reason**: No longer using webhooks for synchronization

**Migration**: All sync happens through direct Stripe SDK writes and FDW reads.

### Requirement: Subscription Change Event Logging

**Reason**: Stripe provides native event logs accessible via API and dashboard

**Migration**: Use Stripe dashboard events or API for audit trail. Remove local `stripe_webhook_events` table.

### Requirement: Retry Logic for Failed Webhook Updates

**Reason**: No webhooks means no retry logic needed

**Migration**: FDW queries are idempotent; Stripe SDK writes use Stripe's built-in idempotency.

## Performance Considerations

### Caching Strategy

- Cache `getUserSubscriptionStatus()` for 5 minutes per user
- Cache `active_subscriptions` view for admin dashboard (1 minute TTL)
- Cache `get_active_products()` for tier selection (1 hour TTL)

### Query Optimization

- Use `stripe_metadata` for fast subscription ID lookups
- Prefer specific ID queries over email-based joins
- Batch FDW queries when possible for list views

### Rate Limiting

- FDW queries count toward Stripe API rate limits
- Implement application-level caching to reduce API calls
- Use database query pooling efficiently
