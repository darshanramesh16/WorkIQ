-- AI Interview Module: candidates, interview_sessions, hr_questions, notifications
-- Requires: public.has_role(app_role) already exists

-- Enable pgcrypto for gen_random_uuid if not already
create extension if not exists pgcrypto;

-- Candidates table
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  job_role text not null,
  status text not null default 'new', -- new, interview_scheduled, shortlisted, rejected, next_round, hired
  scores jsonb, -- {technical, communication, confidence, overall_fit}
  summary text,
  user_id uuid, -- optional link to app user if any
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Interview sessions table
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  mode text not null check (mode in ('chat','voice')),
  start_time timestamptz not null default now(),
  end_time timestamptz,
  transcript jsonb not null default '[]'::jsonb, -- array of {role, content, ts}
  analysis_json jsonb, -- full AI analysis payload
  created_by uuid,
  created_at timestamptz not null default now()
);

-- HR questions table
create table if not exists public.hr_questions (
  id uuid primary key default gen_random_uuid(),
  role text not null, -- job role identifier
  question_text text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.candidates enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.hr_questions enable row level security;
alter table public.notifications enable row level security;

-- Candidates policies
create policy "HR/Admin can manage all candidates" on public.candidates
  for all using (public.has_role(auth.uid(), 'hr') or public.has_role(auth.uid(), 'admin'));

create policy "Employees can view their own candidate record" on public.candidates
  for select using (user_id = auth.uid());

-- Interview sessions policies
create policy "HR/Admin can manage all interview sessions" on public.interview_sessions
  for all using (public.has_role(auth.uid(), 'hr') or public.has_role(auth.uid(), 'admin'));

create policy "Employees can access their own interview sessions" on public.interview_sessions
  for select using (exists (
    select 1 from public.candidates c
    where c.id = interview_sessions.candidate_id and c.user_id = auth.uid()
  ));

create policy "Employees can create their own interview sessions" on public.interview_sessions
  for insert with check (exists (
    select 1 from public.candidates c
    where c.id = candidate_id and c.user_id = auth.uid()
  ));

create policy "Employees can update their own interview sessions" on public.interview_sessions
  for update using (exists (
    select 1 from public.candidates c
    where c.id = interview_sessions.candidate_id and c.user_id = auth.uid()
  ));

-- HR questions policies
create policy "Anyone can view HR questions" on public.hr_questions
  for select using (true);

create policy "HR/Admin can manage HR questions" on public.hr_questions
  for all using (public.has_role(auth.uid(), 'hr') or public.has_role(auth.uid(), 'admin'));

-- Notifications policies
create policy "Users can view their notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users can insert own notifications" on public.notifications
  for insert with check (user_id = auth.uid());

create policy "HR/Admin can manage notifications" on public.notifications
  for all using (public.has_role(auth.uid(), 'hr') or public.has_role(auth.uid(), 'admin'));

-- Helpful indexes
create index if not exists idx_candidates_email on public.candidates(email);
create index if not exists idx_candidates_user on public.candidates(user_id);
create index if not exists idx_sessions_candidate on public.interview_sessions(candidate_id);
create index if not exists idx_hr_questions_role on public.hr_questions(role);
create index if not exists idx_notifications_user on public.notifications(user_id);

-- Update updated_at on candidates
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_candidates_updated_at on public.candidates;
create trigger trg_candidates_updated_at before update on public.candidates
for each row execute function public.set_updated_at();
