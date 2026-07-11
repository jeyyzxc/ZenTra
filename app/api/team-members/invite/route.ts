import { NextResponse } from 'next/server';
import { inviteTeamMember } from '@/app/admin/(dashboard)/team/actions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      fullName?: string;
      email?: string;
      contactNumber?: string;
      role?: 'SUPERADMIN' | 'ADMIN';
    };
    const result = await inviteTeamMember({
      fullName: body.fullName ?? '',
      email: body.email ?? '',
      contactNumber: body.contactNumber ?? '',
      role: body.role ?? 'ADMIN',
    });

    return NextResponse.json({
      member: result.member,
      deliveryWarning: result.deliveryWarning,
      message: result.deliveryWarning ?? 'Invitation sent successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to invite this team member.' },
      { status: 400 },
    );
  }
}
