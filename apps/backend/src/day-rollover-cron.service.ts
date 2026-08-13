import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export function getYesterdayISOLocal(): { isoDate: string; dateObj: Date } {
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

  return { isoDate: `${year}-${month}-${day}`, dateObj: d };
}

@Injectable()
export class DayRolloverCronService implements OnModuleInit {
  private readonly logger = new Logger(DayRolloverCronService.name);

  onModuleInit() {
    this.logger.log('Initializing Midnight Day-Rollover & Freeze Consumption Cron Service...');
    // Run initial rollover check & schedule periodic check every 15 minutes
    this.runDayRolloverProcess();
    setInterval(() => this.runDayRolloverProcess(), 15 * 60 * 1000);
  }

  async runDayRolloverProcess(): Promise<{
    processedCount: number;
    freezesUsedCount: number;
    streaksBrokenCount: number;
  }> {
    try {
      this.logger.log('Executing Day-Boundary Rollover & Freeze Consumption Check...');
      const { isoDate: yesterdayISO, dateObj: yesterdayObj } = getYesterdayISOLocal();

      const users = await prisma.user.findMany({
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
          if (isHabitDueOnDate(habit, yesterdayObj)) {
            const existingLog = habit.logs.find((l) => l.date === yesterdayISO);
            
            // Incomplete or unlogged habit from yesterday
            if (!existingLog || (!existingLog.completed && !existingLog.freezeUsed)) {
              processedCount++;

              if (habit.freezesRemaining > 0) {
                // Auto-consume 1 freeze to save streak
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
                this.logger.log(`Auto-applied freeze for habit ${habit.id} (${habit.title}) for user ${user.id}`);
              } else {
                // No freezes remaining -> Streak breaks!
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
                this.logger.log(`Streak broken for habit ${habit.id} (${habit.title}) for user ${user.id}`);
              }
            }
          }
        }
      }

      this.logger.log(
        `Day Rollover Process Complete for ${yesterdayISO}. Processed: ${processedCount}, Freezes Used: ${freezesUsedCount}, Streaks Broken: ${streaksBrokenCount}`
      );

      return { processedCount, freezesUsedCount, streaksBrokenCount };
    } catch (err: any) {
      this.logger.error('Error during Day Rollover Process:', err);
      return { processedCount: 0, freezesUsedCount: 0, streaksBrokenCount: 0 };
    }
  }
}
