# K12Calendar 📅

A sophisticated event management platform specifically designed for K-12 schools, bringing the power of modern event management to education.

![K12Calendar](https://img.shields.io/badge/K12Calendar-Event%20Management-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)

## 🌟 Features

### For Schools
- **Event Creation Wizard**: Step-by-step event creation with templates
- **Analytics Dashboard**: Real-time metrics on ticket sales, attendance, and revenue
- **Automated Communications**: Email/SMS reminders and updates
- **Capacity Management**: Track RSVPs and manage event capacity
- **Check-in System**: QR code-based check-in for events

### For Parents/Students
- **Personalized Event Feed**: Discover relevant school events
- **Easy RSVP**: Quick sign-up with family management
- **Calendar Sync**: Sync events to Google/Apple calendars
- **Mobile-First Design**: Access on any device
- **Real-time Updates**: Get notifications about event changes

### For Districts
- **Multi-School Management**: Oversee events across all schools
- **Compliance Tracking**: Ensure policy adherence
- **Resource Allocation**: Optimize venue and staff usage
- **Unified Reporting**: District-wide analytics and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- (Optional) PostHog account for analytics

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/k12-calendar.git
cd k12-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 🏗️ Project Structure

```
k12-calendar/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── events/        # Event-related components
│   │   └── layout/        # Layout components
│   ├── pages/             # Page components
│   │   ├── auth/          # Auth pages (login, register)
│   │   ├── dashboard/     # Dashboard pages by role
│   │   └── public/        # Public pages
│   ├── lib/               # External library configs
│   ├── store/             # State management (Zustand)
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── i18n/              # Internationalization
│   └── styles/            # Global styles
├── public/                # Static assets
└── supabase/              # Database schemas and migrations
```

## 📊 Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('parent', 'teacher', 'school_admin', 'district_admin')),
  school_id UUID REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_id UUID REFERENCES districts(id),
  address JSONB,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  capacity INTEGER,
  event_type TEXT,
  requires_rsvp BOOLEAN DEFAULT false,
  requires_payment BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

The app uses a clean, modern design inspired by:
- **Notion**: Clean layouts and intuitive UX
- **Eventbrite**: Event-focused features
- **Salesforce**: Enterprise-grade analytics

### Color Palette
- Primary: Indigo (`#6366f1`)
- Success: Green (`#10b981`)
- Warning: Amber (`#f59e0b`)
- Error: Red (`#ef4444`)

## 🌐 Internationalization

The app supports multiple languages:
- English (default)
- Spanish
- More languages can be added in `src/i18n/config.js`

## 🔒 Security

- Supabase Row Level Security (RLS) for data protection
- Role-based access control (RBAC)
- Secure authentication with magic links and OAuth
- Input validation with Zod
- XSS protection built into React

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📝 License

MIT License - feel free to use this for your school!

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 💬 Support

- Documentation: [docs.k12calendar.com](https://docs.k12calendar.com)
- Issues: [GitHub Issues](https://github.com/yourusername/k12-calendar/issues)
- Email: support@k12calendar.com

---

Built with ❤️ for Education 🚌
