# 8 Minutes

It only takes 8 minutes with a friend to feel less alone. 8 Minutes pairs
strangers for short, monitored conversations: take a 1-minute quiz, get matched
with the best available listener, and chat for eight minutes. Talk with a
credit, or earn credits by being a listener.

## Stack

- Next.js 14 (Pages Router), Tailwind CSS v4
- Supabase: phone-OTP auth, Postgres + RLS, Realtime chat

## Features

- Phone-number login (Supabase + Twilio SMS OTP)
- Credit system (1 credit = 8 minutes of talking)
  - Everyone gets 1 free credit per week, automatically (including existing
    accounts). Want more sooner? Earn extra by listening; you still get your
    weekly one either way. Granted by a weekly cron (`/api/cron/weekly-credits`,
    scheduled in [`vercel.json`](vercel.json)).
- 1-minute quiz that matches talkers to the best listener online now
- Real-time 8-minute chat with a countdown and roles (talker / listener)
- Anonymous "envelope" talk requests in your account
- Community bulletin board on the landing page
- Lightweight conversation monitoring (word-flagging + reporting)

## Setup

1. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

2. Create `.env.local` from the example and fill in your Supabase keys
   (Project Settings -> API):

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)

3. Apply the database schema to your Supabase project
   (`oxcxkjhtijwrmpeketxi`). Either paste
   [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
   into the Supabase SQL editor, or run it with the Supabase CLI:

   ```bash
   supabase link --project-ref oxcxkjhtijwrmpeketxi
   supabase db push
   ```

4. Enable phone auth in the Supabase dashboard:
   Authentication -> Providers -> Phone -> enable, then add your Twilio
   Account SID, Auth Token, and Message Service SID.

5. Run the dev server:

   ```bash
   npm run dev
   ```

## Notes

- Credit changes and matching run server-side with the service-role key and
  Postgres RPCs, so balances can't be tampered with from the client.
- Phone numbers are normalized to E.164 (a US `+1` prefix is assumed when no
  country code is given).

&copy; 2026 Sahiti Dasari.
