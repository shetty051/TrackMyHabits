'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { RooneyExpression, ROONEY_EXPRESSIONS } from '../rooney/RooneyExpressions';
import { Sparkles, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  text: string;
  expression: RooneyExpression;
  route: string;
  nextExpectedRoute?: string;
  requiresNavClick?: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'stats-grid',
    title: 'Dashboard Overview',
    text: 'Welcome! Here is your daily completion average and overall habits streak.',
    expression: RooneyExpression.POINTING_2,
    route: '/',
    position: 'bottom',
  },
  {
    targetId: 'habits-checklist',
    title: "Today's Habit Checklist",
    text: 'Click the checkmark circle next to any habit to instantly log completion for today!',
    expression: RooneyExpression.ENCOURAGING,
    route: '/',
    position: 'top',
  },
  {
    targetId: 'header-actions',
    title: 'Theme & Notifications',
    text: 'Toggle between dark and light modes here, and check your real-time notification badge alerts!',
    expression: RooneyExpression.WINK,
    route: '/',
    position: 'bottom',
  },
  {
    targetId: 'nav-sidebar',
    title: 'Navigation Sidebar',
    text: 'Use the sidebar anytime to jump between Dashboard, Insights, Rewards, and Profile!',
    expression: RooneyExpression.CELEBRATORY,
    route: '/',
    position: 'right',
  },
];

const CROSS_PAGE_LANDING_INDICES: number[] = [];

interface GuidedTutorialProps {
  active: boolean;
  onComplete: () => void;
}

