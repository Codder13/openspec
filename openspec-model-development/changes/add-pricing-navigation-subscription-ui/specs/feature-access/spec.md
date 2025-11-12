# Feature Access Control Capability Spec

## ADDED Requirements

### Requirement: Booking Creation Limit Enforcement

The system SHALL enforce monthly booking creation limits based on the artist's subscription tier and prevent bookings beyond the limit.

#### Scenario: Artist within booking limit

- **WHEN** an artist attempts to create a booking
- **AND** their booking count for the current month is below their tier limit
- **THEN** the system SHALL allow the booking creation to proceed
- **AND** the booking count SHALL increment by 1

#### Scenario: Artist at booking limit

- **WHEN** an artist attempts to create a booking
- **AND** their booking count for the current month equals or exceeds their tier limit
- **THEN** the system SHALL block the booking creation
- **AND** it SHALL return a 403 Forbidden response with message: "Ai atins limita de rezervări pentru planul tău"
- **AND** the client SHALL display an upgrade prompt modal

#### Scenario: API route booking limit check

- **WHEN** a POST request is made to `/api/bookings`
- **THEN** the API route SHALL:
  1. Authenticate the user
  2. Fetch the artist's current subscription tier
  3. Count bookings created this month
  4. Compare count against tier limit
  5. Block request if limit reached
- **AND** the check SHALL happen before any database write operations

#### Scenario: Middleware booking limit enforcement

- **WHEN** the Next.js middleware intercepts a POST request to `/api/bookings`
- **THEN** it SHALL perform the same limit check as the API route
- **AND** if the limit is exceeded, it SHALL return 403 without reaching the API route

### Requirement: Portfolio Item Upload Limit Enforcement

The system SHALL enforce portfolio item upload limits based on the artist's subscription tier.

#### Scenario: Artist within portfolio limit

- **WHEN** an artist attempts to upload a portfolio item (photo, video, or audio)
- **AND** their current portfolio item count is below their tier limit
- **THEN** the upload SHALL proceed successfully
- **AND** the portfolio item count SHALL increment by 1

#### Scenario: Artist at portfolio limit

- **WHEN** an artist attempts to upload a portfolio item
- **AND** their portfolio item count equals or exceeds their tier limit
- **THEN** the upload SHALL be blocked
- **AND** the system SHALL return a 403 response: "Ai atins limita de elemente în portofoliu pentru planul tău"
- **AND** an upgrade prompt modal SHALL open

#### Scenario: Portfolio item deletion reduces count

- **WHEN** an artist deletes a portfolio item
- **THEN** the portfolio item count SHALL decrement by 1
- **AND** the artist SHALL be able to upload new items if now below the limit

### Requirement: Premium Feature Access Gating

The system SHALL hide or disable premium features for artists who are not subscribed to tiers that include those features.

#### Scenario: Analytics access for Professional and Premium tiers

- **WHEN** an artist on the Professional or Premium tier views their dashboard
- **THEN** they SHALL see an "Analize" (Analytics) section with:
  - Profile views over time
  - Booking conversion rate
  - Revenue trends
- **AND** clicking analytics SHALL navigate to a detailed analytics page

#### Scenario: Analytics hidden for Free tier

- **WHEN** an artist on the Free tier views their dashboard
- **THEN** the "Analize" section SHALL be hidden or show a locked state
- **AND** if they click on it, an upgrade prompt SHALL appear
- **AND** the prompt SHALL highlight: "Upgrade la Profesional pentru acces la analize"

#### Scenario: Priority placement for Professional and Premium tiers

- **WHEN** the artist search results are generated
- **THEN** artists on Professional and Premium tiers SHALL be boosted in ranking
- **AND** their profiles SHALL appear above Free tier artists with similar relevance

#### Scenario: Priority placement denied for Free tier

- **WHEN** search results include Free tier artists
- **THEN** they SHALL not receive priority placement boost
- **AND** they SHALL appear in standard relevance order

#### Scenario: Featured artist badge for Premium tier

- **WHEN** a Premium tier artist's profile is displayed
- **THEN** it SHALL show a "Artist Premium" badge
- **AND** the badge SHALL be visually distinct (e.g., gold star icon)

#### Scenario: Custom branding for Premium tier

- **WHEN** a Premium tier artist views their profile customization settings
- **THEN** they SHALL see options to:
  - Upload a custom profile banner
  - Choose custom accent colors
  - Add a custom tagline
- **AND** Free and Professional tier artists SHALL not see these options

### Requirement: Upgrade Prompt Modal

The system SHALL display a contextual upgrade prompt modal when an artist attempts to use a feature beyond their tier limits or access a premium feature.

#### Scenario: Upgrade prompt on booking limit

- **WHEN** an artist hits their monthly booking limit
- **AND** attempts to create another booking
- **THEN** an upgrade modal SHALL open immediately
- **AND** the modal SHALL display:
  - Title: "Ai atins limita de rezervări"
  - Current tier and limit (e.g., "Gratuit - 5 rezervări/lună")
  - Recommended tier (Professional with 20 bookings)
  - Feature comparison table
  - Pricing for recommended tier
  - "Upgrade Acum" primary button
  - "Poate mai târziu" secondary button

#### Scenario: Upgrade prompt on portfolio limit

- **WHEN** an artist hits their portfolio item limit
- **AND** attempts to upload a new item
- **THEN** an upgrade modal SHALL open
- **AND** it SHALL show similar content as booking limit prompt
- **BUT** it SHALL recommend Premium tier (unlimited portfolio)

#### Scenario: Upgrade prompt on premium feature

