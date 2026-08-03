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
          body: JSON.stringify({
            resumeUrl,
            skills: uploadData.skills,
            experience: uploadData.experienceYears ? Number(uploadData.experienceYears) : undefined,
            education: uploadData.education && uploadData.education.length > 0 ? uploadData.education.join(", ") : undefined,
            jobTitle: uploadData.currentTitle || undefined,
            bio: uploadData.summary || undefined,
            phone: uploadData.phone || undefined,
            location: uploadData.location || undefined,
            linkedinUrl: uploadData.linkedinUrl || undefined,
            highestEducation: uploadData.highestEducation || undefined,
            noticePeriod: uploadData.noticePeriod || undefined,
            dateOfBirth: uploadData.dateOfBirth || undefined,
          }),
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
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="border-b border-slate-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">Application Details</h2>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Finalize your application for this position.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 sm:px-8 sm:py-8">
        {error && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700">Application Error</p>
                <p className="mt-1.5 text-sm text-amber-600 leading-relaxed">{error}</p>
                {missingRequirements.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold text-amber-600">Missing Profile Information:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {missingRequirements.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3">
                      <Link
                        href="/user/profile"
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-all"
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
        <div className="mb-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Label className="text-sm font-bold text-slate-800">Your Resume</Label>
              <p className="text-xs font-medium text-slate-500">Resume / Curriculum Vitae</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-5">
            {currentResumeUrl && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Current Resume</p>
                    {currentResumeUpdatedAt && (
                      <p className="text-xs font-medium text-slate-500">Last updated: {formatResumeUpdatedAt(currentResumeUpdatedAt)}</p>
                    )}
                  </div>
                </div>
                <a
                  href={currentResumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-5 flex items-center rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all"
                >
                  View Resume
                </a>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-500 block">Upload New Resume (Optional)</Label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="h-11 rounded-xl bg-white border-slate-200 text-slate-700 file:bg-slate-100 file:border-0 file:text-xs file:font-semibold file:text-slate-700 file:px-4 file:h-8 file:rounded-lg file:mr-4 cursor-pointer"
                />
                {resumeFile && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 whitespace-nowrap">
                    <Upload className="h-3 w-3" />
                    Ready: {resumeFile.name.slice(0, 20)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Cover Letter */}
        <div className="mb-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <Label htmlFor="coverLetter" className="text-sm font-bold text-slate-800">Cover Letter</Label>
              <p className="text-xs font-medium text-slate-500">Message to Hiring Manager</p>
            </div>
          </div>
          <div className="relative">
            <Textarea
              id="coverLetter"
              {...register("coverLetter")}
              placeholder="Describe why you are a good fit for this role..."
              rows={6}
              className="rounded-xl bg-white border-slate-200 focus:ring-primary/20 focus:border-primary/50 text-slate-800 resize-none p-5 font-medium leading-relaxed"
            />
          </div>
          {errors.coverLetter && (
            <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.coverLetter.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-6">
          <p className="text-xs font-medium text-slate-500 max-w-xs">
            Your application will be submitted to the employer securely.
          </p>
          <Button
            type="submit"
            loading={loading}
            className="w-full sm:w-60 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 text-white font-semibold transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