export default function GuidedTutorial({ active, onComplete }: GuidedTutorialProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [overlayVisible, setOverlayVisible] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Responsive Viewport Resize Listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Restore step index from sessionStorage & auto-sync with current route
  useEffect(() => {
    if (!active) return;

    if (typeof window !== 'undefined') {
      const savedStep = sessionStorage.getItem('tmh_tutorial_step');
      if (savedStep) {
        const idx = parseInt(savedStep, 10);
        if (!isNaN(idx) && idx >= 0 && idx < TUTORIAL_STEPS.length) {
          const stepRoute = TUTORIAL_STEPS[idx]?.route;
          if (stepRoute === pathname) {
            setCurrentStepIdx(idx);
          } else {
            router.push(stepRoute);
            setCurrentStepIdx(idx);
          }
        }
      }
    }
  }, [active, pathname]);

  // Control overlay visibility & smart delays
  useEffect(() => {
    if (!active) return;

    if (CROSS_PAGE_LANDING_INDICES.includes(currentStepIdx)) {
      setOverlayVisible(false);
      const timer = setTimeout(() => {
        setOverlayVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setOverlayVisible(true);
    }
  }, [active, currentStepIdx]);

  const rawStep = TUTORIAL_STEPS[currentStepIdx] || TUTORIAL_STEPS[0];

  // Resolve target element ID dynamically based on viewport size
  const getActiveTargetId = () => {
    if (isMobileViewport) {
      if (rawStep.targetId === 'nav-sidebar') {
        return 'mobile-hamburger-btn';
      }
      if (rawStep.requiresNavClick) {
        const el = document.getElementById(rawStep.targetId);
        if (!el) return 'mobile-hamburger-btn';
      }
    }
    return rawStep.targetId;
  };

  const activeTargetId = getActiveTargetId();

  // Resolve step copy dynamically for mobile
  const getStepCopy = () => {
    let title = rawStep.title;
    let text = rawStep.text;

    if (isMobileViewport) {
      if (rawStep.targetId === 'nav-sidebar') {
        title = 'Navigation Menu';
        text = 'Here is your mobile navigation menu! Tap the menu icon anytime to jump between Dashboard, Insights, Rewards, Profile, and My Habits.';
      } else if (rawStep.requiresNavClick && activeTargetId === 'mobile-hamburger-btn') {
        const pageName = rawStep.nextExpectedRoute ? rawStep.nextExpectedRoute.replace('/', '') : 'next page';
        const formattedPage = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        text = `Tap the menu icon in the top header, then select '${formattedPage}' to explore!`;
      }
    }
    return { title, text };
  };

  const stepCopy = getStepCopy();

  // Scroll target element into view cleanly when step changes
  useEffect(() => {
    if (!active || !activeTargetId) return;

    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(activeTargetId);
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [active, currentStepIdx, activeTargetId]);

  // Synchronize target element bounding box
  useEffect(() => {
    if (!active) return;

    const updateRect = () => {
      if (activeTargetId) {
        const el = document.getElementById(activeTargetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 200);
    window.addEventListener('resize', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
    };
  }, [active, currentStepIdx, pathname, activeTargetId]);

  // Anti-Bypass Tutorial State Machine Click Interceptor
  useEffect(() => {
    if (!active) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow clicks inside tutorial card container or mobile hamburger button
      if (target.closest('#tutorial-card-container') || target.closest('#mobile-hamburger-btn')) {
        return;
      }

      const navLink = target.closest('[data-nav-href]') as HTMLElement | null;
      if (navLink) {
        const clickedHref = navLink.getAttribute('data-nav-href');
        const expectedHref = rawStep.nextExpectedRoute;

        if (rawStep.requiresNavClick) {
          if (clickedHref === expectedHref) {
            if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
              const nextIdx = currentStepIdx + 1;
              setOverlayVisible(false);
              setCurrentStepIdx(nextIdx);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('tmh_tutorial_step', String(nextIdx));
              }
            }
          } else {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            setWarningMessage("Don't hurry, we'll get there!");
          }
        } else {
          if (clickedHref !== rawStep.route) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            setWarningMessage("Don't hurry, we'll get there!");
          }
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [active, currentStepIdx, rawStep]);

  if (!active || !overlayVisible) return null;

  const completeAndCleanUp = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tmh_tutorial_active');
      sessionStorage.removeItem('tmh_tutorial_step');
    }
    onComplete();
  };

  const handleNextStep = () => {
    setWarningMessage(null);
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      const nextStep = TUTORIAL_STEPS[nextIdx];

      if (CROSS_PAGE_LANDING_INDICES.includes(nextIdx)) {
        setOverlayVisible(false);
      }

      if (nextStep.route && pathname !== nextStep.route) {
        router.push(nextStep.route);
      }
      setCurrentStepIdx(nextIdx);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tmh_tutorial_step', String(nextIdx));
      }
    } else {
      completeAndCleanUp();
    }
  };

  const handlePrevStep = () => {
    setWarningMessage(null);
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      const prevStep = TUTORIAL_STEPS[prevIdx];
      if (prevStep.route && pathname !== prevStep.route) {
        router.push(prevStep.route);
      }
      setCurrentStepIdx(prevIdx);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tmh_tutorial_step', String(prevIdx));
      }
    }
  };

  const handleSkipClick = () => {
    setIsSkipping(true);
  };

  const expressionUrl =
    (ROONEY_EXPRESSIONS && ROONEY_EXPRESSIONS[rawStep.expression]) || '/rooney/Neutral.png';

  const cardWidth = 420;
  const cardHeight = 260;

  const getCardStyle = (): React.CSSProperties => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Mobile Viewports (<768px): Smart Top / Bottom Docking based on target position
    if (viewportWidth < 768) {
      if (targetRect) {
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const isTargetInLowerHalf = targetCenterY > viewportHeight / 2;

        if (isTargetInLowerHalf) {
          // Target is in lower half -> Dock tutorial card safely at TOP of screen
          return {
            position: 'fixed',
            left: '50%',
            top: '1rem',
            transform: 'translateX(-50%)',
            width: 'calc(100vw - 1.5rem)',
            maxWidth: '380px',
          };
        } else {
          // Target is in upper half -> Dock tutorial card safely at BOTTOM of screen
          return {
            position: 'fixed',
            left: '50%',
            bottom: '1rem',
            transform: 'translateX(-50%)',
            width: 'calc(100vw - 1.5rem)',
            maxWidth: '380px',
          };
        }
      }
      return {
        position: 'fixed',
        left: '50%',
        bottom: '1rem',
        transform: 'translateX(-50%)',
        width: 'calc(100vw - 1.5rem)',
        maxWidth: '380px',
      };
    }

    if (isSkipping || !targetRect) {
      return {
        position: 'fixed',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    let computedLeft = 50;
    let computedTop = 50;
    const pad = 12;

    switch (rawStep.position) {
      case 'right':
        computedLeft = targetRect.right + pad;
        computedTop = Math.max(80, targetRect.top + 20);
        break;
      case 'top':
        computedLeft = Math.max(20, targetRect.left + targetRect.width / 2 - 210);
        computedTop = targetRect.top - cardHeight - pad;
        break;
      case 'bottom':
        computedLeft = Math.max(20, targetRect.left + targetRect.width / 2 - 210);
        computedTop = targetRect.bottom + pad;
        break;
      case 'left':
        computedLeft = targetRect.left - cardWidth - pad;
        computedTop = targetRect.top;
        break;
      default:
        computedLeft = viewportWidth / 2 - 210;
        computedTop = viewportHeight / 2 - 130;
    }

    // Desktop Boundary Clamping
    const clampedLeft = Math.max(16, Math.min(computedLeft, viewportWidth - cardWidth - 24));
    const clampedTop = Math.max(16, Math.min(computedTop, viewportHeight - cardHeight - 24));

    return {
      position: 'fixed',
      left: `${clampedLeft}px`,
      top: `${clampedTop}px`,
    };
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
      {/* Spotlight Hole-Punch Overlay */}
      {targetRect && !isSkipping ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${tTop}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${tBottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${tTop}px`,
              left: 0,
              width: `${tLeft}px`,
              height: `${tHeight}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${tTop}px`,
              left: `${tRight}px`,
              right: 0,
              height: `${tHeight}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 990,
              pointerEvents: 'auto',
            }}
          />
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 990,
          }}
        />
      )}

      {/* Positioned Rooney Tutorial Card */}
      <div
        id="tutorial-card-container"
        style={{
          ...getCardStyle(),
          zIndex: 995,
          pointerEvents: 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isSkipping ? 'skipping' : `${currentStepIdx}-${warningMessage ? 'warn' : 'normal'}`}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="glass-panel"
            style={{
              padding: isMobileViewport ? '1.1rem 1.2rem' : '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderRadius: '18px',
              backgroundColor: 'var(--surface-card)',
              border: warningMessage
                ? '2px solid var(--secondary-accent)'
                : '1px solid var(--border-color)',
              boxShadow: '0 16px 40px var(--shadow-color)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--secondary-accent)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkles size={14} /> Rooney • Step {currentStepIdx + 1} of {TUTORIAL_STEPS.length}
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

            {/* Content Body */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: isMobileViewport ? '70px' : '85px',
                  height: isMobileViewport ? '95px' : '120px',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 6px 12px var(--shadow-color))',
                }}
              >
                <Image
                  src={expressionUrl}
                  alt="Rooney Expression"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  unoptimized
                />
              </div>

              <div>
                <h3
                  style={{
                    fontSize: isMobileViewport ? '0.98rem' : '1.05rem',
                    fontWeight: 800,
                    color: 'var(--text)',
                    marginBottom: '0.3rem',
                  }}
                >
                  {warningMessage ? 'Hold On!' : isSkipping ? 'Hold up!' : stepCopy.title}
                </h3>
                <p
                  style={{
                    fontSize: isMobileViewport ? '0.85rem' : '0.9rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.45,
                  }}
                >
                  {warningMessage
                    ? `"${warningMessage}"`
                    : isSkipping
                    ? '"Okay genius. Are you sure you don\'t need a tutorial?"'
                    : `"${stepCopy.text}"`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.2rem',
              }}
            >
              <div>
                {!isSkipping && !warningMessage && currentStepIdx > 0 && (
                  <button
                    onClick={handlePrevStep}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
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
                {warningMessage ? (
                  <button
                    onClick={() => setWarningMessage(null)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    }}
                  >
                    Return to Tutorial
                  </button>
                ) : isSkipping ? (
                  <>
                    <button
                      onClick={() => setIsSkipping(false)}
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <RotateCcw size={14} /> Resume
                    </button>
                    <button
                      onClick={completeAndCleanUp}
                      style={{
                        padding: '0.55rem 1.15rem',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'var(--primary-accent)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      }}
                    >
                      Skip & Exit
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNextStep}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    }}
                  >
                    {currentStepIdx < TUTORIAL_STEPS.length - 1 ? (
                      <>
                        Next Step <ChevronRight size={16} />
                      </>
                    ) : (
                      <>
                        Finish Tutorial 🎉
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
