import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@trackmyhabits/database';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, age, sex, habits } = await req.json();

    // Execute atomic transaction for user profile update and habit creation
    await prisma.$transaction(async (tx) => {
      // 1. Update user profile details
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(name ? { name } : {}),
          ...(age ? { age: parseInt(String(age), 10) } : {}),
          ...(sex ? { sex } : {}),
          profileCompleteness: 100,
        },
      });

      // 2. Create pre-selected habit records if any
      if (Array.isArray(habits) && habits.length > 0) {
        for (const habit of habits) {
          await tx.habit.create({
            data: {
              userId,
              title: habit.title,
              emoji: habit.emoji || '⚡',
              color: habit.color || '#78866B',
              frequencyType: habit.frequencyType || 'daily',
              specificDays: habit.specificDays || null,
              freezesRemaining: 3,
            },
          });
        }
      }
    });

    return NextResponse.json(
      { message: 'Onboarding completed successfully', habitsCreated: habits?.length || 0 },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
