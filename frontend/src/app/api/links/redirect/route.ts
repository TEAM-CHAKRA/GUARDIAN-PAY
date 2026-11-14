import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken } from '@/lib/linkScanner';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const acknowledgeWarning = searchParams.get('acknowledgeWarning');
  const format = searchParams.get('format');

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Destination verification token missing' },
      },
      { status: 403 }
    );
  }

  const validation = validateVerificationToken(token);
  if (!validation.valid || !validation.url) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: validation.error || 'Destination verification failed' },
      },
      { status: 403 }
    );
  }

  if (validation.action === 'warn' && acknowledgeWarning !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WARNING_CONFIRMATION_REQUIRED',
          message: 'Security warning acknowledgment required prior to external redirection.',
        },
      },
      { status: 400 }
    );
  }

  if (format === 'json' || req.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({
      success: true,
      redirectUrl: validation.url,
      action: validation.action,
      score: validation.score,
    });
  }

  return NextResponse.redirect(validation.url, 302);
}
