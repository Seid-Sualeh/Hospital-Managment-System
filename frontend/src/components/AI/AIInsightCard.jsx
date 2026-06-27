import React from "react";
import { Sparkles } from "lucide-react";

const AIInsightCard = ({
  title,
  subtitle,
  icon: Icon = Sparkles,
  variant = "primary",
  children,
  className = "",
  loading = false,
}) => (
  <article className={`ai-insight-card ai-insight-card-${variant} mc-card h-100 ${className}`}>
    <div className="mc-card-body">
      <header className="ai-insight-card-header">
        <div className={`ai-insight-icon ai-insight-icon-${variant}`} aria-hidden="true">
          <Icon size={18} />
        </div>
        <div className="ai-insight-card-titles">
          <h6 className="ai-insight-card-title mb-0">{title}</h6>
          {subtitle && <p className="ai-insight-card-subtitle mb-0">{subtitle}</p>}
        </div>
      </header>
      <div className={`ai-insight-card-content ${loading ? "is-loading" : ""}`}>
        {children}
      </div>
    </div>
  </article>
);

export default AIInsightCard;
