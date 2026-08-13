'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { RooneyExpression, ROONEY_EXPRESSIONS } from './RooneyExpressions';
import {
  ROONEY_INTRO_SEQUENCE,
  DialogueLine,
  getRandomDialogue,
  ScenarioKey,
} from './rooneyDialogueEngine';

export type RooneyMode = 'idle' | 'prominent';

interface RooneyProps {
  mode?: RooneyMode;
  showIntroOnLoad?: boolean;
  onIntroComplete?: () => void;
  customScenario?: ScenarioKey;
  onModeChange?: (mode: RooneyMode) => void;
  hideFloating?: boolean;
}

export default function Rooney({
  mode: externalMode,
  showIntroOnLoad = false,
  onIntroComplete,
  customScenario,
  onModeChange,
  hideFloating = false,
}: RooneyProps) {
  const [internalMode, setInternalMode] = useState<RooneyMode>(showIntroOnLoad ? 'prominent' : 'idle');
  const [introStep, setIntroStep] = useState<number | null>(showIntroOnLoad ? 0 : null);

  const activeMode = externalMode !== undefined ? externalMode : internalMode;
  const isProminent = activeMode === 'prominent';

  const [currentDialogue, setCurrentDialogue] = useState<DialogueLine>({
    text: "Hey there! Tap me anytime for tips & motivation!",
    expression: RooneyExpression.NEUTRAL,
  });
  const [isSpeechOpen, setIsSpeechOpen] = useState(showIntroOnLoad);

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
      if (onIntroComplete) {
        onIntroComplete();
      }
    }
  };

  const handleRooneyClick = () => {
    if (introStep !== null) {
      handleNextIntroStep();
      return;
    }

    if (!isSpeechOpen) {
      const scenarios: ScenarioKey[] = ['idle', 'encouragement', 'roast', 'celebration'];
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      setCurrentDialogue(getRandomDialogue(randomScenario));
      setIsSpeechOpen(true);
    } else {
      const scenarios: ScenarioKey[] = ['idle', 'encouragement', 'roast', 'celebration'];
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      setCurrentDialogue(getRandomDialogue(randomScenario));
    }
  };

  const activeExpressionUrl = ROONEY_EXPRESSIONS[currentDialogue.expression] || ROONEY_EXPRESSIONS.NEUTRAL;
  const isIntroMode = introStep !== null;

  // Check if tutorial is currently active (via prop or sessionStorage)
  const isTutorialActive =
    hideFloating ||
    (typeof window !== 'undefined' && sessionStorage.getItem('tmh_tutorial_active') === 'true');

  // Scale compensation for smaller raw images (Celebratory & Pointing_2)
  const isSmallerImage =
    currentDialogue.expression === RooneyExpression.CELEBRATORY ||
    currentDialogue.expression === RooneyExpression.POINTING_2;
  const imageScaleCompensation = isSmallerImage ? 1.36 : 1.0;

  // HIDE floating bottom-right Rooney widget whenever a tutorial is active!
  if (isTutorialActive && !isProminent) return null;

  return (
    <>
      {/* Dimmed backdrop when in prominent mode */}
      <AnimatePresence>
        {isProminent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if (!isIntroMode) updateMode('idle');
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 998,
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Animated Wrapper for Rooney + Speech Bubble */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200,
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
                top: '12%',
                left: '50%',
                transform: 'translateX(-50%)',
              }
            : {
                bottom: '1.5rem',
                right: '1.5rem',
              }),
        }}
      >
        {/* In Prominent Mode: Rooney Avatar FIRST (Top Center) */}
        {isProminent && (
          <motion.div
            onClick={handleRooneyClick}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              width: '180px',
              height: '240px',
              filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
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
        )}

        {/* Speech Dialogue Bubble (Below Rooney Avatar in Prominent Mode, Above in Idle Mode) */}
        <AnimatePresence>
          {isSpeechOpen && (
            <motion.div
              initial={{ opacity: 0, y: isProminent ? 15 : 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isProminent ? 10 : 10, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              style={{
                pointerEvents: 'auto',
                marginTop: isProminent ? '0.75rem' : 0,
                marginBottom: isProminent ? 0 : '1rem',
                maxWidth: isProminent ? '380px' : '280px',
                width: '100%',
                padding: '1.2rem 1.35rem',
                borderRadius: '18px',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 12px 36px var(--shadow-color)',
                color: 'var(--text)',
                fontSize: isProminent ? '1.05rem' : '0.925rem',
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

        {/* In Idle Mode: Floating Rooney Character Avatar SECOND */}
        {!isProminent && (
          <motion.div
            onClick={handleRooneyClick}
            animate={{
              y: [0, -7, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              width: '80px',
              height: '115px',
              transition: 'width 0.3s ease, height 0.3s ease',
              filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
        )}
      </motion.div>
    </>
  );
}