- **WHEN** an artist on Free tier clicks on a locked analytics section
- **THEN** an upgrade modal SHALL open
- **AND** it SHALL explain the analytics features available on Professional tier
- **AND** it SHALL show a preview/screenshot of the analytics dashboard

#### Scenario: Upgrade button action

- **WHEN** an artist clicks "Upgrade Acum" in the prompt modal
- **THEN** they SHALL be redirected to `/subscription-plans` with the recommended tier pre-selected
- **OR** the subscription tier selection modal SHALL open with the recommended tier highlighted

#### Scenario: Dismiss upgrade prompt

- **WHEN** an artist clicks "Poate mai târziu" or closes the modal
- **THEN** the modal SHALL close
- **AND** the original action SHALL be canceled (booking not created, file not uploaded)
- **AND** the artist SHALL remain on the current page

### Requirement: Server-Side Feature Gate Validation

All feature access checks SHALL be performed on the server side (API routes and middleware) to prevent client-side bypass.

#### Scenario: Client bypasses UI limit check

- **WHEN** a malicious user bypasses client-side feature gates using browser dev tools
- **AND** sends a direct API request to create a booking beyond their limit
- **THEN** the API route SHALL perform its own limit check
- **AND** it SHALL return 403 Forbidden
- **AND** the booking SHALL NOT be created in the database

#### Scenario: API route validates feature access

- **WHEN** any feature-gated API route is called
- **THEN** it SHALL:
  1. Authenticate the user
  2. Load the user's subscription tier from database
  3. Validate the requested action against tier permissions
  4. Return 403 if unauthorized
  5. Proceed with the action if authorized

#### Scenario: Middleware pre-validates requests

- **WHEN** the Next.js middleware intercepts a request to a feature-gated endpoint
- **THEN** it SHALL perform a lightweight check (cached subscription status)
- **AND** if the check fails, it SHALL return 403 without reaching the API route
- **AND** if the check passes, it SHALL allow the request to continue

### Requirement: Usage Tracking and Reset

The system SHALL accurately track feature usage and reset monthly counters at the appropriate time.

#### Scenario: Booking count increments on creation

- **WHEN** an artist successfully creates a booking
- **THEN** the system SHALL increment their `bookings_count_this_month` field in the `artist_subscriptions` table
- **AND** the increment SHALL happen atomically in the same transaction as the booking creation

#### Scenario: Booking count decrements on cancellation

- **WHEN** a booking is canceled by the artist or client
- **THEN** the system SHALL decrement the artist's `bookings_count_this_month` field
- **AND** this only applies to bookings within the current billing period

#### Scenario: Monthly usage counter reset

- **WHEN** an artist's subscription billing period renews (monthly or annual)
- **THEN** a cron job SHALL reset their usage counters:
  - `bookings_count_this_month` → 0
- **AND** the reset SHALL happen on the billing period start date, not calendar month

#### Scenario: Portfolio item count update

- **WHEN** an artist uploads or deletes a portfolio item
- **THEN** the system SHALL update their `portfolio_items_count` in the `artist_subscriptions` table
- **AND** this count does not reset monthly (it's a total count)

### Requirement: Grace Period for Limit Enforcement

The system SHALL provide a brief grace period when an artist's subscription expires or is downgraded to prevent immediate feature lockout.

#### Scenario: Subscription expires with grace period

- **WHEN** an artist's paid subscription expires
- **AND** their status changes to "past_due" or "canceled"
- **THEN** the system SHALL provide a 3-day grace period
- **AND** during the grace period, the artist SHALL retain access to paid features
- **BUT** a warning banner SHALL be displayed: "Abonamentul tău a expirat. Actualizează metoda de plată pentru a continua."

#### Scenario: Grace period expires

- **WHEN** the 3-day grace period ends
- **AND** the subscription has not been reactivated
- **THEN** the system SHALL immediately downgrade the artist to Free tier limits
- **AND** all premium features SHALL be locked
- **AND** usage counters SHALL be reset to match Free tier limits

#### Scenario: Reactivation within grace period

- **WHEN** an artist reactivates their subscription during the grace period
- **THEN** their paid tier access SHALL continue without interruption
- **AND** no usage counters SHALL be reset
- **AND** the warning banner SHALL disappear

### Requirement: Feature Access Check Function

The system SHALL provide a reusable `checkFeatureAccess()` function that can be called from any component or API route to validate feature access.

#### Scenario: Check booking creation access

- **WHEN** `checkFeatureAccess('create_booking', artistId)` is called
- **THEN** the function SHALL:
  1. Fetch the artist's subscription tier
  2. Get the current month's booking count
  3. Compare against tier's `maxBookingsPerMonth`
  4. Return `{ allowed: true }` if below limit
  5. Return `{ allowed: false, reason: 'limit_reached', requiredTier: 'professional' }` if at limit

#### Scenario: Check premium feature access

- **WHEN** `checkFeatureAccess('analytics', artistId)` is called
- **THEN** the function SHALL:
  1. Fetch the artist's subscription tier
  2. Check if tier's `analyticsAccess` is true
  3. Return `{ allowed: true }` if tier has access
  4. Return `{ allowed: false, reason: 'tier_required', requiredTier: 'professional' }` if tier lacks access

#### Scenario: Check portfolio upload access

- **WHEN** `checkFeatureAccess('upload_portfolio', artistId)` is called
- **THEN** the function SHALL follow the same pattern as booking creation check
- **BUT** compare against `maxPortfolioItems` instead

#### Scenario: Caching feature access checks

- **WHEN** `checkFeatureAccess()` is called multiple times for the same artist within a short period
- **THEN** the subscription tier data SHALL be cached for 5 minutes
- **AND** usage counts SHALL be fetched fresh on each call (not cached)
- **AND** this prevents excessive database queries while maintaining accuracy
