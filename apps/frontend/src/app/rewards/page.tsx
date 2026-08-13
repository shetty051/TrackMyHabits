'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { RooneyExpression } from '../../components/rooney/RooneyExpressions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  X,
  Flame,
  Zap,
  Shield,
  Calendar,
  Clock,
} from 'lucide-react';

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  category: 'streak' | 'engagement' | 'volume';
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function RewardsPage() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/rewards');
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);

        // Real-Time Rooney Celebration if new badges were unlocked
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
        }
      }
    } catch (err) {
      console.error('Failed to fetch rewards', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const filteredBadges =
    activeCategory === 'all'
      ? badges
      : badges.filter((b) => b.category === activeCategory);

  return (
    <DashboardShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header Summary Card */}
        <header
          id="rewards-overview"
          className="glass-panel"
          style={{
            padding: '2rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            borderRadius: '20px',
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
              <Award size={14} /> Rewards & Trophies
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>
              Badge Showcase
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Earn badges by completing habits, maintaining streaks, and hitting volume milestones.
            </p>
          </div>

          {/* Unlocked Counter Pill */}
          <div
            style={{
              padding: '1rem 1.75rem',
              borderRadius: '16px',
              backgroundColor: 'var(--surface-hover)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary-accent-alpha)',
                color: 'var(--secondary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--secondary-accent)' }}>
                {unlockedCount} / {badges.length}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Badges Unlocked
              </div>
            </div>
          </div>
        </header>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Badges (${badges.length})` },
            { id: 'streak', label: 'Streak Badges' },
            { id: 'engagement', label: 'Engagement & Defense' },
            { id: 'volume', label: 'Volume Milestones' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '9999px',
                border: activeCategory === tab.id ? 'none' : '1px solid var(--border-color)',
                backgroundColor:
                  activeCategory === tab.id ? 'var(--primary-accent)' : 'var(--surface-card)',
                color: activeCategory === tab.id ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 30 Seeded Badges Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading reward badges...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '1rem',
            }}
          >
            {filteredBadges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedBadge(badge)}
                className="glass-panel"
                style={{
                  padding: '1.5rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.85rem',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  border: badge.unlocked
                    ? '1.5px solid var(--secondary-accent)'
                    : '1px solid var(--border-color)',
                  backgroundColor: badge.unlocked
                    ? 'var(--surface-card)'
                    : 'var(--surface-hover)',
                  opacity: badge.unlocked ? 1 : 0.55,
                  filter: badge.unlocked ? 'none' : 'grayscale(90%)',
                  boxShadow: badge.unlocked
                    ? '0 8px 24px var(--secondary-accent-alpha)'
                    : 'none',
                }}
              >
                {/* Badge Icon / Emoji Avatar */}
                <div
                  style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: badge.unlocked
                      ? 'var(--secondary-accent-alpha)'
                      : 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    boxShadow: badge.unlocked
                      ? '0 0 20px var(--secondary-accent-alpha)'
                      : 'none',
                  }}
                >
                  {badge.iconKey}
                  {!badge.unlocked && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        backgroundColor: 'var(--surface-card)',
                        borderRadius: '50%',
                        padding: '3px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Lock size={14} />
                    </div>
                  )}
                </div>

                {/* Badge Title & Category Tag */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' }}>
                    {badge.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: badge.unlocked ? 'var(--secondary-accent)' : 'var(--text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {badge.category}
                  </span>
                </div>

                {/* Unlocked Status Indicator */}
                {badge.unlocked ? (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--secondary-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <CheckCircle2 size={13} /> Unlocked
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</div>
                )}
              </motion.div>
            ))}

            {/* End Card: "More reward badges are on their way… stay tuned…" */}
            <motion.div
              className="glass-panel"
              style={{
                padding: '1.5rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '0.75rem',
                borderRadius: '18px',
                border: '1px dashed var(--border-color)',
                backgroundColor: 'transparent',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--secondary-accent-alpha)',
                  color: 'var(--secondary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={22} />
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                Coming Soon!
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                More reward badges are on their way… stay tuned…
              </p>
            </motion.div>
          </div>
        )}

        {/* Framer Motion Smooth Expanding Badge Detail Modal */}
        <AnimatePresence>
          {selectedBadge && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
              onClick={() => setSelectedBadge(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{
                  maxWidth: '440px',
                  width: '100%',
                  padding: '2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '1.25rem',
                  borderRadius: '24px',
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 20px 50px var(--shadow-color)',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setSelectedBadge(null)}
                  style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>

                {/* Badge Icon Avatar */}
                <div
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    backgroundColor: selectedBadge.unlocked
                      ? 'var(--secondary-accent-alpha)'
                      : 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    boxShadow: selectedBadge.unlocked
                      ? '0 0 30px var(--secondary-accent-alpha)'
                      : 'none',
                  }}
                >
                  {selectedBadge.iconKey}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)' }}>
                    {selectedBadge.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: selectedBadge.unlocked ? 'var(--secondary-accent)' : 'var(--text-muted)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {selectedBadge.category} Category
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  "{selectedBadge.description}"
                </p>

                {/* Unlocked Timestamp Status */}
                <div
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    backgroundColor: selectedBadge.unlocked
                      ? 'var(--secondary-accent-alpha)'
                      : 'var(--surface-hover)',
                    border: `1px solid ${selectedBadge.unlocked ? 'var(--secondary-accent)' : 'var(--border-color)'}`,
                    color: selectedBadge.unlocked ? 'var(--secondary-accent)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {selectedBadge.unlocked ? (
                    <>
                      <CheckCircle2 size={16} /> Earned on{' '}
                      {new Date(selectedBadge.unlockedAt!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Locked — Complete criteria to unlock
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
