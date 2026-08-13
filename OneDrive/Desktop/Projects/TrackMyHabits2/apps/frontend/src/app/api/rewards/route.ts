import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@trackmyhabits/database';

export async function evaluateAndFetchBadges(userId: string) {
  // 1. Fetch user data with habits, logs, and userBadges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      habits: true,
      habitLogs: {
        where: { completed: true },
      },
      userBadges: true,
    },
  });

  if (!user) return { badges: [], newlyUnlocked: [] };

  const allBadges = await prisma.badge.findMany();
  const unlockedBadgeIds = new Set(user.userBadges.map((ub) => ub.badgeId));

  // Compute metrics
  const totalCompletedLogs = user.habitLogs.length;
  const totalHabitsCreated = user.habits.length;
  const isProfile100 = user.profileCompleteness === 100;
  const hasUsedFreeze = user.habits.some((h) => h.freezesRemaining < 3);
  const hasUsedAllFreezes = user.habits.some((h) => h.freezesRemaining === 0);

  // Compute consecutive streak days
  const uniqueDates = Array.from(new Set(user.habitLogs.map((l) => l.date))).sort();
  let maxStreak = 0;
  let currentStreak = 0;

  if (uniqueDates.length > 0) {
    currentStreak = 1;
    maxStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
  }

  // Check Saturday & Sunday completions
  const completedWeekend = user.habitLogs.some((l) => {
    const day = new Date(l.date).getDay();
    return day === 0 || day === 6;
  });

  const newlyUnlocked: any[] = [];

  for (const badge of allBadges) {
    if (unlockedBadgeIds.has(badge.id)) continue;

    let eligible = false;

    // Evaluate Criteria
    switch (badge.name) {
      // Streak-Based
      case 'First Step':
        eligible = totalCompletedLogs >= 1;
        break;
      case '3-Day Spark':
        eligible = maxStreak >= 3;
        break;
      case '7-Day Flame':
        eligible = maxStreak >= 7;
        break;
      case '14-Day Momentum':
        eligible = maxStreak >= 14;
        break;
      case '21-Day Habit Builder':
        eligible = maxStreak >= 21;
        break;
      case '30-Day Master':
        eligible = maxStreak >= 30;
        break;
      case '60-Day Titan':
        eligible = maxStreak >= 60;
        break;
      case '90-Day Legend':
        eligible = maxStreak >= 90;
        break;
      case 'Weekend Warrior':
        eligible = completedWeekend;
        break;
      case 'Daily Devotee':
        eligible = currentStreak >= 7;
        break;

      // Engagement-Based
      case 'Profile Perfectionist':
        eligible = isProfile100;
        break;
      case 'Architect':
        eligible = totalHabitsCreated >= 1;
        break;
      case 'Multi-Tracker':
        eligible = totalHabitsCreated >= 3;
        break;
      case 'Habit Collector':
        eligible = totalHabitsCreated >= 5;
        break;
      case 'Freeze Defender':
        eligible = hasUsedFreeze;
        break;
      case 'Shield Master':
        eligible = hasUsedAllFreezes;
        break;
      case 'Onboarding Graduate':
        eligible = user.profileCompleteness >= 50;
        break;
      case 'Night Owl':
        eligible = totalCompletedLogs >= 3;
        break;
      case 'Early Bird':
        eligible = totalCompletedLogs >= 2;
        break;
      case 'Theme Master':
        eligible = true;
        break;

      // Volume-Based
      case 'High Five':
        eligible = totalCompletedLogs >= 5;
        break;
      case 'Double Digits':
        eligible = totalCompletedLogs >= 10;
        break;
      case 'Quarter Century':
        eligible = totalCompletedLogs >= 25;
        break;
      case 'Half Century':
        eligible = totalCompletedLogs >= 50;
        break;
      case 'Century Club':
        eligible = totalCompletedLogs >= 100;
        break;
      case 'Legend 150':
        eligible = totalCompletedLogs >= 150;
        break;
      case 'Double Century':
        eligible = totalCompletedLogs >= 200;
        break;
      case 'Consistency Crusader':
        eligible = totalCompletedLogs >= 30;
        break;
      case 'Habit Warrior':
        eligible = totalCompletedLogs >= 40;
        break;
      case 'Habit Master':
        eligible = totalCompletedLogs >= 500;
        break;

      default:
        eligible = false;
    }

    if (eligible) {
      const newUB = await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });

      // Insert real Notification row for badge unlock
      await prisma.notification.create({
        data: {
          userId,
          message: `🎉 You unlocked the "${badge.name}" ${badge.iconKey} badge!`,
          read: false,
        },
      });

      unlockedBadgeIds.add(badge.id);
      newlyUnlocked.push({
        ...badge,
        unlockedAt: newUB.unlockedAt.toISOString(),
      });
    }
  }

  // Format response with unlocked status and timestamps
  const userBadgeMap = new Map(
    (
      await prisma.userBadge.findMany({
        where: { userId },
      })
    ).map((ub) => [ub.badgeId, ub.unlockedAt.toISOString()])
  );

  const formattedBadges = allBadges.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    iconKey: b.iconKey,
    category: b.category,
    unlocked: userBadgeMap.has(b.id),
    unlockedAt: userBadgeMap.get(b.id) || null,
  }));

  return { badges: formattedBadges, newlyUnlocked };
}

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
