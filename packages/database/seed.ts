import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Curated 15 High-Quality Sustained-Effort Badges (Removed low-effort/setup badges)
const BADGES = [
  // STREAK-BASED BADGES (6) - Requires consecutive daily consistency
  { name: '3-Day Spark', description: 'Maintain a 3-day completion streak', iconKey: '⚡', category: 'streak' },
  { name: '7-Day Flame', description: 'Maintain a 7-day completion streak', iconKey: '🔥', category: 'streak' },
  { name: '14-Day Momentum', description: 'Maintain a 14-day completion streak', iconKey: '🚀', category: 'streak' },
  { name: '21-Day Habit Builder', description: 'Maintain a 21-day completion streak', iconKey: '🧱', category: 'streak' },
  { name: '30-Day Master', description: 'Maintain a 30-day completion streak', iconKey: '👑', category: 'streak' },
  { name: '60-Day Titan', description: 'Maintain a 60-day completion streak', iconKey: '🛡️', category: 'streak' },

  // VOLUME & CONSISTENCY BADGES (6) - Requires genuine completion volume
  { name: 'Double Digits', description: 'Reach 10 total habit completions', iconKey: '🔟', category: 'volume' },
  { name: 'Quarter Century', description: 'Reach 25 total habit completions', iconKey: '🎯', category: 'volume' },
  { name: 'Half Century', description: 'Reach 50 total habit completions', iconKey: '🏅', category: 'volume' },
  { name: 'Century Club', description: 'Reach 100 total habit completions', iconKey: '💯', category: 'volume' },
  { name: 'Legend 150', description: 'Reach 150 total habit completions', iconKey: '⭐', category: 'volume' },
  { name: 'Habit Master', description: 'Reach 500 total habit completions', iconKey: '🎖️', category: 'volume' },

  // MILESTONE & DEFENSE BADGES (3) - Requires specific effort & defense
  { name: 'Weekend Warrior', description: 'Complete habits on both Saturday and Sunday', iconKey: '⚔️', category: 'streak' },
  { name: 'Freeze Defender', description: 'Deploy a streak freeze to protect a streak', iconKey: '🧊', category: 'engagement' },
  { name: 'Shield Master', description: 'Use 3 streak freezes to protect your habits', iconKey: '🛡️', category: 'engagement' },
];

async function main() {
  console.log('Seeding 15 curated high-effort reward badges into Prisma database...');
  
  const validNames = BADGES.map((b) => b.name);

  // 1. Clean up orphaned UserBadge rows & deleted badges seamlessly
  const outdatedBadges = await prisma.badge.findMany({
    where: { name: { notIn: validNames } },
  });

  if (outdatedBadges.length > 0) {
    console.log(`Cleaning up ${outdatedBadges.length} outdated/pruned badges...`);
    const outdatedIds = outdatedBadges.map((b) => b.id);

    await prisma.userBadge.deleteMany({
      where: { badgeId: { in: outdatedIds } },
    });

    await prisma.badge.deleteMany({
      where: { id: { in: outdatedIds } },
    });

    console.log('Successfully pruned outdated badges & cleaned orphaned UserBadge rows.');
  }

  // 2. Upsert the 15 curated badges
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        iconKey: badge.iconKey,
        category: badge.category,
      },
      create: badge,
    });
  }

  const finalCount = await prisma.badge.count();
  console.log(`Successfully seeded ${finalCount} curated reward badges!`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
