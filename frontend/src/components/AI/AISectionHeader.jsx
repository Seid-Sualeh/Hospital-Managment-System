import React from "react";
import { Sparkles } from "lucide-react";

const AISectionHeader = ({
  title = "Clinical Decision Support",
  subtitle = "AI-assisted insights for licensed clinicians. Not a substitute for clinical judgment.",
}) => (
  <header className="ai-section-header mb-3">
    <div className="ai-section-header-main">
      <div className="ai-section-header-icon" aria-hidden="true">
        <Sparkles size={18} />
      </div>
      <div>
        <h5 className="ai-section-header-title mb-1">{title}</h5>
        <p className="ai-section-header-subtitle mb-0">{subtitle}</p>
      </div>
    </div>
    <span className="ai-section-header-tag">Powered by Gemini</span>
  </header>
);

export default AISectionHeader;
