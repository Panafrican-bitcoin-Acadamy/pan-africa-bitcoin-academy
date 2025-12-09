# Bitcoin Academy - Learning Hub

A modern, visual guide to understanding Bitcoin — from keys and UTXOs to mining and wallets. Built to empower the next generation of African Bitcoin talent through education, mentorship, and community.

## Features

- **Student Dashboard** - Comprehensive dashboard with progress tracking, achievements, sats wallet, calendar, assignments, and learning path
- **Interactive Calendar** - Full-featured calendar with month/list views, color-coded events (live classes, assignments, deadlines, quizzes), and Google Calendar integration
- **Authentication System** - Sign In/Sign Up modal with beautiful UI, backdrop blur effects, and Notion-based profile management
- **Profile Management** - User profiles with editable information, profile picture upload, and automatic data sync with Notion
- **Progress Tracking** - Gamified progress overview with course completion, chapters, assignments, sats earned, and attendance rates
- **Achievements System** - Unlockable achievements with visual badges fetched from Notion
- **Sats Wallet** - Track earned sats with pending rewards from Notion Sats Rewards database
- **Learning Path** - Interactive chapter cards with status indicators (completed, in-progress, locked) and icons
- **Assignments & Tasks** - Organized view of due assignments and completed tasks
- **Live Sessions** - Upcoming events fetched from Notion Events database with join buttons and calendar integration
- **Community Integration** - Quick access to WhatsApp, Nostr, mentor messaging, and Q&A
- **Resources Hub** - Centralized access to guides, wallets, tools, and tutorials
- **Certification Tracking** - Progress towards certification with requirements checklist
- **Leaderboard** - Rankings based on sats earned from Notion Achievements database
- **Interactive Learning Chapters** - Comprehensive Bitcoin education from basics to advanced topics with Bitcoin-themed icons and suggested order
- **Cohort Registration** - Africa-focused registration with automatic country codes, flags, cohort selection from Notion, and real-time seat availability
- **Cohort Management** - Dynamic cohort display with status, sessions, level badges (Beginner/Intermediate/Advanced), and available seats calculated from enrollments
- **Mentorship Program** - Apply to become a mentor, guest lecturer, volunteer, or ambassador with clear vetting steps
- **Impact Dashboard** - Track progress with metrics, cohort history, and outcomes
- **Donation Support** - Lightning Network and on-chain Bitcoin donations
- **Blog ("Voices of the Bitcoin Academy")** - Student and mentor stories, technical deep dives, featured posts, and submissions
- **FAQ Section** - Answers to common questions about time zones, requirements, and policies
- **Full-width Layout & Bitcoin Backgrounds** - Futuristic Bitcoin B, blockchain, and keys visuals across all pages
- **Notion Integration** - Full database integration for students, applications, cohorts, enrollments, events, sats rewards, achievements, and profiles

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

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **React 19** - Latest React features
- **Notion API** - Database integration for applications and cohorts

## Getting Started

First, install dependencies:

```bash
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory (see `env.template` for reference):

```env
NOTION_API_KEY=secret_your_notion_api_key_here
NOTION_APPLICATIONS_DB_ID=your_applications_database_id_here
NOTION_COHORTS_DB_ID=your_cohorts_database_id_here
NOTION_COHORT_ENROLLMENT_DB_ID=your_cohort_enrollment_database_id_here
NOTION_STUDENTS_DB_ID=your_students_database_id_here
NOTION_EVENTS_DB_ID=your_events_database_id_here
NOTION_SATS_REWARDS_DB_ID=your_sats_rewards_database_id_here
NOTION_ACHIEVEMENTS_DB_ID=your_achievements_database_id_here
NOTION_PROFILE_DB_ID=your_profile_database_id_here
NOTION_DEVELOPER_RESOURCES_DB_ID=your_developer_resources_database_id_here
NOTION_DEVELOPER_EVENTS_DB_ID=your_developer_events_database_id_here
# ... and more (see env.template for full list)
```

See [NOTION_SETUP.md](./NOTION_SETUP.md) and [NOTION_DATABASES.md](./NOTION_DATABASES.md) for detailed setup instructions.

### Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Test Notion Connection

Visit [http://localhost:3000/api/notion/test](http://localhost:3000/api/notion/test) to verify your Notion integration is working.

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
│   └── notion.ts          # Notion API client and helpers
├── app/
│   └── api/               # API routes
│       └── notion/        # Notion integration endpoints
│           ├── test/      # Connection test endpoint
│           ├── submit-application/ # Form submission endpoint
│           ├── cohorts/   # Cohorts data endpoint
│           ├── students/  # Students data endpoint
│           ├── events/    # Events/calendar data endpoint
│           ├── sats/      # Sats rewards data endpoint
│           ├── leaderboard/ # Leaderboard data endpoint
│           ├── profile/   # Profile management endpoints (login, register, update)
│           ├── developer-resources/ # Developer resources from Notion
│           └── developer-events/ # Developer events and mentors from Notion
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

## Contributing

This project is part of a broader effort to build Bitcoin education and sovereignty in Africa. Contributions are welcome!

## License

Educational content - use responsibly. Not financial advice.

## Contact

For questions or support, visit the [FAQ page](/faq) or contact us through the [Contact page](/about).

---

Built with ❤️ for the Bitcoin community in Africa.
