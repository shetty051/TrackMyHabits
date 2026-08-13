import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@trackmyhabits/database';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: { hasSeenIntroTutorial: true },
    });

    return NextResponse.json({ message: 'Tutorial marked as complete' });
  } catch (error: any) {
    console.error('Complete tutorial error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete tutorial' },
      { status: 500 }
    );
  }
}
