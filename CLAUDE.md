# DH Portal - Claude Code Instructions

## Project Overview

This is a Next.js application with Supabase authentication supporting Google OAuth, Facebook OAuth, and magic links.

## Authentication Setup

- Using Supabase v2.50.4
- Auth component: `src/components/Auth.tsx`
- Supabase client: `src/lib/supabase.ts`
- Supported auth methods: Google OAuth, Facebook OAuth, Magic Links
- Auth callback route: `/auth/callback`

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Code Conventions

- Use TypeScript for all files
- Follow existing component and file patterns in `src/components/`
- The SCSS files should live in a folder with the component it is intended to style. for example, for a hero component, there should be a Hero folder in the components folder, with both a hero.tsx, and a hero.modules.scss file within it.
- Prefer functional components with hooks
- Use absolute imports with `@/` prefix

## Styling Convetions

- Do not use tailwind for styling. We will only use Scss Modules.

## Supabase Configuration

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Auth providers configured: Google, Facebook
- Email templates configured for magic links

## Database Changes

- Create migration: `npx supabase migration new <name>`
- Test locally: `npx supabase db push --local`
- Deploy to production: `npx supabase db push --linked`

## Notes for Developers

- Always test auth flows after making changes
- Check Supabase dashboard for auth logs and user management
- Use `auth.sessions` table via SQL Editor to debug sessions
- Redirect URL for OAuth: `${window.location.origin}/auth/callback`
- CLAUDE should not run Git commands in order to avoid mistakes.
