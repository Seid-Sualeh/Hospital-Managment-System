import React, { useId, useState } from "react";
import { ChevronDown, Sparkles, FileText, Stethoscope, Pill, FlaskConical, BarChart3 } from "lucide-react";
import AIActionButton from "./AIActionButton";
import AIResponsePanel from "./AIResponsePanel";
import AIStatusChip from "./AIStatusChip";

const PANEL_ICONS = {
  summary: FileText,
  diagnosis: Stethoscope,
  medication: Pill,
  lab: FlaskConical,
  pharmacy: Pill,
  dashboard: BarChart3,
  default: Sparkles,
};

const getPanelStatus = (loading, error, content, sections) => {
  if (loading) return "loading";
  if (error) return "error";
  if (content || sections?.length) return "success";
  return "idle";
};

const AICollapsiblePanel = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  loading = false,
  content,
  sections = [],
  error = null,
  onRefresh,
  defaultOpen = false,
  variant = "default",
  disabled = false,
  disabledReason,
  children,
  emptyTitle,
  emptyDescription,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const bodyId = `${panelId}-body`;
  const Icon = PANEL_ICONS[variant] || PANEL_ICONS.default;
  const status = getPanelStatus(loading, error, content, sections);
  const hasResult = status === "success";

  const handleToggle = () => setOpen((v) => !v);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <section
      className={`ai-collapsible-panel ai-panel-variant-${variant} ${open ? "is-open" : ""} ${hasResult ? "has-result" : ""}`}
      aria-labelledby={panelId}
    >
      <div className="ai-collapsible-header">
        <button
          type="button"
          className="ai-collapsible-toggle"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-controls={bodyId}
          id={panelId}
        >
          <span className={`ai-panel-icon ai-panel-icon-${variant}`} aria-hidden="true">
            <Icon size={17} />
          </span>
          <span className="ai-collapsible-titles">
            <span className="ai-collapsible-title">{title}</span>
            {subtitle && <span className="ai-collapsible-subtitle">{subtitle}</span>}
          </span>
          <AIStatusChip status={status} />
          <ChevronDown size={18} className={`ai-collapsible-chevron ${open ? "is-open" : ""}`} aria-hidden="true" />
        </button>

        {actionLabel && onAction && (
          <div className="ai-collapsible-actions">
            <AIActionButton
              onClick={onAction}
              loading={loading}
              disabled={disabled}
              aria-label={actionLabel}
              title={disabled ? disabledReason : undefined}
            >
              <span className="ai-action-label-full">{actionLabel}</span>
              <span className="ai-action-label-short">Generate</span>
            </AIActionButton>
          </div>
        )}
      </div>

      <div
        id={bodyId}
        className="ai-collapsible-body"
        role="region"
        aria-labelledby={panelId}
        hidden={!open}
      >
        {children || (
          <AIResponsePanel
            content={content}
            sections={sections}
            loading={loading}
            error={error}
            onRefresh={onRefresh}
            exportTitle={title}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        )}
      </div>
    </section>
  );
};

export default AICollapsiblePanel;
