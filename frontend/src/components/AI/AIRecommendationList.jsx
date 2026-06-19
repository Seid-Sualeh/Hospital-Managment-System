import React from "react";
import { ChevronRight } from "lucide-react";

const AIRecommendationList = ({
  title,
  items = [],
  emptyText = "No recommendations available.",
  variant = "default",
}) => (
  <div className={`ai-recommendation-list ai-recommendation-${variant}`}>
    {title && <h6 className="ai-recommendation-heading">{title}</h6>}
    {items?.length ? (
      <ul className="ai-recommendation-items mb-0">
        {items.map((item, idx) => (
          <li key={idx} className="ai-recommendation-item">
            <ChevronRight size={14} className="ai-recommendation-bullet" aria-hidden="true" />
            <span>{typeof item === "string" ? item : item.finding || item.text || ""}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="ai-recommendation-empty mb-0">{emptyText}</p>
    )}
  </div>
);

export default AIRecommendationList;
