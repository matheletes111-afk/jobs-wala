const SKILL_KEYWORDS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "python",
  "java",
  "c++",
  "sql",
  "postgresql",
  "mongodb",
  "aws",
  "docker",
  "kubernetes",
  "graphql",
  "rest",
  "html",
  "css",
  "tailwind",
  "redux",
  "git",
  "figma",
] as const;

export interface ParsedResumeResult {
  extractedText: string;
  extractedName: string | null;
  extractedEmail: string | null;
  extractedPhone: string | null;
  extractedLocation: string | null;
  skills: string[];
}

function uniquePreserveOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function normalizeTextForSearch(text: string): string {
  return text.toLowerCase();
}

export function parseResumeBuffer(buffer: Buffer): ParsedResumeResult {
  const utf8Text = buffer.toString("utf8");
  const latin1Text = buffer.toString("latin1");
  const extractedText =
    utf8Text.length >= latin1Text.length ? utf8Text : latin1Text;

  const compactText = extractedText.replace(/\0/g, " ").replace(/\s+/g, " ").trim();
  const lines = extractedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const searchText = normalizeTextForSearch(compactText);

  const emailMatch = compactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = compactText.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}/
  );

  let extractedName: string | null = null;
  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 80) continue;
    if (/@|http|www\.|\d/.test(line)) continue;
    if (!/^[A-Za-z][A-Za-z\s.'-]+$/.test(line)) continue;
    extractedName = line;
    break;
  }

  let extractedLocation: string | null = null;
  const locationLine = lines.find((line) =>
    /(location|address|city|state|country)\s*[:\-]/i.test(line)
  );
  if (locationLine) {
    const cleaned = locationLine.replace(
      /(location|address|city|state|country)\s*[:\-]\s*/i,
      ""
    );
    extractedLocation = cleaned || null;
  } else {
    const inlineLocationMatch = compactText.match(
      /\b(?:based in|location)\s*[:\-]?\s*([A-Za-z][A-Za-z\s,.-]{2,60})/i
    );
    extractedLocation = inlineLocationMatch?.[1]?.trim() || null;
  }

  const skills = uniquePreserveOrder(
    SKILL_KEYWORDS.filter((skill) => searchText.includes(skill.toLowerCase())).map(
      (skill) => skill
    )
  );

  return {
    extractedText: compactText,
    extractedName,
    extractedEmail: emailMatch?.[0] || null,
    extractedPhone: phoneMatch?.[0] || null,
    extractedLocation,
    skills,
  };
}
