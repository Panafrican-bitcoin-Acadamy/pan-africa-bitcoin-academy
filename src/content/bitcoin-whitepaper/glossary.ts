import type { GlossaryEntry } from './types';

/** Longest phrases first so shorter subphrases don’t steal matches. */
export const WHITEPAPER_GLOSSARY: GlossaryEntry[] = [
  {
    term: 'double-spending',
    definition:
      'Spending the same electronic coin twice. Without a shared ledger, digital cash can be copied; Bitcoin’s chain prevents this.',
  },
  {
    term: 'proof-of-work',
    definition:
      'A puzzle (finding a hash with many leading zeros) that costs CPU time to produce but is cheap to verify. It orders blocks and secures the chain.',
  },
  {
    term: 'timestamp server',
    definition:
      'A system that proves data existed at a time by publishing its hash. Bitcoin chains timestamps to build ordering without a central clock.',
  },
  {
    term: 'Merkle Tree',
    definition:
      'A binary tree of hashes: transactions hash up to one root in the block header, so old txs can be pruned while keeping the block commitment.',
  },
  {
    term: 'Merkle branch',
    definition:
      'A path of sibling hashes from a transaction up to the Merkle root—used in SPV to prove inclusion without full blocks.',
  },
  {
    term: 'nonce',
    definition:
      'A number miners change repeatedly until the block hash satisfies the difficulty (enough leading zero bits).',
  },
  {
    term: 'peer-to-peer',
    definition:
      'Nodes talk directly to each other instead of routing everything through one company’s servers.',
  },
  {
    term: 'SHA-256',
    definition:
      'The hash function used in Bitcoin’s proof-of-work and many inner hashes.',
  },
  {
    term: 'UTXO',
    definition:
      'Unspent transaction output: a chunk of value you can spend once. Bitcoin tracks coins as outputs, not account balances.',
  },
  {
    term: 'SPV',
    definition:
      'Simplified Payment Verification: checking payments using only block headers plus a Merkle path, not the full blockchain.',
  },
  {
    term: 'digital signatures',
    definition:
      'Cryptographic proof you control a private key—used to transfer coins by signing the next owner’s key.',
  },
  {
    term: 'longest chain',
    definition:
      'The valid fork with the most cumulative proof-of-work; honest nodes treat it as the canonical transaction history.',
  },
];
