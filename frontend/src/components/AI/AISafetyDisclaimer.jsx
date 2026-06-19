import React from "react";
import { ShieldAlert } from "lucide-react";
import { AI_DISCLAIMER } from "../../constants/ai";

const AISafetyDisclaimer = ({ message = AI_DISCLAIMER, className = "" }) => (
  <aside className={`ai-disclaimer ${className}`} role="note" aria-label="Clinical decision support disclaimer">
    <ShieldAlert size={16} className="ai-disclaimer-icon" aria-hidden="true" />
    <div>
      <strong className="ai-disclaimer-label">Clinical Decision Support</strong>
      <p className="ai-disclaimer-text mb-0">{message}</p>
    </div>
  </aside>
);

export default AISafetyDisclaimer;
