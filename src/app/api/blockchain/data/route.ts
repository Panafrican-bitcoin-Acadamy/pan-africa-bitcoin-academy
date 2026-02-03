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

    try {
      if (type === 'mempool') {
        // Fetch mempool blocks only
        const response = await fetch('https://mempool.space/api/v1/fees/mempool-blocks', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch mempool data: ${response.statusText}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json({ mempoolBlocks: data }, { status: 200 });
      } else if (type === 'blocks') {
        // Fetch confirmed blocks only
        const response = await fetch('https://mempool.space/api/blocks', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch blocks data: ${response.statusText}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json({ blocks: data }, { status: 200 });
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
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch block detail: ${response.statusText}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json({ blockDetail: data }, { status: 200 });
      } else {
        // Fetch both mempool and blocks in parallel
        const [mempoolResponse, blocksResponse] = await Promise.all([
          fetch('https://mempool.space/api/v1/fees/mempool-blocks', {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }),
          fetch('https://mempool.space/api/blocks', {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }),
        ]);

        clearTimeout(timeoutId);

        if (!mempoolResponse.ok || !blocksResponse.ok) {
          const errors = [];
          if (!mempoolResponse.ok) {
            errors.push(`Mempool: ${mempoolResponse.statusText}`);
          }
          if (!blocksResponse.ok) {
            errors.push(`Blocks: ${blocksResponse.statusText}`);
          }
          return NextResponse.json(
            { error: `Failed to fetch blockchain data: ${errors.join(', ')}` },
            { status: 500 }
          );
        }

        const [mempoolData, blocksData] = await Promise.all([
          mempoolResponse.json(),
          blocksResponse.json(),
        ]);

        // Validate data structure
        if (!Array.isArray(mempoolData) || !Array.isArray(blocksData)) {
          return NextResponse.json(
            { error: 'Invalid data format from API' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            mempoolBlocks: mempoolData,
            blocks: blocksData,
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
      
      throw fetchError;
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

