'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { RooneyExpression } from '../../components/rooney/RooneyExpressions';
import {
  CheckSquare,
  Plus,
  Zap,
  Edit2,
  Trash2,
  X,
  Shield,
  Snowflake,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Habit {
  id: string;
  title: string;
  emoji: string;
  color: string;
  frequencyType: string;
  specificDays?: string | null;
  freezesRemaining: number;
  createdAt: string;
}

const EMOJI_OPTIONS = ['💧', '🌙', '👟', '🏋️‍♂️', '🧘‍♂️', '📚', '✍️', '🍏', '🧠', '🎯', '🚀', '💡'];
const COLOR_OPTIONS = ['#78866B', '#365C47', '#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#F472B6'];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [freezingHabitId, setFreezingHabitId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('⚡');
  const [color, setColor] = useState('#78866B');
  const [frequencyType, setFrequencyType] = useState('daily');
  const [specificDays, setSpecificDays] = useState('MON,WED,FRI');
  const [submitting, setSubmitting] = useState(false);

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
      }
    } catch (err) {
      console.error('Failed to fetch habits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setEmoji(habit.emoji);
    setColor(habit.color);
    setFrequencyType(habit.frequencyType);
    setSpecificDays(habit.specificDays || 'MON,WED,FRI');
  };

  // Reset Form
  const resetForm = () => {
    setTitle('');
    setEmoji('⚡');
    setColor('#78866B');
    setFrequencyType('daily');
    setSpecificDays('MON,WED,FRI');
    setIsCreateModalOpen(false);
    setEditingHabit(null);
  };

  // Create Habit
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, emoji, color, frequencyType, specificDays }),
      });

      if (!res.ok) {
        throw new Error('Failed to create habit');
      }

      resetForm();
      await fetchHabits();
    } catch (err: any) {
      alert('Error creating habit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Update Habit
  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, emoji, color, frequencyType, specificDays }),
      });

      if (!res.ok) {
        throw new Error('Failed to update habit');
      }

      resetForm();
      await fetchHabits();
    } catch (err: any) {
      alert('Error updating habit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete habit');
      }
      await fetchHabits();
    } catch (err: any) {
      alert('Error deleting habit: ' + err.message);
    }
  };

  // Use Freeze Mechanic
  const handleUseFreeze = async (habit: Habit) => {
    if (habit.freezesRemaining <= 0) return;

    setFreezingHabitId(habit.id);
    try {
      const res = await fetch(`/api/habits/${habit.id}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to use streak freeze');
      }

      const remaining = data.freezesRemaining;

      // Rooney Dialogue Reaction based on remaining freezes
      let rooneyText = '';
      let rooneyExpression = RooneyExpression.NEUTRAL;

      if (remaining === 2) {
        rooneyText = 'You just have 2 more freezes left';
        rooneyExpression = RooneyExpression.POINTING_2;
      } else if (remaining === 1) {
        rooneyText = 'You just have 1 freeze left! Use it wisely!';
        rooneyExpression = RooneyExpression.CONCERNED;
      } else if (remaining === 0) {
        rooneyText = 'You have 0 freezes left! No more safety net!';
        rooneyExpression = RooneyExpression.DISAPPOINTED;
      }

      // Dispatch global Rooney speak event
      if (rooneyText) {
        window.dispatchEvent(
          new CustomEvent('rooney-speak', {
            detail: {
              text: rooneyText,
              expression: rooneyExpression,
            },
          })
        );
      }

      await fetchHabits();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFreezingHabitId(null);
    }
  };

  return (
    <DashboardShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>My Habits</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Manage habits, customize schedules, and deploy streak freeze protections.
            </p>
          </div>
          <button
            id="create-habit-btn"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: '0.75rem 1.35rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--primary-accent)',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            <Plus size={18} /> Add New Habit
          </button>
        </header>

        {/* Habits List Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading habits...</div>
        ) : habits.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '3rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'var(--secondary-accent-alpha)',
                color: 'var(--secondary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckSquare size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No habits created yet</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.5 }}>
              Click "Add New Habit" above to create your custom habit and start tracking!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {habits.map((habit) => {
              const freezesZero = habit.freezesRemaining <= 0;
              const isFreezing = freezingHabitId === habit.id;

              return (
                <div
                  key={habit.id}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface-hover)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `6px solid ${habit.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    boxShadow: '0 4px 16px var(--shadow-color)',
                  }}
                >
                  {/* Card Top: Title, Emoji, Edit/Delete Actions */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{ fontSize: '1.75rem' }}>{habit.emoji}</span>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>
                          {habit.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenEdit(habit)}
                          title="Edit habit"
                          style={actionButtonStyle}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          title="Delete habit"
                          style={{ ...actionButtonStyle, color: '#f87171' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Schedule Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>
                        Schedule:{' '}
                        <strong style={{ color: 'var(--secondary-accent)', textTransform: 'capitalize' }}>
                          {habit.frequencyType === 'specific-days'
                            ? `Days (${habit.specificDays || 'Custom'})`
                            : habit.frequencyType}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Freezes Remaining & Use Freeze Action Button */}
                  <div
                    style={{
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Shield
                        size={16}
                        style={{ color: freezesZero ? '#f87171' : 'var(--secondary-accent)' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: freezesZero ? '#f87171' : 'var(--text)' }}>
                        {habit.freezesRemaining} Freezes Left
                      </span>
                    </div>

                    {/* Genuinely Disabled Freeze Button when 0 remaining */}
                    <button
                      onClick={() => handleUseFreeze(habit)}
                      disabled={freezesZero || isFreezing}
                      title={freezesZero ? '0 Freezes Remaining' : 'Use a streak freeze to protect today'}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '9999px',
                        border: freezesZero ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--secondary-accent)',
                        backgroundColor: freezesZero
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'var(--secondary-accent-alpha)',
                        color: freezesZero ? '#f87171' : 'var(--secondary-accent)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: freezesZero || isFreezing ? 'not-allowed' : 'pointer',
                        opacity: freezesZero ? 0.5 : isFreezing ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Snowflake size={14} />
                      {isFreezing
                        ? 'Applying...'
                        : freezesZero
                        ? '0 Freezes Left'
                        : 'Use Freeze'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Habit Modal Form */}
        {(isCreateModalOpen || editingHabit) && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              className="glass-panel"
              style={{
                maxWidth: '480px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
                  {editingHabit ? 'Edit Habit' : 'Create Custom Habit'}
                </h3>
                <button
                  onClick={resetForm}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
              >
                <div>
                  <label style={labelStyle}>Habit Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Read 30 mins, 10k steps..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={labelStyle}>Emoji Icon</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          border: `1.5px solid ${emoji === e ? 'var(--secondary-accent)' : 'var(--border-color)'}`,
                          backgroundColor: emoji === e ? 'var(--secondary-accent-alpha)' : 'var(--surface-hover)',
                          fontSize: '1.2rem',
                          cursor: 'pointer',
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: `2px solid ${color === c ? '#FFFFFF' : 'transparent'}`,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Frequency Schedule</label>
                  <select
                    value={frequencyType}
                    onChange={(e) => setFrequencyType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="daily">Daily</option>
                    <option value="alternate">Alternate Days</option>
                    <option value="specific-days">Specific Days</option>
                  </select>
                </div>

                {frequencyType === 'specific-days' && (
                  <div>
                    <label style={labelStyle}>Specific Days (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. MON,WED,FRI"
                      value={specificDays}
                      onChange={(e) => setSpecificDays(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Saving...' : editingHabit ? 'Update Habit' : 'Create Habit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
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
