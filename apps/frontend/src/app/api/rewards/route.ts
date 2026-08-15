import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { evaluateAndFetchBadges } from '@/utils/rewards';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { badges, newlyUnlocked } = await evaluateAndFetchBadges(userId);

    return NextResponse.json({ badges, newlyUnlocked }, { status: 200 });
  } catch (error: any) {
    console.error('Rewards API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
