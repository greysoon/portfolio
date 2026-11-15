import React, { useEffect, useMemo, useState } from 'react';
import { siteConfig } from '../config/siteConfig';

interface TypingHeaderProps {
  onComplete: () => void;
}

interface AnimStep {
  inner: string;
  cursor: string;
  ms: number;
}

export const TypingHeader: React.FC<TypingHeaderProps> = ({ onComplete }) => {
  const steps = useMemo<AnimStep[]>(() => {
    const target = siteConfig.headerText;
    const seq: AnimStep[] = [
      { inner: '', cursor: ' ', ms: 180 },
      { inner: '', cursor: '_', ms: 180 },
      { inner: '', cursor: ' ', ms: 180 },
      { inner: '', cursor: '_', ms: 180 },
    ];

    for (let i = 1; i <= target.length; i++) {
      seq.push({
        inner: target.slice(0, i),
        cursor: '_',
        ms: 75,
      });
    }

    seq.push(
      { inner: target, cursor: ' ', ms: 180 },
      { inner: target, cursor: '_', ms: 180 },
      { inner: target, cursor: ' ', ms: 180 },
      { inner: target, cursor: '', ms: 160 }
    );

    return seq;
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const [stepIndex, setStepIndex] = useState(() =>
    prefersReducedMotion ? steps.length - 1 : 0
  );
  const [dockedTop, setDockedTop] = useState(() => prefersReducedMotion);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setStepIndex(steps.length - 1);
      setDockedTop(true);
      onComplete();
      return;
    }

    let denominator = 1;
    try {
      const raw = window.localStorage.getItem('stepDenominator');
      const parsed = raw !== null ? Number(raw) : NaN;
      denominator =
        Number.isFinite(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 1;
    } catch {
      denominator = 1;
    }

    if (stepIndex < steps.length - 1) {
      const delay = Math.max(25, steps[stepIndex].ms / denominator);
      const timer = window.setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, delay);
      return () => window.clearTimeout(timer);
    } else {
      setDockedTop(true);
      try {
        window.localStorage.setItem('stepDenominator', '2');
      } catch {
        // Ignore storage errors
      }
      const finishTimer = window.setTimeout(() => {
        onComplete();
      }, 450);
      return () => window.clearTimeout(finishTimer);
    }
  }, [stepIndex, steps, onComplete]);

  const current = steps[stepIndex] ?? { inner: siteConfig.headerText, cursor: '', ms: 0 };

  return (
    <h1
      id="intro"
      className={`intro-header ${dockedTop ? 'top' : ''}`}
      aria-label={`{${siteConfig.headerText}}`}
    >
      <span className="sr-only">{siteConfig.headerText}</span>
      <span className="brace" aria-hidden="true">
        {'{'}
      </span>
      <span className="intro-text" aria-hidden="true">
        {current.inner}
      </span>
      {current.cursor && (
        <span className="intro-cursor" aria-hidden="true">
          {current.cursor}
        </span>
      )}
      <span className="brace" aria-hidden="true">
        {'}'}
      </span>
    </h1>
  );
};
