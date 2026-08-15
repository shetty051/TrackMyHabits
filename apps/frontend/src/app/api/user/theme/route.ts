import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@trackmyhabits/database';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { theme } = await req.json();

    if (!theme || (theme !== 'light' && theme !== 'dark')) {
      return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        themePreference: theme,
      },
    });

    return NextResponse.json(
      {
        message: 'Theme preference updated',
        themePreference: updatedUser.themePreference,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update theme error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update theme' },
      { status: 500 }
    );
  }
}
