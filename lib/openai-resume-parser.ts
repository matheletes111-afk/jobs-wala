import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { z } from "zod";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface StructuredResumeData {
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
  extractedText: z.string().default(""),
  name: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().int().nonnegative().nullable().default(null),
  currentTitle: z.string().nullable().default(null),
  education: z.array(z.string()).default([]),
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
                "Extract this resume into strict JSON with keys: extractedText, name, email, phone, location, skills, experienceYears, currentTitle, education, summary. " +
                "Rules: return only valid JSON. Keep extractedText as plain text summary of resume content (max 12000 chars). skills must be string[]. experienceYears must be number or null.",
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

