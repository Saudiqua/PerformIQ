# PerformIQ MVP Design Guidelines

## Design Approach

**Selected Approach:** Design System-Based (Material Design + Linear-inspired refinements)

**Justification:** PerformIQ is a data-intensive performance management platform where clarity, efficiency, and information hierarchy are paramount. Users need to quickly scan metrics, understand trends, and make decisions. The design prioritizes usability and data comprehension over decorative elements.

**Key Design Principles:**
1. **Data First:** Metrics and insights take visual priority over decorative elements
2. **Cognitive Clarity:** Clear information hierarchy reduces mental load
3. **Trust Through Consistency:** Predictable patterns build user confidence
4. **Role-Appropriate Density:** Employees see focused views; managers see comprehensive overviews

---

## Typography System

**Font Families:**
- Primary: 'Inter' (Google Fonts) - All UI text, metrics, labels
- Accent: 'JetBrains Mono' (Google Fonts) - Numerical data, scores, percentages

**Type Scale:**
- **Page Titles:** text-3xl font-semibold (36px) - Dashboard headers
- **Section Headers:** text-xl font-semibold (20px) - Card titles, panel headers
- **Subsection Headers:** text-lg font-medium (18px) - Metric group labels
- **Body Text:** text-base font-normal (16px) - Descriptions, content
- **Supporting Text:** text-sm font-normal (14px) - Labels, captions
- **Micro Text:** text-xs font-medium (12px) - Timestamps, badges, chart labels
- **Display Numbers:** text-4xl font-bold (JetBrains Mono) - Performance scores
- **Metric Numbers:** text-2xl font-semibold (JetBrains Mono) - Key statistics

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16** exclusively
- Micro spacing (gaps, tight margins): 2, 4
- Standard spacing (card padding, element separation): 6, 8
- Section spacing (between major components): 12, 16

**Grid Structure:**
- **Sidebar Navigation:** Fixed 64px width (w-64), full height
- **Main Content Area:** Remaining width with max-w-7xl container, px-8 horizontal padding
- **Dashboard Cards:** Grid with gap-6, responsive columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Content Padding:** Consistent p-6 for all cards and panels

**Vertical Rhythm:**
- Space between page title and first content: mb-8
- Space between major sections: mb-12
- Space between related elements: mb-4 or mb-6

---

## Component Library

### Navigation Sidebar
- Fixed left sidebar, full height, 64px width
- Logo at top (h-16 with p-4)
- Navigation items: py-3 px-4, hover state with slightly elevated appearance
- Role badge below navigation (Employee/Manager/Admin)
- User profile section at bottom with avatar (h-10 w-10 rounded-full) and name

### Dashboard Cards
**Standard Card:**
- Rounded corners: rounded-lg
- Padding: p-6
- Shadow: subtle elevation
- Border: 1px solid divider
- Header with icon (h-5 w-5) + title + optional action button

**Metric Card (Performance Scores):**
- Centered layout with large display number (text-4xl JetBrains Mono)
- Metric label below (text-sm)
- Trend indicator: Small arrow icon + percentage change (text-xs)
- Mini sparkline chart below number (h-12)

**Alert Card:**
- Left accent border (border-l-4) indicating severity
- Icon + message + timestamp
- Click target for full employee details
- Badge showing severity level

**Employee Card (Manager Dashboard):**
- Avatar top-left (h-16 w-16 rounded-full)
- Name and role (text-lg font-medium)
- Performance score prominently displayed (text-2xl JetBrains Mono)
- Trend indicator (up/down arrow with %)
- 3 mini metrics in row below (response time, sentiment, activity)
- Alert badge in top-right corner if applicable

### Data Visualization Components
**Chart Container:**
- Height: h-64 for standard charts, h-80 for primary charts
- Padding: p-4
- Axis labels: text-xs
- Grid lines: subtle, minimal
- Tooltips: Clean with rounded-sm, p-2, text-sm

**Chart Types:**
- Line charts for trends (12-week performance, sentiment over time)
- Bar charts for comparisons (team workload distribution)
- Gauge/radial charts for scores (responsiveness rating)
- Simple node graphs for collaboration networks (avoid complexity)

### Form Elements
**Input Fields:**
- Height: h-12
- Padding: px-4
- Rounded: rounded-md
- Border: 1px solid, focus ring on interaction
- Labels: text-sm font-medium mb-2

**Buttons:**
- Primary: px-6 py-3 rounded-md font-medium
- Secondary: px-6 py-3 rounded-md font-medium with border
- Icon buttons: h-10 w-10 rounded-md
- No custom hover states (use system defaults)

### Data Tables (Admin Panel)
- Zebra striping for rows
- Column headers: text-xs font-semibold uppercase tracking-wide
- Cell padding: px-6 py-4
- Sortable columns with icon indicators
- Row actions on right (view, edit icons)

