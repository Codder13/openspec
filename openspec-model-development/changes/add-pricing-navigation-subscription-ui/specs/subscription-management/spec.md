# Subscription Management Capability Spec

## ADDED Requirements

### Requirement: Current Subscription Status Display

The artist dashboard SHALL display the artist's current subscription status including tier, billing period, next billing date, and usage statistics.

#### Scenario: Artist views active subscription

- **WHEN** an artist with an active subscription views their dashboard
- **THEN** a subscription status card SHALL display:
  - Tier name in Romanian (e.g., "Profesional", "Premium", "Gratuit")
  - Active status indicator (green badge or dot)
  - Billing period ("lunar" or "anual")
  - Next billing date in Romanian format (e.g., "15 Decembrie 2025")
  - Next billing amount in RON (e.g., "49 RON")

#### Scenario: Artist views subscription usage stats

- **WHEN** an artist views the subscription status card
- **THEN** it SHALL display usage indicators:
  - Bookings used this month vs. limit (e.g., "5 / 20 rezervări")
  - Portfolio items used vs. limit (e.g., "12 / 50 elemente")
- **AND** usage indicators SHALL show visual progress bars
- **AND** progress bars SHALL change color based on usage (blue: 0-79%, yellow: 80-99%, red: 100%)

#### Scenario: Artist with no subscription (free tier)

- **WHEN** an artist has no paid subscription
- **THEN** the status card SHALL display "Gratuit" as the tier name
- **AND** it SHALL show free tier limits (5 bookings, 10 portfolio items)
- **AND** it SHALL display an "Upgrade" call-to-action button

#### Scenario: Artist with past_due subscription

- **WHEN** an artist's subscription status is "past_due"
- **THEN** the status card SHALL display a warning banner
- **AND** the banner SHALL state "Plată eșuată. Te rugăm să actualizezi metoda de plată."
- **AND** it SHALL provide a button to update payment method via Customer Portal

### Requirement: Billing Management via Customer Portal

Artists SHALL be able to access Stripe Customer Portal to manage all aspects of their subscription including tier changes, cancellations, billing information, invoices, and payment methods.

#### Scenario: Artist accesses Customer Portal

- **WHEN** an artist clicks "Gestionează Abonamentul" (Manage Subscription)
- **THEN** the application SHALL call `/api/stripe/portal` to create a Customer Portal session
- **AND** it SHALL redirect the artist to the Stripe Customer Portal URL
- **AND** the return URL SHALL be set to the artist dashboard

#### Scenario: Artist manages subscription in portal

- **WHEN** an artist is in the Stripe Customer Portal
- **THEN** they SHALL be able to:
  - View current subscription details
  - Upgrade or downgrade subscription tier
  - Cancel subscription
  - Update payment method
  - View and download invoices
  - View billing history

#### Scenario: Artist returns from Customer Portal

- **WHEN** an artist completes actions in Customer Portal and clicks "Return to Dashboard"
- **THEN** they SHALL be redirected back to `/artist/dashboard`
- **AND** the subscription status card SHALL display updated information
- **AND** any subscription changes SHALL be reflected immediately (via webhook updates)

#### Scenario: Subscription changes sync via webhooks

- **WHEN** an artist changes their subscription in the Customer Portal (upgrade, downgrade, or cancel)
- **THEN** Stripe SHALL send webhook events to the application
- **AND** the webhook handler SHALL update the database with the new subscription status
- **AND** the updated information SHALL be visible when the artist returns to the dashboard

### Requirement: Subscription Status Updates

The subscription status displayed in the dashboard SHALL reflect the current state of the artist's subscription, including cancellation schedules and reactivation options.

#### Scenario: Active canceling subscription display

- **WHEN** an artist has canceled their subscription in the Customer Portal
- **AND** the subscription is set to cancel at period end (status: "canceling")
- **THEN** the status card SHALL show "Abonament anulat - Activ până la [end date]"
- **AND** it SHALL display a warning that access will end on the end date
- **AND** it SHALL show an option to reactivate via Customer Portal

#### Scenario: Subscription reactivation

