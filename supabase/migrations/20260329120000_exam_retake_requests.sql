-- Final exam retake requests (e.g. session time expired) and server-side timer reset
CREATE TABLE IF NOT EXISTS public.exam_retake_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  admin_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_exam_retake_requests_status_created
  ON public.exam_retake_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_retake_requests_student
  ON public.exam_retake_requests (student_id);

-- At most one open request per student (avoids duplicate notifications)
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_retake_one_pending
  ON public.exam_retake_requests (student_id)
  WHERE (status = 'pending');

-- When set, client exam timer restarts if localStorage start is older than this
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_timer_reset_at TIMESTAMPTZ;

COMMENT ON TABLE public.exam_retake_requests IS 'Student requests for a new final exam session (e.g. after 2h timeout); admin approves to reset timer.';
