import React from "react";
import { AlertTriangle, CheckCircle2, Info, Stethoscope } from "lucide-react";
import { mergeSections, parseAiContent } from "../../utils/formatAiContent";

const SECTION_ICONS = {
  red: AlertTriangle,
  flag: AlertTriangle,
  warning: AlertTriangle,
  contraindication: AlertTriangle,
  interaction: AlertTriangle,
  differential: Stethoscope,
  diagnosis: Stethoscope,
  investigation: Info,
  recommend: CheckCircle2,
  follow: CheckCircle2,
  treatment: CheckCircle2,
  summary: Info,
};

const pickSectionIcon = (title = "") => {
  const lower = title.toLowerCase();
  const key = Object.keys(SECTION_ICONS).find((k) => lower.includes(k));
  return key ? SECTION_ICONS[key] : Info;
};

const renderItemText = (text) => {
  if (typeof text !== "string") return text;

  const criticalRegex = /\[CRITICAL\]/i;
  const highRegex = /\[HIGH\]/i;
  const lowRegex = /\[LOW\]/i;

  if (criticalRegex.test(text)) {
    const cleanedText = text.replace(criticalRegex, "").trim();
    return (
      <span className="d-inline-flex align-items-center flex-wrap gap-1">
        <span 
          className="badge bg-danger text-white border border-danger-subtle px-2 py-0.5 rounded shadow-sm fw-bold small animate-pulse" 
          style={{ animationDuration: "1.5s" }}
        >
          CRITICAL
        </span>
        <span className="fw-semibold text-danger">{cleanedText}</span>
      </span>
    );
  }

  if (highRegex.test(text)) {
    const cleanedText = text.replace(highRegex, "").trim();
    return (
      <span className="d-inline-flex align-items-center flex-wrap gap-1">
        <span 
          className="badge text-white px-2 py-0.5 rounded shadow-sm fw-bold small" 
          style={{ backgroundColor: "#e05638", border: "1px solid #d04b2e" }}
        >
          HIGH
        </span>
        <span className="fw-semibold text-dark">{cleanedText}</span>
      </span>
    );
  }

  if (lowRegex.test(text)) {
    const cleanedText = text.replace(lowRegex, "").trim();
    return (
      <span className="d-inline-flex align-items-center flex-wrap gap-1">
        <span 
          className="badge text-white px-2 py-0.5 rounded shadow-sm fw-bold small" 
          style={{ backgroundColor: "#2563eb", border: "1px solid #1d4ed8" }}
        >
          LOW
        </span>
        <span className="fw-semibold text-dark">{cleanedText}</span>
      </span>
    );
  }

  // Handle Differential Diagnoses mapping: "Malaria (82%): Patient reports..."
  const diffMatch = text.match(/^([A-Za-z\s/&-]+?)\s*\((\d+)%\):(.*)$/);
  if (diffMatch) {
    const [, name, percent, details] = diffMatch;
    const score = parseInt(percent, 10);
    const colorClass = score >= 80 ? "bg-danger" : score >= 60 ? "bg-warning text-dark" : "bg-primary";
    return (
      <span className="d-inline-flex align-items-center flex-wrap gap-1">
        <strong className="text-dark">{name}</strong>
        <span className={`badge ${colorClass} px-2 py-0.5 rounded fw-semibold ms-1 small`}>
          {percent}% Confidence
        </span>
        <span className="text-muted ms-1">{details}</span>
      </span>
    );
  }

  // Handle Lab Recommendations: "CBC: Evaluate for leukocytosis..."
  const labRecMatch = text.match(/^([A-Za-z\s/&-]+?):\s*(.+)$/);
  if (labRecMatch && labRecMatch[1].length < 25 && !text.includes("http")) {
    const [, testName, utility] = labRecMatch;
    return (
      <span className="d-inline-flex align-items-center flex-wrap gap-1">
        <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-0.5 rounded fw-bold text-uppercase border border-secondary border-opacity-20">{testName}</span>
        <span className="text-dark ms-1">{utility}</span>
      </span>
    );
  }

  return text;
};

const AIFormattedContent = ({ content = "", sections: apiSections = [] }) => {
  const sections = mergeSections(apiSections, content);
  const parsed = parseAiContent(content);
  const paragraphs = sections.length ? [] : parsed.paragraphs;

  if (!sections.length && !paragraphs.length) return null;

  return (
    <div className="ai-formatted-content">
      {paragraphs.length > 0 && (
        <div className="ai-content-lead mb-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="ai-content-paragraph mb-2">
              {p}
            </p>
          ))}
        </div>
      )}

      {sections.map((section, idx) => {
        const Icon = pickSectionIcon(section.title);
        const isAlert = /red flag|warning|contraindication|critical|severe/i.test(section.title);

        return (
          <section
            key={idx}
            className={`ai-content-section ${isAlert ? "ai-content-section-alert" : ""}`}
            aria-labelledby={`ai-section-${idx}`}
          >
            <header className="ai-content-section-header" id={`ai-section-${idx}`}>
              <span className="ai-content-section-icon" aria-hidden="true">
                <Icon size={15} />
              </span>
              <h6 className="ai-content-section-title mb-0">{section.title}</h6>
            </header>
            <ul className="ai-content-list mb-0">
              {section.items.map((item, i) => (
                <li key={i} className="ai-content-list-item">
                  {renderItemText(item)}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default AIFormattedContent;
