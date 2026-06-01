"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatResumeUpdatedAt } from "@/lib/utils";
import { FileText, MessageSquare, Upload, AlertCircle, ExternalLink } from "lucide-react";

const applicationSchema = z.object({
  coverLetter: z.string().default(""),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: string;
  /** Current resume URL from profile (optional). Shown so user can update CV from this page. */
  currentResumeUrl?: string | null;
  /** When the CV was last updated (for display). */
  currentResumeUpdatedAt?: Date | string | null;
}

export default function ApplicationForm({ jobId, currentResumeUrl, currentResumeUpdatedAt }: ApplicationFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema) as Resolver<ApplicationFormData>,
    defaultValues: { coverLetter: "" },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setError("");
    setMissingRequirements([]);
    setLoading(true);

    try {
      let resumeUrl: string | null = null;

      // If user selected a new CV, upload and update profile
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        const uploadRes = await fetch("/api/upload/resume", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload resume");
        }
        const uploadData = await uploadRes.json();
        resumeUrl = uploadData.url;

        const patchRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeUrl }),
        });
        if (!patchRes.ok) {
          throw new Error("Failed to update your CV");
        }
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          coverLetter: data.coverLetter && data.coverLetter.length >= 10 ? data.coverLetter : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "PROFILE_INCOMPLETE" && Array.isArray(errorData.missingRequirements)) {
          setMissingRequirements(errorData.missingRequirements);
          setError(
            errorData.error ||
              "Your profile is missing information required to apply. Please complete the fields below in your profile, then try again."
          );
        } else {
          setError(errorData.error || "Failed to submit application");
        }
        setLoading(false);
        return;
      }

      router.push("/user/applications");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="linear-card rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="border-b border-white/5 p-10 sm:p-12">
        <h2 className="text-2xl font-bold text-foreground">Application Details</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground italic">
          Finalize your application for this position.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 sm:px-8 sm:py-6">
        {error && (
          <div className="mb-10 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-8">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 shrink-0 text-amber-500 mt-1" />
              <div className="flex-1">
                <p className="text-lg font-bold text-amber-400">Protocol Interrupted</p>
                <p className="mt-2 text-muted-foreground font-medium leading-relaxed">{error}</p>
                {missingRequirements.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-xs font-semibold text-amber-500/60">Missing Profile Information:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {missingRequirements.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-bold text-amber-200/80 bg-amber-500/10 px-4 py-2 rounded-lg">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4">
                      <Link
                        href="/user/profile"
                        className="inline-flex items-center gap-3 h-12 px-8 rounded-xl bg-amber-500 text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                      >
                        Complete Profile
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. CV / Resume section - optional update */}
        <div className="mb-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <Label className="text-lg font-bold text-foreground">Your Resume</Label>
              <p className="text-xs font-semibold text-muted-foreground">Resume / Curriculum Vitae</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6">
            {currentResumeUrl && (
              <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Current Resume</p>
                    {currentResumeUpdatedAt && (
                      <p className="text-xs font-semibold text-muted-foreground">LAST SYNC: {formatResumeUpdatedAt(currentResumeUpdatedAt)}</p>
                    )}
                  </div>
                </div>
                <a
                  href={currentResumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-6 flex items-center rounded-xl bg-white/10 text-xs font-semibold text-foreground hover:bg-white/20 transition-all shadow-lg"
                >
                  View Resume
                </a>
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground/60 block">Upload New Resume (Optional)</Label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="h-14 rounded-xl bg-white/5 border-white/10 text-foreground file:bg-white/10 file:border-0 file:text-xs file:font-semibold file:text-foreground file:px-6 file:h-10 file:rounded-lg file:mr-6 cursor-pointer"
                />
                {resumeFile && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary animate-pulse whitespace-nowrap">
                    <Upload className="h-3 w-3" />
                    Pending Override: {resumeFile.name.slice(0, 15)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Message to hiring manager - optional (was Cover Letter) */}
        <div className="mb-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <MessageSquare className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <Label htmlFor="coverLetter" className="text-lg font-bold text-foreground">Cover Letter</Label>
              <p className="text-xs font-semibold text-muted-foreground">Message to Hiring Manager</p>
            </div>
          </div>
          <div className="relative">
            <Textarea
              id="coverLetter"
              {...register("coverLetter")}
              placeholder="Describe why you are a good fit for this role..."
              rows={6}
              className="rounded-[1.5rem] bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 text-foreground resize-none p-8 font-medium leading-relaxed"
            />
            <div className="absolute right-6 bottom-6 h-1 w-1 rounded-full bg-primary/20" />
          </div>
          {errors.coverLetter && (
            <p className="mt-2 text-xs font-bold text-red-500">{errors.coverLetter.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-white/5 p-10 bg-white/[0.01]">
          <div className="flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
             <p className="text-xs font-semibold text-muted-foreground/50 max-w-[200px] leading-loose">
               Submit your application to the employer.
             </p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-80 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-semibold transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
