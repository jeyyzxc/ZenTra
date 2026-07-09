import { NextResponse } from 'next/server';
import { resendInvitation } from '@/app/admin/(dashboard)/team/actions';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const result = await resendInvitation(userId);

    return NextResponse.json({
      deliveryWarning: result.deliveryWarning,
      message: result.deliveryWarning ?? 'Invitation sent successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to resend this invitation.' },
      { status: 400 },
    );
  }
}
