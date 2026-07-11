import { NextResponse } from 'next/server';
import { deleteTeamMember } from '@/app/admin/(dashboard)/team/actions';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const result = await deleteTeamMember(userId);

    return NextResponse.json({
      ...result,
      message: 'Team member deleted permanently.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete this team member.' },
      { status: 400 },
    );
  }
}

