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
 * True if a candidate's skill satisfies a required skill.
 * Only checks candidate→required direction (candidate contains/extends the requirement).
 * e.g. "Redux Toolkit" satisfies "Redux" ✅ (broader supersetting specific)
 *      "React Native" satisfies "React" ✅ (RN devs know React core)
 *      "React" does NOT satisfy "React Native" ❌ (web React ≠ mobile React Native)
 */
export function skillKeywordMatch(required: string, candidate: string): boolean {
  if (!required || !candidate) return false;
  // Only candidate → required direction. Not symmetric.
  return matchSkill(candidate, required);
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
  if (!required || !bio) return false;
  const reqNorm = required.toLowerCase().trim();
  const bioNorm = bio.toLowerCase();
  if (!reqNorm || !bioNorm) return false;

  // 1. Direct phrase inclusion in bio (e.g. "voice process" in bio)
  if (bioNorm.includes(reqNorm)) return true;

  // 2. Normalized alphanumeric phrase check
  const reqClean = compactAlphanumeric(required);
  if (reqClean && reqClean.length >= 3) {
    const bioClean = compactAlphanumeric(bio);
    if (bioClean.includes(reqClean)) return true;
  }

  // 3. For short skills (<= 2 chars like "c", "r", "go", "ai"):
  // Require word boundary
  if (reqNorm.length <= 2) {
    const escaped = reqNorm.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(^|[\\s/,-])${escaped}($|[\\s/,-])`, "i");
    return regex.test(bioNorm);
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

/**
 * Accurately check if a candidate's skill matches a search skill term.
 * Avoids false positive substring matches where a 1-character skill (like 'C')
 * matches any word containing that character (e.g. 'Architect', 'Service Now', 'Cloud', 'React').
 */
export function matchSkill(candidateSkill: string, searchSkill: string): boolean {
  if (!candidateSkill || !searchSkill) return false;
  const s = candidateSkill.trim().toLowerCase();
  const t = searchSkill.trim().toLowerCase();
  if (!s || !t) return false;

  // 1. Exact case-insensitive match
  if (s === t) return true;

  // 2. Normalized match (ignoring spaces, hyphens, dots, slashes)
  // e.g. "servicenow" === "service now", "node.js" === "nodejs", "react-native" === "react native"
  const normS = s.replace(/[\s\-_./]+/g, "");
  const normT = t.replace(/[\s\-_./]+/g, "");
  if (normS && normT && normS === normT) return true;

  // 3. Short skill queries (<= 2 chars like "c", "r", "go", "ai", "ui", "ux", "c#", "c++", "js", "ts", "ml"):
  // Require exact match or word-boundary token match (e.g. "C Language", "C / C++", "AI / ML")
  if (t.length <= 2) {
    const escaped = t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(^|[\\s/,-])${escaped}($|[\\s/,-])`, "i");
    return regex.test(s);
  }

  // 4. Candidate skill CONTAINS the search term (one-direction only):
  // e.g. candidate "React.js" → search "React" ✅
  //      candidate "Solutions Architect" → search "Architect" ✅
  //      candidate "Service-Now Developer" → search "Service now" ✅
  // But NOT reverse: candidate "React" → search "React Native" ❌
  if (s.includes(t) || (normS.length > normT.length && normS.includes(normT))) {
    return true;
  }

  // 5. .js / .ts suffix stripping: "React.js" ↔ "React", "Node.js" ↔ "Node"
  // Only allow candidate-contains-search direction to avoid "React" matching "React Native"
  const normSNoJs = normS.replace(/(js|ts)$/i, "");
  const normTNoJs = normT.replace(/(js|ts)$/i, "");
  if (
    normSNoJs &&
    normTNoJs &&
    normSNoJs.length >= 3 &&
    normTNoJs.length >= 3 &&
    normSNoJs.length >= normTNoJs.length &&
    normSNoJs.includes(normTNoJs)
  ) {
    return true;
  }

  return false;
}

/**
 * Check if an input query contains Boolean operators or parentheses.
 */
export function isBooleanExpression(query: string): boolean {
  if (!query || typeof query !== "string") return false;
  return /\b(AND|OR|NOT)\b|[()]/i.test(query);
}

