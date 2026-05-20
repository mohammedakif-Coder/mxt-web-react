# MXT — Messaging Dashboard

A full-featured messaging service dashboard built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Authentication** — Email/password login with Supabase Auth
- **Compose** — Send SMS/WhatsApp messages (single, bulk, CSV, contact lists)
- **Inbox** — Threaded conversations with keyboard shortcuts, starring, read/unread
- **Activity Log** — Filterable message history with CSV export
- **Campaigns** — Campaign management with delivery tracking
- **Contacts** — Contact management with tags, lists, opt-out tracking
- **Templates** — Reusable message templates with merge fields
- **Senders** — Multi-step sender ID registration workflow
- **Integrations** — Third-party integration management (static)
- **Developers** — API keys, webhooks, SDK references (static)
- **Settings** — Account and SMS preference management
- **Billing** — Balance, invoices, top-up
- **Help** — FAQ and support channels
- **AI Panel** — Collapsible AI assistant (static/mock — ready for future integration)
- **Command Palette** — ⌘+K quick navigation

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, RLS)
- **State**: TanStack React Query

## Setup

1. **Clone** the repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment**: Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
4. **Run the database migration**: Execute the SQL migration in `supabase/migrations/` against your Supabase project via the SQL Editor.
5. **Start the dev server**:
   ```bash
   npm run dev
   ```
6. **Open** http://localhost:8080

## Database Schema

The app uses 12 tables: `profiles`, `contacts`, `contact_lists`, `contact_list_members`, `senders`, `messages`, `campaigns`, `templates`, `inbox_threads`, `inbox_messages`, `invoices`, `activity_log`. All tables have RLS enabled.

## Deployment

Deploy to any static host (Vercel, Netlify, Cloudflare Pages):

```bash
npm run build
```

The `dist/` folder contains the production build.
