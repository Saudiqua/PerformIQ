# PerformIQ MVP - AI-Powered Performance Management

## Overview
PerformIQ is a comprehensive performance management platform that uses AI to analyze employee communication patterns, generate insights, and provide actionable recommendations for both employees and managers.

## Current State
- **Status**: ✅ MVP Complete with PostgreSQL + PDF Export
- **Environment**: Development with PostgreSQL database
- **Server**: Running on port 5000
- **Database**: PostgreSQL with Drizzle ORM - 20 users, 1200+ communications, 192 metrics, 5 alerts
- **Testing**: End-to-end test suite passed for PostgreSQL migration and PDF export
- **Quality**: Database migration tested and verified

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Wouter for routing
- TanStack React Query for data fetching
- Recharts for data visualizations
- Shadcn UI component library

### Backend
- Express.js server
- PostgreSQL database with Drizzle ORM
- OpenAI API integration (via Replit AI Integrations)
- JWT authentication with bcrypt password hashing
- Idempotent data seeding with realistic performance patterns

### AI Integration
- OpenAI GPT-5 model via Replit AI Integrations
- Environment variables: AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY
- Features: Sentiment analysis, performance insights, AI-generated summaries

## Architecture

### Data Model
The application uses comprehensive TypeScript interfaces defined in `shared/schema.ts`:
- **User**: email, name, role (employee/manager/admin), team, manager relationships
- **Team**: name, department
- **Communication**: sender, recipient, platform (email/slack), timestamp, content, sentiment score
- **Metric**: initiative score, collaboration index, responsiveness rating, clarity score (all 0-100)
- **Alert**: type, severity, message, resolution status

### API Endpoints

#### Authentication
- POST `/api/auth/login` - User login with email/password
- POST `/api/auth/signup` - Create new account

#### Employee Endpoints
- GET `/api/employee/dashboard` - Complete dashboard data with metrics, AI insights, and trends

#### Manager Endpoints
- GET `/api/manager/dashboard` - Team health overview, member cards, alerts, analytics
- GET `/api/manager/employee/:id` - Detailed employee analysis with AI recommendations

#### Admin Endpoints
- GET `/api/admin/dashboard` - System-wide analytics and user management
- PUT `/api/admin/thresholds` - Update alert configuration thresholds

## Demo Accounts
All demo accounts use password: `demo123`

- **Employee**: employee@demo.com
- **Manager**: manager@demo.com
- **Admin**: admin@demo.com

## Database Data Generation
The application seeds realistic data into PostgreSQL on first startup:
- **20 users** across 3 teams (Engineering, Marketing, Sales)
  - 3 managers (one per team)
  - 1 admin
  - 16 employees with varying performance patterns
- **1200+ communications** over 3 months with varying sentiment (email and Slack)
- **192 metrics** (12 weeks of data per employee)
- **Performance patterns** including:
  - High performers (base score 85)
  - Struggling employees (base score 45)
  - Employees with recent performance drop
  - Employees showing burnout signals
  - Average performers (base score 68)
- **Automated alerts** for low engagement, performance drops, and burnout signals (5 total)

## User Roles & Dashboards

### Employee Dashboard (`/employee/dashboard`)
Features:
- Performance score with trend indicator
- 4 key metrics with trends: Initiative, Collaboration, Responsiveness, Clarity
- Communication statistics (response time, message volume, sentiment breakdown)
- Top collaboration partners
- 12-week performance trend chart
- AI-generated insights: strengths, growth areas, weekly highlights

### Manager Dashboard (`/manager/dashboard`)
Features:
- Team health overview with red/yellow/green status
- Team member performance cards with alerts
- Alerts sidebar panel showing flagged issues
- Team sentiment trend over time
- Workload distribution chart
- Click through to individual employee deep dive

### Employee Deep Dive (`/manager/employee/:id`)
Features:
- Comprehensive employee profile
- Current performance metrics with radial gauge charts
- 3-month trend visualization
- AI-generated performance summary (200-300 words)
- Recent communication examples with sentiment
- Action recommendations (Recognize, Support, Develop)
- 1:1 meeting talking points

### Admin Dashboard (`/admin/dashboard`)
Features:
- System-wide analytics
- User management table with role badges
- Alert threshold configuration with sliders
- Total users, communications, average performance score

