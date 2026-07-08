import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { z } from "zod";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface StructuredResumeData {
  isResume?: boolean;
  extractedText: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  experienceYears: number | null;
  currentTitle: string | null;
  education: string[];
  summary: string | null;
}

const resumeSchema = z.object({
  isResume: z.boolean().default(true),
  extractedText: z.string().default(""),
  name: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  skills: z.preprocess((val) => {
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.string()).default([])),
  experienceYears: z.preprocess((val) => {
    if (typeof val === "string") {
      const match = val.match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : null;
    }
    if (typeof val === "number") return val;
    return null;
  }, z.number().nonnegative().nullable().default(null)),
  currentTitle: z.string().nullable().default(null),
  education: z.preprocess((val) => {
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.string()).default([])),
  summary: z.string().nullable().default(null),
});

function fallbackParse(text: string): StructuredResumeData {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}/
  );
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const nameCandidate =
    lines.find((line) => /^[A-Za-z][A-Za-z\s.'-]{2,60}$/.test(line)) ?? null;

  // Filter out random non-resume documents that don't have basic contact details
  if (!emailMatch && !phoneMatch && !nameCandidate) {
    return {
      isResume: false,
      extractedText: text.trim(),
      name: null,
      email: null,
      phone: null,
      location: null,
      skills: [],
      experienceYears: null,
      currentTitle: null,
      education: [],
      summary: null,
    };
  }

  const defaultSkills = [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "python",
    "java",
    "sql",
    "aws",
    "docker",
    "mongodb",
    "postgresql",
    "html",
    "css",
    "tailwind",
    "graphql",
    "git",
  ];
  const lower = text.toLowerCase();
  const skills = defaultSkills.filter((skill) => lower.includes(skill));

  return {
    isResume: true,
    extractedText: text.trim(),
    name: nameCandidate,
    email: emailMatch?.[0] ?? null,
    phone: phoneMatch?.[0] ?? null,
    location: null,
    skills,
    experienceYears: null,
    currentTitle: null,
    education: [],
    summary: null,
  };
}

function normalizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  const cleaned = skills
    .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

export async function parseResumeWithOpenAI(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StructuredResumeData> {
  if (!openai) return fallbackParse("");

  let uploadedFileId: string | null = null;
  try {
    const uploaded = await openai.files.create({
      file: await toFile(fileBuffer, fileName, { type: mimeType }),
      purpose: "assistants",
    });
    uploadedFileId = uploaded.id;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploaded.id,
            },
            {
              type: "input_text",
              text:
                "Extract this resume into strict JSON with keys: isResume, extractedText, name, email, phone, location, skills, experienceYears, currentTitle, education, summary. " +
                "Rules: return only valid JSON. Set isResume to true if the document is a candidate's resume/CV, or false if it is a general document, answer sheet, tutorial, assignment, or non-CV text. Keep extractedText as plain text summary of resume content (max 12000 chars). skills must be string[]. experienceYears must be number or null.",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_schema",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              isResume: { type: "boolean", description: "Whether this document is a candidate's resume/CV" },
              extractedText: { type: "string" },
              name: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              phone: { type: ["string", "null"] },
              location: { type: ["string", "null"] },
              skills: { type: "array", items: { type: "string" } },
              experienceYears: { type: ["number", "null"] },
              currentTitle: { type: ["string", "null"] },
              education: { type: "array", items: { type: "string" } },
              summary: { type: ["string", "null"] },
            },
            required: [
              "isResume",
              "extractedText",
              "name",
              "email",
              "phone",
              "location",
              "skills",
              "experienceYears",
              "currentTitle",
              "education",
              "summary",
            ],
          },
        },
      },
    });

    const raw = response.output_text?.trim();
    if (!raw) return fallbackParse("");
    const parsed = resumeSchema.parse(JSON.parse(raw));

    return {
      isResume: parsed.isResume,
      extractedText: parsed.extractedText.slice(0, 12000),
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      skills: normalizeSkills(parsed.skills),
      experienceYears:
        parsed.experienceYears != null ? Math.max(0, Math.round(parsed.experienceYears)) : null,
      currentTitle: parsed.currentTitle,
      education: parsed.education,
      summary: parsed.summary,
    };
  } catch (error) {
    console.warn("[openai-resume-parser] falling back to heuristic parser", error);
    return fallbackParse("");
  } finally {
    if (openai && uploadedFileId) {
      try {
        await openai.files.delete(uploadedFileId);
      } catch {
        // no-op
      }
    }
  }
}

export interface DetailedResumeData {
  isResume?: boolean;
  extractedText: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  experienceYears: number | null;
  currentTitle: string | null;
  education: string[];
  summary: string | null;
  linkedinUrl: string | null;
  highestEducation: string | null;
  noticePeriod: string | null;
  dateOfBirth: string | null;
}

