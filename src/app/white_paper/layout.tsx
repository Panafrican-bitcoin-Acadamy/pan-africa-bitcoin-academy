/**
 * Opaque surface so the global body background image does not reduce contrast on this long-form reader.
 * Set lang="ti" when all copy is Tigrinya.
 */
export default function WhitePaperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative isolate min-h-dvh w-full bg-[#070b12] text-zinc-100"
      lang="ti"
    >
      {/* Full-bleed opaque layer — blocks body::before / bitcoin-bg bleed-through */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#070b12]" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
