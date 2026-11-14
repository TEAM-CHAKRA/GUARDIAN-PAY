import { NextRequest, NextResponse } from 'next/server';
import { analyzeLink } from '@/lib/linkScanner';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = body.url;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL is required',
          },
        },
        { status: 400 }
      );
    }

    // Run structural threat analysis
    const result = analyzeLink(rawUrl);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: err?.message || 'Failed to inspect link',
        },
      },
      { status: 500 }
    );
  }
}
