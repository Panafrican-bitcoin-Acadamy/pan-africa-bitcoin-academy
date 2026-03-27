import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/blockchain/data
 * Proxy endpoint to fetch live blockchain data from mempool.space
 * This avoids CORS issues and provides better error handling
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all'; // 'mempool', 'blocks', 'all', or 'block-detail'

    // Set timeout for requests (15 seconds)
    const timeout = 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const upstreamHeaders = {
      Accept: 'application/json',
      'User-Agent': 'PanAfricaBitcoinAcademy/1.0 (+educational)',
    } as const;

    try {
      if (type === 'mempool') {
        // Fetch mempool blocks only
        const response = await fetch('https://mempool.space/api/v1/fees/mempool-blocks', {
          signal: controller.signal,
          headers: upstreamHeaders,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch mempool data: ${response.statusText}` },
            { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
          );
        }

        try {
          const data = await response.json();
          return NextResponse.json({ mempoolBlocks: data }, { status: 200 });
        } catch {
          return NextResponse.json({ error: 'Invalid JSON from mempool API' }, { status: 502 });
        }
      } else if (type === 'blocks') {
        // Fetch confirmed blocks only
        const response = await fetch('https://mempool.space/api/blocks', {
          signal: controller.signal,
          headers: upstreamHeaders,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch blocks data: ${response.statusText}` },
            { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
          );
        }

        try {
          const data = await response.json();
          return NextResponse.json({ blocks: data }, { status: 200 });
        } catch {
          return NextResponse.json({ error: 'Invalid JSON from blocks API' }, { status: 502 });
        }
      } else if (type === 'block-detail') {
        // Fetch detailed block information
        const blockId = searchParams.get('blockId');
        if (!blockId) {
          return NextResponse.json(
            { error: 'blockId parameter is required for block-detail type' },
            { status: 400 }
          );
        }

        const response = await fetch(`https://mempool.space/api/block/${blockId}`, {
          signal: controller.signal,
          headers: upstreamHeaders,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch block detail: ${response.statusText}` },
            { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
          );
        }

        try {
          const data = await response.json();
          return NextResponse.json({ blockDetail: data }, { status: 200 });
        } catch {
          return NextResponse.json({ error: 'Invalid JSON from block detail API' }, { status: 502 });
        }
      } else {
        // Fetch both mempool and blocks in parallel; allow partial success
        const [mempoolResponse, blocksResponse] = await Promise.all([
          fetch('https://mempool.space/api/v1/fees/mempool-blocks', {
            signal: controller.signal,
            headers: upstreamHeaders,
          }),
          fetch('https://mempool.space/api/blocks', {
            signal: controller.signal,
            headers: upstreamHeaders,
          }),
        ]);

        clearTimeout(timeoutId);

        let mempoolData: unknown[] = [];
        let blocksData: unknown[] = [];
        const warnings: string[] = [];

        if (mempoolResponse.ok) {
          try {
            const raw = await mempoolResponse.json();
            mempoolData = Array.isArray(raw) ? raw : [];
            if (!Array.isArray(raw)) warnings.push('Mempool response was not an array');
          } catch {
            warnings.push('Could not parse mempool JSON');
          }
        } else {
          warnings.push(`Mempool HTTP ${mempoolResponse.status}`);
        }

        if (blocksResponse.ok) {
          try {
            const raw = await blocksResponse.json();
            blocksData = Array.isArray(raw) ? raw : [];
            if (!Array.isArray(raw)) warnings.push('Blocks response was not an array');
          } catch {
            warnings.push('Could not parse blocks JSON');
          }
        } else {
          warnings.push(`Blocks HTTP ${blocksResponse.status}`);
        }

        if (mempoolData.length === 0 && blocksData.length === 0) {
          return NextResponse.json(
            {
              error: `Could not load live data from mempool.space (${warnings.join('; ') || 'no data'})`,
            },
            { status: 502 }
          );
        }

        return NextResponse.json(
          {
            mempoolBlocks: mempoolData,
            blocks: blocksData,
            ...(warnings.length ? { warnings } : {}),
          },
          { status: 200 }
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - mempool.space API took too long to respond' },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        {
          error: fetchError?.message || 'Could not reach mempool.space',
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Error in blockchain data API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

