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

  const [stepIndex, setStepIndex] = useState(0);
  const [dockedTop, setDockedTop] = useState(false);

  useEffect(() => {
    let denominator = 1;
    try {
      if (window.localStorage.getItem('stepDenominator')) {
        denominator = Number(window.localStorage.getItem('stepDenominator')) || 2;
      }
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
      <span className="brace">{'{'}</span>
      <span className="intro-text">{current.inner}</span>
      {current.cursor && <span className="intro-cursor">{current.cursor}</span>}
      <span className="brace">{'}'}</span>
    </h1>
  );
};
