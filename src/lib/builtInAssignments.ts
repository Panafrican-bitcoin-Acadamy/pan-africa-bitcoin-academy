import { SupabaseClient } from '@supabase/supabase-js';

export interface BuiltInAssignmentDefinition {
  id: string;
  chapter_slug: string;
  chapter_number: number;
  title: string;
  question: string;
  description: string;
  points: number;
  reward_sats: number;
  correct_answer: string;
  answer_type: string;
  status: string;
}

export const BUILT_IN_ASSIGNMENTS: BuiltInAssignmentDefinition[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    chapter_slug: 'problems-with-traditional-fiat-money',
    chapter_number: 3,
    title: 'Assignment: Inflation Reality Check',
    question: 'Compare the price of one everyday item (bread, sugar, fuel) today vs 10–20 years ago.',
    description: "Research and compare prices to understand inflation's impact on purchasing power.",
    points: 10,
    reward_sats: 75,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    chapter_slug: 'from-crisis-to-innovation',
    chapter_number: 4,
    title: 'Assignment: "What Broke?"',
    question: 'Explain in your own words one reason the old system failed (inflation, debt, bailouts, control).',
    description: 'Reflect on the failures of the traditional financial system.',
    points: 10,
    reward_sats: 75,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    chapter_slug: 'the-birth-of-bitcoin',
    chapter_number: 5,
    title: 'Assignment: Whitepaper Sentence Decode',
    question: 'Rewrite this sentence in plain language: "A purely peer-to-peer version of electronic cash…"',
    description: 'Practice translating technical language into everyday terms.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    chapter_slug: 'keys-and-transactions',
    chapter_number: 8,
    title: '🧩 Seed Phrase & Key Recovery Challenge',
    question: 'Interactive seed phrase recovery and security exercise',
    description: 'Test your understanding of seed phrase backup, word order verification, and wallet recovery.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    chapter_slug: 'blockchain-basics',
    chapter_number: 7,
    title: 'Assignment: Understanding a Block',
    question: 'What would happen if someone tried to change a transaction in an old block?',
    description: 'Explain the consequences of attempting to alter a transaction in a previous block on the blockchain.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    chapter_slug: 'exchange-software-wallet',
    chapter_number: 6,
    title: 'Assignment: Software Wallet & Exchange Setup',
    question: 'Interactive wallet verification exercise',
    description: 'Verify your software wallet receive address and lightning invoice setup.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    chapter_slug: 'hardware-signers',
    chapter_number: 11,
    title: 'Assignment: Threat Model',
    question: 'List 3 threats a hardware wallet protects against.',
    description: 'Understand the security benefits of hardware wallets.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    chapter_slug: 'utxos-fees-coin-control',
    chapter_number: 9,
    title: 'Assignment: UTXO & Fee Management',
    question: 'Interactive UTXO fee calculation exercise',
    description: 'Calculate effective transaction fees when selecting inputs for a Bitcoin payment.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '10101010-1010-4101-8101-010101010101',
    chapter_slug: 'good-bitcoin-hygiene',
    chapter_number: 10,
    title: 'Assignment: Protect Your Future Self',
    question: 'Why should you use a new receive address every time?',
    description: 'Reflect on why using a new receive address every time is important for privacy and security.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    chapter_slug: 'intro-to-bitcoin-script-optional-track',
    chapter_number: 18,
    title: 'Assignment: Bitcoin Script Challenge',
    question: 'Interactive Bitcoin Script evaluation exercise',
    description: 'Evaluate stack execution for Bitcoin script opcodes.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    chapter_slug: 'why-bitcoin-philosophy-adoption',
    chapter_number: 12,
    title: 'Assignment: Code or State',
    question: 'What do you think of Bitcoin?',
    description: 'Reflect on your perspective of Bitcoin after completing the course.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    chapter_slug: 'proof-of-work-and-block-rewards',
    chapter_number: 14,
    title: '🧩 The Halving Timeline Puzzle',
    question: "Bitcoin's block reward does not decrease smoothly. It drops suddenly — like stairs, not a ramp. Timeline (Place tiles from left to right in chronological order).",
    description: "Interactive exercise ordering Bitcoin's halving block rewards from Genesis (50 BTC) down to 3.125 BTC.",
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
  {
    id: '17171717-1717-4171-8171-717171717171',
    chapter_slug: 'multi-sig-collaborative-custody',
    chapter_number: 17,
    title: 'Assignment: Multisig Collaborative Custody',
    question: 'Interactive 2-of-2 multisig setup and transaction signing exercise',
    description: 'Derive xpubs and construct a 2-of-2 multisig script descriptor with a partner.',
    points: 10,
    reward_sats: 100,
    correct_answer: 'INSTRUCTOR_REVIEW',
    answer_type: 'text',
    status: 'active',
  },
];

/**
 * Ensure built-in assignments exist in Supabase database.
 * Upserts missing built-in assignments if they are not yet in the `assignments` table.
 */
export async function ensureBuiltInAssignments(supabaseAdmin: SupabaseClient): Promise<void> {
  try {
    const { data: existing, error } = await supabaseAdmin
      .from('assignments')
      .select('id, chapter_slug');

    if (error) {
      console.error('[builtInAssignments] Error fetching existing assignments:', error);
      return;
    }

    const existingIds = new Set((existing || []).map((row) => row.id));
    const missing = BUILT_IN_ASSIGNMENTS.filter((def) => !existingIds.has(def.id));

    if (missing.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('assignments')
        .upsert(missing, { onConflict: 'id', ignoreDuplicates: true });

      if (insertError) {
        console.error('[builtInAssignments] Error auto-provisioning missing built-in assignments:', insertError);
      } else {
        console.info(`[builtInAssignments] Successfully auto-provisioned ${missing.length} built-in assignment(s).`);
      }
    }
  } catch (err) {
    console.error('[builtInAssignments] Failed to ensure built-in assignments:', err);
  }
}

/**
 * Find or auto-provision a specific built-in assignment by ID or Chapter Slug.
 */
export async function ensureSingleBuiltInAssignment(
  supabaseAdmin: SupabaseClient,
  idOrSlug: string
): Promise<Record<string, unknown> | null> {
  const match = BUILT_IN_ASSIGNMENTS.find(
    (def) => def.id === idOrSlug || def.chapter_slug === idOrSlug
  );

  if (!match) return null;

  try {
    const { data: existing } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .or(`id.eq.${match.id},chapter_slug.eq.${match.chapter_slug}`)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('assignments')
      .insert(match)
      .select()
      .single();

    if (insertError) {
      console.error(`[builtInAssignments] Failed to insert built-in assignment ${match.id}:`, insertError);
      return match as unknown as Record<string, unknown>;
    }

    return inserted;
  } catch (err) {
    console.error('[builtInAssignments] Error provisioning single assignment:', err);
    return match as unknown as Record<string, unknown>;
  }
}