## Design System
The application follows comprehensive design guidelines defined in `design_guidelines.md`:
- **Fonts**: Inter for UI text, JetBrains Mono for numbers
- **Colors**: Professional blue primary (#3B82F6), green for success, red/yellow for alerts
- **Spacing**: Consistent p-6 on cards, gap-6 on grids
- **Components**: Proper use of Shadcn Card, Button, Badge, Avatar components
- **Typography**: Clear hierarchy with defined sizes for titles, headers, body text
- **Data Visualization**: Clean Recharts implementation with proper tooltips and legends

## Recent Changes
*Last updated: October 23, 2025*

### Latest Updates - PostgreSQL Migration & PDF Export
- ✅ **PostgreSQL Migration Complete** (October 23, 2025)
  - Migrated from in-memory storage to PostgreSQL with Drizzle ORM
  - Created complete database schema with proper relationships and constraints
  - Implemented PostgresStorage class with full CRUD operations
  - Built idempotent data seeding system
  - All 6 tables created and seeded: users, teams, communications, metrics, alerts, thresholds
  - End-to-end tests passed confirming database integration works correctly

- ✅ **PDF Export Functionality** (October 23, 2025)
  - Implemented PDF export using jspdf and html2canvas libraries
  - Added "Export PDF" buttons to Employee Dashboard, Manager Dashboard, and Employee Deep Dive
  - Created reusable PDF export utility with toast notifications
  - Each dashboard wraps content in ID'd div for clean PDF capture
  - End-to-end tests passed confirming PDF exports work on all dashboards

### Completed MVP Features
- ✅ Complete authentication system with JWT tokens and bcrypt password hashing
- ✅ Role-based access control for Employee, Manager, and Admin
- ✅ Employee Dashboard with performance metrics, AI insights, collaboration stats, and 12-week trends
- ✅ Manager Dashboard with team health overview, member performance cards, alerts, and analytics charts
- ✅ Employee Deep Dive view with detailed metrics, AI summaries, and 1:1 talking points
- ✅ Admin Dashboard with user management, system analytics, and configurable alert thresholds
- ✅ OpenAI GPT-5 integration for sentiment analysis and AI-generated insights
- ✅ Full end-to-end test coverage for all user flows
- ✅ Fixed login race condition for reliable authentication flow
- ✅ Implemented proper admin API structure with separate endpoints
- ✅ Added comprehensive data-testid attributes for QA automation
- ✅ Professional UI design following Material Design principles

## Development Notes

### Running the Application
The application runs via the "Start application" workflow which executes `npm run dev`. This starts:
1. Express server on port 5000
2. Vite development server with HMR
3. Automatic data seeding on first launch

### Authentication Flow
1. User logs in with email/password
2. Backend validates credentials with bcrypt
3. JWT token generated and returned
4. Frontend stores token in localStorage
5. Token included in Authorization header for all API requests
6. Protected routes redirect based on user role

### OpenAI Integration
The application uses Replit AI Integrations which provides:
- OpenAI-compatible API access without personal API key
- Access to GPT-5 model (newest as of August 2025)
- Billing through Replit credits
- Environment variables automatically configured

### Key Files
- `shared/schema.ts` - TypeScript interfaces, Zod schemas, and Drizzle table definitions
- `server/db.ts` - PostgreSQL connection with Drizzle
- `server/pg-storage.ts` - PostgreSQL storage implementation with Drizzle ORM
- `server/seed-data.ts` - Idempotent database seeding with realistic patterns
- `server/openai-service.ts` - AI integration functions
- `server/auth.ts` - JWT authentication middleware
- `server/routes.ts` - All API endpoints
- `client/src/App.tsx` - Routing and layout
- `client/src/lib/queryClient.ts` - React Query configuration with auth
- `client/src/lib/pdf-export.ts` - PDF export utility
- `client/src/pages/*` - All dashboard pages with PDF export

## Testing Status
End-to-end test suite executed successfully on October 23, 2025:
- ✅ Employee authentication and dashboard navigation
- ✅ Manager authentication, dashboard, and deep dive navigation
- ✅ Admin authentication and all admin features
- ✅ Performance metrics display correctly from PostgreSQL
- ✅ AI insights generation working
- ✅ Charts and visualizations rendering properly
- ✅ Alert threshold configuration with persistence
- ✅ All API endpoints returning 200 status codes
- ✅ **PostgreSQL Migration Verified:**
  - 16 employees seeded in database
  - 192 metrics (12 weeks × 16 employees)
  - 1200 communications
  - 5 alerts
  - All data properly retrieved and displayed
- ✅ **PDF Export Verified:**
  - Employee Dashboard PDF export successful
  - Manager Dashboard PDF export successful
  - Employee Deep Dive PDF export successful
  - Toast notifications working correctly

## User Preferences
- Focus on visual excellence and professional design quality
- Use Material Design-inspired approach
- Inter font for UI text, JetBrains Mono for numerical data

## Known Limitations
- Simulated data patterns (not real email/Slack integrations)
- No real-time WebSocket notifications yet
- No date range filtering for analytics yet
- No dark mode toggle UI yet (styled for both modes but no toggle button)
- Minor CORS warnings for external avatar images (cosmetic only)

## Future Enhancements
- Real-time WebSocket notification system
- Advanced filtering and date range selectors
- Dark mode toggle button in UI
- Real integration with email/Slack APIs
- Email notifications for alerts
- Performance report scheduling and delivery
