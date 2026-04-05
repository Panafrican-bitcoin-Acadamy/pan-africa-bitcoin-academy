/**
 * Allowed values for sats_rewards — must stay in sync with DB CHECK constraints
 * (see supabase migration / DATABASE docs).
 */
export const SATS_REWARD_TYPES = [
  'assignment',
  'chapter',
  'discussion',
  'peer_help',
  'project',
  'attendance',
  'blog',
  'other',
  'exam',
] as const;

export type SatsRewardType = (typeof SATS_REWARD_TYPES)[number];

export const SATS_RELATED_ENTITY_TYPES = [
  'assignment',
  'chapter',
  'event',
  'discussion',
  'project',
  'blog',
  'other',
  'exam',
] as const;

export type SatsRelatedEntityType = (typeof SATS_RELATED_ENTITY_TYPES)[number];

export function isValidSatsRewardType(value: string): value is SatsRewardType {
  return (SATS_REWARD_TYPES as readonly string[]).includes(value);
}

export function isValidSatsRelatedEntityType(value: string): value is SatsRelatedEntityType {
  return (SATS_RELATED_ENTITY_TYPES as readonly string[]).includes(value);
}

/** Human-readable label for admin UI and emails (reward_type / related_entity_type). */
export function formatSatsRewardTypeLabel(type: string): string {
  if (!type) return '—';
  if (type === 'exam') return 'Final exam';
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
