import { AccountTokenType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/audit';
import { passwordSecurityErrorDetails } from '@/lib/password-security';
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
      tokenType: AccountTokenType.INVITATION,
      newPassword: body.newPassword ?? '',
      ...getRequestContext(request),
    });

    return NextResponse.json({
      success: true,
      message: 'Your team account has been activated successfully.',
    });
  } catch (error) {
    const securityError = passwordSecurityErrorDetails(error);

    if (securityError) {
      return NextResponse.json(securityError.body, { status: securityError.status });
    }

    const message = error instanceof Error ? error.message : 'Unable to set up this account.';
    
    let code = 'SETUP_ERROR';
    let mappedMessage = message;

    if (message.includes('expired')) {
      code = 'SETUP_TOKEN_EXPIRED';
      mappedMessage = 'This account setup link has expired.';
    } else if (message.includes('already been used')) {
      code = 'SETUP_TOKEN_USED';
      mappedMessage = 'This account has already been activated.';
    } else if (message.includes('invalid')) {
      code = 'SETUP_TOKEN_INVALID';
      mappedMessage = 'This account setup link is invalid.';
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
