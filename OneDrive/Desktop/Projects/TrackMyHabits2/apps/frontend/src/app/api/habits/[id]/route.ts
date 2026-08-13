import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@trackmyhabits/database';

export async function PUT(
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
    const { title, emoji, color, frequencyType, specificDays } = await req.json();

    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(emoji ? { emoji } : {}),
        ...(color ? { color } : {}),
        ...(frequencyType ? { frequencyType } : {}),
        ...(specificDays !== undefined ? { specificDays } : {}),
      },
    });

    return NextResponse.json({ message: 'Habit updated successfully', habit: updatedHabit }, { status: 200 });
  } catch (error: any) {
    console.error('Update habit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update habit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Habit deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete habit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete habit' },
      { status: 500 }
    );
  }
}
