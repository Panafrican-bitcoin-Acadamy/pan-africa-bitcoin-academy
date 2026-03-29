import { WRAP_UP_GLOSSARY_PART1 } from "./wrapUpGlossary.part1";
import { WRAP_UP_GLOSSARY_PART2 } from "./wrapUpGlossary.part2";

export type GlossaryEntry = { term: string; definition: string };

/** Combined glossary for the wrap-up chapter (deduped by term). */
const merged = [...WRAP_UP_GLOSSARY_PART1, ...WRAP_UP_GLOSSARY_PART2];
const seen = new Set<string>();
export const WRAP_UP_GLOSSARY: GlossaryEntry[] = merged.filter((e) => {
  const k = e.term.trim().toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});