- **WHEN** an artist with a "canceling" subscription wants to reactivate
- **AND** they click "Reactivează Abonamentul" or access Customer Portal
- **THEN** they SHALL be directed to Stripe Customer Portal
- **AND** they SHALL be able to resume their subscription
- **AND** after reactivation, the webhook SHALL update the status to "active"

### Requirement: Subscription Analytics Widget

The artist dashboard SHALL display a summary widget showing subscription-related analytics.

#### Scenario: Artist views subscription analytics

- **WHEN** an artist with a paid subscription views their dashboard
- **THEN** an analytics widget SHALL display:
  - "Total Cheltuit" (Total Spent): Sum of all subscription payments
  - "Zile Rămase" (Days Remaining): Days until next billing
  - "Rezervări Luna Aceasta" (Bookings This Month): Count with limit
  - "Economii Anuale" (Annual Savings): If on annual plan, show saved amount vs. monthly

#### Scenario: Free tier artist analytics

- **WHEN** an artist on free tier views their dashboard
- **THEN** the analytics widget SHALL show:
  - "Plan Actual: Gratuit"
  - Bookings and portfolio usage
  - Prompt to upgrade: "Upgrade pentru funcții premium"

### Requirement: Email Notifications for Subscription Events

The system SHALL send transactional emails to artists for critical subscription events.

#### Scenario: Subscription welcome email

- **WHEN** an artist successfully completes their first subscription purchase
- **THEN** the system SHALL send a welcome email within 5 minutes
- **AND** the email SHALL include:
  - Thank you message
  - Tier name and features list
  - Billing details (next charge date and amount)
  - Link to Customer Portal
  - Support contact information

#### Scenario: Subscription renewal confirmation

- **WHEN** a subscription is successfully renewed (invoice.payment_succeeded webhook)
- **THEN** the system SHALL send a renewal confirmation email
- **AND** the email SHALL include:
  - Confirmation of payment
  - Amount charged and billing period
  - Next billing date
  - Invoice PDF link (from Stripe)

#### Scenario: Payment failure notification

- **WHEN** a subscription payment fails (invoice.payment_failed webhook)
- **THEN** the system SHALL send a payment failure email immediately
- **AND** the email SHALL include:
  - Clear explanation of the failure
  - Consequences if not resolved (feature restrictions)
  - Call-to-action button to update payment method (Customer Portal)
  - Retry schedule information

#### Scenario: Subscription cancellation confirmation

- **WHEN** an artist cancels their subscription
- **THEN** the system SHALL send a cancellation confirmation email
- **AND** the email SHALL include:
  - Confirmation that cancellation is scheduled
  - Date when access to paid features will end
  - Information about data retention
  - Option to reactivate before end date

### Requirement: Usage Indicator Component

The application SHALL provide reusable usage indicator components that display feature usage with visual progress bars throughout the artist dashboard.

#### Scenario: Normal usage display (0-79%)

- **WHEN** usage is between 0% and 79% of the limit
- **THEN** the indicator SHALL display a blue progress bar
- **AND** it SHALL show the count as "X / Y" format
- **AND** the component SHALL be non-interactive

#### Scenario: Warning usage display (80-99%)

- **WHEN** usage is between 80% and 99% of the limit
- **THEN** the indicator SHALL display a yellow progress bar
- **AND** it SHALL show a warning icon (triangle with exclamation)
- **AND** it SHALL display a tooltip: "Te apropii de limita planului tău"

#### Scenario: Exceeded usage display (100%)

- **WHEN** usage reaches or exceeds 100% of the limit
- **THEN** the indicator SHALL display a red progress bar
- **AND** it SHALL show a lock icon
- **AND** clicking the indicator SHALL open an upgrade prompt modal
- **AND** the tooltip SHALL state: "Ai atins limita. Upgrade pentru mai mult."

#### Scenario: Unlimited tier indication

- **WHEN** the artist is on a tier with unlimited usage for a feature (e.g., Premium tier bookings)
- **THEN** the indicator SHALL display "∞ Nelimitat" instead of a progress bar
- **AND** it SHALL use a premium badge or icon
