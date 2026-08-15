'use client';

import React, { Suspense } from 'react';
import DashboardShellContent from './DashboardShellContent';
import { RooneyMode } from '../rooney/Rooney';

interface DashboardShellProps {
  children: React.ReactNode;
  rooneyMode?: RooneyMode;
  showIntroOnLoad?: boolean;
  onIntroComplete?: () => void;
  onRooneyModeChange?: (mode: RooneyMode) => void;
  tutorialActive?: boolean;
  onTutorialClose?: () => void;
}

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardShellContent {...props} />
    </Suspense>
  );
}
