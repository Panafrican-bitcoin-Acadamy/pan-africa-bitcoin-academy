import type { WhitepaperSection } from './types';
import { rawParagraphsTigrinya } from './rawParagraphsTigrinya';

function build(
  id: string,
  navLabel: string,
  title: string,
  key: keyof typeof rawParagraphsTigrinya,
  rest: Omit<WhitepaperSection, 'id' | 'navLabel' | 'title' | 'paragraphs'>
): WhitepaperSection {
  return {
    id,
    navLabel,
    title,
    paragraphs: [...rawParagraphsTigrinya[key]],
    ...rest,
  };
}

export const WHITEPAPER_SECTIONS: WhitepaperSection[] = [
  build('s-abstract', 'ሓጺር መግለጺ', 'ሓጺር መግለጺ', 'abstract', {
    simplifiedNotes: [
      'In one minute: Bitcoin is digital cash that does not require banks in the middle. Everyone follows the same rules enforced by proof-of-work and the longest chain.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ካልኣይ ግዜ ናይ ምጥቃም' },
      { paragraphIndex: 0, phrase: 'መርትዖ ስራሕ' },
      { paragraphIndex: 0, phrase: 'hash' },
    ],
    commentary: [
      'Satoshi compresses the entire design into this abstract: signatures alone are not enough—you need an ordering of events everyone agrees on.',
    ],
    insights: {
      whatItMeans:
        'Bitcoin’s goal is cash-like payments online without trusted intermediaries, using cryptography and a shared ledger instead.',
      whyItMatters:
        'Every later section expands one sentence from this abstract; come back here after reading and it will “click” much harder.',
    },
  }),
  build('s-1', '1. መእተዊ', '1. መእተዊ', 's1', {
    simplifiedNotes: [
      'ባንክታትን መርበባት ካርድን ኣብ ማእከል መብዛሕትኡ ብኢንተርነት ዝግበር ክፍሊት  ይርከባ። ምምላስ ገንዘብ ንዓደግቲ ይሕግዝ ግን ወጻኢታት ይውስኽን ንኣሽቱ ክፍሊታት ይቐትልን። ቢትኮይን “እመኑና” ብዝረጋገጽ ሒሳብ ክትክኦ ይፍትን።',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ሳልሳይ ኣካላት' },
      { paragraphIndex: 1, phrase: 'ክርይፕቶግራፊ መርትዖ' },
      { paragraphIndex: 1, phrase: 'ካልኣይ ግዜ ናይ ምጥቃም' },
    ],
    commentary: [
      'Notice the problem framing: mediation and reversibility are features for commerce but they bake in surveillance and fees.',
    ],
    insights: {
      whatItMeans:
        'መንጎኛታት “እኩያት” ኣይኮኑን-ግን መንነት፡ ምድንጓያትን ዝተሓተ ክፍሊትን ክህሉ የገድዱ። መዛኑ ንመዛኑ ዝስራሕ ዲዛይን ንዝተፈለየ ምትሕውዋስ ዝዓለመ እዩ።',
      whyItMatters:
        'ናይ ሎሚ ላይትኒንግን ኣብ-ሰንሰለት ዝርከብ UXን ክሳብ ሕጂ ነዚ ካብ 2008 ጀሚሩ እምነት-ኣጉዲልካ ዘለዎ ዕላማ ሂዙ ይርክብ።',
    },
  }),
  build('s-2', '2. ምልውዋጥ', '2. ምልውዋጥ', 's2', {
    simplifiedNotes: [
      'A “coin” here is a chain of signatures: each owner signs the previous tx + next owner’s public key. The hard part is proving nobody spent the same coin earlier—that needs public visibility and ordering (next sections).',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ሰንሰለታዊ' },
      { paragraphIndex: 0, phrase: 'public' },
      { paragraphIndex: 1, phrase: 'ዳግመ ምጥቃም' },
    ],
    commentary: [
      'Modern wallets hide this “chain of signatures” behind UTXOs, but the paper’s mental model is still accurate.',
    ],
    insights: {
      whatItMeans:
        'Ownership is a verifiable history; preventing double-spends is what turns that history into money.',
      whyItMatters:
        'UTXO selection, coin control, and privacy tools all build on this section’s logic.',
    },
    checkpoint: {
      question: 'Why isn’t a chain of signatures enough on its own?',
      options: [
        'Signatures are too slow',
        'The payee cannot see whether an earlier owner already spent the coin',
        'Hashes are not secure',
      ],
      correctIndex: 1,
      explanation:
        'Without a shared order of transactions, you cannot know which spend came “first.”',
    },
  }),
  build('s-3', '3. ናይ ግዜ ማሕተም', '3. ናይ ግዜ ማሕተም', 's3', {
    simplifiedNotes: [
      'A timestamp server commits to data by publishing its hash. Linking timestamps in a chain means older commitments are reinforced by newer ones.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ናይ ግዜ ማሕተም' },
      { paragraphIndex: 0, phrase: 'Usenet post' },
      { paragraphIndex: 0, phrase: 'ሰንሰለት' },
    ],
    commentary: [
      'Newspaper / Usenet examples are intuition pumps: wide publication makes backdating expensive.',
    ],
    insights: {
      whatItMeans:
        'Ordering events in time is the bridge between “messages on the internet” and “one agreed history.”',
      whyItMatters:
        'Light clients and forks are still about which timestamp chain you believe.',
    },
  }),
  build('s-4', '4. መርትዖ ናይ ስራሕ', '4. መርትዖ ናይ ስራሕ', 's4', {
    simplifiedNotes: [
      'Mining is guessing a nonce until SHA-256 gives enough leading zeros. Hard to produce, cheap to check. Longest chain = most work ≈ honest majority if miners are rational.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'መርትዖ ናይ ስራሕ' },
      { paragraphIndex: 1, phrase: 'ኖንስ' },
      { paragraphIndex: 2, phrase: 'ዝነወሐ ሰንሰለት' },
    ],
    commentary: [
      '“One-CPU-one-vote” is an ideal; today mining is specialized ASICs, but the economic spirit remains: costly block production.',
    ],
    insights: {
      whatItMeans:
        'PoW replaces a central referee with energy and math: rewriting history means redoing work faster than the rest of the network.',
      whyItMatters:
        'Difficulty adjustment and fee markets are later layers on this same security budget.',
    },
    checkpoint: {
      question: 'What does proof-of-work replace in “majority decision making”?',
      options: [
        'IP-based voting',
        'DNS records',
        'Encryption algorithms',
      ],
      correctIndex: 0,
      explanation:
        'Satoshi explicitly contrasts proof-of-work with one-IP-one-vote, which Sybil attackers could exploit.',
    },
  }),
  build('s-5', '5. መርበብ', '5. መርበብ', 's5', {
    simplifiedNotes: [
      'Gossip-style propagation: txs spread, miners build blocks, first valid chain wins; temporary forks resolve when one branch accumulates more work.',
    ],
    highlights: [
      { paragraphIndex: 2, phrase: 'ዝነወሐት ሰንሰልት' },
      { paragraphIndex: 3, phrase: 'ክሳብ ኣብ ብዝሕ' },
    ],
    commentary: [
      'This is the blueprint for mempool behavior and compact block relay—same ideas, better engineering.',
    ],
    insights: {
      whatItMeans:
        'The network is deliberately dumb and robust: no leader, only rules and incentives.',
      whyItMatters:
        'Understanding reorgs and confirmations starts here.',
    },
  }),
  build('s-6', '6. መተባብዒ', '6. መተባብዒ', 's6', {
    simplifiedNotes: [
      'Block subsidy bootstraps security; fees take over later. Attacker with majority hash still “should” earn more by mining honestly than by sabotaging confidence in the coin.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ቀዳመይቲ ምስግጋር' },
      { paragraphIndex: 1, phrase: 'መተብብዒ' },
    ],
    commentary: [
      'Halving schedule is policy encoded in clients; it’s not described in detail in this short paper.',
    ],
    insights: {
      whatItMeans:
        'Issuance pays for security; fees align long-run sustainability with chain use.',
      whyItMatters:
        'Fee markets and MEV debates are modern extensions of this two-part reward.',
    },
    checkpoint: {
      question: 'Why include a block reward (subsidy) at all?',
      options: [
        'To pay developers',
        'To distribute coins and incentivize mining when starting from zero issuance',
        'To reduce block size',
      ],
      correctIndex: 1,
      explanation:
        'There is no central issuer—subsidy bootstraps both security and initial distribution.',
    },
  }),
  build('s-7', '7. ዳግማይ ምጥቃም ቦታ ዲስክ', '7. ዳግማይ ምጥቃም ቦታ ዲስክ', 's7', {
    simplifiedNotes: [
      'Merkle trees let full nodes drop old transaction details but keep block headers; SPV wallets rely on roots + branches (next sections).',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'Merkle Tree' },
      { paragraphIndex: 1, phrase: '80 ባይት' },
    ],
    commentary: [
      'Pruning today follows the same idea: keep what you need to validate your view of the chain.',
    ],
    insights: {
      whatItMeans:
        'Scaling verification is not just “bigger disks”—it’s clever commitments so lightweight clients can still trust proofs.',
      whyItMatters:
        'Taproot, assumevalid, and Utreexo-style ideas extend this Merkle thinking.',
    },
  }),
  build('s-8', '8. ቀሊል ናይ ክፍሊት ምርግጋጽ', '8. ቀሊል ናይ ክፍሊት ምርግጋጽ', 's8', {
    simplifiedNotes: [
      'SPV users trust that miners collectively follow rules; they verify inclusion via headers + Merkle proof, not full script execution.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'መርትዖ-ናይ-ስራሕ' },
      { paragraphIndex: 0, phrase: 'ማርክል ጨንፈር' },
    ],
    commentary: [
      'For high value, run a full node; SPV is a deliberate trust trade-off for bandwidth-constrained devices.',
    ],
    insights: {
      whatItMeans:
        'You can accept payments without storing the whole chain—at the cost of stronger assumptions about miners.',
      whyItMatters:
        'Mobile wallets and many Lightning setups inherit this model.',
    },
    checkpoint: {
      question: 'What does an SPV client NOT do by default?',
      options: [
        'Store all historical blocks',
        'Track block headers',
        'Request Merkle proofs',
      ],
      correctIndex: 0,
      explanation:
        'SPV avoids full chain validation; it checks inclusion against headers.',
    },
  }),
  build('s-9', '9. ምሕዋስን ምምቃልን ዋጋ', '9. ምሕዋስን ምምቃልን ዋጋ', 's9', {
    simplifiedNotes: [
      'Values bundle as inputs and split into outputs—this is the UTXO model: coins are outputs, not accounts.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ኣተውትን ወጻእትን' },
      { paragraphIndex: 1, phrase: 'መርኮስ' },
    ],
    commentary: [
      'Change outputs and coin selection algorithms are UX on top of this simple fan-in / fan-out structure.',
    ],
    insights: {
      whatItMeans:
        'Privacy and fee optimization both depend on how you compose inputs and outputs.',
      whyItMatters:
        'Coinjoin, Payjoin, and Lightning channel balancing all play here.',
    },
  }),
  build('s-10', '10. ብሕቲ', '10. ብሕቲ', 's10', {
    simplifiedNotes: [
      'Public ledger privacy is “pseudonymity”: break the link between keys and real names. Reuse of addresses hurts privacy.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'ህዝባዊ' },
      { paragraphIndex: 1, phrase: 'ሓድሽ መፍትሕ' },
    ],
    commentary: [
      'On-chain heuristics (clustering, common-input-ownership) make this section even more relevant today.',
    ],
    insights: {
      whatItMeans:
        'Privacy is not encryption of amounts on-chain in this paper—it’s separation of identity from graph data.',
      whyItMatters:
        'Today’s discussions of on-chain analytics vs. protocol features start from this threat model.',
    },
    checkpoint: {
      question: 'How does Bitcoin-style privacy differ from banking privacy in the paper’s framing?',
      options: [
        'Bitcoin hides amounts completely on-chain',
        'Bitcoin hides identities behind keys while amounts are public',
        'Bitcoin requires ID for every payment',
      ],
      correctIndex: 1,
      explanation:
        'The tape is public; identities are what you try to unlink.',
    },
  }),
  build('s-11', '11. ሕሳብ', '11. ሕሳብ', 's11', {
    simplifiedNotes: [
      'Rough intuition: if honest hash rate dominates, catching up from z blocks behind gets exponentially unlikely. The math justifies waiting for confirmations.',
    ],
    highlights: [
      { paragraphIndex: 1, phrase: 'Binomial random walk' },
      { paragraphIndex: 2, phrase: "Gambler's Ruin problem" },
    ],
    commentary: [
      'Real-world security also depends on propagation, eclipse attacks, and economics—this section is a clean probabilistic model, not the whole story.',
    ],
    insights: {
      whatItMeans:
        'Confirmations are not magic numbers—they’re points on a probability curve against a modeled attacker.',
      whyItMatters:
        'Exchanges pick deposit confirmation counts using math in this spirit.',
    },
  }),
  build('s-12', '12. መዕጸዊ', '12. መዕጸዊ', 's12', {
    simplifiedNotes: [
      'The closing restates the whole architecture: signatures + PoW chain + incentives + voluntary nodes = consensus without a central company.',
    ],
    highlights: [
      { paragraphIndex: 0, phrase: 'እምነት' },
      { paragraphIndex: 0, phrase: 'ኮምፑተር ሓይሊ' },
    ],
    commentary: [
      'Fifteen years later, the debate is still “how much can we enforce with protocol rules alone?”',
    ],
    insights: {
      whatItMeans:
        'Consensus rules are the constitution; clients enforce them—humans coordinate upgrades.',
      whyItMatters:
        'Soft forks, activation, and ossification debates are this sentence in practice.',
    },
  }),
];

export const WHITEPAPER_TIMELINE = [
  { year: '2008', label: 'Whitepaper released', detail: 'Satoshi publishes the Bitcoin design.' },
  { year: '2009', label: 'Genesis block mined', detail: 'The network goes live and the first block reward is created.' },
  { year: 'Today', label: 'Global Bitcoin network', detail: 'Consensus rules remain stable while tools and scaling layers keep improving.' },
] as const;

export function countWords(sections: WhitepaperSection[]): number {
  let n = 0;
  for (const s of sections) {
    for (const p of s.paragraphs) {
      const stripped = p
        .replace(/^<<<CODE>>>|^<<<TABLE>>>|^<<<DEFLIST>>>|^<<<EQ>>>|^<<<OL>>>/gm, '')
        .replace(/<<<CODE>>>|<<<TABLE>>>|<<<DEFLIST>>>|<<<EQ>>>|<<<OL>>>/g, '');
      n += stripped.trim().split(/\s+/).filter(Boolean).length;
    }
  }
  return n;
}
