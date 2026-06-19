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
                  {item}
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
