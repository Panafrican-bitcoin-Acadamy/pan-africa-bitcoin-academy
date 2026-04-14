import type { ReactNode } from 'react';
import { cn } from '@/lib/styles';

/**
 * Whitepaper section diagrams
 * --------------------------------------
 * - Rendered once per section inside `WhitepaperExperience`, **above** that section’s body paragraphs
 *   (after notes/commentary), so the graphic introduces the idea before the Tigrinya text.
 * - `WhitepaperDiagram` maps `sectionId` → SVG. Sections **without** a figure return `null`:
 *   `s-abstract`, `s-5`, `s-6`, `s-11`, `s-12`.
 * - All figures share the same chrome: `frame()` wraps the SVG in a bordered card with responsive sizing
 *   (`viewBox` + fluid width, no horizontal clipping).
 * - Content is didactic English (labels like SHA-256, Prev Hash) to match diagrams elsewhere; it is not a
 *   translation of the paper body. Figures share a cyan / orange / violet / emerald accent palette (`WP`).
 */

export function WhitepaperDiagram({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case 's-2':
      return <TransactionChainDiagram />;
    case 's-3':
      return <TimestampChainDiagram />;
    case 's-4':
      return <BlockchainArchitectureDiagram />;
    case 's-7':
      return <MerkleRootDiagram />;
    case 's-8':
      return <SpvHeadersDiagram />;
    case 's-9':
      return <InputsOutputsDiagram />;
    case 's-10':
      return <PrivacyModelDiagram />;
    default:
      return null;
  }
}

function frame(children: ReactNode) {
  return (
    <figure className="my-8 w-full min-w-0 overflow-hidden rounded-xl border border-cyan-500/35 bg-[#0c1220] p-6 shadow-[0_0_24px_rgba(34,211,238,0.08)] print:break-inside-avoid">
      <div className="flex w-full min-w-0 justify-center overflow-x-auto">{children}</div>
    </figure>
  );
}

function svgProps(viewBox: string, className?: string) {
  return {
    viewBox,
    className: cn('h-auto w-full shrink-0', className ?? 'max-w-6xl'),
    preserveAspectRatio: 'xMidYMid meet' as const,
    'aria-hidden': true as const,
  };
}

/** Shared accents for whitepaper figures (aligned with site cyan / orange / violet). */
const WP = {
  cyan: '#22d3ee',
  cyanHi: '#67e8f9',
  cyanSoft: '#7dd3fc',
  cyanBg: 'rgba(34,211,238,0.1)',
  orange: '#f97316',
  orangeHi: '#fdba74',
  orangeBg: 'rgba(249,115,22,0.1)',
  violet: '#a855f7',
  violetHi: '#d8b4fe',
  violetBg: 'rgba(168,85,247,0.1)',
  emerald: '#34d399',
  emeraldHi: '#6ee7b7',
  rose: '#fb7185',
  label: '#e4e4e7',
  caption: '#94a3b8',
} as const;

/** Chain-of-signatures: three transactions, PK→Hash→Sig, Verify (dotted), Sign (dashed). */
function TransactionChainDiagram() {
  const pw = 178;
  const gap = 34;
  const x0 = 26;
  const xs = [x0, x0 + pw + gap, x0 + 2 * (pw + gap)];
  const cx = xs.map((x) => x + pw / 2);
  const colStroke = [WP.cyan, WP.violet, WP.orange] as const;
  const colFill = [WP.cyanBg, WP.violetBg, WP.orangeBg] as const;
  const colPk = [WP.cyanSoft, WP.violetHi, WP.orangeHi] as const;
  /** Mid-y of Hash / Signature inner rects — cross-links use box edges, not column centers. */
  const hashMidY = 112;
  const sigMidY = 152;
  const pkMidY = 246;
  const hashRight = (i: number) => xs[i] + pw - 10;
  const sigLeft = (i: number) => xs[i] + 10;
  const pkBoxRight = (i: number) => cx[i] + 72;
  const labelsPk = [`Owner 1's Public Key`, `Owner 2's Public Key`, `Owner 3's Public Key`];
  const labelsSig = [`Owner 0's Signature`, `Owner 1's Signature`, `Owner 2's Signature`];

  return frame(
    <svg {...svgProps('0 0 640 334')}>
      <defs>
        <marker id="tx-chain-solid" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.cyan} />
        </marker>
        <marker id="tx-chain-dash" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={WP.orange} />
        </marker>
        <marker id="tx-verify-m" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={WP.violet} />
        </marker>
      </defs>

      {[0, 1, 2].map((i) => {
        const x = xs[i];
        const c = cx[i];
        const innerLeft = x + 10;
        return (
          <g key={i}>
            <rect x={x} y="26" width={pw} height="150" fill={colFill[i]} stroke={colStroke[i]} strokeWidth="1.35" rx="0" />
            <text x={c} y="46" textAnchor="middle" fill={WP.label} fontSize="14" fontWeight="600">
              Transaction
            </text>
            <rect x={innerLeft} y="56" width={pw - 16} height="36" fill="#18181b" stroke={colStroke[i]} strokeWidth="1.05" rx="0" />
            <text x={c} y="78" textAnchor="middle" fill={colPk[i]} fontSize="10">
              {labelsPk[i]}
            </text>
            <rect x={innerLeft} y="98" width={pw - 16} height="30" fill="#18181b" stroke={WP.cyan} strokeWidth="1.1" rx="0" opacity="0.95" />
            <text x={c} y="117" textAnchor="middle" fill={WP.cyanHi} fontSize="11" fontStyle="italic">
              Hash
            </text>
            <rect x={innerLeft} y="134" width={pw - 16} height="36" fill="#18181b" stroke={WP.orange} strokeWidth="1.05" rx="0" />
            <text x={c} y="156" textAnchor="middle" fill={WP.orangeHi} fontSize="10">
              {labelsSig[i]}
            </text>
            <line x1={c} y1="92" x2={c} y2="98" stroke={WP.cyan} strokeWidth="1.35" markerEnd="url(#tx-chain-solid)" />
            <line x1={c} y1="128" x2={c} y2="134" stroke={WP.cyan} strokeWidth="1.35" markerEnd="url(#tx-chain-solid)" />
          </g>
        );
      })}

      <path
        d={`M ${hashRight(0)} ${hashMidY} L ${sigLeft(1)} ${sigMidY}`}
        fill="none"
        stroke={WP.violet}
        strokeWidth="1.1"
        strokeDasharray="2 4"
        markerEnd="url(#tx-verify-m)"
      />
      <text x="212" y="128" fill={WP.violetHi} fontSize="11" fontWeight="600">
        Verify
      </text>
      <path
        d={`M ${hashRight(1)} ${hashMidY} L ${sigLeft(2)} ${sigMidY}`}
        fill="none"
        stroke={WP.violet}
        strokeWidth="1.1"
        strokeDasharray="2 4"
        markerEnd="url(#tx-verify-m)"
      />
      <text x="418" y="128" fill={WP.violetHi} fontSize="11" fontWeight="600">
        Verify
      </text>

      {[0, 1, 2].map((i) => {
        const c = cx[i];
        const bx = c - 72;
        return (
          <g key={`pk-${i}`}>
            <rect x={bx} y="228" width="144" height="36" fill="#0c1220" stroke={colStroke[i]} strokeWidth="1.1" rx="0" />
            <text x={c} y="250" textAnchor="middle" fill={colPk[i]} fontSize="10">
              {`Owner ${i + 1}'s Private Key`}
            </text>
          </g>
        );
      })}

      <path
        d={`M ${pkBoxRight(0)} ${pkMidY} L ${sigLeft(1)} ${sigMidY}`}
        fill="none"
        stroke={WP.orange}
        strokeWidth="1.15"
        strokeDasharray="6 4"
        markerEnd="url(#tx-chain-dash)"
      />
      <text x="190" y="200" fill={WP.orangeHi} fontSize="11" fontWeight="600">
        Sign
      </text>
      <path
        d={`M ${pkBoxRight(1)} ${pkMidY} L ${sigLeft(2)} ${sigMidY}`}
        fill="none"
        stroke={WP.orange}
        strokeWidth="1.15"
        strokeDasharray="6 4"
        markerEnd="url(#tx-chain-dash)"
      />
      <text x="396" y="200" fill={WP.orangeHi} fontSize="11" fontWeight="600">
        Sign
      </text>

    </svg>,
  );
}

