'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Camera,
  Edit2,
  Mail,
  Calendar,
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
  X,
  Lock,
  Shield,
  Zap,
} from 'lucide-react';

interface UnlockedBadge {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  age?: number | null;
  sex?: string | null;
  avatarUrl?: string | null;
  profileCompleteness: number;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<UnlockedBadge | null>(null);

  // Edit Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [sex, setSex] = useState('Male');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setUnlockedBadges(data.unlockedBadges || []);
        setName(data.user.name || '');
        setAge(data.user.age || '');
        setSex(data.user.sex || 'Male');
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload avatar');
      }

      await fetchProfile();
    } catch (err: any) {
      alert('Error uploading avatar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Update Profile Demographics Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age: Number(age) || null, sex }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setIsEditModalOpen(false);
      await fetchProfile();
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading profile details...
        </div>
      </DashboardShell>
    );
  }

  const fieldStatus = [
    { label: 'Account Email', filled: !!profile?.email, weight: '20%' },
    { label: 'Full Name', filled: !!profile?.name && profile.name.trim().length > 0, weight: '20%' },
    { label: 'Age', filled: !!profile?.age && profile.age > 0, weight: '20%' },
    { label: 'Sex / Gender', filled: !!profile?.sex && profile.sex.trim().length > 0, weight: '20%' },
    { label: 'Custom Avatar', filled: !!profile?.avatarUrl && profile.avatarUrl.trim().length > 0, weight: '20%' },
  ];

  return (
    <DashboardShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header id="profile-overview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>User Profile</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Manage personal details, avatar image, and showcase earned trophies.
            </p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
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
            <Edit2 size={16} /> Edit Profile Details
          </button>
        </header>

        {/* Top Section: Avatar & User Summary Card */}
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap',
            borderRadius: '24px',
          }}
        >
          {/* Avatar Picture Uploader */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: 'var(--surface-hover)',
                border: '3px solid var(--secondary-accent)',
                boxShadow: '0 8px 24px var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="User Avatar"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--secondary-accent)' }}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarFileChange}
              style={{ display: 'none' }}
            />

            {/* Camera Upload Button Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload new avatar image"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-accent)',
                color: '#FFFFFF',
                border: '2px solid var(--surface-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              }}
            >
              <Camera size={18} />
            </button>
          </div>

          {/* User Details Overview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)' }}>
                {profile?.name || 'Habit Master'}
              </h3>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--secondary-accent-alpha)',
                  color: 'var(--secondary-accent)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Verified Member
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={16} /> {profile?.email}
              </span>
              {profile?.age && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={16} /> {profile.age} Years Old
                </span>
              )}
              {profile?.sex && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} /> {profile.sex}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} /> Joined{' '}
                {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Real Computed Profile Completeness Card */}
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
                Profile Completeness
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Fill optional details to reach 100% and unlock the "Profile Perfectionist" badge!
              </p>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--secondary-accent)' }}>
              {profile?.profileCompleteness}%
            </span>
          </div>

          {/* Animated Progress Bar Track */}
          <div
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--border-color)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${profile?.profileCompleteness}%`,
                height: '100%',
                backgroundColor: 'var(--secondary-accent)',
                borderRadius: '9999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          {/* Field Completeness Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {fieldStatus.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: item.filled ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: item.filled ? 700 : 500,
                }}
              >
                {item.filled ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--secondary-accent)' }} />
                ) : (
                  <Circle size={18} style={{ color: 'var(--border-color)' }} />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Compact Showcase of Unlocked Badges */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} style={{ color: 'var(--secondary-accent)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                Earned Badges ({unlockedBadges.length})
              </h3>
            </div>
          </div>

          {unlockedBadges.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No badges unlocked yet. Start completing habits to earn your first trophy!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {unlockedBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => setSelectedBadge(badge)}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--surface-hover)',
                    border: '1.5px solid var(--secondary-accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px var(--secondary-accent-alpha)',
                  }}
                >
                  <span style={{ fontSize: '2.25rem' }}>{badge.iconKey}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                    {badge.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--secondary-accent)', fontWeight: 700 }}>
                    Unlocked
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Demographics Modal Form */}
        {isEditModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
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
                maxWidth: '460px',
                width: '100%',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                borderRadius: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
                  Edit Personal Details
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Sex / Gender</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
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
                    disabled={saving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Badge Detail Modal Expansion */}
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
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{
                  maxWidth: '420px',
                  width: '100%',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '1.25rem',
                  borderRadius: '24px',
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

                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--secondary-accent-alpha)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.75rem',
                    boxShadow: '0 0 24px var(--secondary-accent-alpha)',
                  }}
                >
                  {selectedBadge.iconKey}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text)' }}>
                    {selectedBadge.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--secondary-accent)',
                    }}
                  >
                    {selectedBadge.category} Category
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  "{selectedBadge.description}"
                </p>

                <div
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--secondary-accent-alpha)',
                    border: '1px solid var(--secondary-accent)',
                    color: 'var(--secondary-accent)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={16} /> Earned on{' '}
                  {new Date(selectedBadge.unlockedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}

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
