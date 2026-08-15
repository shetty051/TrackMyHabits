import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@trackmyhabits/database';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure target uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Calculate updated profile completeness
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let completeness = 20; // Email base
    if (user?.name) completeness += 20;
    if (user?.age) completeness += 20;
    if (user?.sex) completeness += 20;
    if (avatarUrl) completeness += 20;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        profileCompleteness: completeness,
      },
    });

    return NextResponse.json(
      {
        message: 'Avatar uploaded successfully',
        avatarUrl,
        profileCompleteness: updatedUser.profileCompleteness,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
