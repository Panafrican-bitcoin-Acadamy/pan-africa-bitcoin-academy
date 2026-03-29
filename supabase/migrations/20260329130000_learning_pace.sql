-- How the applicant intends to study: live cohort schedule vs self-paced materials.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS learning_pace text NOT NULL DEFAULT 'live_cohort';

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS learning_pace text NOT NULL DEFAULT 'live_cohort';

COMMENT ON COLUMN public.applications.learning_pace IS 'live_cohort | self_paced';
COMMENT ON COLUMN public.students.learning_pace IS 'live_cohort | self_paced; copied from application on approve';
