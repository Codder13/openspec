# Navigation Capability Spec

## ADDED Requirements

### Requirement: Header Pricing Link

The application SHALL display a "Prețuri" (Pricing) link in the main navigation header that is visible to all users (authenticated and non-authenticated) and navigates to the subscription plans page.

#### Scenario: Desktop navigation displays pricing link

- **WHEN** a user views the header on desktop (viewport ≥ 768px)
- **THEN** the navigation menu SHALL display links in order: "Acasă", "Artiști", "Categorii", "Prețuri", "Despre Noi", "Contact"
- **AND** the "Prețuri" link SHALL navigate to `/subscription-plans` when clicked

#### Scenario: Mobile navigation displays pricing link

- **WHEN** a user opens the mobile menu (viewport < 768px)
- **THEN** the mobile navigation menu SHALL include a "Prețuri" menu item
- **AND** clicking the item SHALL navigate to `/subscription-plans` and close the mobile menu

#### Scenario: Pricing link styling consistency

- **WHEN** the pricing link is displayed
- **THEN** it SHALL use the same styling as other navigation links (font-medium, hover effects, icon)
- **AND** it SHALL use an appropriate icon (e.g., Sparkles, DollarSign, or Star)

#### Scenario: Active state highlighting

- **WHEN** a user is on the `/subscription-plans` page
- **THEN** the "Prețuri" navigation link SHALL display an active state (e.g., different color or underline)

### Requirement: Mobile Menu Integration

The mobile menu component SHALL include the pricing link with the same functionality as desktop navigation.

#### Scenario: Mobile menu includes pricing

- **WHEN** the SimpleMobileMenu component is rendered
- **THEN** it SHALL include a "Prețuri" menu item between "Categorii" and "Despre Noi"
- **AND** the menu item SHALL have an icon and Romanian label

#### Scenario: Mobile menu navigation

- **WHEN** a user clicks "Prețuri" in the mobile menu
- **THEN** the application SHALL navigate to `/subscription-plans`
- **AND** the mobile menu SHALL close automatically
