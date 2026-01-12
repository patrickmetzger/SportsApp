# School Sports Management System

A comprehensive sports management platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Multi-role Authentication**: Support for Admins, Coaches, Students, and Parents
- **Role-based Dashboards**: Custom dashboards for each user type
- **Secure Authentication**: Powered by Supabase Auth
- **Modern UI**: Built with Tailwind CSS for a responsive design
- **Type-safe**: Full TypeScript support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- npm or yarn package manager

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd SchoolSports
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Go to [supabase.com](https://supabase.com) and create a new project

   b. Once your project is created, go to Settings > API

   c. Copy your Project URL and anon/public key

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. **Set up the database schema**

   In your Supabase dashboard, go to the SQL Editor and run:

   ```sql
   -- Create users table
   CREATE TABLE IF NOT EXISTS users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email TEXT UNIQUE NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'student', 'parent')),
     first_name TEXT,
     last_name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create students table
   CREATE TABLE IF NOT EXISTS students (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     grade INTEGER,
     parent_id UUID REFERENCES users(id),
     sports TEXT[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create coaches table
   CREATE TABLE IF NOT EXISTS coaches (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     sport TEXT NOT NULL,
     team_name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create parents table
   CREATE TABLE IF NOT EXISTS parents (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     students UUID[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE students ENABLE ROW LEVEL SECURITY;
   ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
   ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

   -- Create policies (examples - adjust as needed)
   CREATE POLICY "Users can view their own data" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Admins can view all users" ON users
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM users
         WHERE id = auth.uid() AND role = 'admin'
       )
     );
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
SchoolSports/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── admin/               # Admin dashboard
│   ├── dashboard/           # User dashboards
│   │   ├── student/
│   │   ├── parent/
│   │   └── coach/
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # Reusable components
│   ├── layout/
│   └── ui/
├── lib/                     # Utility functions
│   ├── supabase/           # Supabase clients
│   ├── auth.ts             # Auth helpers
│   └── types.ts            # TypeScript types
├── middleware.ts           # Route protection
└── package.json
```

## User Roles

- **Admin**: Full system access, user management, system configuration
- **Coach**: Team management, scheduling, player performance tracking
- **Student**: View teams, schedules, and personal performance
- **Parent**: Monitor children's activities, schedules, and communications

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Next Steps

- Implement team management features
- Add scheduling system
- Create messaging/communication features
- Build performance tracking
- Add payment processing
- Implement reporting and analytics

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

Proprietary - All rights reserved
