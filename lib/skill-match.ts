/** Normalize a skill label for comparison (trim + lowercase). */
export function normalizeSkillLabel(s: string): string {
  return s.trim().toLowerCase();
}

/** Lowercase alphanumeric only — strips spaces, dots, slashes (e.g. "next.js" → "nextjs"). */
export function compactAlphanumeric(s: string): string {
  return normalizeSkillLabel(s).replace(/[^a-z0-9]/g, "");
}

/** Significant tokens from a label (letters/digits runs), for word-level matching. */
function alphanumericRuns(s: string): string[] {
  const m = normalizeSkillLabel(s).match(/[a-z0-9]+/g);
  return m ?? [];
}

/**
 * Split profile/job skill fields that may be comma- or semicolon-separated in one entry.
 */
export function expandSkillTokens(skills: string[]): string[] {
  const out: string[] = [];
  for (const s of skills) {
    if (s == null || String(s).trim() === "") continue;
    const parts = String(s).split(/[,;\n]+/);
    for (const p of parts) {
      const t = p.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

const MIN_KEYWORD_LEN = 3;

function substringKeywordMatch(short: string, long: string): boolean {
  if (!short || !long) return false;
  if (short.length < MIN_KEYWORD_LEN) return short === long;
  return long.includes(short);
}

/**
 * True if a required skill matches a candidate (exact, substring, or word overlap).
 * Examples: react ↔ reactjs; next ↔ next js / next.js; laravel ↔ php laravel / laravel app.
 */
export function skillKeywordMatch(required: string, candidate: string): boolean {
  const r = compactAlphanumeric(required);
  const c = compactAlphanumeric(candidate);
  if (!r || !c) return false;
  if (r === c) return true;

  const short = r.length <= c.length ? r : c;
  const long = r.length <= c.length ? c : r;
  if (substringKeywordMatch(short, long)) return true;

  const reqRuns = alphanumericRuns(required).filter((w) => w.length >= MIN_KEYWORD_LEN);
  const candRuns = alphanumericRuns(candidate).filter((w) => w.length >= MIN_KEYWORD_LEN);

  for (const w of reqRuns) {
    if (c.includes(w)) return true;
    for (const cw of candRuns) {
      if (w === cw) return true;
      const a = w.length <= cw.length ? w : cw;
      const b = w.length <= cw.length ? cw : w;
      if (substringKeywordMatch(a, b)) return true;
    }
  }

  for (const w of candRuns) {
    if (r.includes(w)) return true;
  }

  return false;
}

export type SkillMatchResult = {
  /** 0–100, or null when the job lists no required skills */
  percent: number | null;
  matched: number;
  total: number;
  /** Required skill labels (as on the job) that matched at least one candidate token */
  matchedLabels: string[];
};

/**
 * Check if the required skill is mentioned/matched in the candidate's bio.
 */
export function skillBioMatch(required: string, bio: string): boolean {
  const reqNorm = required.toLowerCase().trim();
  const bioNorm = bio.toLowerCase();

  if (bioNorm.includes(reqNorm)) return true;

  const reqClean = compactAlphanumeric(required);
  if (!reqClean) return false;

  const bioWords = bioNorm.split(/[^a-z0-9]+/);
  if (bioWords.includes(reqClean)) return true;

  const reqRuns = alphanumericRuns(required).filter((w) => w.length >= MIN_KEYWORD_LEN);
  if (reqRuns.length > 0) {
    const bioSet = new Set(bioWords);
    if (reqRuns.every(run => bioSet.has(run))) {
      return true;
    }
  }

  return false;
}

/**
 * Share of required skills matched against candidate profile using keyword matching.
 */
export function computeSkillMatch(
  requiredSkills: string[],
  candidateSkills: string[],
  candidateBio?: string | null
): SkillMatchResult {
  const requiredRaw = expandSkillTokens(requiredSkills.map((s) => String(s)));
  const candidates = expandSkillTokens(candidateSkills.map((s) => String(s)));

  if (requiredRaw.length === 0) {
    return { percent: null, matched: 0, total: 0, matchedLabels: [] };
  }

  const seenNorm = new Set<string>();
  const uniqueRequired: string[] = [];
  for (const r of requiredRaw) {
    const key = compactAlphanumeric(r);
    if (!key || seenNorm.has(key)) continue;
    seenNorm.add(key);
    uniqueRequired.push(r);
  }

  const matchedLabels: string[] = [];
  for (const req of uniqueRequired) {
    let hit = candidates.some((cand) => skillKeywordMatch(req, cand));
    if (!hit && candidateBio) {
      hit = skillBioMatch(req, candidateBio);
    }
    if (hit) matchedLabels.push(req);
  }

  const matched = matchedLabels.length;
  const total = uniqueRequired.length;
  const percent = total === 0 ? null : Math.round((matched / total) * 100);

  return {
    percent,
    matched,
    total,
    matchedLabels,
  };
}
