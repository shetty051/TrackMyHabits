import { NextResponse } from 'next/server';
import { prisma } from '@trackmyhabits/database';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, themePreference } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Initial completeness is 20% for Email + Password
    const initialCompleteness = 20;

    // Create user record in Prisma DB (name, age, sex set in onboarding)
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: null,
        age: null,
        sex: null,
        themePreference: themePreference === 'dark' ? 'dark' : 'light',
        profileCompleteness: initialCompleteness,
      },
      select: {
        id: true,
        email: true,
        themePreference: true,
        profileCompleteness: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'User registered successfully', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
