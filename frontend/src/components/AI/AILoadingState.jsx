import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";

const STEPS = [
  "Reviewing clinical context…",
  "Analyzing patient data…",
  "Generating decision support…",
];

const AILoadingState = ({ message = "Generating clinical insight" }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ai-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="ai-loading-header">
        <Activity size={18} className="ai-loading-pulse-icon text-primary" aria-hidden="true" />
        <span className="ai-loading-title">{message}</span>
      </div>

      <div className="ai-skeleton-stack" aria-hidden="true">
        <div className="ai-skeleton-line ai-skeleton-line-lg" />
        <div className="ai-skeleton-line ai-skeleton-line-md" />
        <div className="ai-skeleton-line ai-skeleton-line-sm" />
      </div>

      <p className="ai-loading-step mb-0">{STEPS[step]}</p>
      <span className="visually-hidden">Loading AI clinical insight</span>
    </div>
  );
};

export default AILoadingState;
