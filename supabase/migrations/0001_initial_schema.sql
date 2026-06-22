-- 8 Minutes — initial schema
-- Apply via Supabase SQL editor or `supabase db push` against project oxcxkjhtijwrmpeketxi.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text not null default 'friend',
  phone                 text,
  bio                   text,
  avatar_url            text,
  credits               integer not null default 1,
  is_listener_available boolean not null default false,
  last_seen             timestamptz,
  created_at            timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  conversation_type text,
  mood              text,
  interests         text[] not null default '{}',
  created_at        timestamptz not null default now()
);
create index if not exists survey_responses_user_idx on public.survey_responses (user_id, created_at desc);

create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  talker_id        uuid not null references public.profiles (id) on delete cascade,
  listener_id      uuid not null references public.profiles (id) on delete cascade,
  status           text not null default 'active' check (status in ('waiting', 'active', 'ended')),
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_seconds integer not null default 480,
  created_at       timestamptz not null default now()
);
create index if not exists conversations_talker_idx on public.conversations (talker_id);
create index if not exists conversations_listener_idx on public.conversations (listener_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  content         text not null,
  flagged         boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

create table if not exists public.credit_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  amount          integer not null,
  reason          text not null,
  conversation_id uuid references public.conversations (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists credit_transactions_user_idx on public.credit_transactions (user_id, created_at desc);

create table if not exists public.talk_requests (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  recipient_id    uuid not null references public.profiles (id) on delete cascade,
  body            text,
  is_anonymous    boolean not null default true,
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  conversation_id uuid references public.conversations (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists talk_requests_recipient_idx on public.talk_requests (recipient_id, status);

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete set null,
  reporter_id     uuid not null references public.profiles (id) on delete cascade,
  reason          text,
  created_at      timestamptz not null default now()
);

create table if not exists public.bulletin_posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references public.profiles (id) on delete set null,
  display_name text not null default 'anonymous',
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists bulletin_posts_created_idx on public.bulletin_posts (created_at desc);

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name, credits)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'friend'),
    1
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.credits in sync with the credit ledger.
create or replace function public.handle_credit_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set credits = credits + new.amount
   where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_credit_transaction on public.credit_transactions;
create trigger on_credit_transaction
  after insert on public.credit_transactions
  for each row execute function public.handle_credit_transaction();

-- Lightweight content moderation: flag messages containing banned words.
create or replace function public.flag_message()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  banned text[] := array['kys', 'kill yourself', 'suicide', 'fuck you'];
  w text;
begin
  foreach w in array banned loop
    if position(lower(w) in lower(new.content)) > 0 then
      new.flagged := true;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  before insert on public.messages
  for each row execute function public.flag_message();

-- Atomically match a talker with a listener: verify credit, create the
-- conversation, debit the talker, and take the listener off the queue.
create or replace function public.app_create_match(p_talker uuid, p_listener uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
  v_conversation_id uuid;
begin
  select credits into v_credits from public.profiles where id = p_talker for update;
  if v_credits is null or v_credits < 1 then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.conversations (talker_id, listener_id, status, started_at)
  values (p_talker, p_listener, 'active', now())
  returning id into v_conversation_id;

  insert into public.credit_transactions (user_id, amount, reason, conversation_id)
  values (p_talker, -1, 'spent_on_conversation', v_conversation_id);

  update public.profiles set is_listener_available = false where id = p_listener;

  return v_conversation_id;
end;
$$;

-- End a conversation. Idempotent: only the first call flips the status and
-- awards the listener a credit (for completing ~7+ minutes).
create or replace function public.app_end_conversation(p_conversation uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv public.conversations%rowtype;
  v_elapsed integer;
begin
  select * into v_conv from public.conversations where id = p_conversation for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if v_conv.talker_id <> p_user and v_conv.listener_id <> p_user then
    raise exception 'FORBIDDEN';
  end if;
  if v_conv.status = 'ended' then
    return;
  end if;

  update public.conversations
     set status = 'ended', ended_at = now()
   where id = p_conversation;

  v_elapsed := extract(epoch from (now() - coalesce(v_conv.started_at, now())));
  if v_elapsed >= 420 then
    insert into public.credit_transactions (user_id, amount, reason, conversation_id)
    values (v_conv.listener_id, 1, 'earned_listening', p_conversation);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.survey_responses    enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.talk_requests       enable row level security;
alter table public.reports             enable row level security;
alter table public.bulletin_posts      enable row level security;

-- profiles: a user manages only their own row. Partner display info is served
-- through server (service-role) API routes to keep credits private.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- survey_responses: fully owned by the user.
drop policy if exists survey_all_own on public.survey_responses;
create policy survey_all_own on public.survey_responses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- conversations: only the two participants can read. Writes go through RPCs.
drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
  for select using (talker_id = auth.uid() or listener_id = auth.uid());

-- messages: participants read; participants insert their own messages while active.
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
       where c.id = messages.conversation_id
         and (c.talker_id = auth.uid() or c.listener_id = auth.uid())
    )
  );

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
       where c.id = messages.conversation_id
         and c.status = 'active'
         and (c.talker_id = auth.uid() or c.listener_id = auth.uid())
    )
  );

-- credit_transactions: read own ledger only. Inserts happen via triggers/RPCs.
drop policy if exists credit_select_own on public.credit_transactions;
create policy credit_select_own on public.credit_transactions
  for select using (user_id = auth.uid());

-- talk_requests: sender/recipient can read; sender inserts; recipient updates.
drop policy if exists talk_requests_select on public.talk_requests;
create policy talk_requests_select on public.talk_requests
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists talk_requests_insert on public.talk_requests;
create policy talk_requests_insert on public.talk_requests
  for insert with check (sender_id = auth.uid());

drop policy if exists talk_requests_update_recipient on public.talk_requests;
create policy talk_requests_update_recipient on public.talk_requests
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- reports: a participant can file and read their own reports.
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (reporter_id = auth.uid());

-- bulletin_posts: world-readable; authenticated users may post as themselves.
drop policy if exists bulletin_select_all on public.bulletin_posts;
create policy bulletin_select_all on public.bulletin_posts
  for select using (true);

drop policy if exists bulletin_insert_auth on public.bulletin_posts;
create policy bulletin_insert_auth on public.bulletin_posts
  for insert with check (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.conversations replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
