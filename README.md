# Pan-Africa Bitcoin Academy - Learning Hub

A modern, visual guide to understanding Bitcoin — from keys and UTXOs to mining and wallets. Built to empower the next generation of African Bitcoin talent through education, mentorship, and community.

## Features

- **Student Dashboard** - Comprehensive dashboard with progress tracking, achievements, sats wallet, calendar, assignments, and learning path
- **Interactive Calendar** - Full-featured calendar with month/list views, color-coded events (live classes, assignments, deadlines, quizzes), and Google Calendar integration
- **Authentication System** - Sign In/Sign Up modal with beautiful UI, backdrop blur effects, and Supabase-based profile management
- **Profile Management** - User profiles with editable information, profile picture upload, and automatic data sync with Supabase
- **Progress Tracking** - Gamified progress overview with course completion, chapters, assignments, sats earned, and attendance rates
- **Achievements System** - Unlockable achievements with visual badges fetched from Supabase
- **Sats Wallet** - Track earned sats with pending rewards from Supabase database
- **Learning Path** - Interactive chapter cards with status indicators (completed, in-progress, locked) and icons
- **Assignments & Tasks** - Organized view of due assignments and completed tasks
- **Live Sessions** - Upcoming events fetched from Supabase Events table with join buttons and calendar integration
- **Community Integration** - Quick access to WhatsApp, Nostr, mentor messaging, and Q&A
- **Resources Hub** - Centralized access to guides, wallets, tools, and tutorials
- **Certification Tracking** - Progress towards certification with requirements checklist
- **Leaderboard** - Rankings based on sats earned from Supabase database
- **Interactive Learning Chapters** - Comprehensive Bitcoin education from basics to advanced topics with Bitcoin-themed icons and suggested order
- **Cohort Registration** - Africa-focused registration with automatic country codes, flags, cohort selection from Supabase, and real-time seat availability
- **Cohort Management** - Dynamic cohort display with status, sessions, level badges (Beginner/Intermediate/Advanced), and available seats calculated from enrollments
- **Developer Hub** - Comprehensive roadmap for Bitcoin developers with learning resources, community links, opportunities, portfolio projects, and certification path
- **Mentorship Program** - Apply to become a mentor, guest lecturer, volunteer, or ambassador with clear vetting steps
- **Impact Dashboard** - Track progress with metrics, cohort history, and outcomes
- **Donation Support** - Lightning Network and on-chain Bitcoin donations
- **Blog ("Voices of the Pan-Africa Bitcoin Academy")** - Student and mentor stories, technical deep dives, featured posts, and submissions
- **FAQ Section** - Answers to common questions about time zones, requirements, and policies
- **Full-width Layout & Bitcoin Backgrounds** - Futuristic Bitcoin B, blockchain, and keys visuals across all pages
- **Supabase Integration** - Full database integration for students, applications, cohorts, enrollments, events, sats rewards, achievements, and profiles

## Pages

- **Home** - Overview with Bitcoin-themed visuals, funder logos, and community links (WhatsApp, Nostr, Discord)
- **Dashboard** - Student dashboard with progress tracking, calendar, achievements, assignments, and learning path
- **Chapters** - Learning content with progress, suggested order, and Bitcoin iconography
- **Apply** - Registration form with Africa-focused country codes and cohort details
- **Developer Hub** - Roadmap for Bitcoin developers with learning resources, global communities, opportunities, and portfolio project ideas
- **FAQ** - Frequently asked questions
- **Mentorship** - Volunteer and mentor application
- **Impact** - Impact dashboard with metrics and student outcomes
- **Donate** - Bitcoin donation page with Lightning and on-chain options
- **Blog** - Featured stories, categories, submissions, and individual posts
- **About** - Mission and project information

## SEO & Optimization

- **Enhanced Metadata** - Open Graph, Twitter Cards, and comprehensive meta tags
- **Structured Data (JSON-LD)** - Schema.org markup for better search visibility
- **Dynamic Sitemap** - Auto-generated sitemap.xml for search engines
- **robots.txt** - Proper crawling directives
- **Performance Optimizations** - Image optimization, compression, security headers
- **Page-Specific SEO** - Custom metadata for each page

