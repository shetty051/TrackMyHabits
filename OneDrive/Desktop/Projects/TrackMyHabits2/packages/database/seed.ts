import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BADGES = [
  // STREAK-BASED (10)
  { name: 'First Step', description: 'Log your very first habit completion', iconKey: '🌱', category: 'streak' },
  { name: '3-Day Spark', description: 'Maintain a 3-day completion streak', iconKey: '⚡', category: 'streak' },
  { name: '7-Day Flame', description: 'Maintain a 7-day completion streak', iconKey: '🔥', category: 'streak' },
  { name: '14-Day Momentum', description: 'Maintain a 14-day completion streak', iconKey: '🚀', category: 'streak' },
  { name: '21-Day Habit Builder', description: 'Maintain a 21-day completion streak', iconKey: '🧱', category: 'streak' },
  { name: '30-Day Master', description: 'Maintain a 30-day completion streak', iconKey: '👑', category: 'streak' },
  { name: '60-Day Titan', description: 'Maintain a 60-day completion streak', iconKey: '🛡️', category: 'streak' },
  { name: '90-Day Legend', description: 'Maintain a 90-day completion streak', iconKey: '🏆', category: 'streak' },
  { name: 'Weekend Warrior', description: 'Complete habits on both Saturday and Sunday', iconKey: '⚔️', category: 'streak' },
  { name: 'Daily Devotee', description: 'Log habits every single day of the week', iconKey: '🌟', category: 'streak' },

  // ENGAGEMENT-BASED (10)
  { name: 'Profile Perfectionist', description: 'Reach 100% user profile completeness', iconKey: '👤', category: 'engagement' },
  { name: 'Architect', description: 'Create your very first custom habit', iconKey: '✍️', category: 'engagement' },
  { name: 'Multi-Tracker', description: 'Create 3 or more active habits', iconKey: '📊', category: 'engagement' },
  { name: 'Habit Collector', description: 'Create 5 or more custom habits', iconKey: '🗂️', category: 'engagement' },
  { name: 'Freeze Defender', description: 'Deploy your first streak freeze to save a streak', iconKey: '🧊', category: 'engagement' },
  { name: 'Shield Master', description: 'Use 3 streak freezes to protect your habits', iconKey: '🛡️', category: 'engagement' },
  { name: 'Onboarding Graduate', description: 'Complete the initial 6-step onboarding cards', iconKey: '🎓', category: 'engagement' },
  { name: 'Night Owl', description: 'Log a habit during evening hours', iconKey: '🌙', category: 'engagement' },
  { name: 'Early Bird', description: 'Log a habit before 9 AM', iconKey: '🌅', category: 'engagement' },
  { name: 'Theme Master', description: 'Toggle between dark and light themes', iconKey: '🎨', category: 'engagement' },

  // VOLUME-BASED (10)
  { name: 'High Five', description: 'Reach 5 total habit completions', iconKey: '🖐️', category: 'volume' },
  { name: 'Double Digits', description: 'Reach 10 total habit completions', iconKey: '🔟', category: 'volume' },
  { name: 'Quarter Century', description: 'Reach 25 total habit completions', iconKey: '🎯', category: 'volume' },
  { name: 'Half Century', description: 'Reach 50 total habit completions', iconKey: '🏅', category: 'volume' },
  { name: 'Century Club', description: 'Reach 100 total habit completions', iconKey: '💯', category: 'volume' },
  { name: 'Legend 150', description: 'Reach 150 total habit completions', iconKey: '⭐', category: 'volume' },
  { name: 'Double Century', description: 'Reach 200 total habit completions', iconKey: '💎', category: 'volume' },
  { name: 'Consistency Crusader', description: 'Achieve 30 habit completions in a single month', iconKey: '🤺', category: 'volume' },
  { name: 'Habit Warrior', description: 'Reach 40 total habit completions', iconKey: '🗡️', category: 'volume' },
  { name: 'Habit Master', description: 'Reach 500 total habit completions', iconKey: '🎖️', category: 'volume' },
];

async function main() {
  console.log('Seeding 30 reward badges into Prisma database...');
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
  console.log('Successfully seeded 30 reward badges!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
