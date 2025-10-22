# PerformIQ MVP - AI-Powered Performance Management

## Overview
PerformIQ is a comprehensive performance management platform that uses AI to analyze employee communication patterns, generate insights, and provide actionable recommendations for both employees and managers.

## Current State
- **Status**: ✅ MVP Complete, Tested, and Demo-Ready
- **Environment**: Development with simulated data
- **Server**: Running on port 5000
- **Database**: In-memory storage with seeded realistic data
- **Testing**: End-to-end test suite passed for all user roles
- **Quality**: Architect-reviewed and approved

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
- In-memory storage (MemStorage)
- OpenAI API integration (via Replit AI Integrations)
- JWT authentication with bcrypt password hashing

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

## Mock Data Generation
The application generates realistic simulated data on startup:
- **24 users** across 3 teams (Engineering, Marketing, Sales)
- **1200+ communications** over 3 months with varying sentiment
- **Performance patterns** including:
  - 3 high performers (base score 85)
  - 3 struggling employees (base score 45)
  - 1 employee with recent performance drop
  - 1 employee showing burnout signals
  - 12 average performers (base score 68)
- **Automated alerts** for low engagement, performance drops, and burnout signals

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
*Last updated: October 22, 2025*

### Completed MVP Features
- ✅ Complete authentication system with JWT tokens and bcrypt password hashing
- ✅ Role-based access control for Employee, Manager, and Admin
- ✅ Employee Dashboard with performance metrics, AI insights, collaboration stats, and 12-week trends
- ✅ Manager Dashboard with team health overview, member performance cards, alerts, and analytics charts
- ✅ Employee Deep Dive view with detailed metrics, AI summaries, and 1:1 talking points
- ✅ Admin Dashboard with user management, system analytics, and configurable alert thresholds
- ✅ OpenAI GPT-5 integration for sentiment analysis and AI-generated insights
- ✅ Comprehensive data seeding with 24 users, 3 teams, 1200+ communications
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
- `shared/schema.ts` - TypeScript interfaces and Zod schemas
- `server/storage.ts` - In-memory storage implementation
- `server/seed-data.ts` - Mock data generation
- `server/openai-service.ts` - AI integration functions
- `server/auth.ts` - JWT authentication middleware
- `server/routes.ts` - All API endpoints
- `client/src/App.tsx` - Routing and layout
- `client/src/lib/queryClient.ts` - React Query configuration with auth
- `client/src/pages/*` - All dashboard pages

## Testing Status
End-to-end test suite executed successfully on October 22, 2025:
- ✅ Employee authentication and dashboard navigation
- ✅ Manager authentication, dashboard, and deep dive navigation
- ✅ Admin authentication and all admin features
- ✅ Performance metrics display correctly
- ✅ AI insights generation working
- ✅ Charts and visualizations rendering properly
- ✅ Alert threshold configuration with persistence
- ✅ All API endpoints returning 200 status codes

## User Preferences
- Focus on visual excellence and professional design quality
- Use Material Design-inspired approach
- Inter font for UI text, JetBrains Mono for numerical data

## Known Limitations
- Data is in-memory only (resets on server restart)
- Simulated data patterns (not real integrations)
- No email notifications
- No export to PDF (in future phase)
- No dark mode toggle (styled for both modes but no toggle UI)

## Future Enhancements
- Replace in-memory storage with PostgreSQL
- Export reports to PDF
- Real-time notification system
- Advanced filtering and date range selectors
- Dark mode toggle in UI
- Real integration with email/Slack APIs
