import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch user habits with all historical logs
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: true,
      },
    });

    const totalLogsCount = habits.reduce((acc, h) => acc + (h.logs?.length || 0), 0);
    const totalCompletedLogsCount = habits.reduce(
      (acc, h) => acc + (h.logs?.filter((l) => l.completed).length || 0),
      0
    );

    // Genuine Empty State check
    if (habits.length === 0 || totalCompletedLogsCount === 0) {
      return NextResponse.json({
        hasData: false,
        message: 'Analytics will be visible once you start doing your habits',
      });
    }

    // 1. Calculate 30-Day Recency-Weighted Completion Rate (RWCR) Score
    let weightedSum = 0;
    let weightTotal = 0;

    const dayNameCounts: Record<string, { totalDue: number; completed: number }> = {
      SUN: { totalDue: 0, completed: 0 },
      MON: { totalDue: 0, completed: 0 },
      TUE: { totalDue: 0, completed: 0 },
      WED: { totalDue: 0, completed: 0 },
      THU: { totalDue: 0, completed: 0 },
      FRI: { totalDue: 0, completed: 0 },
      SAT: { totalDue: 0, completed: 0 },
    };

    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    for (let d = 0; d < 30; d++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - d);
      const dateISO = targetDate.toISOString().split('T')[0];
      const dayShort = daysShort[targetDate.getDay()];

      const weight = Math.exp(-0.05 * d); // Exponential decay weight
      let dueCount = 0;
      let completedCount = 0;

      habits.forEach((h) => {
        if (isHabitDueOnDate(h, targetDate)) {
          dueCount++;
          dayNameCounts[dayShort].totalDue++;
          if (h.logs?.some((l) => l.date === dateISO && l.completed)) {
            completedCount++;
            dayNameCounts[dayShort].completed++;
          }
        }
      });

      const dayFraction = dueCount > 0 ? completedCount / dueCount : 1.0;
      weightedSum += weight * dayFraction;
      weightTotal += weight;
    }

    const rawScore = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0;
    const consistencyScore = Math.round(rawScore);

    // Determine Score Tier
    let tierName = 'Needs Spark';
    let tierDesc = 'Keep logging habits daily to build momentum!';
    let tierColor = '#F87171';

    if (consistencyScore >= 90) {
      tierName = 'Mastery Tier';
      tierDesc = '🏆 Champion of Consistency! Outstanding dedication.';
      tierColor = '#34D399';
    } else if (consistencyScore >= 75) {
      tierName = 'Flow State';
      tierDesc = '🔥 Solid Momentum! You are crushing your daily habits.';
      tierColor = '#60A5FA';
    } else if (consistencyScore >= 50) {
      tierName = 'Building Habits';
      tierDesc = '🌱 Promising Progress! Focus on daily repetition.';
      tierColor = '#FBBF24';
    }

    // 2. Build 14-Day Timeline Data for Chart Plotting
    const timelineData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dISO = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let dueCount = 0;
      let completedCount = 0;

      habits.forEach((h) => {
        if (isHabitDueOnDate(h, d)) {
          dueCount++;
          if (h.logs?.some((l) => l.date === dISO && l.completed)) {
            completedCount++;
          }
        }
      });

      const pct = dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 0;
      timelineData.push({ date: dISO, label, completedCount, dueCount, percentage: pct });
    }

    // 3. Per-Habit Consistency Breakdown
    const habitBreakdown = habits.map((h) => {
      let habitDue = 0;
      let habitCompleted = 0;

      for (let d = 0; d < 30; d++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - d);
        const dateISO = targetDate.toISOString().split('T')[0];

        if (isHabitDueOnDate(h, targetDate)) {
          habitDue++;
          if (h.logs?.some((l) => l.date === dateISO && l.completed)) {
            habitCompleted++;
          }
        }
      }

      const rate = habitDue > 0 ? Math.round((habitCompleted / habitDue) * 100) : 0;
      return {
        id: h.id,
        title: h.title,
        emoji: h.emoji,
        color: h.color,
        rate,
        completedCount: habitCompleted,
        dueCount: habitDue,
      };
    });

    // 4. Generate Actionable Data Insights
    const actionableTips: string[] = [];

    // Best Day of Week
    let bestDay = 'MON';
    let bestDayPct = -1;
    Object.entries(dayNameCounts).forEach(([day, stat]) => {
      const pct = stat.totalDue > 0 ? stat.completed / stat.totalDue : 0;
      if (pct > bestDayPct && stat.totalDue > 0) {
        bestDayPct = pct;
        bestDay = day;
      }
    });

    const dayFullNames: Record<string, string> = {
      SUN: 'Sundays',
      MON: 'Mondays',
      TUE: 'Tuesdays',
      WED: 'Wednesdays',
      THU: 'Thursdays',
      FRI: 'Fridays',
      SAT: 'Saturdays',
    };

    if (bestDayPct > 0) {
      actionableTips.push(
        `You have your highest completion rate on ${dayFullNames[bestDay] || bestDay}! Try aligning challenging habits with this peak day.`
      );
    }

    // Best & Weakest Habit Insights
    const sortedHabits = [...habitBreakdown].sort((a, b) => b.rate - a.rate);
    if (sortedHabits.length > 0) {
      const topHabit = sortedHabits[0];
      actionableTips.push(
        `"${topHabit.title}" ${topHabit.emoji} is your most consistent habit at ${topHabit.rate}% completion!`
      );

      if (sortedHabits.length > 1) {
        const weakest = sortedHabits[sortedHabits.length - 1];
        if (weakest.rate < 70) {
          actionableTips.push(
            `"${weakest.title}" ${weakest.emoji} has a ${weakest.rate}% completion rate. Consider setting daily Rooney reminders or pairing it with "${topHabit.title}".`
          );
        }
      }
    }

    return NextResponse.json({
      hasData: true,
      consistencyScore,
      tierName,
      tierDesc,
      tierColor,
      timelineData,
      habitBreakdown,
      actionableTips,
    });
  } catch (error: any) {
    console.error('Insights calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate insights' },
      { status: 500 }
    );
  }
}
