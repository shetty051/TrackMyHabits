import { NextResponse } from 'next/server';
import { prisma } from '@trackmyhabits/database';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, age, sex } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
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

    // Calculate profile completeness
    let completeness = 20; // Base completion for email+password
    if (name) completeness += 20;
    if (age) completeness += 30;
    if (sex) completeness += 30;

    // Create user record in database
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name || null,
        age: age ? parseInt(age, 10) : null,
        sex: sex || null,
        themePreference: 'dark',
        profileCompleteness: completeness,
      },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        sex: true,
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
