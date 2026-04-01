-- Track student sats withdrawal requests to prevent duplicate requests
-- for the same pending-sats snapshot while still allowing future requests.

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  pending_snapshot_sats integer not null check (pending_snapshot_sats > 0),
  status text not null default 'requested' check (status in ('requested', 'processed', 'rejected', 'cancelled')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz null,
  processed_by uuid null references public.admins(id) on delete set null,
  notes text null
);

create index if not exists idx_withdrawal_requests_student_requested_at
  on public.withdrawal_requests(student_id, requested_at desc);

-- Prevent duplicate active requests for the same pending snapshot
create unique index if not exists uq_withdrawal_requests_active_snapshot
  on public.withdrawal_requests(student_id, pending_snapshot_sats)
  where status = 'requested';