const detailedResumeSchema = z.object({
  isResume: z.boolean().default(true),
  extractedText: z.string().default(""),
  name: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  skills: z.preprocess((val) => {
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.string()).default([])),
  experienceYears: z.preprocess((val) => {
    if (typeof val === "string") {
      const match = val.match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : null;
    }
    if (typeof val === "number") return val;
    return null;
  }, z.number().nonnegative().nullable().default(null)),
  currentTitle: z.string().nullable().default(null),
  education: z.preprocess((val) => {
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.string()).default([])),
  summary: z.string().nullable().default(null),
  linkedinUrl: z.string().nullable().default(null),
  highestEducation: z.string().nullable().default(null),
  noticePeriod: z.string().nullable().default(null),
  dateOfBirth: z.string().nullable().default(null),
});

export async function parseResumeDetailedWithOpenAI(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DetailedResumeData> {
  if (!openai) {
    const fallback = fallbackParse("");
    return {
      ...fallback,
      linkedinUrl: null,
      highestEducation: null,
      noticePeriod: null,
      dateOfBirth: null,
    };
  }

  let uploadedFileId: string | null = null;
  try {
    const uploaded = await openai.files.create({
      file: await toFile(fileBuffer, fileName, { type: mimeType }),
      purpose: "assistants",
    });
    uploadedFileId = uploaded.id;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploaded.id,
            },
            {
              type: "input_text",
              text:
                "Extract this resume into strict JSON with keys: isResume, extractedText, name, email, phone, location, skills, experienceYears, currentTitle, education, summary, linkedinUrl, highestEducation, noticePeriod, dateOfBirth. " +
                "Rules: return only valid JSON. Set isResume to true if the document is a candidate's resume/CV, or false if it is a general document, answer sheet, tutorial, assignment, or non-CV text. Keep extractedText as plain text summary of resume content (max 12000 chars). skills must be string[]. experienceYears must be number or null. Extract linkedinUrl as string or null. Extract highestEducation (e.g. B.Tech, MBA) as string or null. Extract noticePeriod as string or null. Extract dateOfBirth (YYYY-MM-DD) as string or null.",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "detailed_resume_schema",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              isResume: { type: "boolean", description: "Whether this document is a candidate's resume/CV" },
              extractedText: { type: "string" },
              name: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              phone: { type: ["string", "null"] },
              location: { type: ["string", "null"] },
              skills: { type: "array", items: { type: "string" } },
              experienceYears: { type: ["number", "null"] },
              currentTitle: { type: ["string", "null"] },
              education: { type: "array", items: { type: "string" } },
              summary: { type: ["string", "null"] },
              linkedinUrl: { type: ["string", "null"] },
              highestEducation: { type: ["string", "null"] },
              noticePeriod: { type: ["string", "null"] },
              dateOfBirth: { type: ["string", "null"] },
            },
            required: [
              "isResume",
              "extractedText",
              "name",
              "email",
              "phone",
              "location",
              "skills",
              "experienceYears",
              "currentTitle",
              "education",
              "summary",
              "linkedinUrl",
              "highestEducation",
              "noticePeriod",
              "dateOfBirth",
            ],
          },
        },
      },
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      const fallback = fallbackParse("");
      return { ...fallback, linkedinUrl: null, highestEducation: null, noticePeriod: null, dateOfBirth: null };
    }
    const parsed = detailedResumeSchema.parse(JSON.parse(raw));

    return {
      isResume: parsed.isResume,
      extractedText: parsed.extractedText.slice(0, 12000),
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      skills: normalizeSkills(parsed.skills),
      experienceYears:
        parsed.experienceYears != null ? Math.max(0, Math.round(parsed.experienceYears)) : null,
      currentTitle: parsed.currentTitle,
      education: parsed.education,
      summary: parsed.summary,
      linkedinUrl: parsed.linkedinUrl,
      highestEducation: parsed.highestEducation,
      noticePeriod: parsed.noticePeriod,
      dateOfBirth: parsed.dateOfBirth,
    };
  } catch (error) {
    console.warn("[openai-resume-parser] falling back to heuristic parser in detailed route", error);
    const fallback = fallbackParse("");
    return { ...fallback, linkedinUrl: null, highestEducation: null, noticePeriod: null, dateOfBirth: null };
  } finally {
    if (openai && uploadedFileId) {
      try {
        await openai.files.delete(uploadedFileId);
      } catch {
        // no-op
      }
    }
  }
}

export function guessNameFromFilename(filename: string): string | null {
  if (!filename) return null;
  // Remove extension
  let clean = filename.replace(/\.[^/.]+$/, "");
  // Remove brackets and parentheses content (e.g. [10y_3m], (1))
  clean = clean.replace(/\[[^\]]*\]/g, "").replace(/\([^)]*\)/g, "");
  // Replace underscores, hyphens, and multiple spaces with a single space
  clean = clean.replace(/[_-]+/g, " ").trim();
  // Remove common prefixes like "Naukri", "Resume", "CV", "Profile" (case-insensitive)
  clean = clean.replace(/^(naukri|resume|cv|profile|doc|draft|updated|latest)\b/i, "").trim();
  
  // If it's CamelCase (e.g. VijaySingh), add spaces before capitals
  if (/^[A-Z][a-z]+[A-Z][a-z]+/.test(clean)) {
    clean = clean.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  // Capitalize first letter of each word
  clean = clean.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();

  return clean || null;
}

