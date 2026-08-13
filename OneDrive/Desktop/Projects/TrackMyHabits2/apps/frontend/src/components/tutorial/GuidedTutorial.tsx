'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { RooneyExpression, ROONEY_EXPRESSIONS } from '../rooney/RooneyExpressions';
import { Sparkles, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2 } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  text: string;
  expression: RooneyExpression;
  route?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'nav-sidebar',
    title: 'Navigation Menu',
    text: "Here's your navigation menu! Toggle between Dashboard, My Habits, Insights, Rewards, and Profile anytime.",
    expression: RooneyExpression.POINTING,
    position: 'right',
  },
  {
    targetId: 'stats-grid',
    title: 'Habit Overview & Freezes',
    text: 'Check out your active habits and streak freeze bank here. You start with 3 freezes to protect your streaks!',
    expression: RooneyExpression.POINTING_2,
    position: 'top',
  },
  {
    targetId: 'header-actions',
    title: 'Themes & Notifications',
    text: 'Switch between dark and light themes here, and keep an eye on your alert notifications!',
    expression: RooneyExpression.ENCOURAGING,
    position: 'bottom',
  },
  {
    targetId: 'create-habit-btn',
    title: 'Create Your First Custom Habit',
    text: "Now let me show you how to create your first custom habit! Click 'Add New Habit' to open the creation form.",
    expression: RooneyExpression.CELEBRATORY,
    route: '/habits',
    position: 'bottom',
  },
];

interface GuidedTutorialProps {
  active: boolean;
  onComplete: () => void;
}

export default function GuidedTutorial({ active, onComplete }: GuidedTutorialProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TUTORIAL_STEPS[currentStepIdx];

  // Synchronize target DOM element position
  useEffect(() => {
    if (!active) return;

    if (step?.route && pathname !== step.route) {
      router.push(step.route);
      return;
    }

    const updateRect = () => {
      if (step?.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        }
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 250);
    window.addEventListener('resize', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
    };
  }, [active, currentStepIdx, pathname, step, router]);

  if (!active) return null;

  const handleNextStep = () => {
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      const nextStep = TUTORIAL_STEPS[nextIdx];
      if (nextStep.route && pathname !== nextStep.route) {
        router.push(nextStep.route);
      }
      setCurrentStepIdx(nextIdx);
    } else {
      onComplete();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      const prevStep = TUTORIAL_STEPS[prevIdx];
      if (prevStep.route && pathname !== prevStep.route) {
        router.push(prevStep.route);
      }
      setCurrentStepIdx(prevIdx);
    }
  };

  const handleSkipClick = () => {
    setIsSkipping(true);
  };

  const handleConfirmSkip = () => {
    setIsSkipping(false);
    onComplete();
  };

  const handleResumeTutorial = () => {
    setIsSkipping(false);
  };

  const expressionUrl = isSkipping
    ? ROONEY_EXPRESSIONS[RooneyExpression.ROASTING]
    : ROONEY_EXPRESSIONS[step?.expression || RooneyExpression.NEUTRAL];

  // Calculate dynamic card style to position card OUTSIDE target element
  const getCardStyle = (): React.CSSProperties => {
    if (isSkipping || !targetRect) {
      return {
        position: 'fixed',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const pad = 16;
    const pos = step.position;

    switch (pos) {
      case 'right':
        return {
          position: 'fixed',
          left: `${targetRect.right + pad}px`,
          top: `${Math.max(80, targetRect.top + 60)}px`,
        };
      case 'top':
        return {
          position: 'fixed',
          bottom: `${window.innerHeight - targetRect.top + pad}px`,
          left: `${Math.max(20, targetRect.left + (targetRect.width / 2) - 210)}px`,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: `${targetRect.bottom + pad}px`,
          right: `${Math.max(20, window.innerWidth - targetRect.right)}px`,
        };
      case 'left':
        return {
          position: 'fixed',
          right: `${window.innerWidth - targetRect.left + pad}px`,
          top: `${targetRect.top}px`,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const pad = 6;
  const tTop = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const tLeft = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const tWidth = targetRect ? targetRect.width + pad * 2 : 0;
  const tHeight = targetRect ? targetRect.height + pad * 2 : 0;
  const tRight = targetRect ? targetRect.right + pad : 0;
  const tBottom = targetRect ? targetRect.bottom + pad : 0;

  return (
    <>
      {/* 4-Panel Hole-Punch Spotlight Overlay: Keeps target 100% UNBLURRED and sharp */}
      {targetRect && !isSkipping ? (
        <>
          {/* Top dark blurred panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${tTop}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          {/* Bottom dark blurred panel */}
          <div
            style={{
              position: 'fixed',
              top: `${tBottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          {/* Left dark blurred panel */}
          <div
            style={{
              position: 'fixed',
              top: `${tTop}px`,
              left: 0,
              width: `${tLeft}px`,
              height: `${tHeight}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          {/* Right dark blurred panel */}
          <div
            style={{
              position: 'fixed',
              top: `${tTop}px`,
              left: `${tRight}px`,
              right: 0,
              height: `${tHeight}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          {/* Glowing Green Highlight Border around the sharp target */}
          <div
            style={{
              position: 'fixed',
              top: `${tTop}px`,
              left: `${tLeft}px`,
              width: `${tWidth}px`,
              height: `${tHeight}px`,
              borderRadius: '14px',
              border: '2.5px solid var(--secondary-accent)',
              boxShadow: '0 0 28px var(--secondary-accent)',
              zIndex: 991,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        /* Full screen overlay during skip confirmation */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(5px)',
            zIndex: 990,
          }}
        />
      )}

      {/* Positioned Rooney Callout Overlay Card */}
      <div
        style={{
          ...getCardStyle(),
          zIndex: 995,
          pointerEvents: 'auto',
          maxWidth: '420px',
          width: '90%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isSkipping ? 'skipping' : currentStepIdx}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              borderRadius: '18px',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 16px 40px var(--shadow-color)',
            }}
          >
            {/* Callout Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--secondary-accent)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkles size={14} /> {isSkipping ? 'Rooney' : `Rooney`}
              </div>
              {!isSkipping && (
                <button
                  onClick={handleSkipClick}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Skip Tutorial
                </button>
              )}
            </div>

            {/* Content Body: Character Avatar + Dialogue Text */}
            <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '85px',
                  height: '120px',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 6px 12px var(--shadow-color))',
                }}
              >
                <Image
                  src={expressionUrl}
                  alt="Rooney Tutorial Expression"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  {isSkipping ? 'Hold up!' : step?.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {isSkipping
                    ? '"Okay genius. Are you sure you don\'t need a tutorial?"'
                    : `"${step?.text}"`}
                </p>
              </div>
            </div>

            {/* Actions / Buttons: Includes Back Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <div>
                {!isSkipping && currentStepIdx > 0 && (
                  <button
                    onClick={handlePrevStep}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {isSkipping ? (
                  <>
                    <button
                      onClick={handleResumeTutorial}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <RotateCcw size={15} /> Resume Tutorial
                    </button>
                    <button
                      onClick={handleConfirmSkip}
                      style={{
                        padding: '0.6rem 1.1rem',
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
                      Yes, I got this <CheckCircle2 size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNextStep}
                    style={{
                      padding: '0.6rem 1.25rem',
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
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    }}
                  >
                    {currentStepIdx < TUTORIAL_STEPS.length - 1 ? (
                      <>
                        Next Step <ChevronRight size={16} />
                      </>
                    ) : (
                      <>
                        Finish & Create Habit <Sparkles size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
