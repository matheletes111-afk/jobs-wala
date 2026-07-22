import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "EMPLOYER" && session.user?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: { savedXRayQueries: true }
    });

    return NextResponse.json({ queries: profile?.savedXRayQueries || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "EMPLOYER" && session.user?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, prompt, query, start = 1, gl = "in" } = body;

    if (action === "save-query") {
      if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
      const label = body.label || query.substring(0, 30) + "...";

      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id }
      });

      const existingQueries = (profile?.savedXRayQueries as { query: string; label: string; createdAt: string }[]) || [];
      const newQuery = { query, label, createdAt: new Date().toISOString() };

      await prisma.employerProfile.update({
        where: { userId: session.user.id },
        data: {
          savedXRayQueries: [newQuery, ...existingQueries].slice(0, 20)
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "delete-query") {
      const { index } = body;
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id }
      });

      const queries = (profile?.savedXRayQueries as { query: string; label: string; createdAt: string }[]) || [];
      queries.splice(index, 1);

      await prisma.employerProfile.update({
        where: { userId: session.user.id },
        data: { savedXRayQueries: queries }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "extract") {
      if (!openai) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
      }

      if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional technical recruiter. Your task is to convert a natural language job search query into a highly optimized Google X-Ray search string. By default, target LinkedIn profiles (site:linkedin.com/in), but if the user specifies another platform like GitHub, Behance, or StackOverflow, use the appropriate site operator. Only return the search string, nothing else. Example: Input: 'React dev in Bangalore', Output: 'site:linkedin.com/in \"React\" \"Bangalore\"'"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0,
      });

      const extractedQuery = response.choices[0]?.message?.content?.trim();
      return NextResponse.json({ query: extractedQuery });
    }

    if (action === "search") {
      if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        return NextResponse.json({
          error: "Google Search API key or CX ID not configured. Please add GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX to your .env file."
        }, { status: 500 });
      }

      if (!query) {
        return NextResponse.json({ error: "Search query is required" }, { status: 400 });
      }

      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&start=${start}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json();
        return NextResponse.json({ error: "Google Search API error", details: errorData }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({
        results: data.items || [],
        totalResults: data.searchInformation?.totalResults || "0",
        searchTime: data.searchInformation?.formattedSearchTime || "0.0"
      });
    }

    if (action === "summarize") {
      if (!openai) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
      }

      const { snippet, title, jobTitle, jobDescription } = body;
      if (!snippet) {
        return NextResponse.json({ error: "Snippet is required" }, { status: 400 });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a senior technical recruiter. Analyze the following search result snippet against a job requirement. Provide a concise, one-sentence 'Recruiter Insight' (max 150 chars) and a 'Match Score' from 0 to 100 based on how well the candidate seems to fit the role. Return ONLY a JSON object with keys 'summary' and 'score'."
          },
          {
            role: "user",
            content: `Job: ${jobTitle || "Technical Role"}\nRequirement: ${jobDescription || "Relevant technical expertise"}\n\nCandidate Title: ${title}\nCandidate Snippet: ${snippet}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0]?.message?.content || '{"summary": "", "score": 0}');
      return NextResponse.json(content);
    }

    if (action === "refine") {
      if (!openai) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
      }

      const { query, results } = body;
      if (!query || !results) {
        return NextResponse.json({ error: "Query and results are required" }, { status: 400 });
      }

      const snippets = results.slice(0, 5).map((r: { snippet: string }) => r.snippet).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert technical sourcer. Analyze the current X-Ray query and the search results snippets. Suggest 3 specific keywords or operators to add to the query to improve result quality. Return a JSON object with a key 'suggestions' containing an array of 3 strings. Example: { 'suggestions': ['\"TypeScript\"', '\"Remote\"', '-jobs'] }"
          },
          {
            role: "user",
            content: `Current Query: ${query}\nResults Snippets: ${snippets}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{"suggestions": []}';
      return NextResponse.json(JSON.parse(content));
    }

    if (action === "draft-email") {
      if (!openai) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
      }

      const { candidate, jobTitle, jobDescription } = body;
      if (!candidate) {
        return NextResponse.json({ error: "Candidate info is required" }, { status: 400 });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional recruiter. Draft a highly personalized, concise outreach message (LinkedIn InMail style) for a candidate. Use their profile snippet to mention something specific. Keep it under 400 characters. Use a warm, professional tone."
          },
          {
            role: "user",
            content: `Candidate: ${candidate.title}\nSnippet: ${candidate.snippet}\nJob: ${jobTitle || "a relevant role"}\nDescription: ${jobDescription || "technical project"}`
          }
        ],
        temperature: 0.8,
      });

      return NextResponse.json({ draft: response.choices[0]?.message?.content?.trim() });
    }

    if (action === "db-search") {
      if (!prompt) {
        return NextResponse.json({ error: "Search query is required" }, { status: 400 });
      }

      let parsedCriteria = {
        skills: [] as string[],
        location: "",
        jobTitle: "",
        minExperience: null as number | null
      };

      if (openai) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a professional recruiting assistant. Your task is to extract search parameters from a natural language candidate search query. Extract: 'skills' (array of strings, e.g. React, Node.js), 'location' (string, e.g. Bangalore, Remote), 'jobTitle' (string, e.g. Developer, Manager), and 'minExperience' (integer or null, e.g. 3). Return ONLY a JSON object with these keys."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0,
            response_format: { type: "json_object" }
          });
          parsedCriteria = JSON.parse(response.choices[0]?.message?.content || "{}");
        } catch (e) {
          console.error("OpenAI parsing failed, falling back to simple keywords:", e);
        }
      }

      const whereClause: any = {};
      const conditions: any[] = [];

      if (parsedCriteria.location) {
        conditions.push({
          location: {
            contains: parsedCriteria.location,
            mode: "insensitive"
          }
        });
      }

      if (parsedCriteria.jobTitle) {
        conditions.push({
          jobTitle: {
            contains: parsedCriteria.jobTitle,
            mode: "insensitive"
          }
        });
      }

      if (parsedCriteria.minExperience != null && !isNaN(Number(parsedCriteria.minExperience))) {
        conditions.push({
          experience: {
            gte: Number(parsedCriteria.minExperience)
          }
        });
      }

      if (parsedCriteria.skills && Array.isArray(parsedCriteria.skills) && parsedCriteria.skills.length > 0) {
        conditions.push({
          OR: [
            {
              skills: {
                hasSome: parsedCriteria.skills
              }
            },
            ...parsedCriteria.skills.map((skill: string) => ({
              bio: {
                contains: skill,
                mode: "insensitive"
              }
            }))
          ]
        });
      }

      if (conditions.length > 0) {
        whereClause.AND = conditions;
      }

      const results = await prisma.jobSeekerProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: { email: true }
          }
        },
        take: 30
      });

      return NextResponse.json({
        results: results.map((profile: any) => ({
          id: profile.id,
          userId: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.user?.email,
          phone: profile.phone,
          location: profile.location,
          skills: profile.skills,
          experience: profile.experience,
          jobTitle: profile.jobTitle,
          bio: profile.bio,
          resumeUrl: profile.resumeUrl,
          education: profile.education
        })),
        criteria: parsedCriteria
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[xray-search-api] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
