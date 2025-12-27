# PerformIQ Admin Dashboard - Design Guidelines

## Design Approach
**Selected Framework:** Modern Enterprise Dashboard System
**Primary References:** Linear (clean layouts, refined typography), Vercel Dashboard (card-based data), Stripe Dashboard (professional density)
**Key Principle:** Information clarity with visual polish - every pixel serves the user's workflow

## Layout Architecture

**Sidebar Navigation (240px fixed)**
- Company logo/branding at top
- Primary nav items: Dashboard, Integrations, Events, Settings, Team
- Sync status indicator at bottom
- Collapsible on mobile (hamburger menu)

**Main Content Area**
- Top bar: Page title, search, notifications, theme toggle (moon/sun icon), user profile
- Content container: max-w-7xl with px-6 py-8 spacing
- Responsive grid system for cards and data tables

**Spacing System:** Use Tailwind units of 2, 4, 6, and 8 consistently (p-4, gap-6, mb-8)

## Typography Hierarchy

**Font Stack:** Inter (primary), SF Mono (code/data)
- Page Titles: 2xl/3xl, font-semibold
- Section Headers: lg/xl, font-medium  
- Body Text: sm/base, font-normal
- Metrics/Stats: 2xl/3xl, font-bold
- Timestamps/Meta: xs/sm, reduced opacity

## Component Library

**Integration Cards (Grid: 3 columns desktop, 2 tablet, 1 mobile)**
- Integration logo (40px circular avatar)
- Service name + connection status badge
- Last sync timestamp
- Quick action: "Sync Now" button (primary small)
- Hover state: subtle elevation increase
- Connection status: Green dot (active), Yellow (syncing), Red (error)

**Sync Status Panel**
- Positioned prominently at dashboard top
- Real-time metrics: Total integrations, Active syncs, Events today
- Visual sync progress bars for active operations
- "Sync All" primary action button

**Events Table**
- Sortable columns: Timestamp, Integration, Event Type, Status, Actions
- Row actions: View details, Retry (for failed events)
- Pagination footer with items per page selector
- Empty state with helpful illustration + setup CTA

**Status Badges**
- Success: Green with checkmark icon
- Processing: Blue with spinner animation
- Error: Red with alert icon
- Pending: Gray with clock icon
- Small pill shape with icon + text

**Theme Toggle**
- Icon-only button in top bar
- Smooth transition between modes (200ms ease)
- Persists user preference

## Dashboard Sections

1. **Quick Stats Bar** (4-column grid)
   - Connected Integrations count
   - Events Synced Today count  
   - Success Rate percentage
   - Last Sync time

2. **Integration Management Grid**
   - Header: "Connected Integrations" + "Add Integration" button
   - Cards showing: Slack, Gmail, Outlook, Teams, Zoom
   - Each card includes manual sync trigger

3. **Recent Events Stream**
   - Table view of latest 20 normalized events
   - Filter controls: By integration, By status, Date range
   - Real-time updates via subtle flash animation on new rows

4. **Sync Activity Timeline** (optional sidebar widget)
   - Chronological list of recent sync operations
   - Visual timeline connector between items

## Interactive Elements

**Buttons:**
- Primary: Used for main actions (Sync Now, Add Integration)
- Secondary: Used for optional actions (View Details)
- Danger: For destructive actions (Disconnect)
- Ghost: For tertiary actions in tables

**Inputs:**
- Search bar with icon prefix in top bar
- Date range picker with calendar dropdown
- Multi-select filters with checkboxes

## Animations
- Page transitions: None (instant navigation)
- Loading states: Subtle skeleton screens for cards and tables
- Sync progress: Smooth indeterminate progress bar
- Success feedback: Brief checkmark animation (500ms)

## Images
**No hero images required** - This is a functional dashboard focused on data and workflows. Use integration logos (Slack, Gmail, etc.) as 40px circular avatars within cards and tables.

## Accessibility Notes
- All status indicators include text labels, not color alone
- Interactive elements maintain 44px minimum touch target
- Form inputs have visible labels and clear focus states
- Keyboard navigation supported throughout (tab order, shortcuts)