### Badges & Indicators
- Performance level: rounded-full px-3 py-1 text-xs font-medium
- Alert severity: rounded px-2 py-1 text-xs font-semibold
- Trend indicators: Inline with arrows (↑ ↓ →)

---

## Page-Specific Layouts

### Employee Dashboard (`/employee/dashboard`)
**Structure:**
1. **Page Header:** Welcome message with name, current date (mb-8)
2. **Performance Overview (Full Width):** Large score card with trend, h-48
3. **Four Metric Cards (2x2 Grid):** Initiative, Collaboration, Responsiveness, Clarity
4. **Communication Stats Section:** Grid of 4 stat cards (avg response time, messages, sentiment, top collaborators)
5. **AI Insights Panel:** Two-column layout - Strengths (left) + Growth Areas (right), p-8
6. **Weekly Trend Chart:** Full width, h-80, showing 12-week trends

### Manager Dashboard (`/manager/dashboard`)
**Structure:**
1. **Team Health Overview Bar:** Horizontal stats row - team score, category breakdown, alert count (h-24)
2. **Alerts Panel (Sidebar):** Right sidebar w-80, scrollable list of flagged issues
3. **Team Member Grid:** Main area, 3-4 columns of employee cards with performance snapshots
4. **Team Analytics Section (Below Grid):** 
   - Left: Collaboration network graph (w-1/2)
   - Right: Team sentiment trend line chart (w-1/2)

### Individual Deep Dive (`/manager/employee/:id`)
**Structure:**
1. **Employee Header:** Avatar + name + role + overall score (h-32)
2. **Three-Column Metric Overview:** Current scores for 3 key metrics with gauges
3. **Trend Charts Row:** 3 charts showing 3-month history for each metric
4. **AI Performance Summary:** Large text block (max-w-3xl, text-base, leading-relaxed)
5. **Communication Examples:** 3-4 cards showing recent message snippets with sentiment scores
6. **Action Recommendations:** Boxed section with 3 categorized suggestions (Recognize, Support, Develop)
7. **1:1 Talking Points:** Bulleted list in highlighted panel

### Admin Settings (`/admin/settings`)
**Structure:**
1. **Tabs Navigation:** Horizontal tabs (Users, Thresholds, Analytics, Settings)
2. **Users Tab:** Data table with filters, search, role badges
3. **Thresholds Tab:** Slider controls in card layout with current values displayed
4. **Analytics Tab:** System-wide stats in grid layout with comparison charts

---

## Images

**Logo/Branding:**
- PerformIQ logo in sidebar header (simple text-based or minimal icon, h-8)
- No large hero images (this is a dashboard application, not marketing)

**Avatars:**
- User profile photos throughout (circular, various sizes: h-10, h-16, h-20)
- Placeholder avatars for demo accounts with initials on solid backgrounds

**Icons:**
- Use Heroicons (outline style) via CDN for all UI icons
- Metric icons: TrendingUpIcon, UsersIcon, ClockIcon, ChatBubbleIcon
- Navigation icons: HomeIcon, ChartBarIcon, UserGroupIcon, CogIcon
- Trend indicators: ArrowUpIcon, ArrowDownIcon
- No custom SVG icons

**Illustrations:**
- Empty states: Simple centered icon + text (no complex illustrations)
- Demo mode banner: Small info icon + text banner at top

---

## Responsive Behavior

**Breakpoints:**
- Mobile (base): Single column layouts, sidebar collapses to bottom nav or hamburger
- Tablet (md:): 2-column grids, sidebar remains
- Desktop (lg:): 3-4 column grids, full feature set

**Mobile Adaptations:**
- Stack all grid layouts to single column
- Charts reduce height to h-48
- Hide secondary metrics, show primary data only
- Bottom navigation bar replaces sidebar
- Employee cards become list items with minimal info

---

## Special Considerations

**Data Density Balance:**
- Manager views: Higher density with more information per screen
- Employee views: Focused, less overwhelming with clear CTAs
- Use progressive disclosure: Summary → Details → Deep dive

**Loading States:**
- Skeleton loaders matching component structure (h-6 rounded, animate-pulse)
- Chart containers show skeleton with grid lines
- Never show empty white screens

**Demo Mode Indicator:**
- Persistent top banner (h-12, rounded-none) with "Demo Mode - Simulated Data" message
- Info icon + dismissible

**Accessibility:**
- Chart colors must have sufficient contrast
- All interactive elements have focus states
- Icon buttons include aria-labels
- Maintain consistent tab order through complex dashboards

---

## Animation Guidelines

**Minimal Animations Only:**
- Page transitions: None (instant route changes)
- Hover states: System default (no custom transitions)
- Chart rendering: Simple fade-in (duration-300)
- Modals: Fade in backdrop, scale content slightly
- Loading spinners: Subtle rotation only

**Prohibited:**
- Scroll-triggered animations
- Parallax effects
- Complex transitions
- Anything that distracts from data consumption