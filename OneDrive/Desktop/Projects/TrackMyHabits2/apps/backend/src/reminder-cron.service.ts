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

@Injectable()
export class ReminderCronService implements OnModuleInit {
  private readonly logger = new Logger(ReminderCronService.name);

  onModuleInit() {
    this.logger.log('Initializing End-of-Day Habit Reminder Cron Scheduler...');
    // Run initial check and set periodic cron interval (every 30 minutes)
    this.runReminderCronCheck();
    setInterval(() => this.runReminderCronCheck(), 30 * 60 * 1000);
  }

  async runReminderCronCheck() {
    try {
      this.logger.log('Executing NestJS End-of-Day Incomplete Habit Gap Check...');
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

      let totalSent = 0;

      for (const user of users) {
        const dueHabitsToday = user.habits.filter((h) => isHabitDueOnDate(h, todayObj));
        const incompleteHabits = dueHabitsToday.filter(
          (h) => !h.logs.some((l) => l.completed)
        );

        if (incompleteHabits.length > 0) {
          const message = `⚡ Reminder: You have ${incompleteHabits.length} incomplete habit${
            incompleteHabits.length > 1 ? 's' : ''
          } scheduled for today!`;

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
            totalSent++;
          }
        }
      }

      this.logger.log(`End-of-Day Reminder Check Completed. ${totalSent} reminder notifications sent.`);
    } catch (err: any) {
      this.logger.error('Error during reminder cron execution:', err);
    }
  }
}
