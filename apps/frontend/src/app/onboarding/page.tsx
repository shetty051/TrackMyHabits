'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User,
  Heart,
  Target,
  Check,
  X,
  Droplets,
  Moon,
  Footprints,
  Dumbbell,
  BookOpen,
  PenTool,
  Brain,
  Apple,
} from 'lucide-react';

interface HabitItem {
  id: string;
  title: string;
  emoji: string;
  color: string;
  frequencyType: string;
  category: string;
}

const AGE_BRACKET_HABITS: Record<string, { label: string; habits: HabitItem[] }> = {
  teen: {
    label: 'Teens (13–19)',
    habits: [
      { id: 'study', title: 'Daily Study & Homework Session', emoji: '📖', color: '#60A5FA', frequencyType: 'daily', category: 'Focus' },
      { id: 'screentime', title: 'Limit Social Media Screen Time', emoji: '📱', color: '#F87171', frequencyType: 'daily', category: 'Wellness' },
      { id: 'sleep', title: 'Consistent Sleep Schedule (8-9h)', emoji: '🌙', color: '#818CF8', frequencyType: 'daily', category: 'Routine' },
      { id: 'water', title: 'Drink 2–3L Water Daily', emoji: '💧', color: '#38BDF8', frequencyType: 'daily', category: 'Routine' },
      { id: 'sport', title: 'Active Sports / Exercise', emoji: '⚽', color: '#34D399', frequencyType: 'specific-days', category: 'Fitness' },
      { id: 'read', title: 'Read 20 Pages Daily', emoji: '📚', color: '#A78BFA', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'nosugar', title: 'Limit Sugary Drinks & Snacks', emoji: '🍏', color: '#10B981', frequencyType: 'daily', category: 'Wellness' },
      { id: 'journal', title: 'Daily Thought Journaling', emoji: '✍️', color: '#F472B6', frequencyType: 'daily', category: 'Wellness' },
      { id: 'learn', title: 'Learn a New Skill / Language', emoji: '🧠', color: '#3B82F6', frequencyType: 'daily', category: 'Focus' },
    ],
  },
  youngAdult: {
    label: 'Young Adults (20–35)',
    habits: [
      { id: 'water', title: 'Drink 2–3L of Water Daily', emoji: '💧', color: '#60A5FA', frequencyType: 'daily', category: 'Routine' },
      { id: 'sleep', title: 'Sleep 8 Hours Every Night', emoji: '🌙', color: '#818CF8', frequencyType: 'daily', category: 'Routine' },
      { id: 'exercise', title: 'Gym / Workout 3x Week', emoji: '🏋️‍♂️', color: '#F87171', frequencyType: 'specific-days', category: 'Fitness' },
      { id: 'meditate', title: 'Meditate 10 Mins Daily', emoji: '🧘‍♂️', color: '#FBBF24', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'worklife', title: 'Disconnect From Work at 7 PM', emoji: '💻', color: '#34D399', frequencyType: 'daily', category: 'Focus' },
      { id: 'read', title: 'Read 15 Mins Daily', emoji: '📚', color: '#A78BFA', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'nosugar', title: 'No Sugar After 8 PM', emoji: '🍏', color: '#10B981', frequencyType: 'daily', category: 'Wellness' },
      { id: 'journal', title: 'Journal Daily Reflections', emoji: '✍️', color: '#F472B6', frequencyType: 'daily', category: 'Wellness' },
      { id: 'budget', title: 'Review Daily Expenses', emoji: '📊', color: '#3B82F6', frequencyType: 'daily', category: 'Focus' },
    ],
  },
  adult: {
    label: 'Adults (36–50)',
    habits: [
      { id: 'walk', title: 'Walk 10,000 Steps Daily', emoji: '👟', color: '#34D399', frequencyType: 'daily', category: 'Fitness' },
      { id: 'stretch', title: '15 Min Mobility & Stretching', emoji: '🧘‍♀️', color: '#FBBF24', frequencyType: 'daily', category: 'Fitness' },
      { id: 'water', title: 'Drink 2.5L Water Daily', emoji: '💧', color: '#60A5FA', frequencyType: 'daily', category: 'Routine' },
      { id: 'diet', title: 'Balanced Whole-Food Meals', emoji: '🥗', color: '#10B981', frequencyType: 'daily', category: 'Wellness' },
      { id: 'mindfulness', title: 'Mindfulness Breathwork', emoji: '🧠', color: '#A78BFA', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'read', title: 'Read 20 Mins Before Bed', emoji: '📚', color: '#818CF8', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'winddown', title: 'Evening Herbal Tea & Wind-Down', emoji: '☕', color: '#F472B6', frequencyType: 'daily', category: 'Wellness' },
      { id: 'sleep', title: 'Prioritize 7–8 Hours Sleep', emoji: '🌙', color: '#3B82F6', frequencyType: 'daily', category: 'Routine' },
      { id: 'posture', title: 'Ergonomic Posture Check', emoji: '🪑', color: '#F87171', frequencyType: 'daily', category: 'Focus' },
    ],
  },
  senior: {
    label: 'Seniors (51+)',
    habits: [
      { id: 'morningwalk', title: 'Morning Gentle Walk (30 Mins)', emoji: '🚶‍♂️', color: '#34D399', frequencyType: 'daily', category: 'Fitness' },
      { id: 'meds', title: 'Take Daily Medications & Vitamins', emoji: '💊', color: '#F87171', frequencyType: 'daily', category: 'Routine' },
      { id: 'water', title: 'Maintain Healthy Hydration (2L)', emoji: '💧', color: '#60A5FA', frequencyType: 'daily', category: 'Routine' },
      { id: 'jointcare', title: 'Joint Care & Low-Impact Stretch', emoji: '🧘‍♂️', color: '#FBBF24', frequencyType: 'daily', category: 'Fitness' },
      { id: 'puzzle', title: 'Daily Brain Puzzles / Sudoku', emoji: '🧩', color: '#A78BFA', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'read', title: 'Evening Book Reading', emoji: '📖', color: '#818CF8', frequencyType: 'daily', category: 'Mindfulness' },
      { id: 'garden', title: 'Outdoor Gardening / Fresh Air', emoji: '🌿', color: '#10B981', frequencyType: 'daily', category: 'Wellness' },
      { id: 'sleep', title: 'Consistent Sleep & Rest', emoji: '🌙', color: '#3B82F6', frequencyType: 'daily', category: 'Routine' },
      { id: 'social', title: 'Connect With Family or Friends', emoji: '📞', color: '#F472B6', frequencyType: 'daily', category: 'Wellness' },
    ],
  },
};