/** Timestamp chain: prev hash + whole block → hash; hash → hash; items are illustrative only (no arrows). */
function TimestampChainDiagram() {
  const fillInner = '#18181b';
  /** Item accents — cyan / orange / violet (same family as transaction figure). */
  const itemAccents = [
    { stroke: WP.cyan, label: WP.cyanSoft },
    { stroke: WP.orange, label: WP.orangeHi },
    { stroke: WP.violet, label: WP.violetHi },
  ] as const;

  const blockW = 238;
  const blockH = 118;
  const gap = 48;
  const x1 = 32;
  const x2 = x1 + blockW + gap;
  const blockY = 88;
  const hashW = 112;
  const hashH = 38;
  const cx1 = x1 + blockW / 2;
  const cx2 = x2 + blockW / 2;
  const hash1 = { x: cx1 - hashW / 2, y: 34, w: hashW, h: hashH };
  const hash2 = { x: cx2 - hashW / 2, y: 34, w: hashW, h: hashH };
  const midY = hash1.y + hash1.h / 2;
  const inPrevY = midY - 6;
  const inBlockY = midY + 6;
  const itemY = blockY + 42;
  const itemH = 34;
  const itemW = 62;
  const itemGap = 10;
  const itemLabels = ['Item', 'Item', '…'] as const;

  const itemCenters = (baseX: number) =>
    itemLabels.map((_, i) => baseX + 12 + i * (itemW + itemGap) + itemW / 2);

  const ic1 = itemCenters(x1);
  const ic2 = itemCenters(x2);

  /** Point on block top edge (near label), then up, then across into left side of Hash. */
  const blockFeedPath = (baseX: number, hashLeft: number) => {
    const bx = baseX + 44;
    return `M ${bx} ${blockY} L ${bx} ${inBlockY} L ${hashLeft - 3} ${inBlockY}`;
  };

  return frame(
    <svg {...svgProps('0 0 620 252')}>
      <defs>
        <marker id="wp-timestamp-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#a1a1aa" />
        </marker>
        <marker id="wp-timestamp-arr-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.cyan} />
        </marker>
        <marker id="wp-timestamp-arr-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.orange} />
        </marker>
        <marker id="wp-timestamp-arr-violet" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.violet} />
        </marker>
      </defs>

      {/* Block containers + items (no arrows from items) */}
      <rect
        x={x1}
        y={blockY}
        width={blockW}
        height={blockH}
        fill={WP.cyanBg}
        stroke={WP.cyan}
        strokeWidth="1.2"
        rx="0"
      />
      <text x={x1 + 10} y={blockY + 18} fill={WP.cyanSoft} fontSize="12" fontWeight="600">
        Block 1
      </text>
      <rect
        x={x2}
        y={blockY}
        width={blockW}
        height={blockH}
        fill={WP.violetBg}
        stroke={WP.violet}
        strokeWidth="1.2"
        rx="0"
      />
      <text x={x2 + 10} y={blockY + 18} fill={WP.violetHi} fontSize="12" fontWeight="600">
        Block 2
      </text>

      {itemLabels.map((label, i) => (
        <g key={`b1-${i}`}>
          <rect
            x={x1 + 12 + i * (itemW + itemGap)}
            y={itemY}
            width={itemW}
            height={itemH}
            fill={fillInner}
            stroke={itemAccents[i].stroke}
            strokeWidth="1.1"
            rx="0"
          />
          <text x={ic1[i]} y={itemY + 22} textAnchor="middle" fill={itemAccents[i].label} fontSize="11" fontWeight="600">
            {label}
          </text>
        </g>
      ))}
      {itemLabels.map((label, i) => (
        <g key={`b2-${i}`}>
          <rect
            x={x2 + 12 + i * (itemW + itemGap)}
            y={itemY}
            width={itemW}
            height={itemH}
            fill={fillInner}
            stroke={itemAccents[i].stroke}
            strokeWidth="1.1"
            rx="0"
          />
          <text x={ic2[i]} y={itemY + 22} textAnchor="middle" fill={itemAccents[i].label} fontSize="11" fontWeight="600">
            {label}
          </text>
        </g>
      ))}

      {/* Hash boxes (on top of block/item fills; connectors drawn after) */}
      <rect
        x={hash1.x}
        y={hash1.y}
        width={hash1.w}
        height={hash1.h}
        fill={fillInner}
        stroke={WP.cyan}
        strokeWidth="1.25"
        rx="0"
      />
      <text x={cx1} y={hash1.y + 25} textAnchor="middle" fill={WP.cyanHi} fontSize="14" fontWeight="600">
        Hash
      </text>
      <rect
        x={hash2.x}
        y={hash2.y}
        width={hash2.w}
        height={hash2.h}
        fill={fillInner}
        stroke={WP.cyan}
        strokeWidth="1.25"
        rx="0"
      />
      <text x={cx2} y={hash2.y + 25} textAnchor="middle" fill={WP.cyanHi} fontSize="14" fontWeight="600">
        Hash
      </text>

      {/* Connectors: drawn last */}
      {/* Previous hash → Hash 1 (upper lane on left edge) */}
      <line
        x1={12}
        y1={inPrevY}
        x2={hash1.x - 3}
        y2={inPrevY}
        stroke={WP.violet}
        strokeWidth="1.15"
        markerEnd="url(#wp-timestamp-arr-violet)"
      />
      {/* Whole Block 1 → Hash 1 (from block top edge, elbow into lower lane) */}
      <path
        d={blockFeedPath(x1, hash1.x)}
        fill="none"
        stroke={WP.orange}
        strokeWidth="1.15"
        markerEnd="url(#wp-timestamp-arr-orange)"
      />
      {/* Hash 1 → Hash 2 (chain) */}
      <line
        x1={hash1.x + hash1.w + 3}
        y1={midY}
        x2={hash2.x - 3}
        y2={midY}
        stroke={WP.cyan}
        strokeWidth="1.35"
        markerEnd="url(#wp-timestamp-arr-cyan)"
      />
      {/* Whole Block 2 → Hash 2 */}
      <path
        d={blockFeedPath(x2, hash2.x)}
        fill="none"
        stroke={WP.orange}
        strokeWidth="1.15"
        markerEnd="url(#wp-timestamp-arr-orange)"
      />
      {/* Chain continues right */}
      <line
        x1={hash2.x + hash2.w + 3}
        y1={midY}
        x2={602}
        y2={midY}
        stroke={WP.cyan}
        strokeWidth="1.2"
        markerEnd="url(#wp-timestamp-arr-cyan)"
      />

    </svg>,
  );
}

