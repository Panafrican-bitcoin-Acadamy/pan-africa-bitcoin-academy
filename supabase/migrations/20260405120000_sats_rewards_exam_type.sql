-- Allow categorizing sats rewards as final exam (admin UI + automated 80%+ bonus can use same type).
ALTER TABLE public.sats_rewards
  DROP CONSTRAINT IF EXISTS sats_rewards_reward_type_check;

ALTER TABLE public.sats_rewards
  ADD CONSTRAINT sats_rewards_reward_type_check
  CHECK (
    reward_type IN (
      'assignment',
      'chapter',
      'discussion',
      'peer_help',
      'project',
      'attendance',
      'blog',
      'other',
      'exam'
    )
  );

ALTER TABLE public.sats_rewards
  DROP CONSTRAINT IF EXISTS sats_rewards_related_entity_type_check;

ALTER TABLE public.sats_rewards
  ADD CONSTRAINT sats_rewards_related_entity_type_check
  CHECK (
    related_entity_type IN (
      'assignment',
      'chapter',
      'event',
      'discussion',
      'project',
      'blog',
      'other',
      'exam'
    )
  );