See [SEO_OPTIMIZATION.md](./SEO_OPTIMIZATION.md) for detailed SEO setup and testing guide.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **React 19** - Latest React features
- **Supabase** - PostgreSQL database with real-time capabilities and authentication
- **Vercel** - Deployment and hosting platform

## Getting Started

First, install dependencies:

```bash
npm install
```

### Environment Setup

The project uses Supabase for database and backend services. Environment variables are automatically configured when using the Vercel Supabase integration.

For local development, create a `.env.local` file (see `env.template` for reference):

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://panafricanbitcoin.com

# Supabase Configuration (auto-configured via Vercel integration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) and [STEP_BY_STEP_GUIDE.md](./STEP_BY_STEP_GUIDE.md) for detailed setup instructions.

### Database Setup

1. Run the SQL schema in Supabase SQL Editor (see `supabase/schema.sql`)
2. Add sample data (optional, see `supabase/sample-data.sql`)
3. Verify tables are created and RLS policies are enabled

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Student dashboard
│   ├── chapters/          # Learning content
│   ├── apply/             # Cohort registration
│   ├── developer-hub/     # Developer Hub with roadmap and resources
│   ├── donate/            # Donation page
│   ├── faq/               # FAQ page
│   ├── impact/            # Impact dashboard
│   ├── mentorship/        # Mentorship application
│   ├── blog/              # Blog listing, submit, and post routes
│   └── globals.css        # Global styles and Bitcoin theme
├── components/            # React components
│   ├── Navbar.tsx         # Navigation header with Sign In button
│   ├── Footer.tsx         # Footer component with social links
│   ├── AuthModal.tsx      # Sign In modal with backdrop blur
│   ├── StudentDashboard.tsx # Main student dashboard component
│   ├── Calendar.tsx        # Interactive calendar with events
│   ├── PageContainer.tsx  # Page layout wrapper (full-width)
│   └── BitcoinIcons.tsx   # Custom Bitcoin B iconography
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client initialization
├── app/
│   └── api/               # API routes
│       ├── students/      # Students data endpoint
│       ├── events/        # Events/calendar data endpoint
│       ├── cohorts/       # Cohorts data endpoint
│       ├── sats/          # Sats rewards data endpoint
│       ├── leaderboard/   # Leaderboard data endpoint
│       ├── profile/        # Profile management endpoints (login, register, update)
│       └── submit-application/ # Application submission endpoint
├── supabase/              # Database schema and migrations
│   ├── schema.sql         # Complete database schema
│   └── sample-data.sql    # Sample data for testing
├── app/layout.tsx         # Root layout with Bitcoin backgrounds
└── tailwind.config.ts     # Tailwind theme (Bitcoin palette)
```

## Bitcoin Theme

The site uses a futuristic Bitcoin-themed design with:
- Deep blue backgrounds (`#02000a`)
- Orange accents (`#f97602`)
- Cyan and purple highlights
- Bitcoin network-inspired background effects
- Glowing neon-style elements

## Deployment

The project is deployed on Vercel with automatic deployments from GitHub. Supabase integration is configured via Vercel's integration system.

- **Production URL**: https://pan-africa-bitcoin-academy-yohannes-projects-586fef0b.vercel.app
- **Custom Domain**: https://panafricanbitcoin.com
- **Vercel Dashboard**: https://vercel.com/yohannes-projects-586fef0b/pan-africa-bitcoin-academy

## Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase database setup guide
- [STEP_BY_STEP_GUIDE.md](./STEP_BY_STEP_GUIDE.md) - Complete step-by-step implementation guide
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Testing checklist for all features
- [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) - Current deployment status and information

## Contributing

This project is part of a broader effort to build Bitcoin education and sovereignty in Africa. Contributions are welcome!

## License

Educational content - use responsibly. Not financial advice.

## Contact

For questions or support, visit the [FAQ page](/faq) or contact us through the [About page](/about).

---

Built with ❤️ for the Bitcoin community in Africa.
