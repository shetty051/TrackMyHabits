import { NextResponse } from 'next/server';
import { prisma } from '@trackmyhabits/database';

function isHabitDueOnDate(habit: any, dateObj: Date): boolean {
  if (habit.frequencyType === 'daily') return true;

  if (habit.frequencyType === 'specific-days') {
    if (!habit.specificDays) return true;
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = days[dateObj.getDay()];
    return habit.specificDays.toUpperCase().includes(currentDay);
  }

  if (habit.frequencyType === 'alternate') {
    const created = new Date(habit.createdAt);
    const diffTime = Math.abs(dateObj.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % 2 === 0;
  }

  return true;
}

export async function POST() {
  try {
    const todayObj = new Date();
    const todayISO = todayObj.toISOString().split('T')[0];

    const users = await prisma.user.findMany({
      include: {
        habits: {
          include: {
            logs: {
              where: { date: todayISO },
            },
          },
        },
      },
    });

    let remindersSent = 0;

    for (const user of users) {
      const dueHabitsToday = user.habits.filter((h) => isHabitDueOnDate(h, todayObj));
      const incompleteHabits = dueHabitsToday.filter(
        (h) => !h.logs.some((l) => l.completed)
      );

      if (incompleteHabits.length > 0) {
        const message = `⚡ Reminder: You have ${incompleteHabits.length} incomplete habit${
          incompleteHabits.length > 1 ? 's' : ''
        } scheduled for today!`;

        // Check if reminder was already sent today to prevent duplicates
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            message: { startsWith: '⚡ Reminder:' },
            createdAt: {
              gte: new Date(`${todayISO}T00:00:00.000Z`),
            },
          },
        });

        if (!existingReminder) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              message,
              read: false,
            },
          });
          remindersSent++;
        }
      }
    }

    return NextResponse.json(
      { message: 'Cron reminder check completed', remindersSent },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cron reminder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run cron reminder' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
