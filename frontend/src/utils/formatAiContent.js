/**
 * Parses AI-generated clinical text into structured blocks for premium rendering.
 */
export const parseAiContent = (text = "") => {
  if (!text?.trim()) return { sections: [], paragraphs: [] };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let current = null;
  const paragraphs = [];

  lines.forEach((line) => {
    const boldHeading = line.match(/^\*\*(.+?)\*\*:?$/);
    const plainHeading = !boldHeading && line.match(/^([A-Z][A-Za-z\s/&-]{2,}):$/);

    if (boldHeading || plainHeading) {
      if (current) sections.push(current);
      current = { title: (boldHeading?.[1] || plainHeading?.[1]).trim(), items: [] };
      return;
    }

    const bullet = line.match(/^[-•*]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    const cleaned = (bullet?.[1] || numbered?.[1] || line)
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/^🚨\s*/, "")
      .replace(/^✅\s*/, "")
      .trim();

    if (current) {
      current.items.push(cleaned);
    } else if (bullet || numbered) {
      if (!current) current = { title: "Clinical Notes", items: [] };
      current.items.push(cleaned);
    } else {
      paragraphs.push(cleaned);
    }
  });

  if (current) sections.push(current);
  return { sections, paragraphs };
};

export const mergeSections = (apiSections = [], content = "") => {
  if (apiSections?.length) {
    return apiSections.map((s) => ({
      title: s.title,
      items: (s.items || []).map((i) => (typeof i === "string" ? i : i.text || i.finding || "")),
    }));
  }
  return parseAiContent(content).sections;
};
