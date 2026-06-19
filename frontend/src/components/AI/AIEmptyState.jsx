import React from "react";
import { BrainCircuit } from "lucide-react";

const AIEmptyState = ({
  title = "No clinical insight generated",
  description = "Run the analysis to receive AI-assisted decision support for this record.",
}) => (
  <div className="ai-empty-state" role="status">
    <div className="ai-empty-state-icon" aria-hidden="true">
      <BrainCircuit size={28} />
    </div>
    <h6 className="ai-empty-state-title">{title}</h6>
    <p className="ai-empty-state-desc mb-0">{description}</p>
  </div>
);

export default AIEmptyState;
