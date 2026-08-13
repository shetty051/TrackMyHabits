'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { RooneyExpression, ROONEY_EXPRESSION_URLS } from './RooneyExpressions';
import {
  getRandomDialogue,
  DialogueLine,
  ROONEY_INTRO_SEQUENCE,
} from './rooneyDialogueEngine';

export type RooneyMode = 'idle' | 'prominent';

interface RooneyProps {
  mode?: RooneyMode;
  showIntroOnLoad?: boolean;
  onIntroComplete?: () => void;
  onModeChange?: (mode: RooneyMode) => void;
  customScenario?: string;
  hideFloating?: boolean;
}

export default function Rooney({
  mode: externalMode,
  showIntroOnLoad = false,
  onIntroComplete,
  onModeChange,
  customScenario,
  hideFloating = false,
}: RooneyProps) {
  const [internalMode, setInternalMode] = useState<RooneyMode>(showIntroOnLoad ? 'prominent' : 'idle');
  const [introStep, setIntroStep] = useState<number | null>(showIntroOnLoad ? 0 : null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const activeMode = externalMode !== undefined ? externalMode : internalMode;
  const isProminent = activeMode === 'prominent';

  const [currentDialogue, setCurrentDialogue] = useState<DialogueLine>({
    text: "Hey there! Tap me anytime for tips & motivation!",
    expression: RooneyExpression.NEUTRAL,
  });
  const [isSpeechOpen, setIsSpeechOpen] = useState(showIntroOnLoad);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync mode changes
  const updateMode = (newMode: RooneyMode) => {
    setInternalMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

  // Custom event listener for global Rooney speech calls ('rooney-speak')
  useEffect(() => {
    const handleCustomRooneySpeak = (
      e: CustomEvent<{ text: string; expression: RooneyExpression; mode?: RooneyMode }>
    ) => {
      const isTutorialActiveNow =
        hideFloating ||
        (typeof window !== 'undefined' && sessionStorage.getItem('tmh_tutorial_active') === 'true');

      // Ignore speech/badge popups while tutorial is running
      if (isTutorialActiveNow) return;

      if (e.detail?.text && e.detail?.expression) {
        setCurrentDialogue({
          text: e.detail.text,
          expression: e.detail.expression,
        });
        setIsSpeechOpen(true);
        if (e.detail.mode) {
          updateMode(e.detail.mode);
        }
      }
    };

    window.addEventListener('rooney-speak' as any, handleCustomRooneySpeak as any);
    return () => {
      window.removeEventListener('rooney-speak' as any, handleCustomRooneySpeak as any);
    };
  }, []);

  // Trigger custom scenario updates
  useEffect(() => {
    if (customScenario) {
      const dialogue = getRandomDialogue(customScenario);
      setCurrentDialogue(dialogue);
      setIsSpeechOpen(true);
    }
  }, [customScenario]);

  // Handle Intro Step Initialization
  useEffect(() => {
    if (showIntroOnLoad) {
      setIntroStep(0);
      setCurrentDialogue(ROONEY_INTRO_SEQUENCE[0]);
      setIsSpeechOpen(true);
      updateMode('prominent');
    }
  }, [showIntroOnLoad]);

  const handleNextIntroStep = () => {
    if (introStep !== null && introStep < ROONEY_INTRO_SEQUENCE.length - 1) {
      const nextIdx = introStep + 1;
      setIntroStep(nextIdx);
      setCurrentDialogue(ROONEY_INTRO_SEQUENCE[nextIdx]);
    } else {
      // Intro complete: Return Rooney smoothly to idle mode
      setIntroStep(null);
      setIsSpeechOpen(false);
      updateMode('idle');
      if (onIntroComplete) onIntroComplete();
    }
  };

  const handleRooneyClick = () => {
    if (isIntroMode) return;

    if (isProminent) {
      // In prominent mode, click returns Rooney to floating idle mode
      updateMode('idle');
      setIsSpeechOpen(false);
    } else {
      // In idle mode, click toggles dialogue popup
      if (!isSpeechOpen) {
        const dialogue = getRandomDialogue();
        setCurrentDialogue(dialogue);
        setIsSpeechOpen(true);
      } else {
        setIsSpeechOpen(false);
      }
    }
  };

  // Determine active expression asset URL
  const activeExpressionUrl =
    (ROONEY_EXPRESSION_URLS && currentDialogue?.expression && ROONEY_EXPRESSION_URLS[currentDialogue.expression]) ||
    (ROONEY_EXPRESSIONS && currentDialogue?.expression && ROONEY_EXPRESSIONS[currentDialogue.expression]) ||
    '/rooney/Neutral.png';

  const imageScaleCompensation =
    currentDialogue.expression === RooneyExpression.SLEEPING ||
    currentDialogue.expression === RooneyExpression.CONFUSED ||
    currentDialogue.expression === RooneyExpression.BLUSHING ||
    currentDialogue.expression === RooneyExpression.ROASTING ||
    currentDialogue.expression === RooneyExpression.DISAPPOINTED ||
    currentDialogue.expression === RooneyExpression.URGENT ||
    currentDialogue.expression === RooneyExpression.CELEBRATORY
      ? 1.28
      : 1.0;

  const isIntroMode = introStep !== null;

  // HIDE floating widget completely when tutorial is active
  const isTutorialActiveSession =
    typeof window !== 'undefined' && sessionStorage.getItem('tmh_tutorial_active') === 'true';

  if (hideFloating || (isTutorialActiveSession && !isProminent)) {
    return null;
  }

  return (
    <>
      {/* Prominent Mode Full-Screen Backdrop Overlay */}
      <AnimatePresence>
        {isProminent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isIntroMode) {
                updateMode('idle');
                setIsSpeechOpen(false);
              }
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              zIndex: 998,
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Rooney Companion Animated Container */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 240,
          mass: 0.8,
        }}
        style={{
          position: 'fixed',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          ...(isProminent
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                right: 'auto',
                bottom: 'auto',
                width: isMobileViewport ? 'calc(100vw - 2rem)' : 'auto',
                maxWidth: '420px',
              }
            : {
                top: 'auto',
                left: 'auto',
                transform: 'none',
                bottom: isMobileViewport ? '1rem' : '1.5rem',
                right: isMobileViewport ? '1rem' : '1.5rem',
                width: 'auto',
                maxWidth: 'none',
              }),
        }}
      >
        {/* In Prominent Mode: Rooney Avatar FIRST (Top Center) */}
        {isProminent && (
          <motion.div
            onClick={handleRooneyClick}
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              width: isMobileViewport ? '140px' : '180px',
              height: isMobileViewport ? '180px' : '240px',
              filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDialogue.expression}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%', position: 'relative' }}
              >
                <Image
                  src={activeExpressionUrl}
                  alt="Rooney Character Companion"
                  fill
                  style={{
                    objectFit: 'contain',
                    transform: `scale(${imageScaleCompensation})`,
                    transition: 'transform 0.25s ease',
                  }}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Speech Dialogue Bubble */}
        <AnimatePresence>
          {isSpeechOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              style={{
                pointerEvents: 'auto',
                marginTop: isProminent ? '0.75rem' : 0,
                marginBottom: isProminent ? 0 : '1rem',
                maxWidth: isProminent ? (isMobileViewport ? '90vw' : '380px') : (isMobileViewport ? '260px' : '280px'),
                width: '100%',
                padding: isMobileViewport ? '1rem 1.1rem' : '1.2rem 1.35rem',
                borderRadius: '18px',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 12px 36px var(--shadow-color)',
                color: 'var(--text)',
                fontSize: isProminent ? (isMobileViewport ? '0.95rem' : '1.05rem') : '0.9rem',
                lineHeight: 1.5,
                position: 'relative',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Header Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--secondary-accent)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Sparkles size={14} /> Rooney
                </div>
                {!isIntroMode && (
                  <button
                    onClick={() => setIsSpeechOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dialogue Text */}
              <p style={{ margin: 0, fontWeight: 500 }}>"{currentDialogue.text}"</p>

              {/* Action Buttons */}
              {isIntroMode ? (
                <button
                  onClick={handleNextIntroStep}
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--primary-accent)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    float: 'right',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {introStep < 4 ? (
                    <>
                      Next <ChevronRight size={14} />
                    </>
                  ) : (
                    <>
                      Got it! <Sparkles size={14} />
                    </>
                  )}
                </button>
              ) : currentDialogue.text.includes("missed a habit") ? (
                <button
                  onClick={async () => {
                    await fetch('/api/user/clear-missed-alert', { method: 'POST' }).catch(console.error);
                    setIsSpeechOpen(false);
                    updateMode('idle');
                  }}
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--primary-accent)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    float: 'right',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  I'll Bounce Back! <Sparkles size={14} />
                </button>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* In Idle Mode: Rooney Floating Avatar SECOND (Docked Bottom Right) */}
        {!isProminent && (
          <motion.div
            onClick={handleRooneyClick}
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              width: isMobileViewport ? '56px' : '76px',
              height: isMobileViewport ? '72px' : '96px',
              filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDialogue.expression}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%', position: 'relative' }}
              >
                <Image
                  src={activeExpressionUrl}
                  alt="Rooney Character Companion"
                  fill
                  style={{
                    objectFit: 'contain',
                    transform: `scale(${imageScaleCompensation})`,
                    transition: 'transform 0.25s ease',
                  }}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
