'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'error',
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return '#EF4444';
      case 'success':
        return '#10B981';
      case 'info':
      default:
        return 'var(--primary-accent)';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={18} color="#FFFFFF" />;
      case 'success':
        return <CheckCircle2 size={18} color="#FFFFFF" />;
      case 'info':
      default:
        return <Info size={18} color="#FFFFFF" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: getBgColor(),
        color: '#FFFFFF',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        zIndex: 9999,
        fontSize: '0.88rem',
        fontWeight: 600,
        maxWidth: 'calc(100vw - 32px)',
        animation: 'fadeInUp 0.25s ease-out forwards',
      }}
    >
      {getIcon()}
      <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
