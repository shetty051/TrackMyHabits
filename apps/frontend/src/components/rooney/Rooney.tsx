'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Send, Loader2, Award, TrendingUp, Lightbulb, Zap } from 'lucide-react';
import { RooneyExpression, ROONEY_EXPRESSION_URLS, ROONEY_EXPRESSIONS } from './RooneyExpressions';
import {
  getRandomDialogue,
  DialogueLine,
  ROONEY_INTRO_SEQUENCE,
} from './rooneyDialogueEngine';

import { getRealtimeRooneyMood } from './RooneyMoodEngine';

export type RooneyMode = 'idle' | 'prominent';

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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

  // AI Chat Mode State
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [currentDialogue, setCurrentDialogue] = useState<DialogueLine>(() => getRandomDialogue('idle'));
  const [isSpeechOpen, setIsSpeechOpen] = useState(showIntroOnLoad);

  // Fetch persisted chat history when entering Prominent AI Mode
  useEffect(() => {
    if (isProminent && !showIntroOnLoad) {
      fetchChatHistory();
    }
  }, [isProminent, showIntroOnLoad]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/ai/chat');
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  // Scroll to bottom of chat window
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  // Fetch real-time habit & profile state to evaluate Rooney's mood in Idle mode
  const fetchRealtimeMood = async () => {
    try {
      const [profRes, habitsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/habits'),
      ]);
      if (profRes.ok && habitsRes.ok) {
        const profData = await profRes.json();
        const habitsData = await habitsRes.json();

        const user = profData.user;
        const habits = habitsData.habits || [];

        // Local YYYY-MM-DD date string
        const todayISO = new Date().toLocaleDateString('en-CA');
        const totalDue = habits.length;
        const completed = habits.filter((h: any) =>
          h.logs?.some((l: any) => l.date === todayISO && l.completed)
        ).length;
        const hasMissed = !!user?.hasUnaddressedMissedHabit;

        // Check for dev simulation override (?simulatedHour=20 or window.__simulatedHour)
        let simHour: number | undefined = undefined;
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const hourParam = urlParams.get('simulatedHour');
          if (hourParam !== null) {
            simHour = parseInt(hourParam, 10);
          } else if ((window as any).__simulatedHour !== undefined) {
            simHour = (window as any).__simulatedHour;
          }
        }

        const moodDialogue = getRealtimeRooneyMood(totalDue, completed, hasMissed, simHour);
        setCurrentDialogue(moodDialogue);
      }
    } catch (err) {
      console.error('Failed to fetch real-time Rooney mood:', err);
    }
  };

  useEffect(() => {
    if (!showIntroOnLoad && !isProminent) {
      fetchRealtimeMood();
      const interval = setInterval(fetchRealtimeMood, 15000);
      return () => clearInterval(interval);
    }
  }, [showIntroOnLoad, isProminent]);

  // Resize listener
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
    if (newMode === 'idle') {
      fetchRealtimeMood();
    }
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

  // Send message to Gemini server-side route
  const handleSendChatMessage = async (overridePrompt?: string) => {
    const messageToSend = overridePrompt || chatInput;
    if (!messageToSend || !messageToSend.trim() || isAiLoading) return;

    const userMessageText = messageToSend.trim();
    if (!overridePrompt) setChatInput('');

    // Optimistically update chat history
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessageText,
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessageText }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reach Gemini AI service');
      }

      const data = await res.json();
      if (data.messages) {
        setChatMessages(data.messages);
      }
    } catch (err: any) {
      console.error('AI Chat Submission Error:', err);
      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Oops! ${err.message || 'I had trouble processing that request. Please try again in a moment!'} ⚡`,
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Trigger custom scenario updates
  useEffect(() => {
    if (customScenario) {
      const dialogue = getRandomDialogue(customScenario as any);
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
      setIntroStep(null);
      setIsSpeechOpen(false);
      updateMode('idle');
      if (onIntroComplete) onIntroComplete();
    }
  };

  const handleRooneyClick = () => {
    if (isIntroMode) return;

    if (isProminent) {
      updateMode('idle');
      setIsSpeechOpen(false);
    } else {
      const freshDialogue = getRandomDialogue('idle');
      setCurrentDialogue(freshDialogue);
      setIsSpeechOpen(true);
    }
  };

  // Expression Rule for AI Mode:
  // In Prominent/AI mode, Rooney ONLY uses THINKING (while awaiting response) and NEUTRAL expressions
  const activeExpression = isProminent
    ? isAiLoading
      ? RooneyExpression.THINKING
      : RooneyExpression.NEUTRAL
    : currentDialogue?.expression || RooneyExpression.NEUTRAL;

  const activeExpressionUrl =
    (ROONEY_EXPRESSION_URLS && ROONEY_EXPRESSION_URLS[activeExpression]) ||
    (ROONEY_EXPRESSIONS && ROONEY_EXPRESSIONS[activeExpression]) ||
    '/rooney/Neutral.png';

  const imageScaleCompensation =
    activeExpression === RooneyExpression.SLEEPING ||
    activeExpression === RooneyExpression.CONFUSED ||
    activeExpression === RooneyExpression.BLUSHING ||
    activeExpression === RooneyExpression.ROASTING ||
    activeExpression === RooneyExpression.DISAPPOINTED ||
    activeExpression === RooneyExpression.CONCERNED ||
    activeExpression === RooneyExpression.CELEBRATORY
      ? 1.28
      : 1.0;

  const isIntroMode = introStep !== null;

  const isTutorialActiveSession =
    typeof window !== 'undefined' && sessionStorage.getItem('tmh_tutorial_active') === 'true';

  if (hideFloating || (isTutorialActiveSession && !isProminent)) {
    return null;
  }

  // Self-contained responsive positioning:
  // - Mobile (<=768px): Fixed bottom sheet anchored at bottom: 12px, left: 16px, right: 16px, height: min(520px, 84vh)
  // - Desktop (>768px): Fixed widget anchored at bottom-right (bottom: 24px, right: 24px, width: 400px, height: min(580px, 82vh))
  const getContainerStyle = (): React.CSSProperties => {
    if (!isProminent) {
      return {
        position: 'fixed',
        bottom: isMobileViewport ? '1rem' : '1.5rem',
        right: isMobileViewport ? '1rem' : '1.5rem',
        top: 'auto',
        left: 'auto',
        transform: 'none',
        width: 'auto',
        maxWidth: isMobileViewport ? 'calc(100vw - 32px)' : '320px',
        boxSizing: 'border-box',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      };
    }

    if (isMobileViewport) {
      return {
        position: 'fixed',
        bottom: '12px',
        left: '16px',
        right: '16px',
        top: 'auto',
        width: 'calc(100vw - 32px)',
        maxWidth: '100%',
        height: 'min(520px, 84vh)',
        boxSizing: 'border-box',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
      };
    }

    return {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      top: 'auto',
      left: 'auto',
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
      height: 'min(580px, 82vh)',
      boxSizing: 'border-box',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
    };
  };

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
        key={isProminent ? 'prominent-container' : 'idle-container'}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        style={getContainerStyle()}
      >
        {/* PROMINENT MODE: Self-Contained Interactive Gemini AI Chat Panel */}
        {isProminent && !isIntroMode ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              padding: isMobileViewport ? '0.85rem' : '1.1rem',
              borderRadius: '20px',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 16px 40px var(--shadow-color)',
              color: 'var(--text)',
              fontSize: '0.9rem',
              lineHeight: 1.45,
              position: 'relative',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header (Pinned Top) */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.6rem',
                marginBottom: '0.4rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--secondary-accent)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Sparkles size={16} /> Rooney AI Companion
              </div>
              <button
                onClick={() => {
                  updateMode('idle');
                  setIsSpeechOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Rooney Character Avatar (Pinned Top-Center below Header) */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                padding: '0.2rem 0',
              }}
            >
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'relative',
                  width: isMobileViewport ? '72px' : '90px',
                  height: isMobileViewport ? '84px' : '105px',
                  filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25))',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeExpression}
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
            </div>

            {/* Scrollable Message List Container (Takes remaining flex space) */}
            <div
              ref={chatScrollRef}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                margin: '0.4rem 0',
              }}
            >
              {chatMessages.length === 0 ? (
                <div
                  style={{
                    padding: '1rem 0.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                >
                  👋 Hi! I'm Rooney, your Gemini-powered habit assistant. Ask me for habit continuation likelihood, streak tips, new habit ideas, or what badges you've won!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '86%',
                      padding: '0.65rem 0.9rem',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor:
                        msg.role === 'user' ? 'var(--primary-accent)' : 'var(--surface)',
                      color: msg.role === 'user' ? '#FFFFFF' : 'var(--text)',
                      fontSize: '0.86rem',
                      lineHeight: 1.45,
                      border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isAiLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Rooney is thinking...
                </div>
              )}
            </div>

            {/* Pinned Bottom Controls (Quick Chips + Input Form) */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.6rem',
              }}
            >
              {/* Quick Action Suggestion Chips */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '2px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <button
                  onClick={() => handleSendChatMessage('What is my habit continuation likelihood?')}
                  disabled={isAiLoading}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <TrendingUp size={12} style={{ color: 'var(--secondary-accent)' }} /> Likelihood
                </button>

                <button
                  onClick={() => handleSendChatMessage('What badges have I won?')}
                  disabled={isAiLoading}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Award size={12} style={{ color: '#F59E0B' }} /> My Badges
                </button>

                <button
                  onClick={() => handleSendChatMessage('Give me a streak improvement tip.')}
                  disabled={isAiLoading}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Lightbulb size={12} style={{ color: '#10B981' }} /> Streak Tips
                </button>

                <button
                  onClick={() => handleSendChatMessage('Suggest new habits for me.')}
                  disabled={isAiLoading}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Zap size={12} style={{ color: '#6366F1' }} /> New Habits
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Rooney anything..."
                  disabled={isAiLoading}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isAiLoading}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor:
                      chatInput.trim() && !isAiLoading ? 'var(--primary-accent)' : 'var(--border-color)',
                    color: '#FFFFFF',
                    cursor: chatInput.trim() && !isAiLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* IDLE MODE or INTRO MODE Speech Bubble */
          <AnimatePresence>
            {isSpeechOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                style={{
                  pointerEvents: 'auto',
                  marginTop: isProminent ? '0.6rem' : 0,
                  marginBottom: isProminent ? 0 : '0.6rem',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: isMobileViewport ? '0.85rem 0.95rem' : '1.1rem 1.25rem',
                  borderRadius: '18px',
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 12px 36px var(--shadow-color)',
                  color: 'var(--text)',
                  fontSize: isProminent ? (isMobileViewport ? '0.88rem' : '1rem') : (isMobileViewport ? '0.85rem' : '0.9rem'),
                  lineHeight: 1.45,
                  position: 'relative',
                  backdropFilter: 'blur(16px)',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {/* Header Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
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
                <p style={{ margin: 0, fontWeight: 500, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  "{currentDialogue.text}"
                </p>

                {/* Action Buttons */}
                {isIntroMode && (
                  <button
                    onClick={handleNextIntroStep}
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
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
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

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
                key={activeExpression}
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
