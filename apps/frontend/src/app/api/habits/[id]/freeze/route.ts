import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@trackmyhabits/database';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== userId) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    if (habit.freezesRemaining <= 0) {
      return NextResponse.json(
        { error: 'No streak freezes remaining for this habit' },
        { status: 400 }
      );
    }

    const todayDate = new Date().toISOString().split('T')[0];

    // Transaction: Decrement freezes and log protected date
    const updatedHabit = await prisma.$transaction(async (tx) => {
      // Create or update log entry as completed/protected for today
      await tx.habitLog.upsert({
        where: {
          habitId_date: {
            habitId: id,
            date: todayDate,
          },
        },
        update: { completed: true },
        create: {
          habitId: id,
          userId,
          date: todayDate,
          completed: true,
        },
      });

      // Decrement freezes remaining
      return await tx.habit.update({
        where: { id },
        data: {
          freezesRemaining: habit.freezesRemaining - 1,
        },
      });
    });

    return NextResponse.json(
      {
        message: 'Streak freeze activated successfully',
        freezesRemaining: updatedHabit.freezesRemaining,
        habit: updatedHabit,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Streak freeze error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to use streak freeze' },
      { status: 500 }
    );
  }
}