/** Linked blocks — layout matches classic diagram: Prev Hash | Nonce (one row), Tx row below; arrows into Prev Hash. */
function BlockchainArchitectureDiagram() {
  const fillInner = '#18181b';
  const blockAccents = [
    { fill: WP.cyanBg, border: WP.cyan, title: WP.cyanSoft },
    { fill: WP.violetBg, border: WP.violet, title: WP.violetHi },
  ] as const;
  const txAccents = [
    { stroke: WP.cyan, label: WP.cyanHi },
    { stroke: WP.orange, label: WP.orangeHi },
    { stroke: WP.violet, label: WP.violetHi },
  ] as const;

  const blockW = 268;
  const blockH = 118;
  const gap = 40;
  const x1 = 44;
  const x2 = x1 + blockW + gap;
  const yBlock = 32;
  const innerPad = 12;
  const innerTop = yBlock + 22;
  const headerRowH = 38;
  const colGap = 10;
  const innerW = blockW - 2 * innerPad;
  const prevW = (innerW - colGap) / 2;
  const nonceW = prevW;
  const prevY = innerTop;
  const prevH = headerRowH;
  const prevMidY = prevY + prevH / 2;
  const txY = prevY + prevH + 12;
  const txBoxW = 54;
  const txBoxH = 28;
  const txGap = 8;

  const prevLeft = (x: number) => x + innerPad;
  const nonceLeft = (x: number) => x + innerPad + prevW + colGap;

  return frame(
    <svg {...svgProps('0 0 668 168')}>
      <defs>
        <marker id="wp-blockchain-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.cyan} />
        </marker>
        <marker id="wp-blockchain-arr-violet" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.violet} />
        </marker>
      </defs>

      {[x1, x2].map((x, bi) => (
        <g key={x}>
          <rect
            x={x}
            y={yBlock}
            width={blockW}
            height={blockH}
            fill={blockAccents[bi].fill}
            stroke={blockAccents[bi].border}
            strokeWidth="1.25"
            rx="0"
          />
          <text x={x + innerPad} y={yBlock + 17} fill={blockAccents[bi].title} fontSize="13" fontWeight="600">
        Block
      </text>
          <rect
            x={prevLeft(x)}
            y={prevY}
            width={prevW}
            height={prevH}
            fill={fillInner}
            stroke={WP.cyan}
            strokeWidth="1.1"
            rx="0"
          />
          <text x={prevLeft(x) + prevW / 2} y={prevY + 24} textAnchor="middle" fill={WP.cyanHi} fontSize="11" fontWeight="600">
            Prev Hash
      </text>
          <rect
            x={nonceLeft(x)}
            y={prevY}
            width={nonceW}
            height={prevH}
            fill={fillInner}
            stroke={WP.orange}
            strokeWidth="1.05"
            rx="0"
          />
          <text x={nonceLeft(x) + nonceW / 2} y={prevY + 24} textAnchor="middle" fill={WP.orangeHi} fontSize="11" fontWeight="600">
            Nonce
      </text>
          {(['Tx', 'Tx', '…'] as const).map((label, i) => {
            const txX = x + innerPad + i * (txBoxW + txGap);
            return (
              <g key={i}>
                <rect
                  x={txX}
                  y={txY}
                  width={txBoxW}
                  height={txBoxH}
                  fill={fillInner}
                  stroke={txAccents[i].stroke}
                  strokeWidth="1.05"
                  rx="0"
                />
                <text x={txX + txBoxW / 2} y={txY + 19} textAnchor="middle" fill={txAccents[i].label} fontSize="11" fontWeight="600">
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      <line
        x1={10}
        y1={prevMidY}
        x2={prevLeft(x1) - 4}
        y2={prevMidY}
        stroke={WP.violet}
        strokeWidth="1.15"
        markerEnd="url(#wp-blockchain-arr-violet)"
      />
      <line
        x1={x1 + blockW - 3}
        y1={prevMidY}
        x2={prevLeft(x2) - 4}
        y2={prevMidY}
        stroke={WP.cyan}
        strokeWidth="1.25"
        markerEnd="url(#wp-blockchain-arr)"
      />

    </svg>,
  );
}

function MerkleRootDiagram() {
  const fillInner = '#18181b';
  const dash = '4 3';
  const arrowFill = WP.cyanSoft;
  const strokeDash = WP.violet;
  const txStroke = [WP.cyan, WP.orange, WP.violet, WP.emerald] as const;
  const hashLabelMuted = [WP.cyanHi, WP.orangeHi, WP.violetHi, WP.emeraldHi] as const;

  const bl = 20;
  const bw = 448;
  const gap = 40;
  const br = bl + bw + gap;
  const blockTop = 32;
  const pad = 16;
  const iw = bw - 2 * pad;

  const blockLabelY = blockTop + 20;
  const headerOuterY = blockTop + 52;
  const headerInnerPad = 10;
  const headerTitleRowH = 22;
  const gapTitleToRow1 = 8;
  const headerRow1H = 36;
  const headerRowGap = 10;
  const headerRootH = 34;
  const headerOuterH =
    headerInnerPad +
    headerTitleRowH +
    gapTitleToRow1 +
    headerRow1H +
    headerRowGap +
    headerRootH +
    headerInnerPad;

  const prevNonceGap = 10;
  const prevW = (iw - prevNonceGap) / 2;
  const nonceW = prevW;
  const row1Y = headerOuterY + headerInnerPad + headerTitleRowH + gapTitleToRow1;
  const rootY = row1Y + headerRow1H + headerRowGap;
  const rootCellBottom = rootY + headerRootH;

  const headerBottom = headerOuterY + headerOuterH;
  const gapBelowHeader = 26;

  const innerLeft = (bx: number) => bx + pad;
  const txW = 72;
  const txGap = 12;
  const txLeft0 = innerLeft(bl) + 24;
  const txCenters = [0, 1, 2, 3].map((i) => txLeft0 + txW / 2 + i * (txW + txGap));
  const hash01Cx = (txCenters[0] + txCenters[1]) / 2;
  const hash23Cx = (txCenters[2] + txCenters[3]) / 2;
  const pairW = Math.min(86, txCenters[1] - txCenters[0] + txW - 6);
  const leafW = txW;

  const pairY = headerBottom + gapBelowHeader;
  const pairH = 30;
  const layerGapMid = 54;
  const leafY = pairY + pairH + layerGapMid;
  const leafH = 28;
  const layerGapTx = 52;
  const txRowY = leafY + leafH + layerGapTx;
  const txH = 30;
  const bottomPad = pad;
  const bh = txRowY + txH + bottomPad - blockTop;
  const panelCaptionY = blockTop + bh + 24;

  const tcy = (y: number, h: number) => y + h * 0.62;

  const box = (cx: number, y: number, w: number, h: number, dashed: boolean, stroke: string) => (
    <rect
      x={cx - w / 2}
      y={y}
      width={w}
      height={h}
      rx="2"
      fill={fillInner}
      stroke={stroke}
      strokeWidth="1.15"
      strokeDasharray={dashed ? dash : 'none'}
    />
  );

  const arrow = (x1: number, y1: number, x2: number, y2: number) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={arrowFill}
      strokeWidth="1.2"
      strokeLinecap="round"
      markerEnd="url(#wp-merkle-arr)"
    />
  );

  /** Prev Hash + Nonce (top row); Root Hash full width below — matches whitepaper figure. */
  const blockHeader = (bx: number) => {
    const il = innerLeft(bx);
    const rootCx = il + iw / 2;
    const titleBandY = headerOuterY + headerInnerPad;
    const isLeft = bx === bl;
    const hdrBg = isLeft ? WP.cyanBg : WP.violetBg;
    const hdrOutline = isLeft ? WP.cyan : WP.violet;
    const titleFill = isLeft ? WP.cyanSoft : WP.violetHi;
    return (
      <g>
        <rect
          x={il}
          y={headerOuterY}
          width={iw}
          height={headerOuterH}
          rx="3"
          fill={hdrBg}
          stroke={hdrOutline}
          strokeWidth="1.1"
        />
        <text x={il + iw / 2} y={tcy(titleBandY, headerTitleRowH)} textAnchor="middle" fill={titleFill} fontSize="11.5" fontWeight="600">
          Block Header (Block Hash)
      </text>
        <rect
          x={il + headerInnerPad}
          y={row1Y}
          width={prevW}
          height={headerRow1H}
          rx="2"
          fill={fillInner}
          stroke={WP.cyan}
          strokeWidth="1.1"
        />
        <text x={il + headerInnerPad + prevW / 2} y={tcy(row1Y, headerRow1H)} textAnchor="middle" fill={WP.cyanHi} fontSize="11" fontWeight="600">
          Prev Hash
      </text>
        <rect
          x={il + headerInnerPad + prevW + prevNonceGap}
          y={row1Y}
          width={nonceW}
          height={headerRow1H}
          rx="2"
          fill={fillInner}
          stroke={WP.orange}
          strokeWidth="1.1"
        />
        <text
          x={il + headerInnerPad + prevW + prevNonceGap + nonceW / 2}
          y={tcy(row1Y, headerRow1H)}
          textAnchor="middle"
          fill={WP.orangeHi}
          fontSize="11"
          fontWeight="600"
        >
          Nonce
      </text>
        <rect
          x={il + headerInnerPad}
          y={rootY}
          width={iw - 2 * headerInnerPad}
          height={headerRootH}
          rx="2"
          fill={fillInner}
          stroke={WP.emerald}
          strokeWidth="1.15"
        />
        <text x={rootCx} y={tcy(rootY, headerRootH)} textAnchor="middle" fill={WP.emeraldHi} fontSize="11" fontWeight="600">
          Root Hash
      </text>
      </g>
    );
  };

  const rootCxAt = (bx: number) => innerLeft(bx) + iw / 2;

  const dxPruned = br - bl;

  const vbW = br + bw + 24;
  const vbH = panelCaptionY + 18;

  return frame(
    <svg {...svgProps(`0 0 ${vbW} ${vbH}`)}>
      <defs>
        <marker id="wp-merkle-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={arrowFill} />
        </marker>
      </defs>

      {[bl, br].map((bx) => (
        <g key={bx}>
          <rect
            x={bx}
            y={blockTop}
            width={bw}
            height={bh}
            rx="4"
            fill={bx === bl ? WP.cyanBg : WP.violetBg}
            stroke={bx === bl ? WP.cyan : WP.violet}
            strokeWidth="1.25"
          />
          <text x={bx + 14} y={blockLabelY} fill={bx === bl ? WP.cyanSoft : WP.violetHi} fontSize="13" fontWeight="600">
            Block
          </text>
          {blockHeader(bx)}
        </g>
      ))}

      {/* ——— Arrows: full tree (left), under nodes ——— */}
      <g className="pointer-events-none">
      {[0, 1, 2, 3].map((i) => (
          <line
            key={`f-tx-${i}`}
            x1={txCenters[i]}
            y1={txRowY}
            x2={txCenters[i]}
            y2={leafY + leafH}
            stroke={arrowFill}
            strokeWidth="1.2"
            strokeLinecap="round"
            markerEnd="url(#wp-merkle-arr)"
          />
        ))}
        <line
          x1={txCenters[0]}
          y1={leafY}
          x2={hash01Cx}
          y2={pairY + pairH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
        <line
          x1={txCenters[1]}
          y1={leafY}
          x2={hash01Cx}
          y2={pairY + pairH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
        <line
          x1={txCenters[2]}
          y1={leafY}
          x2={hash23Cx}
          y2={pairY + pairH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
        <line
          x1={txCenters[3]}
          y1={leafY}
          x2={hash23Cx}
          y2={pairY + pairH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
      </g>

      {/* ——— Full tree nodes (left) ——— */}
      <g>
        {box(hash01Cx, pairY, pairW, pairH, true, strokeDash)}
        <text x={hash01Cx} y={tcy(pairY, pairH)} textAnchor="middle" fill={WP.violetHi} fontSize="11" fontWeight="600">
          Hash01
      </text>
        {box(hash23Cx, pairY, pairW, pairH, true, strokeDash)}
        <text x={hash23Cx} y={tcy(pairY, pairH)} textAnchor="middle" fill={WP.violetHi} fontSize="11" fontWeight="600">
          Hash23
        </text>
        {[0, 1, 2, 3].map((i) => (
          <g key={`fl-${i}`}>
            {box(txCenters[i], leafY, leafW, leafH, true, strokeDash)}
            <text x={txCenters[i]} y={tcy(leafY, leafH)} textAnchor="middle" fill={hashLabelMuted[i]} fontSize="10.5" fontWeight="600">
              {`Hash${i}`}
            </text>
          </g>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <g key={`ft-${i}`}>
            <rect
              x={txCenters[i] - txW / 2}
              y={txRowY}
              width={txW}
              height={txH}
              rx="2"
              fill={fillInner}
              stroke={txStroke[i]}
              strokeWidth="1.15"
            />
            <text x={txCenters[i]} y={tcy(txRowY, txH)} textAnchor="middle" fill={hashLabelMuted[i]} fontSize="11" fontWeight="600">
              {`Tx${i}`}
            </text>
          </g>
        ))}
      </g>

      {/* ——— Pruned panel: arrows ——— */}
      <g className="pointer-events-none">
        <line
          x1={txCenters[3] + dxPruned}
          y1={txRowY}
          x2={txCenters[3] + dxPruned}
          y2={leafY + leafH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
        <line
          x1={txCenters[2] + dxPruned}
          y1={leafY}
          x2={hash23Cx + dxPruned}
          y2={pairY + pairH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
        <line
          x1={txCenters[3] + dxPruned}
          y1={leafY}
          x2={hash23Cx + dxPruned}
          y2={pairY + pairH}
          stroke={arrowFill}
          strokeWidth="1.2"
          strokeLinecap="round"
          markerEnd="url(#wp-merkle-arr)"
        />
      </g>

      {/* ——— Pruned tree nodes (right) ——— */}
      <g>
        {box(hash01Cx + dxPruned, pairY, pairW, pairH, false, WP.cyan)}
        <text x={hash01Cx + dxPruned} y={tcy(pairY, pairH)} textAnchor="middle" fill={WP.cyanHi} fontSize="11" fontWeight="600">
          Hash01
        </text>
        {box(hash23Cx + dxPruned, pairY, pairW, pairH, true, strokeDash)}
        <text x={hash23Cx + dxPruned} y={tcy(pairY, pairH)} textAnchor="middle" fill={WP.violetHi} fontSize="11" fontWeight="600">
          Hash23
        </text>
        {box(txCenters[2] + dxPruned, leafY, leafW, leafH, false, WP.orange)}
        <text x={txCenters[2] + dxPruned} y={tcy(leafY, leafH)} textAnchor="middle" fill={WP.orangeHi} fontSize="11" fontWeight="600">
          Hash2
        </text>
        {box(txCenters[3] + dxPruned, leafY, leafW, leafH, true, strokeDash)}
        <text x={txCenters[3] + dxPruned} y={tcy(leafY, leafH)} textAnchor="middle" fill={WP.emeraldHi} fontSize="10.5" fontWeight="600">
          Hash3
        </text>
        <rect
          x={txCenters[3] + dxPruned - txW / 2}
          y={txRowY}
          width={txW}
          height={txH}
          rx="2"
          fill={fillInner}
          stroke={txStroke[3]}
          strokeWidth="1.15"
        />
        <text x={txCenters[3] + dxPruned} y={tcy(txRowY, txH)} textAnchor="middle" fill={hashLabelMuted[3]} fontSize="11" fontWeight="600">
          Tx3
        </text>
      </g>

      {/* ——— Pair row → Root Hash ——— */}
      <g className="pointer-events-none">
        {arrow(hash01Cx, pairY, rootCxAt(bl), rootCellBottom)}
        {arrow(hash23Cx, pairY, rootCxAt(bl), rootCellBottom)}
        {arrow(hash01Cx + dxPruned, pairY, rootCxAt(br), rootCellBottom)}
        {arrow(hash23Cx + dxPruned, pairY, rootCxAt(br), rootCellBottom)}
      </g>

      <text x={bl + bw / 2} y={panelCaptionY} textAnchor="middle" fill={WP.caption} fontSize="12" fontWeight="600">
        Transactions Hashed in a Merkle Tree
      </text>
      <text x={br + bw / 2} y={panelCaptionY} textAnchor="middle" fill={WP.caption} fontSize="12" fontWeight="600">
        After Pruning Tx0–2 from the Block
      </text>
    </svg>,
  );
}

/**
 * Longest-PoW chain + Merkle branch — layout matches classic figure:
 * Each block: outer shell → **Block Header** title → **Prev Hash | Nonce** → **Merkle Root** (full width).
 * Tree centered under **middle** block: **Hash01** (left) + **Hash23** (dashed) → root; **Hash2** + **Hash3** (dashed) → Hash23; **Tx3** → Hash3.
 */
function SpvHeadersDiagram() {
  const fillInner = '#18181b';
  const fillHdrPanel = 'rgba(15,23,42,0.55)';
  const strokeBlk = '#d4d4d8';
  const strokeHdrOutline = '#52525b';
  const dash = '5 4';
  const arrowTree = '#94a3b8';
  const titleTeal = '#5eead4';
  const arrowChain = '#5eead4';

  const fsTitle = 28;
  const fsHdr = 18;
  const fsCell = 17;
  const fsTree = 18;
  const fsSide = 16;

  const bw = 328;
  const gap = 56;
  const bx = [32, 32 + bw + gap, 32 + 2 * (bw + gap)];
  const by = 78;
  const pad = 16;
  const innerW = bw - 2 * pad;

  /** Vertical stack inside each block (top → bottom). */
  const hdrTitleY = by + 28;
  const panelTop = by + 44;
  const panelPad = 12;
  const prevY = panelTop + panelPad + 22;
  const prevH = 48;
  const colGap = 10;
  const prevW = (innerW - 2 * panelPad - colGap) / 2;
  const nonceLeft = (i: number) => bx[i] + pad + panelPad + prevW + colGap;
  const prevLeft = (i: number) => bx[i] + pad + panelPad;
  const rootY = prevY + prevH + 14;
  const rootH = 50;
  const rootBottom = rootY + rootH;
  const panelBottom = rootY + rootH + panelPad;
  const bh = panelBottom + 14 - by;

  const prevCx = (i: number) => prevLeft(i) + prevW / 2;
  const prevMidY = prevY + prevH / 2;

  const xm = bx[1] + bw / 2;

  /**
   * Merkle tree geometry (x = centers): Hash01 left of center, Hash23 right; Hash2/Hash3 grouped under Hash23; Tx3 under Hash3.
   */
  const pairGap = 108;
  const hash01Cx = xm - pairGap;
  const hash23Cx = xm + pairGap;
  const childHalf = 58;
  const hash2Cx = hash23Cx - childHalf;
  const hash3Cx = hash23Cx + childHalf;

  const treeGap = 52;
  const yPair = by + bh + treeGap;
  const pairH = 52;
  const pairW = 118;
  const layerGap = 56;
  const yChild = yPair + pairH + layerGap;
  const childH = 48;
  const childW = 102;
  const txGap = 48;
  const txY = yChild + childH + txGap;
  const txH = 48;
  const txW = 110;

  const pairBottom = yPair + pairH;
  const childBottom = yChild + childH;

  const treeRight = hash3Cx + Math.max(childW, txW) / 2 + 10;
  const labelX = Math.max(bx[2] + bw + 28, treeRight + 16);
  const labelY = (yPair + txY + txH) / 2 + 8;

  const vbW = labelX + 260;
  const vbH = txY + txH + 48;

  const shellStroke = [WP.cyan, WP.violet, WP.orange] as const;
  const shellFill = [WP.cyanBg, WP.violetBg, WP.orangeBg] as const;

  const tcy = (y: number, h: number) => y + h * 0.57;

  const spvSvg = svgProps(`0 0 ${vbW} ${vbH}`, 'max-w-[min(100%,92rem)]');

  return frame(
    <svg {...spvSvg}>
      <defs>
        <marker id="wp-spv2-arr-tree" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={arrowTree} />
        </marker>
        <marker id="wp-spv2-arr-chain" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill={arrowChain} />
        </marker>
      </defs>

      <text x={vbW / 2} y={50} textAnchor="middle" fill={titleTeal} fontSize={fsTitle} fontWeight="700">
        Longest Proof-of-Work Chain
      </text>

      {[0, 1, 2].map((i) => (
        <g key={i}>
          {/* Outer block (chain segment) */}
          <rect
            x={bx[i]}
            y={by}
            width={bw}
            height={bh}
            rx="7"
            fill={shellFill[i]}
            stroke={shellStroke[i]}
            strokeWidth="1.5"
          />
          {/* Section title — above inner header panel */}
          <text x={bx[i] + pad + 4} y={hdrTitleY} textAnchor="start" fill={WP.label} fontSize={fsHdr} fontWeight="700">
            Block Header
      </text>
          {/* Inner panel: Prev | Nonce, then Merkle Root */}
          <rect
            x={bx[i] + pad}
            y={panelTop}
            width={innerW}
            height={panelBottom - panelTop}
            rx="5"
            fill={fillHdrPanel}
            stroke={strokeHdrOutline}
            strokeWidth="1.1"
          />
          <rect
            x={prevLeft(i)}
            y={prevY}
            width={prevW}
            height={prevH}
            rx="4"
            fill={fillInner}
            stroke={WP.cyan}
            strokeWidth="1.15"
          />
          <text x={prevCx(i)} y={tcy(prevY, prevH)} textAnchor="middle" fill={WP.cyanHi} fontSize={fsCell} fontWeight="600">
            Prev Hash
      </text>
          <rect
            x={nonceLeft(i)}
            y={prevY}
            width={prevW}
            height={prevH}
            rx="4"
            fill={fillInner}
            stroke={WP.orange}
            strokeWidth="1.15"
          />
          <text x={nonceLeft(i) + prevW / 2} y={tcy(prevY, prevH)} textAnchor="middle" fill={WP.orangeHi} fontSize={fsCell} fontWeight="600">
            Nonce
      </text>
          <rect
            x={bx[i] + pad + panelPad}
            y={rootY}
            width={innerW - 2 * panelPad}
            height={rootH}
            rx="4"
            fill={fillInner}
            stroke={WP.emerald}
            strokeWidth={i === 1 ? 1.55 : 1.2}
          />
          <text x={bx[i] + bw / 2} y={tcy(rootY, rootH)} textAnchor="middle" fill={WP.emeraldHi} fontSize={fsCell} fontWeight="600">
            Merkle Root
      </text>
        </g>
      ))}

      <g stroke={arrowChain} strokeWidth="1.55" fill="none" strokeLinecap="round">
        <line x1={12} y1={prevMidY} x2={prevLeft(0)} y2={prevMidY} markerEnd="url(#wp-spv2-arr-chain)" />
        <line x1={bx[0] + bw - 2} y1={prevMidY} x2={prevLeft(1)} y2={prevMidY} markerEnd="url(#wp-spv2-arr-chain)" />
        <line x1={bx[1] + bw - 2} y1={prevMidY} x2={prevLeft(2)} y2={prevMidY} markerEnd="url(#wp-spv2-arr-chain)" />
        <line x1={bx[2] + bw - 2} y1={prevMidY} x2={bx[2] + bw + 62} y2={prevMidY} markerEnd="url(#wp-spv2-arr-chain)" />
      </g>

      <text x={labelX} y={labelY} textAnchor="start" fill={WP.violetHi} fontSize={fsSide} fontWeight="600">
        Merkle Branch for Tx3
      </text>

      <g>
        <rect
          x={hash01Cx - pairW / 2}
          y={yPair}
          width={pairW}
          height={pairH}
          rx="5"
          fill={fillInner}
          stroke={strokeBlk}
          strokeWidth="1.25"
        />
        <text x={hash01Cx} y={tcy(yPair, pairH)} textAnchor="middle" fill={WP.label} fontSize={fsTree} fontWeight="600">
          Hash01
        </text>
        <rect
          x={hash23Cx - pairW / 2}
          y={yPair}
          width={pairW}
          height={pairH}
          rx="5"
          fill={fillInner}
          stroke={strokeBlk}
          strokeWidth="1.25"
          strokeDasharray={dash}
        />
        <text x={hash23Cx} y={tcy(yPair, pairH)} textAnchor="middle" fill={WP.label} fontSize={fsTree} fontWeight="600">
          Hash23
        </text>

        <rect
          x={hash2Cx - childW / 2}
          y={yChild}
          width={childW}
          height={childH}
          rx="5"
          fill={fillInner}
          stroke={strokeBlk}
          strokeWidth="1.2"
        />
        <text x={hash2Cx} y={tcy(yChild, childH)} textAnchor="middle" fill={WP.label} fontSize={fsTree} fontWeight="600">
          Hash2
        </text>
        <rect
          x={hash3Cx - childW / 2}
          y={yChild}
          width={childW}
          height={childH}
          rx="5"
          fill={fillInner}
          stroke={strokeBlk}
          strokeWidth="1.2"
          strokeDasharray={dash}
        />
        <text x={hash3Cx} y={tcy(yChild, childH)} textAnchor="middle" fill={WP.label} fontSize={fsTree} fontWeight="600">
          Hash3
        </text>

        <rect
          x={hash3Cx - txW / 2}
          y={txY}
          width={txW}
          height={txH}
          rx="5"
          fill={fillInner}
          stroke={strokeBlk}
          strokeWidth="1.2"
        />
        <text x={hash3Cx} y={tcy(txY, txH)} textAnchor="middle" fill={WP.label} fontSize={fsTree} fontWeight="600">
          Tx3
        </text>
      </g>

      <g className="pointer-events-none" stroke={arrowTree} strokeWidth="1.45" fill="none" strokeLinecap="round">
        <line x1={hash3Cx} y1={txY} x2={hash3Cx} y2={childBottom} markerEnd="url(#wp-spv2-arr-tree)" />
        <line x1={hash2Cx} y1={yChild} x2={hash23Cx} y2={pairBottom} markerEnd="url(#wp-spv2-arr-tree)" />
        <line x1={hash3Cx} y1={yChild} x2={hash23Cx} y2={pairBottom} markerEnd="url(#wp-spv2-arr-tree)" />
        <line x1={hash01Cx} y1={yPair} x2={xm} y2={rootBottom} markerEnd="url(#wp-spv2-arr-tree)" />
        <line x1={hash23Cx} y1={yPair} x2={xm} y2={rootBottom} markerEnd="url(#wp-spv2-arr-tree)" />
      </g>
    </svg>,
  );
}

/**
 * Banking-style privacy vs public-ledger privacy (whitepaper §10).
 * Top: identities → transactions —(line)→ … → counterparty | Public. Bottom: Identities | Transactions → Public.
 */
function PrivacyModelDiagram() {
  const fsTitle = 12;
  const fsBox = 10;
  const h = 36;
  const y1 = 48;
  const y2 = 154;
  const mid1 = y1 + h / 2;
  const mid2 = y2 + h / 2;

  const idX = 20;
  const idW = 88;
  const txX = 120;
  const txW = 104;
  const ttpX = 244;
  const ttpW = 168;
  const cpX = 428;
  const cpW = 96;
  const divTopX = 532;
  const pubX = 542;
  const pubW = 78;

  const idRight = idX + idW;
  const txRight = txX + txW;
  const ttpRight = ttpX + ttpW;
  const cpRight = cpX + cpW;

  const box = (x: number, y: number, w: number, label: string, fill: string, stroke: string, fs = fsBox) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={fill} stroke={stroke} strokeWidth="1.15" />
      <text x={x + w / 2} y={y + h * 0.62} textAnchor="middle" fill={WP.label} fontSize={fs} fontWeight="600">
        {label}
      </text>
    </g>
  );

  const vDivider = (x: number, y: number, yb: number) => (
    <line x1={x} y1={y} x2={x} y2={yb} stroke="#64748b" strokeWidth="1.35" strokeLinecap="round" />
  );

  return frame(
    <svg {...svgProps('0 0 640 206')}>
      <defs>
        <marker id="wp-privacy-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={WP.cyanSoft} />
        </marker>
      </defs>

      <text x={idX} y={30} fill={WP.cyanHi} fontSize={fsTitle + 1} fontWeight="700">
        Traditional Privacy Model
      </text>
      {box(idX, y1, idW, 'Identities', WP.cyanBg, WP.cyan)}
      <line x1={idRight} y1={mid1} x2={txX} y2={mid1} stroke={WP.caption} strokeWidth="1.2" strokeLinecap="round" />
      {box(txX, y1, txW, 'Transactions', 'rgba(52,211,153,0.12)', WP.emerald)}
      <line x1={txRight} y1={mid1} x2={ttpX - 2} y2={mid1} stroke={WP.cyanSoft} strokeWidth="1.2" markerEnd="url(#wp-privacy-arr)" />
      {box(ttpX, y1, ttpW, 'Trusted Third Party', WP.orangeBg, WP.orange, 8.5)}
      <line x1={ttpRight} y1={mid1} x2={cpX - 2} y2={mid1} stroke={WP.cyanSoft} strokeWidth="1.2" markerEnd="url(#wp-privacy-arr)" />
      {box(cpX, y1, cpW, 'Counterparty', WP.violetBg, WP.violet)}
      {vDivider(divTopX, y1 - 2, y1 + h + 2)}
      {box(pubX, y1, pubW, 'Public', 'rgba(148,163,184,0.14)', '#94a3b8')}

      <text x={idX} y={136} fill={WP.emeraldHi} fontSize={fsTitle + 1} fontWeight="700">
        New Privacy Model
      </text>
      {box(idX, y2, idW, 'Identities', WP.cyanBg, WP.cyan)}
      {vDivider(114, y2 - 2, y2 + h + 2)}
      {box(txX, y2, txW, 'Transactions', 'rgba(52,211,153,0.12)', WP.emerald)}
      <line x1={txRight} y1={mid2} x2={pubX - 2} y2={mid2} stroke={WP.cyanSoft} strokeWidth="1.2" markerEnd="url(#wp-privacy-arr)" />
      {box(pubX, y2, pubW, 'Public', 'rgba(148,163,184,0.14)', '#94a3b8')}
    </svg>,
  );
}

/** UTXO fan-in / fan-out as labeled columns: external arrows only; empty channel between columns. */
function InputsOutputsDiagram() {
  const fillInner = '#18181b';
  const inStrokes = [WP.orange, WP.violet, WP.cyan] as const;
  const inLabels = [WP.orangeHi, WP.violetHi, WP.cyanHi] as const;
  const outStrokes = [WP.cyan, WP.violet] as const;
  const outLabels = [WP.cyanHi, WP.violetHi] as const;

  const cx = 100;
  const cy = 48;
  const cw = 420;
  const ch = 300;
  const boxW = 112;
  const boxH = 44;
  const gapY = 14;
  const leftColX = cx + 52;
  const rightColX = cx + cw - 52 - boxW;
  const yIn0 = cy + 72;
  const yIn1 = yIn0 + boxH + gapY;
  const yIn2 = yIn1 + boxH + gapY;
  const yOut0 = cy + 92;
  const yOut1 = yOut0 + boxH + gapY;
  const inCy = [yIn0 + boxH / 2, yIn1 + boxH / 2, yIn2 + boxH / 2];
  const outCy = [yOut0 + boxH / 2, yOut1 + boxH / 2];
  const arrowInFrom = 36;
  const arrowOutTo = cx + cw + 48;

  return frame(
    <svg {...svgProps('0 0 620 360')}>
      <defs>
        <marker id="wp-tx-io-arr-in-o" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.orange} />
        </marker>
        <marker id="wp-tx-io-arr-in-v" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.violet} />
        </marker>
        <marker id="wp-tx-io-arr-in-c" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.cyan} />
        </marker>
        <marker id="wp-tx-io-arr-out" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.cyan} />
        </marker>
        <marker id="wp-tx-io-arr-out-violet" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={WP.violet} />
        </marker>
      </defs>

      <rect
        x={cx}
        y={cy}
        width={cw}
        height={ch}
        rx="6"
        fill={WP.cyanBg}
        stroke={WP.cyan}
        strokeWidth="1.5"
      />
      <text x={cx + 20} y={cy + 30} fill={WP.cyanHi} fontSize="15" fontWeight="600">
        Transaction
      </text>

      {[yIn0, yIn1, yIn2].map((y, i) => (
        <g key={`in-${i}`}>
          <rect x={leftColX} y={y} width={boxW} height={boxH} rx="4" fill={fillInner} stroke={inStrokes[i]} strokeWidth="1.1" />
          <text x={leftColX + boxW / 2} y={y + boxH / 2 + 5} textAnchor="middle" fill={inLabels[i]} fontSize="13" fontWeight="600">
            {i < 2 ? 'In' : '…'}
          </text>
        </g>
      ))}

      {[yOut0, yOut1].map((y, i) => (
        <g key={`out-${i}`}>
          <rect x={rightColX} y={y} width={boxW} height={boxH} rx="4" fill={fillInner} stroke={outStrokes[i]} strokeWidth="1.1" />
          <text
            x={rightColX + boxW / 2}
            y={y + boxH / 2 + 5}
            textAnchor="middle"
            fill={outLabels[i]}
            fontSize="13"
            fontWeight="600"
          >
            {i === 0 ? 'Out' : '…'}
          </text>
        </g>
      ))}

      <g strokeWidth="1.25" strokeLinecap="round" fill="none">
        {inCy.map((y, i) => (
          <line
            key={`ein-${i}`}
            x1={arrowInFrom}
            y1={y}
            x2={leftColX - 4}
            y2={y}
            stroke={inStrokes[i]}
            markerEnd={`url(#wp-tx-io-arr-in-${i === 0 ? 'o' : i === 1 ? 'v' : 'c'})`}
          />
        ))}
        {outCy.map((y, i) => (
          <line
            key={`eout-${i}`}
            x1={rightColX + boxW + 4}
            y1={y}
            x2={arrowOutTo}
            y2={y}
            stroke={outStrokes[i]}
            markerEnd={i === 0 ? 'url(#wp-tx-io-arr-out)' : 'url(#wp-tx-io-arr-out-violet)'}
          />
        ))}
      </g>
    </svg>,
  );
}
