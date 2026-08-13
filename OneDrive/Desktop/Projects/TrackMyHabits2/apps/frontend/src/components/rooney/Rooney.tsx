'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RooneyExpression,
  ROONEY_EXPRESSIONS,
} from './RooneyExpressions';
import {
  getRandomDialogue,
  ROONEY_INTRO_SEQUENCE,
  DialogueLine,
  ScenarioKey,
} from './rooneyDialogueEngine';
import { X, ChevronRight, Sparkles } from 'lucide-react';

export type RooneyMode = 'idle' | 'prominent';

interface RooneyProps {
  mode?: RooneyMode;
  showIntroOnLoad?: boolean;
  onIntroComplete?: () => void;
  customScenario?: ScenarioKey;
  onModeChange?: (mode: RooneyMode) => void;
}

export default function Rooney({
  mode: externalMode,
  showIntroOnLoad = false,
  onIntroComplete,
  customScenario,
  onModeChange,
}: RooneyProps) {
  const [internalMode, setInternalMode] = useState<RooneyMode>(showIntroOnLoad ? 'prominent' : 'idle');
  const [introStep, setIntroStep] = useState<number | null>(showIntroOnLoad ? 0 : null);

  const activeMode = externalMode !== undefined ? externalMode : internalMode;

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

  // Scale compensation for smaller raw images (Celebratory & Pointing_2)
  const isSmallerImage =
    currentDialogue.expression === RooneyExpression.CELEBRATORY ||
    currentDialogue.expression === RooneyExpression.POINTING_2;
  const imageScaleCompensation = isSmallerImage ? 1.36 : 1.0;

  const isProminent = activeMode === 'prominent';

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
                top: '36%',
                left: '50%',
                x: '-50%',
                y: '-50%',
              }
            : {
                bottom: '1.5rem',
                right: '1.5rem',
                x: 0,
                y: 0,
              }),
        }}
      >
        {/* Speech Dialogue Bubble */}
        <AnimatePresence>
          {isSpeechOpen && (
            <motion.div
              initial={{ opacity: 0, y: isProminent ? -15 : 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isProminent ? -10 : 10, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              style={{
                pointerEvents: 'auto',
                marginBottom: '1rem',
                maxWidth: isProminent ? '360px' : '280px',
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
                  justify: 'space-between',
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
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Rooney Character Avatar */}
        <motion.div
          onClick={handleRooneyClick}
          animate={{
            y: isProminent ? [0, -12, 0] : [0, -7, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{ scale: isProminent ? 1.04 : 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            position: 'relative',
            width: isProminent ? '190px' : '80px',
            height: isProminent ? '270px' : '115px',
            transition: 'width 0.3s ease, height 0.3s ease',
            filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.3))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: `scale(${imageScaleCompensation})`,
              transition: 'transform 0.25s ease',
            }}
          >
            <Image
              src={activeExpressionUrl}
              alt={`Rooney (${currentDialogue.expression})`}
              fill
              style={{
                objectFit: 'contain',
                background: 'transparent',
              }}
              priority
            />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
