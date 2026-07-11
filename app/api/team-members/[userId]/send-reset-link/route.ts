import { NextResponse } from 'next/server';
import { sendPasswordResetLink } from '@/app/admin/(dashboard)/team/actions';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const body = await request.json() as { reason?: string };
    const result = await sendPasswordResetLink(userId, body.reason ?? '');

    return NextResponse.json({
      deliveryWarning: result.deliveryWarning,
      message: result.deliveryWarning ?? 'Password reset link sent successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send this password reset link.' },
      { status: 400 },
    );
  }
}