function getBracketData(age: number | '') {
  if (typeof age === 'number' && !isNaN(age)) {
    if (age <= 19) return AGE_BRACKET_HABITS.teen;
    if (age >= 20 && age <= 35) return AGE_BRACKET_HABITS.youngAdult;
    if (age >= 36 && age <= 50) return AGE_BRACKET_HABITS.adult;
    if (age >= 51) return AGE_BRACKET_HABITS.senior;
  }
  return AGE_BRACKET_HABITS.youngAdult;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Form State
  const [name, setName] = useState(session?.user?.name || '');
  const [age, setAge] = useState<number | ''>(25);
  const [sex, setSex] = useState<string>('Male');
  
  // Active habits list dynamically derived from age
  const activeBracket = getBracketData(age);
  const currentHabitList = activeBracket.habits;

  // Selected habits state mapping habit IDs to boolean
  const [selectedHabitIds, setSelectedHabitIds] = useState<Record<string, boolean>>({
    study: true, screentime: true, sleep: true, water: true, sport: true, read: true,
    exercise: true, meditate: true, worklife: true, nosugar: true, journal: true, budget: true,
    walk: true, stretch: true, diet: true, mindfulness: true, winddown: true, posture: true,
    morningwalk: true, meds: true, jointcare: true, puzzle: true, garden: true, social: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const toggleHabit = (id: string) => {
    setSelectedHabitIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const habitsToCreate = currentHabitList.filter((h) => selectedHabitIds[h.id]);

      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || session?.user?.name || 'Habit Tracker User',
          age,
          sex,
          habits: habitsToCreate,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save onboarding selections');
      }

      router.push('/?intro=true');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('Error saving onboarding data: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Slide Animation Variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const selectedHabitsInCurrentBracket = currentHabitList.filter((h) => selectedHabitIds[h.id]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
      }}
    >
      <ThemeToggle fixed />

      {/* Main Container */}
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Progress Bar & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Step {currentStep + 1} of 6</span>
            <span>{Math.round(((currentStep + 1) / 6) * 100)}% Completed</span>
          </div>
          <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: 'var(--surface-hover)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${((currentStep + 1) / 6) * 100}%`,
                backgroundColor: 'var(--primary-accent)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Card Motion Container */}
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem',
            minHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {/* CARD 1: Welcome & Name */}
              {currentStep === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={badgeStyle}>
                    <Sparkles size={16} /> Welcome to TrackMyHabits
                  </div>
                  <h2 style={cardTitleStyle}>What should we call you?</h2>
                  <p style={cardDescStyle}>
                    Let's personalize your daily experience. Enter your preferred display name.
                  </p>
                  <div>
                    <label style={labelStyle}>Your Preferred Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* CARD 2: Age & Sex */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={badgeStyle}>
                    <User size={16} /> Personal Demographics
                  </div>
                  <h2 style={cardTitleStyle}>Tell us a bit about yourself</h2>
                  <p style={cardDescStyle}>
                    This helps our system tune habit recommendations to your specific age group.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={labelStyle}>Your Age</label>
                      <input
                        type="number"
                        min="13"
                        max="100"
                        value={age}
                        onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        style={{
                          ...inputStyle,
                          borderColor: (typeof age !== 'number' || isNaN(age) || age < 13 || age > 100) ? '#EF4444' : 'var(--border-color)',
                        }}
                      />
                      {(typeof age !== 'number' || isNaN(age) || age < 13 || age > 100) && (
                        <span style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                          Please enter a valid age between 13 and 100.
                        </span>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Sex / Gender</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other / Non-Binary</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 3: Routine Habits */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={badgeStyle}>
                      <Droplets size={16} /> Daily Foundation Habits
                    </div>
                    <div style={ageCalloutStyle}>
                      <Sparkles size={14} /> Suggested based on your age group: <strong>{activeBracket.label}</strong>
                    </div>
                  </div>
                  <h2 style={cardTitleStyle}>Select your core daily routine goals</h2>
                  <p style={cardDescStyle}>Toggle "Yes" for habits you want pre-loaded into your tracker.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {currentHabitList.slice(0, 3).map((habit) => (
                      <HabitToggleRow
                        key={habit.id}
                        habit={habit}
                        selected={selectedHabitIds[habit.id] !== false}
                        onToggle={() => toggleHabit(habit.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 4: Fitness & Mindfulness Habits */}
              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={badgeStyle}>
                      <Dumbbell size={16} /> Fitness & Mind Habits
                    </div>
                    <div style={ageCalloutStyle}>
                      <Sparkles size={14} /> Suggested based on your age group: <strong>{activeBracket.label}</strong>
                    </div>
                  </div>
                  <h2 style={cardTitleStyle}>Active lifestyle & mental clarity</h2>
                  <p style={cardDescStyle}>Would you like to track any of these recommended habits?</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {currentHabitList.slice(3, 6).map((habit) => (
                      <HabitToggleRow
                        key={habit.id}
                        habit={habit}
                        selected={selectedHabitIds[habit.id] !== false}
                        onToggle={() => toggleHabit(habit.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 5: Wellness & Focus Habits */}
              {currentStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={badgeStyle}>
                      <PenTool size={16} /> Wellness & Focus Habits
                    </div>
                    <div style={ageCalloutStyle}>
                      <Sparkles size={14} /> Suggested based on your age group: <strong>{activeBracket.label}</strong>
                    </div>
                  </div>
                  <h2 style={cardTitleStyle}>Evening & wellness goals</h2>
                  <p style={cardDescStyle}>Select any additional habits tailored for your age group.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {currentHabitList.slice(6, 9).map((habit) => (
                      <HabitToggleRow
                        key={habit.id}
                        habit={habit}
                        selected={selectedHabitIds[habit.id] !== false}
                        onToggle={() => toggleHabit(habit.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 6: Review & Final Confirmation */}
              {currentStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={badgeStyle}>
                      <CheckCircle2 size={16} /> Ready to Launch
                    </div>
                    <div style={ageCalloutStyle}>
                      <Sparkles size={14} /> Tailored for: <strong>{activeBracket.label}</strong>
                    </div>
                  </div>
                  <h2 style={cardTitleStyle}>Review your onboarding setup</h2>
                  <p style={cardDescStyle}>
                    We will update your profile and pre-create <strong>{selectedHabitsInCurrentBracket.length} active habits</strong> with 3 streak freezes each.
                  </p>

                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-hover)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Name:</strong> {name || session?.user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Age & Sex:</strong> {age ? `${age} years (${activeBracket.label})` : 'Not specified'} • {sex}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Pre-created Habits ({selectedHabitsInCurrentBracket.length}):</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedHabitsInCurrentBracket.map((h) => (
                        <span
                          key={h.id}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--secondary-accent-alpha)',
                            color: 'var(--secondary-accent)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          {h.emoji} {h.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {currentStep > 0 ? (
              <button
                onClick={prevStep}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={currentStep === 1 && (typeof age !== 'number' || isNaN(age) || age < 13 || age > 100)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary-accent)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: (currentStep === 1 && (typeof age !== 'number' || isNaN(age) || age < 13 || age > 100)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: (currentStep === 1 && (typeof age !== 'number' || isNaN(age) || age < 13 || age > 100)) ? 0.5 : 1,
                }}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '0.85rem 1.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary-accent)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Creating Habits...' : <>Complete Onboarding <CheckCircle2 size={18} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function HabitToggleRow({
  habit,
  selected,
  onToggle,
}: {
  habit: HabitItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: `1.5px solid ${selected ? 'var(--secondary-accent)' : 'var(--border-color)'}`,
        backgroundColor: selected ? 'var(--secondary-accent-alpha)' : 'var(--surface-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{habit.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            {habit.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {habit.category} • {habit.frequencyType}
          </div>
        </div>
      </div>

      <button
        type="button"
        style={{
          padding: '0.4rem 0.9rem',
          borderRadius: '9999px',
          border: 'none',
          backgroundColor: selected ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.1)',
          color: selected ? '#FFFFFF' : 'var(--text-muted)',
          fontWeight: 700,
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          cursor: 'pointer',
        }}
      >
        {selected ? <><Check size={14} /> Yes</> : <><X size={14} /> Skip</>}
      </button>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.35rem 0.8rem',
  borderRadius: '9999px',
  backgroundColor: 'var(--secondary-accent-alpha)',
  color: 'var(--secondary-accent)',
  fontSize: '0.8rem',
  fontWeight: 700,
  width: 'fit-content',
};

const ageCalloutStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.35rem 0.8rem',
  borderRadius: '8px',
  backgroundColor: 'var(--secondary-accent-alpha)',
  color: 'var(--secondary-accent)',
  fontSize: '0.85rem',
  fontWeight: 600,
  width: 'fit-content',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: 'var(--text)',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--surface-hover)',
  color: 'var(--text)',
  fontSize: '0.95rem',
  outline: 'none',
};