/**
 * Tokenize a boolean expression into operators, parentheses, and skill phrase literals.
 * Correctly treats unquoted multi-word phrases (e.g. "(Service now) AND Architect") as intact search terms.
 */
export function tokenizeBooleanExpr(expr: string): string[] {
  if (!expr || typeof expr !== "string") return [];

  const tokens: string[] = [];
  const regex = /"([^"]+)"|(\b(?:AND|OR|NOT)\b)|(\()|(\))|([^"()]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(expr)) !== null) {
    if (match[1] !== undefined) {
      // Quoted string
      const term = match[1].trim();
      if (term) tokens.push(term);
    } else if (match[2] !== undefined) {
      // AND / OR / NOT
      tokens.push(match[2].toUpperCase());
    } else if (match[3] !== undefined) {
      tokens.push("(");
    } else if (match[4] !== undefined) {
      tokens.push(")");
    } else if (match[5] !== undefined) {
      // Unquoted text chunk - may contain boolean operators within
      const subTokens = match[5]
        .split(/\b(AND|OR|NOT)\b/i)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const st of subTokens) {
        const upper = st.toUpperCase();
        if (upper === "AND" || upper === "OR" || upper === "NOT") {
          tokens.push(upper);
        } else if (st) {
          tokens.push(st);
        }
      }
    }
  }

  return tokens;
}

/**
 * Extract all search terms from a boolean expression (excluding operators and parentheses)
 * Useful for highlighting matched skill badges in the UI.
 */
export function extractSearchTerms(expr: string): string[] {
  if (!expr || typeof expr !== "string") return [];
  const tokens = tokenizeBooleanExpr(expr);
  const terms: string[] = [];
  for (const t of tokens) {
    const upper = t.toUpperCase();
    if (upper !== "AND" && upper !== "OR" && upper !== "NOT" && t !== "(" && t !== ")") {
      terms.push(t);
    }
  }
  return terms;
}

/**
 * Evaluate a boolean skill expression against a candidate's list of skills.
 */
export function evaluateBooleanSkills(expr: string, candidateSkills: string[]): boolean {
  if (!expr || !expr.trim()) return true;
  if (!candidateSkills || candidateSkills.length === 0) return false;

  const tokens = tokenizeBooleanExpr(expr);
  if (tokens.length === 0) return true;

  const outputQueue: Array<{ type: "term" | "op"; value: string }> = [];
  const operatorStack: string[] = [];
  const precedence: Record<string, number> = {
    NOT: 3,
    AND: 2,
    OR: 1,
  };

  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (upper === "AND" || upper === "OR" || upper === "NOT") {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== "(" &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[upper]
      ) {
        outputQueue.push({ type: "op", value: operatorStack.pop()! });
      }
      operatorStack.push(upper);
    } else if (token === "(") {
      operatorStack.push("(");
    } else if (token === ")") {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== "("
      ) {
        outputQueue.push({ type: "op", value: operatorStack.pop()! });
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === "(") {
        operatorStack.pop(); // remove '('
      }
    } else {
      // Literal skill term
      outputQueue.push({ type: "term", value: token });
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op !== "(" && op !== ")") {
      outputQueue.push({ type: "op", value: op });
    }
  }

  // Evaluate Postfix / Reverse Polish Notation expression
  const stack: boolean[] = [];
  for (const item of outputQueue) {
    if (item.type === "op") {
      if (item.value === "AND") {
        const b = stack.length > 0 ? stack.pop()! : false;
        const a = stack.length > 0 ? stack.pop()! : false;
        stack.push(a && b);
      } else if (item.value === "OR") {
        const b = stack.length > 0 ? stack.pop()! : false;
        const a = stack.length > 0 ? stack.pop()! : false;
        stack.push(a || b);
      } else if (item.value === "NOT") {
        const a = stack.length > 0 ? stack.pop()! : false;
        stack.push(!a);
      }
    } else {
      const matched = candidateSkills.some((skill) => matchSkill(skill, item.value));
      stack.push(matched);
    }
  }

  return stack.length > 0 ? stack.pop()! : false;
}
