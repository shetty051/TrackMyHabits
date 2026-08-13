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

export default function DashboardShell({
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

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Viewport resize listener for responsive mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileViewport(isMobile);
      if (isMobile) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const checkRooneyMood = async () => {
    try {
      const [profRes, habitsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/habits'),
      ]);
      if (profRes.ok && habitsRes.ok) {
        const profData = await profRes.json();
        const habitsData = await habitsRes.json();
        const user = profData.user;

        const hasMissed = !!user?.hasUnaddressedMissedHabit;
        if (hasMissed) {
          window.dispatchEvent(
            new CustomEvent('rooney-speak', {
              detail: {
                text: "Aww man, we missed a habit yesterday and ran out of freezes! 💔 Streak reset, but don't give up — let me help you build a new streak today!",
                expression: 'ROASTING',
                mode: 'prominent',
              },
            })
          );
        }
      }
    } catch (err) {
      console.error('Failed Rooney mood evaluation:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      checkRooneyMood();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    const checkTutorialState = () => {
      if (
        searchParams.get('tutorial') === 'true' ||
        (typeof window !== 'undefined' && sessionStorage.getItem('tmh_tutorial_active') === 'true')
      ) {
        setInternalTutorialActive(true);
      }
    };

    checkTutorialState();

    const handleStartTutorial = () => {
      setInternalTutorialActive(true);
    };

    window.addEventListener('tmh-start-tutorial', handleStartTutorial);
    return () => window.removeEventListener('tmh-start-tutorial', handleStartTutorial);
  }, [searchParams, pathname]);

  const isTutorialOpen = !!externalTutorialActive || internalTutorialActive;

  const navItems = [
    { id: 'nav-item-home', label: 'Home', href: '/', icon: <Home size={20} /> },
    { id: 'nav-item-habits', label: 'My Habits', href: '/habits', icon: <CheckSquare size={20} /> },
    { id: 'nav-item-insights', label: 'Insights', href: '/insights', icon: <BarChart3 size={20} /> },
    { id: 'nav-item-rewards', label: 'Rewards', href: '/rewards', icon: <Award size={20} /> },
    { id: 'nav-item-profile', label: 'Profile', href: '/profile', icon: <User size={20} /> },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleMarkAsRead = async (notificationId?: string, all?: boolean) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, all }),
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/habits':
        return 'My Habits';
      case '/insights':
        return 'Insights & Analytics';
      case '/rewards':
        return 'Rewards & Badges';
      case '/profile':
        return 'User Profile';
      default:
        return 'TrackMyHabits';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface)', position: 'relative' }}>
      {/* Single Global Rooney Companion Instance */}
      <Rooney
        mode={rooneyMode}
        showIntroOnLoad={showIntroOnLoad}
        onIntroComplete={onIntroComplete}
        onModeChange={onRooneyModeChange}
      />

      {/* Guided Tutorial Overlay */}
      <GuidedTutorial
        active={isTutorialOpen}
        onComplete={() => {
          setInternalTutorialActive(false);
          if (onTutorialClose) onTutorialClose();
          fetch('/api/user/tutorial-complete', { method: 'POST' }).catch(console.error);
        }}
      />

      {/* MOBILE BACKDROP & DRAWER OVERLAY (<768px) */}
      <AnimatePresence>
        {isMobileViewport && isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                zIndex: 90,
              }}
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                backgroundColor: 'var(--surface-card)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem 1.25rem',
                zIndex: 100,
                boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
              }}
            >
              {/* Mobile Drawer Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--primary-accent)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                      }}
                    >
                      T
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
                      TrackMyHabits
                    </span>
                  </Link>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Mobile Drawer Navigation Links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        id={item.id}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          color: isActive ? 'var(--secondary-accent)' : 'var(--text-muted)',
                          backgroundColor: isActive ? 'var(--secondary-accent-alpha)' : 'transparent',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '1rem',
                          textDecoration: 'none',
                        }}
                      >
                        <span style={{ color: isActive ? 'var(--secondary-accent)' : 'inherit' }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Logout */}
              <div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'rgba(239, 68, 68, 0.9)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR (Visible >=768px) */}
      {!isMobileViewport && (
        <aside
          id="nav-sidebar"
          style={{
            width: collapsed ? '80px' : '260px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'var(--surface-card)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 1rem',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {!collapsed && (
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    T
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
                    TrackMyHabits
                  </span>
                </Link>
              )}

              <button
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Toggle sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Menu size={20} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    id={item.id}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      color: isActive ? 'var(--secondary-accent)' : 'var(--text-muted)',
                      backgroundColor: isActive ? 'var(--secondary-accent-alpha)' : 'transparent',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.95rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--secondary-accent)' : 'inherit' }}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'rgba(239, 68, 68, 0.9)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              <LogOut size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '70px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobileViewport ? '0 1rem' : '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Mobile Hamburger & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {isMobileViewport && (
              <button
                id="mobile-hamburger-btn"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile navigation"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface-hover)',
                  color: 'var(--text)',
                  borderRadius: '10px',
                  padding: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Menu size={20} />
              </button>
            )}

            <h1 className="responsive-title" style={{ fontWeight: 800, color: 'var(--text)' }}>
              {getPageTitle()}
            </h1>
          </div>

          {/* Top Bar Actions: Notification Bell + Theme Toggle */}
          <div id="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            {/* Notification Bell Icon with Dynamic Unread Badge */}
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Notifications"
              style={{
                position: 'relative',
                background: 'none',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-hover)',
                color: 'var(--text)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--primary-accent)',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 2px var(--surface-card)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '52px',
                    right: 0,
                    width: isMobileViewport ? 'calc(100vw - 2rem)' : '360px',
                    maxWidth: '360px',
                    maxHeight: '440px',
                    borderRadius: '18px',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 16px 40px var(--shadow-color)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                      <Bell size={16} style={{ color: 'var(--secondary-accent)' }} /> Notifications
                      {unreadCount > 0 && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: 'var(--secondary-accent-alpha)', color: 'var(--secondary-accent)' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={() => handleMarkAsRead(undefined, true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--secondary-accent)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                          style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: notif.read ? 'transparent' : 'var(--secondary-accent-alpha)',
                            cursor: notif.read ? 'default' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.45, fontWeight: notif.read ? 400 : 600 }}>
                              {notif.message}
                            </p>
                            {!notif.read && (
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--secondary-accent)',
                                  flexShrink: 0,
                                  marginTop: '4px',
                                }}
                              />
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ThemeToggle />
          </div>
        </header>

        {/* Route Page Content */}
        <main
          className="mobile-padding"
          style={{
            flex: 1,
            padding: isMobileViewport ? '1.25rem 0.85rem' : '2rem',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
