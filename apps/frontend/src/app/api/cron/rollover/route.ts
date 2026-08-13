import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    // Calculate yesterday ISO in IST local time
    const d = new Date();
    d.setDate(d.getDate() - 1);

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);

    const year = parts.find((p) => p.type === 'year')?.value || d.getFullYear().toString();
    const month = parts.find((p) => p.type === 'month')?.value || String(d.getMonth() + 1).padStart(2, '0');
    const day = parts.find((p) => p.type === 'day')?.value || String(d.getDate()).padStart(2, '0');

    const yesterdayISO = `${year}-${month}-${day}`;

    // Target specific user if logged in, otherwise all users
    const whereCondition = userId ? { id: userId } : {};

    const users = await prisma.user.findMany({
      where: whereCondition,
      include: {
        habits: {
          include: {
            logs: {
              where: { date: yesterdayISO },
            },
          },
        },
      },
    });

    let processedCount = 0;
    let freezesUsedCount = 0;
    let streaksBrokenCount = 0;

    for (const user of users) {
      for (const habit of user.habits) {
        if (isHabitDueOnDate(habit, d)) {
          const existingLog = habit.logs.find((l) => l.date === yesterdayISO);

          if (!existingLog || (!existingLog.completed && !existingLog.freezeUsed)) {
            processedCount++;

            if (habit.freezesRemaining > 0) {
              const remaining = habit.freezesRemaining - 1;
              await prisma.habit.update({
                where: { id: habit.id },
                data: { freezesRemaining: remaining },
              });

              await prisma.habitLog.upsert({
                where: { habitId_date: { habitId: habit.id, date: yesterdayISO } },
                create: {
                  habitId: habit.id,
                  userId: user.id,
                  date: yesterdayISO,
                  completed: false,
                  freezeUsed: true,
                },
                update: {
                  completed: false,
                  freezeUsed: true,
                },
              });

              await prisma.notification.create({
                data: {
                  userId: user.id,
                  message: `🛡️ Streak Freeze Auto-Applied: 1 freeze consumed for '${habit.title}' on ${yesterdayISO} to preserve your streak! (${remaining} freeze${remaining === 1 ? '' : 's'} remaining)`,
                  read: false,
                },
              });

              freezesUsedCount++;
            } else {
              await prisma.habitLog.upsert({
                where: { habitId_date: { habitId: habit.id, date: yesterdayISO } },
                create: {
                  habitId: habit.id,
                  userId: user.id,
                  date: yesterdayISO,
                  completed: false,
                  freezeUsed: false,
                },
                update: {
                  completed: false,
                  freezeUsed: false,
                },
              });

              await prisma.user.update({
                where: { id: user.id },
                data: { hasUnaddressedMissedHabit: true },
              });

              await prisma.notification.create({
                data: {
                  userId: user.id,
                  message: `⚠️ Streak Reset: '${habit.title}' was missed on ${yesterdayISO} with 0 freezes remaining. Your streak has reset.`,
                  read: false,
                },
              });

              streaksBrokenCount++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      yesterdayISO,
      processedCount,
      freezesUsedCount,
      streaksBrokenCount,
      message: `Day-boundary rollover executed for ${yesterdayISO}! Consumed ${freezesUsedCount} freeze(s), ${streaksBrokenCount} streak(s) reset.`,
    });
  } catch (err: any) {
    console.error('Failed to run day rollover route:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
