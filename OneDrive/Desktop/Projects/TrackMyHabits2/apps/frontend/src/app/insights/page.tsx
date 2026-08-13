'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Award,
  Lightbulb,
  CheckSquare,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface TimelineItem {
  date: string;
  label: string;
  completedCount: number;
  dueCount: number;
  percentage: number;
}

interface HabitBreakdownItem {
  id: string;
  title: string;
  emoji: string;
  color: string;
  rate: number;
  completedCount: number;
  dueCount: number;
}

interface InsightsData {
  hasData: boolean;
  message?: string;
  consistencyScore?: number;
  tierName?: string;
  tierDesc?: string;
  tierColor?: string;
  timelineData?: TimelineItem[];
  habitBreakdown?: HabitBreakdownItem[];
  actionableTips?: string[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/insights');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch insights', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <DashboardShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            Insights & Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Recency-weighted consistency metrics and data-driven recommendations.
          </p>
        </header>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Calculating consistency score...
          </div>
        ) : !data?.hasData ? (
          /* Genuine Empty State for Users without Habit Log Data */
          <div
            className="glass-panel"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              borderRadius: '20px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: 'var(--secondary-accent-alpha)',
                color: 'var(--secondary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={32} />
            </div>

            <div style={{ maxWidth: '440px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
                No Analytics Data Yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {data?.message || 'Analytics will be visible once you start doing your habits.'}
              </p>
            </div>

            <Link
              href="/"
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--primary-accent)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              Go to Dashboard & Track Habits <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Real Analytics Data View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Grid: Consistency Score Gauge + Tier Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Score Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                  borderRadius: '20px',
                }}
              >
                {/* Circular Score Gauge */}
                <div
                  style={{
                    position: 'relative',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: `conic-gradient(${data.tierColor} ${
                      (data.consistencyScore || 0) * 3.6
                    }deg, var(--surface-hover) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 20px ${data.tierColor}33`,
                  }}
                >
                  <div
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--surface-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>
                      {data.consistencyScore}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Score
                    </span>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: `${data.tierColor}20`,
                      color: data.tierColor,
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {data.tierName}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                    Consistency Rating
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {data.tierDesc}
                  </p>
                </div>
              </div>

              {/* Actionable AI Insights Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderRadius: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-accent)' }}>
                  <Lightbulb size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                    Data-Driven Insights
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.actionableTips?.map((tip, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--surface-hover)',
                        borderLeft: '4px solid var(--secondary-accent)',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.45,
                      }}
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 14-Day Completion Trend Timeline Bar Chart */}
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                    14-Day Completion Trend
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Daily percentage of scheduled habits completed.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary-accent)', fontWeight: 700, fontSize: '0.85rem' }}>
                  <TrendingUp size={16} /> Past 2 Weeks
                </div>
              </div>

              {/* Custom SVG Bar Chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '180px', paddingTop: '1rem' }}>
                {data.timelineData?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {/* Hover Tooltip Label */}
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {item.percentage}%
                    </span>

                    {/* Bar */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${Math.max(8, item.percentage)}%`,
                        borderRadius: '6px 6px 2px 2px',
                        backgroundColor:
                          item.percentage >= 80
                            ? 'var(--secondary-accent)'
                            : item.percentage >= 50
                            ? 'var(--primary-accent)'
                            : 'var(--surface-hover)',
                        transition: 'height 0.4s ease',
                      }}
                    />

                    {/* X-Axis Date Label */}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Habit Consistency Breakdown */}
            <div
              className="glass-panel"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                borderRadius: '20px',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                Per-Habit Consistency (30 Days)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.habitBreakdown?.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-hover)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>{h.emoji}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {h.title}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: h.color, fontSize: '0.9rem' }}>
                        {h.rate}% Rate ({h.completedCount}/{h.dueCount} Done)
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--border-color)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${h.rate}%`,
                          height: '100%',
                          backgroundColor: h.color,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
