# DentalOS HR

A multi-tenant HR management platform for dental practices that handles employee lifecycle management, document management with e-signatures, attendance tracking with automated point system, performance reviews, compliance management, and onboarding workflows.

## 🚀 Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Deployment:** Vercel

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── employees/         # Employee management
│   │   ├── documents/         # Document management
│   │   ├── attendance/        # Attendance tracking
│   │   ├── pto/               # PTO/Time off
│   │   ├── performance/       # Performance reviews
│   │   ├── discipline/        # Discipline tracking
│   │   ├── training/          # Training management
│   │   ├── onboarding/        # Onboarding workflows
│   │   ├── licenses/          # License tracking
│   │   └── settings/          # Organization settings
│   ├── auth/                  # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── api/                   # API routes
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── layout/                # Layout components
├── lib/
│   ├── supabase/              # Supabase clients & auth
│   ├── actions/               # Server actions
│   └── validations/           # Zod schemas
├── types/
│   └── database.ts            # TypeScript types
└── hooks/                     # Custom React hooks
```

## 🗄️ Database Schema

The database includes the following tables:

### Core Tables
- `organizations` - Multi-tenant support for dental practices
- `users` - Authentication and access control
- `employees` - Employee roster with full details
- `positions` - Job descriptions and KPIs

### HR Management
- `attendance_records` - Daily attendance with points
- `pto_requests` - Time off requests and approvals
- `performance_reviews` - Review scheduling and scoring
- `discipline_incidents` - Progressive discipline tracking
- `licenses` - Certification and license tracking

### Documents & Training
- `document_templates` - Document templates with merge fields
- `employee_documents` - Document storage and e-signatures
- `training_courses` - Training catalog
- `employee_training` - Training assignments

### Onboarding
- `onboarding_templates` - Checklist templates
- `onboarding_template_tasks` - Template tasks
- `employee_onboarding` - Active onboarding progress

### System
- `audit_log` - Track all changes
- `notifications` - User notifications
- `pto_settings` / `attendance_settings` - Organization settings

## 🔐 User Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Owner** | Practice owner | Full access to everything |
| **Admin** | Office manager | Full HR access except billing |
| **Manager** | Department lead | Manage direct reports |
| **Employee** | Regular employee | Self-service portal only |

## 📊 Key Features

### Dashboard
- Headcount overview
- Compliance alerts (licenses, training)
- Attendance summary
- Pending actions list

### Employee Management
- Employee directory with search/filter
- Org chart visualization
- Complete profile management
- Employment lifecycle tracking

### Attendance & Points System
- Daily attendance logging
- Automatic point calculation:
  - Tardiness: 1 point
  - Left Early: 1 point
  - Unexcused Absence: 3 points
  - No-Call/No-Show: 10 points
- Rolling 90-day reset
- Threshold alerts (2, 5, 7, 10 points)

### Document Management
- Document templates with merge fields
- E-signature workflow
- Document status tracking
- Secure file storage

### Performance Reviews
- Scheduled reviews (30/60/90 day, quarterly, annual)
- Rating scales and scoring
- Digital signatures
- Compensation recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dentalos-hr
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. Set up the database:
   - Create a new Supabase project
   - Run the migration file at `supabase/migrations/00001_initial_schema.sql`

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Running Locally
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Database Migrations
Migration files are located in `supabase/migrations/`. Run them in order in your Supabase SQL editor.

### Adding New shadcn/ui Components
```bash
npx shadcn@latest add <component-name>
```

## 📱 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📈 Roadmap

### Phase 1: MVP ✅
- [x] Authentication & Multi-Tenancy
- [x] Employee Management
- [x] Dashboard with KPIs
- [ ] Document Management (in progress)
- [ ] Attendance & Points System

### Phase 2: Core Features
- [ ] Onboarding Workflows
- [ ] Performance Management
- [ ] PTO Management
- [ ] Discipline Tracking

### Phase 3: Advanced Features
- [ ] License & Certification Tracking
- [ ] Training Management
- [ ] Advanced Documents with E-Signatures
- [ ] Reporting & Analytics

### Phase 4: Scale
- [ ] Payroll Integrations
- [ ] Calendar Integrations
- [ ] Practice Management Integrations
- [ ] Mobile App

## 💰 Pricing Model

| Tier | Employees | Price | Features |
|------|-----------|-------|----------|
| Starter | 1-10 | $49/mo | Core HR, Documents, Attendance |
| Professional | 11-25 | $99/mo | + Reviews, Training, PTO |
| Business | 26-50 | $199/mo | + Custom Forms, Reports, API |
| Enterprise | 50+ | Custom | + SSO, Integrations, Support |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, email support@dentalos.com or open an issue in this repository.

---

Built with ❤️ for dental practices everywhere.
