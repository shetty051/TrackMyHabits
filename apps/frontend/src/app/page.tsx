'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import Rooney, { RooneyMode } from '../components/rooney/Rooney';
import { RooneyExpression } from '../components/rooney/RooneyExpressions';
import DashboardShell from '../components/layout/DashboardShell';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Circle,
  HelpCircle,
  TrendingUp,
  Award,
  Calendar,
  CheckSquare,
  Shield,
  Flame,
  Bot,
} from 'lucide-react';

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

interface Habit {
  id: string;
  title: string;
  emoji: string;
  color: string;
  frequencyType: string;
  specificDays?: string | null;
  freezesRemaining: number;
  createdAt: string;
  logs?: HabitLog[];
}

function isHabitDueOnDate(habit: Habit, dateObj: Date): boolean {
  if (habit.frequencyType === 'daily') return true;

  if (habit.frequencyType === 'specific-days') {
    if (!habit.specificDays) return true;
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = days[dateObj.getDay()];
    return habit.specificDays.toUpperCase().includes(currentDay);
  }

  if (habit.frequencyType === 'alternate') {
    const created = new Date(habit.createdAt);
    const diffTime = Math.abs(dateObj.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % 2 === 0;
  }

  return true;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isIntroQuery = searchParams.get('intro') === 'true';
  const [triggerIntro, setTriggerIntro] = useState(isIntroQuery);
  const [rooneyMode, setRooneyMode] = useState<RooneyMode>(isIntroQuery ? 'prominent' : 'idle');
  const [tutorialOverlayActive, setTutorialOverlayActive] = useState<boolean>(false);

  // Habits Data & Metrics State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('');

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard habits', err);
    } finally {
      setLoadingHabits(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchHabits();
      fetch('/api/user/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.name) {
              setUserName(data.user.name);
            }
            const seen = !!data.user.hasSeenIntroTutorial;
            setHasSeenTutorial(seen);
            if (!seen || searchParams.get('intro') === 'true') {
              setTriggerIntro(true);
              setRooneyMode('prominent');
            }
          }
        })
        .catch((err) => console.error('Failed to fetch user profile for tutorial check', err));
    }
  }, [status, searchParams]);

  const toggleRooneyMode = () => {
    setRooneyMode((prev) => (prev === 'idle' ? 'prominent' : 'idle'));
  };

  // Toggle Habit Completion Log for Today
  const handleToggleHabitLog = async (habitId: string) => {
    setTogglingId(habitId);
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayISO }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle habit log');
      }

      const data = await res.json();
      await fetchHabits();

      // Trigger Rooney celebration if badge was newly unlocked
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        const newest = data.newlyUnlocked[0];
        window.dispatchEvent(
          new CustomEvent('rooney-speak', {
            detail: {
              text: `Congrats! You unlocked the "${newest.name}" ${newest.iconKey} badge! Keep crushing it! 🎉`,
              expression: RooneyExpression.CELEBRATORY,
              mode: 'prominent',
            },
          })
        );
      } else if (data.completed) {
        // Trigger Standard Celebratory Rooney speech if checked
        window.dispatchEvent(
          new CustomEvent('rooney-speak', {
            detail: {
              text: "Great job ticking that habit off! You're building solid momentum today! 🔥",
              expression: RooneyExpression.CELEBRATORY,
            },
          })
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // Dates & Metrics Computation
  const todayObj = new Date();
  const todayISO = todayObj.toISOString().split('T')[0];

  const dueHabitsToday = habits.filter((h) => isHabitDueOnDate(h, todayObj));
  const completedTodayHabits = dueHabitsToday.filter((h) =>
    h.logs?.some((l) => l.date === todayISO && l.completed)
  );

  const totalDueTodayCount = dueHabitsToday.length;
  const completedTodayCount = completedTodayHabits.length;
  const todayCompletionPct =
    totalDueTodayCount > 0 ? Math.round((completedTodayCount / totalDueTodayCount) * 100) : 0;

  // Calculate 7-Day Rolling Daily Average
  const calculateRollingAverage = (): number => {
    if (habits.length === 0) return 0;

    let totalPossible = 0;
    let totalCompleted = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dISO = d.toISOString().split('T')[0];

      habits.forEach((h) => {
        if (isHabitDueOnDate(h, d)) {
          totalPossible++;
          if (h.logs?.some((l) => l.date === dISO && l.completed)) {
            totalCompleted++;
          }
        }
      });
    }

    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };

  const rollingAveragePct = calculateRollingAverage();

  // Calculate All-Habits Completion Streak (consecutive 100% completed days)
  const calculateAllHabitsStreak = (): number => {
    if (habits.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    const dueToday = habits.filter((h) => isHabitDueOnDate(h, today));
    let startDayOffset = 0;

    if (dueToday.length > 0) {
      const completedToday = dueToday.filter((h) =>
        h.logs?.some((l) => l.date === todayISO && l.completed)
      );

      if (completedToday.length === dueToday.length) {
        streak++;
        startDayOffset = 1;
      } else {
        startDayOffset = 1;
      }
    } else {
      startDayOffset = 1;
    }

    for (let i = startDayOffset; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dISO = d.toISOString().split('T')[0];

      const dueOnDay = habits.filter((h) => isHabitDueOnDate(h, d));
      if (dueOnDay.length === 0) {
        continue;
      }

      const completedOnDay = dueOnDay.filter((h) =>
        h.logs?.some((l) => l.date === dISO && l.completed)
      );

      if (completedOnDay.length === dueOnDay.length) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const allHabitsStreak = calculateAllHabitsStreak();

  // If authenticated, render within DashboardShell
  if (status === 'authenticated' && session) {
    return (
      <DashboardShell
        rooneyMode={rooneyMode}
        onRooneyModeChange={(newMode) => setRooneyMode(newMode)}
        showIntroOnLoad={triggerIntro}
        tutorialActive={tutorialOverlayActive}
        onTutorialClose={() => setTutorialOverlayActive(false)}
        onIntroComplete={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('tmh_tutorial_active', 'true');
            sessionStorage.setItem('tmh_tutorial_step', '0');
          }
          setTriggerIntro(false);
          setRooneyMode('idle');
          setTutorialOverlayActive(true);
          fetch('/api/user/tutorial-complete', { method: 'POST' }).catch(console.error);
          setHasSeenTutorial(true);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Welcome Header */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem 2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--secondary-accent-alpha)',
                  color: 'var(--secondary-accent)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                }}
              >
                <CheckCircle2 size={14} /> Welcome Back
              </div>
              <h2 className="responsive-title" style={{ fontWeight: 800, color: 'var(--text)' }}>
                Hello, {userName || (session.user?.name && session.user.name !== 'User' ? session.user.name : '') || 'Habit Master'} 👋
              </h2>
              <p className="responsive-subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Here is your daily habit overview for today.
              </p>
            </div>

            {/* Test Rooney & Tutorial Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/?tutorial=true')}
                style={{
                  padding: '0.65rem 1.1rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary-accent)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <HelpCircle size={15} /> Guided Tutorial
              </button>

              <button
                onClick={() => {
                  setRooneyMode('prominent');
                  window.dispatchEvent(
                    new CustomEvent('rooney-speak', {
                      detail: {
                        text: "Hey! I'm Rooney, your AI habit companion! How can I help you build better routines today?",
                        expression: 'ENCOURAGING',
                        mode: 'prominent',
                      },
                    })
                  );
                }}
                style={{
                  padding: '0.65rem 1.1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--secondary-accent-alpha)',
                  color: 'var(--secondary-accent)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Bot size={16} /> AI Mode
              </button>
            </div>
          </div>

          {/* Quick Stats Grid computed from REAL database entries */}
          <div
            id="stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <StatBox
              title="Today's Completion"
              value={`${todayCompletionPct}%`}
              sub={`${completedTodayCount} of ${totalDueTodayCount} Habits Done`}
              icon={<Award size={20} />}
            />
            <StatBox
              title="Rolling 7-Day Average"
              value={`${rollingAveragePct}%`}
              sub="Consistency Score"
              icon={<TrendingUp size={20} />}
            />
            <StatBox
              title="All-Habits Streak"
              value={`${allHabitsStreak} ${allHabitsStreak === 1 ? 'Day' : 'Days'}`}
              sub="Consecutive 100% Days"
              icon={<Flame size={20} />}
            />
          </div>

          {/* Today's To-Do List Section */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              borderRadius: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
                  Today's Habit Checklist
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {todayObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--secondary-accent-alpha)',
                  color: 'var(--secondary-accent)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {todayCompletionPct === 100 ? (
                  <>
                    <CheckCircle2 size={16} /> All Completed! 🎉
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> {completedTodayCount}/{totalDueTodayCount} Done
                  </>
                )}
              </div>
            </div>

            {/* Habits Due Today List */}
            {loadingHabits ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading today's habits...
              </div>
            ) : dueHabitsToday.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <CheckSquare size={32} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>No habits scheduled for today.</p>
                <Link
                  href="/habits"
                  style={{
                    color: 'var(--secondary-accent)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'underline',
                  }}
                >
                  Manage Your Habit Schedules →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {dueHabitsToday.map((habit) => {
                  const isCompleted = habit.logs?.some(
                    (l) => l.date === todayISO && l.completed
                  );
                  const isToggling = togglingId === habit.id;

                  return (
                    <div
                      key={habit.id}
                      onClick={() => !isToggling && handleToggleHabitLog(habit.id)}
                      style={{
                        padding: '1.1rem 1.35rem',
                        borderRadius: '14px',
                        backgroundColor: isCompleted
                          ? 'var(--secondary-accent-alpha)'
                          : 'var(--surface-hover)',
                        border: `1.5px solid ${isCompleted ? 'var(--secondary-accent)' : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                          type="button"
                          aria-label={`Toggle habit ${habit.title}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isCompleted ? 'var(--secondary-accent)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={24} style={{ fill: 'var(--secondary-accent)', color: '#FFFFFF' }} />
                          ) : (
                            <Circle size={24} />
                          )}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{habit.emoji}</span>
                          <div>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                color: 'var(--text)',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                opacity: isCompleted ? 0.75 : 1,
                              }}
                            >
                              {habit.title}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Schedule: <strong style={{ textTransform: 'capitalize' }}>{habit.frequencyType}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Shield size={14} style={{ color: 'var(--secondary-accent)' }} />
                        <span>{habit.freezesRemaining} Freezes Left</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Unauthenticated Landing Page View
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 20%, var(--secondary-accent-alpha) 0%, transparent 60%)',
      }}
    >
      <ThemeToggle fixed />

      <div
        className="glass-panel"
        style={{
          maxWidth: '820px',
          width: '100%',
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--secondary-accent-alpha)',
            border: '1px solid var(--border-color)',
            color: 'var(--secondary-accent)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          <Sparkles size={16} /> TrackMyHabits
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1
            style={{
              fontSize: '3.25rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--text) 30%, var(--secondary-accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Master Your Daily Habits, Transform Your Life
          </h1>

          <p
            style={{
              fontSize: '1.2rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            Build consistency with custom schedules, streak freeze protections, dynamic badges, and Rooney — your interactive habit companion.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <Link
            href="/signup"
            style={{
              padding: '1rem 2.25rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--primary-accent)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1.1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              textDecoration: 'none',
            }}
          >
            Start Your Journey <ArrowRight size={20} />
          </Link>

          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: 'var(--secondary-accent)',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Log in here
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}

function StatBox({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '16px',
        backgroundColor: 'var(--surface-hover)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
        {icon && <span style={{ color: 'var(--secondary-accent)' }}>{icon}</span>}
      </div>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary-accent)' }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</span>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
