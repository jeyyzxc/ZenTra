import { AccountTokenType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/audit';
import { completePasswordWithToken } from '@/lib/team-access';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      token?: string;
      newPassword?: string;
    };

    await completePasswordWithToken({
      rawToken: body.token ?? '',
      tokenType: AccountTokenType.PASSWORD_RESET,
      newPassword: body.newPassword ?? '',
      ...getRequestContext(request),
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset this password.';
    
    let code = 'RESET_ERROR';
    let mappedMessage = message;

    if (message.includes('expired')) {
      code = 'RESET_TOKEN_EXPIRED';
      mappedMessage = 'This password reset link has expired.';
    } else if (message.includes('already been used')) {
      code = 'RESET_TOKEN_USED';
      mappedMessage = 'This password reset link has already been used.';
    } else if (message.includes('invalid')) {
      code = 'RESET_TOKEN_INVALID';
      mappedMessage = 'This password reset link is invalid.';
    }

    return NextResponse.json(
      { 
        success: false,
        code,
        message: mappedMessage,
        error: mappedMessage // For backwards compatibility with AccountPasswordForm error state
      },
      { status: 400 },
    );
  }
}
