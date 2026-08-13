import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@trackmyhabits/database';

function calculateCompleteness(user: any): number {
  let score = 20; // Email base
  if (user.name && user.name.trim().length > 0) score += 20;
  if (user.age && user.age > 0) score += 20;
  if (user.sex && user.sex.trim().length > 0) score += 20;
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) score += 20;
  return Math.min(100, score);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        sex: true,
        avatarUrl: true,
        themePreference: true,
        profileCompleteness: true,
        createdAt: true,
        userBadges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const completeness = calculateCompleteness(user);

    return NextResponse.json({
      user: {
        ...user,
        profileCompleteness: completeness,
      },
      unlockedBadges: user.userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        iconKey: ub.badge.iconKey,
        category: ub.badge.category,
        unlocked: true,
        unlockedAt: ub.unlockedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, age, sex } = await req.json();

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedData = {
      ...(name !== undefined ? { name } : {}),
      ...(age !== undefined ? { age: Number(age) || null } : {}),
      ...(sex !== undefined ? { sex } : {}),
    };

    const merged = { ...currentUser, ...updatedData };
    const completeness = calculateCompleteness(merged);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updatedData,
        profileCompleteness: completeness,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
      profileCompleteness: completeness,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
