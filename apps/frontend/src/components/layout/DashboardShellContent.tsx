'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from '../ThemeToggle';
import Rooney, { RooneyMode } from '../rooney/Rooney';
import GuidedTutorial from '../tutorial/GuidedTutorial';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  CheckSquare,
  BarChart3,
  Award,
  User,
  LogOut,
  Menu,
  Bell,
  CheckCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  rooneyMode?: RooneyMode;
  showIntroOnLoad?: boolean;
  onIntroComplete?: () => void;
  onRooneyModeChange?: (mode: RooneyMode) => void;
  tutorialActive?: boolean;
  onTutorialClose?: () => void;
}

export default function DashboardShellContent({
  children,
  rooneyMode,
  showIntroOnLoad,
  onIntroComplete,
  onRooneyModeChange,
  tutorialActive: externalTutorialActive,
  onTutorialClose,
}: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Navigation Drawer States
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const [internalTutorialActive, setInternalTutorialActive] = useState(false);
  const tutorialActive =
    externalTutorialActive !== undefined ? externalTutorialActive : internalTutorialActive;

  // Real Notifications Drawer & Unread Count State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { label: 'Overview', href: '/', icon: Home, id: 'nav-item-overview' },
    { label: 'My Habits', href: '/habits', icon: CheckSquare, id: 'nav-item-habits' },
    { label: 'Insights & Analytics', href: '/insights', icon: BarChart3, id: 'nav-item-insights' },
    { label: 'Rewards & Badges', href: '/rewards', icon: Award, id: 'nav-item-rewards' },
    { label: 'Profile & Settings', href: '/profile', icon: User, id: 'nav-item-profile' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside
        id="nav-sidebar"
        style={{
          width: isMobileViewport ? '100%' : collapsed ? '80px' : '260px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRight: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          display: isMobileViewport && !isMobileMenuOpen ? 'none' : 'flex',
          flexDirection: 'column',
          position: isMobileViewport ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        {/* Sidebar Header / Logo */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed && !isMobileViewport ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-sage) 0%, var(--accent-sage-hover) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            {(!collapsed || isMobileViewport) && (
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                TrackMyHabits
              </span>
            )}
          </Link>

          {!isMobileViewport && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '6px',
              }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1.25rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobileViewport && setIsMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: collapsed && !isMobileViewport ? '0.85rem' : '0.75rem 1rem',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    justifyContent: collapsed && !isMobileViewport ? 'center' : 'flex-start',
                    backgroundColor: isActive ? 'var(--accent-sage-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent-sage-dark)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? 'var(--primary-accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                  {(!collapsed || isMobileViewport) && <span style={{ color: isActive ? 'var(--primary-accent)' : 'var(--text)' }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '1rem 0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: collapsed && !isMobileViewport ? '0.85rem' : '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              justifyContent: collapsed && !isMobileViewport ? 'center' : 'flex-start',
              fontWeight: 500,
              width: '100%',
              transition: 'background 0.15s ease',
            }}
          >
            <LogOut size={20} />
            {(!collapsed || isMobileViewport) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navigation Bar */}
        <header
          style={{
            height: '70px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobileViewport && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          {/* Action Tools */}
          <div id="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />

            {/* Notifications Drawer Toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  position: 'relative',
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#EF4444',
                      borderRadius: '50%',
                      border: '2px solid var(--bg-secondary)',
                    }}
                  />
                )}
              </button>

              {/* Real Notifications Dropdown Menu */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: '52px',
                      right: 0,
                      width: '340px',
                      maxWidth: 'calc(100vw - 32px)',
                      backgroundColor: 'var(--surface)',
                      opacity: 1,
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      boxShadow: '0 16px 40px var(--shadow-color), 0 4px 16px rgba(0,0,0,0.15)',
                      zIndex: 1000,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-sage-dark)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCheck size={14} /> Mark read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '320px', overflowY: 'auto', backgroundColor: 'var(--surface)' }}>
                      {notifications.length === 0 ? (
                        <div
                          style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                          }}
                        >
                          No new notifications! 🎉
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: '0.85rem 1rem',
                              borderBottom: '1px solid var(--border-color)',
                              backgroundColor: n.read ? 'var(--surface)' : 'var(--surface-card)',
                            }}
                          >
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', fontWeight: n.read ? 400 : 600 }}>
                              {n.message}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>{children}</main>
      </div>

      {/* Rooney Mascot Companion */}
      <Rooney
        mode={rooneyMode}
        showIntroOnLoad={showIntroOnLoad}
        onIntroComplete={onIntroComplete}
        onModeChange={onRooneyModeChange}
      />

      {/* Interactive Guided Onboarding Tutorial */}
      <GuidedTutorial
        active={tutorialActive}
        onComplete={() => {
          setInternalTutorialActive(false);
          if (onTutorialClose) onTutorialClose();
        }}
      />
    </div>
  );
}
