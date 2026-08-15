import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@trackmyhabits/database';

// Supported Gemini Models (falling back automatically)
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash'];

// GET: Retrieve user's persisted chat history
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Failed to fetch chat history:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: Send message, generate Gemini grounded response, persist chat history
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Save User Message to Prisma ChatMessage
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: prompt.trim(),
      },
    });

    // 2. Fetch User Profile, Habits, Logs, and Badges for Data Grounding
    const [user, habits, userBadges] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.habit.findMany({
        where: { userId },
        include: {
          logs: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { unlockedAt: 'desc' },
      }),
    ]);

    // 3. Compute Real Habit Stats & Continuation Likelihood
    const habitStats = habits.map((habit) => {
      const totalLogs = habit.logs.length;
      const completedLogs = habit.logs.filter((l) => l.completed).length;
      const likelihoodPercent = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 50;

      let streak = 0;
      const sortedLogs = [...habit.logs].sort((a, b) => b.date.localeCompare(a.date));
      for (const log of sortedLogs) {
        if (log.completed || log.freezeUsed) {
          streak++;
        } else {
          break;
        }
      }

      return {
        title: habit.title,
        emoji: habit.emoji,
        frequency: habit.frequencyType,
        freezesRemaining: habit.freezesRemaining,
        currentStreak: streak,
        continuationLikelihood: `${likelihoodPercent}%`,
        recentCompletions: `${completedLogs}/${totalLogs} past check-ins`,
      };
    });

    const badgeList = userBadges.map((ub) => ({
      name: ub.badge.name,
      description: ub.badge.description,
      category: ub.badge.category,
      unlockedAt: ub.unlockedAt.toISOString().split('T')[0],
    }));

    // 4. Build Grounded System Context for Gemini
    const systemPromptContext = `
You are Rooney, an encouraging, witty, and intelligent AI habit companion inside the TrackMyHabits app.
Your tone is friendly, constructive, and grounded strictly in the user's real habit data provided below.

USER PROFILE:
- Name: ${user?.name || 'Habit Builder'}
- Profile Completeness: ${user?.profileCompleteness || 0}%

USER REAL HABITS & STATISTICS:
${JSON.stringify(habitStats, null, 2)}

USER UNLOCKED BADGES (${badgeList.length} total):
${JSON.stringify(badgeList, null, 2)}

GUIDELINES FOR YOUR RESPONSES:
1. When asked about streak-improvement tips: analyze their lowest likelihood habits and give specific actionable advice.
2. When asked about habit continuation likelihood: quote their exact computed percentages (e.g. ${habitStats.map(h => `${h.title}: ${h.continuationLikelihood}`).join(', ')}).
3. When asked for new habit suggestions: recommend 2-3 complimentary habits that naturally fit alongside their current habits (${habits.map(h => h.title).join(', ')}).
4. When asked "what badges have I won": list their actual unlocked badges (${badgeList.map(b => b.name).join(', ')}). If they have zero, encourage them on how to earn their first one.
5. Keep answers concise, highly engaging, formatted nicely with markdown bullet points and emojis.
`;

    // 5. Check GEMINI_API_KEY from process.env ONLY
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      const honestNoKeyReply = `Gemini API key isn't configured yet. Please add your GEMINI_API_KEY to apps/frontend/.env.local to enable live AI responses! 🔑\n\nIn the meantime, here is your habit likelihood summary based on your real logs:\n${habitStats.map(h => `• **${h.title}**: ${h.continuationLikelihood} continuation likelihood`).join('\n')}`;

      await prisma.chatMessage.create({
        data: {
          userId,
          role: 'assistant',
          content: honestNoKeyReply,
        },
      });

      const updatedMessages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        success: true,
        messages: updatedMessages,
        reply: honestNoKeyReply,
      });
    }

    // 6. Call Gemini REST API with model fallbacks
    let assistantReply = '';
    let apiSuccess = false;

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPromptContext}\n\nUser Message: ${prompt.trim()}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            assistantReply = candidateText.trim();
            apiSuccess = true;
            break;
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          console.warn(`Model ${modelName} returned status ${response.status}:`, errJson);
        }
      } catch (mErr) {
        console.warn(`Error calling model ${modelName}:`, mErr);
      }
    }

    if (!apiSuccess || !assistantReply) {
      assistantReply = generateGroundedFallbackReply(prompt, habitStats, badgeList, user?.name);
    }

    // 7. Save Assistant Response to Prisma ChatMessage
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: assistantReply,
      },
    });

    // 8. Return updated chat history
    const updatedMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      messages: updatedMessages,
      reply: assistantReply,
    });
  } catch (err: any) {
    console.error('Failed in AI Chat route:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}

// Fallback response engine grounded in real data when API key call fails
function generateGroundedFallbackReply(
  prompt: string,
  habitStats: any[],
  badgeList: any[],
  userName?: string | null
): string {
  const p = prompt.toLowerCase();

  if (p.includes('badge') || p.includes('won') || p.includes('unlocked')) {
    if (badgeList.length === 0) {
      return `Hey ${userName || 'friend'}! You haven't unlocked any badges yet, but you're super close! Complete your habits today to earn your very first consistency badge! 🏆`;
    }
    const names = badgeList.map((b) => `• **${b.name}**: ${b.description}`).join('\n');
    return `Here are the real badges you've unlocked so far (${badgeList.length} total):\n\n${names}\n\nKeep going to unlock even more badges! 🌟`;
  }

  if (p.includes('likelihood') || p.includes('continuation') || p.includes('probability')) {
    if (habitStats.length === 0) {
      return `You don't have any active habits created yet! Create a habit first so I can calculate your continuation likelihood! ⚡`;
    }
    const lines = habitStats
      .map(
        (h) =>
          `• **${h.emoji} ${h.title}**: ${h.continuationLikelihood} continuation likelihood (${h.recentCompletions}, current streak: ${h.currentStreak} days)`
      )
      .join('\n');
    return `Based on your real check-in history over the past 30 days, here is your habit continuation likelihood:\n\n${lines}\n\nMaintain your daily check-ins to boost your likelihood score! 🚀`;
  }

  if (p.includes('tip') || p.includes('streak') || p.includes('improve')) {
    const lowest = habitStats.sort((a, b) => parseInt(a.continuationLikelihood) - parseInt(b.continuationLikelihood))[0];
    if (lowest) {
      return `Here's a targeted streak-improvement tip for **${lowest.emoji} ${lowest.title}** (currently at ${lowest.continuationLikelihood} consistency):\n\n1. **Set a fixed time trigger**: Link this habit to an existing routine.\n2. **Use Streak Freezes wisely**: You have ${lowest.freezesRemaining} freezes left.\n3. **Start small**: Aim for 5 minutes of effort today to keep your streak alive! 💪`;
    }
    return `To improve your streaks, focus on completing habits at the same time every day and leverage your 3 daily streak freezes when life gets busy! 🛡️`;
  }

  if (p.includes('suggest') || p.includes('new habit') || p.includes('recommend')) {
    return `Based on your current routine, here are 3 great habits to add next:\n\n• 💧 **Daily Hydration**: Drink 2L of water daily.\n• 📚 **10-Min Reading**: Read 5 pages before bed.\n• 🧘 **Mindful Breathing**: 3 minutes of deep breathing every morning.`;
  }

  return `Hey ${userName || 'there'}! I'm Rooney, your AI habit companion! I can help you with:\n\n• 📊 **Habit Continuation Likelihood** (calculated from your real log history)\n• 🏆 **Unlocked Badges** (pulled directly from your profile)\n• 💡 **Streak-Improvement Tips**\n• ⚡ **New Habit Suggestions**`;
}
