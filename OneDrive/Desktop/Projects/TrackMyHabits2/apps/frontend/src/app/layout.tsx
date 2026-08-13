import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import AuthProvider from '../context/AuthProvider';
import React from 'react';

export const metadata = {
  title: 'TrackMyHabits - Monorepo Skeleton & Auth',
  description: 'Habit tracking application monorepo with Next.js, NestJS, Prisma, and NextAuth.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
