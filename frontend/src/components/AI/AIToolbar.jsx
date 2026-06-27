import React, { useState } from "react";
import { Copy, Download, RefreshCcw, Check } from "lucide-react";

const AIToolbar = ({ content, onRefresh, exportTitle = "Clinical AI Insight" }) => {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const exportPdf = () => {
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const safeTitle = exportTitle.replace(/</g, "");
    const safeContent = content.replace(/</g, "&lt;");
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${safeTitle}</title>
<style>
  body{font-family:"Segoe UI",system-ui,sans-serif;padding:32px;color:#1a1a2e;line-height:1.65;max-width:720px;margin:0 auto}
  h1{font-size:1.1rem;font-weight:600;border-bottom:2px solid #0d6efd;padding-bottom:8px;margin-bottom:20px}
  pre{white-space:pre-wrap;font-family:inherit;font-size:0.9rem}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #dee2e6;font-size:0.8rem;color:#6c757d}
</style></head><body>
<h1>${safeTitle}</h1>
<pre>${safeContent}</pre>
<div class="footer">This AI output is for clinical decision support only. The licensed clinician remains the final decision maker.</div>
</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (!content && !onRefresh) return null;

  return (
    <div className="ai-toolbar" role="toolbar" aria-label="AI insight actions">
      {onRefresh && (
        <button type="button" className="ai-toolbar-btn" onClick={onRefresh} aria-label="Regenerate insight">
          <RefreshCcw size={14} aria-hidden="true" />
          <span className="d-none d-sm-inline">Regenerate</span>
        </button>
      )}
      {content && (
        <>
          <button
            type="button"
            className={`ai-toolbar-btn ${copied ? "ai-toolbar-btn-success" : ""}`}
            onClick={copyText}
            aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span className="d-none d-sm-inline">{copied ? "Copied" : "Copy"}</span>
          </button>
          <button type="button" className="ai-toolbar-btn" onClick={exportPdf} aria-label="Export as PDF">
            <Download size={14} aria-hidden="true" />
            <span className="d-none d-sm-inline">Export</span>
          </button>
        </>
      )}
    </div>
  );
};

export default AIToolbar;
