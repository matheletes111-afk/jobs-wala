"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, MessageSquare, Upload, AlertCircle, ExternalLink } from "lucide-react";

const applicationSchema = z.object({
  coverLetter: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: string;
  /** Current resume URL from profile (optional). Shown so user can update CV from this page. */
  currentResumeUrl?: string | null;
}

export default function ApplicationForm({ jobId, currentResumeUrl }: ApplicationFormProps) {
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
    resolver: zodResolver(applicationSchema),
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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
        <h2 className="text-xl font-semibold text-gray-900">Apply for this job</h2>
        <p className="mt-1 text-sm text-gray-500">
          Optionally update your CV and add a message for the hiring manager.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 sm:px-8 sm:py-6">
        {error && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium">Profile incomplete</p>
                <p className="mt-1 text-amber-800">{error}</p>
                {missingRequirements.length > 0 && (
                  <>
                    <p className="mt-2 font-medium text-amber-900">Missing in your profile:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-800">
                      {missingRequirements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    <Link
                      href="/user/profile"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                    >
                      Complete profile
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. CV / Resume section - optional update */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-4 w-4 text-[#2563eb]" />
            </div>
            <Label className="text-base font-medium">Your CV (optional)</Label>
          </div>
          <p className="mt-1 mb-3 text-sm text-gray-500">
            Applications use your profile CV. You can update it here before submitting.
          </p>
          {currentResumeUrl && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="text-sm text-gray-600">Current CV:</span>
              <a
                href={currentResumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#2563eb] hover:underline"
              >
                View current resume
              </a>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="max-w-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#2563eb] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-[#1d4ed8]"
            />
            {resumeFile && (
              <span className="text-sm text-gray-600">
                <Upload className="mr-1 inline h-4 w-4" />
                {resumeFile.name} will replace your current CV
              </span>
            )}
          </div>
        </div>

        {/* 2. Message to hiring manager - optional (was Cover Letter) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
              <MessageSquare className="h-4 w-4 text-sky-600" />
            </div>
            <Label htmlFor="coverLetter" className="text-base font-medium">
              Message to hiring manager (optional)
            </Label>
          </div>
          <p className="mt-1 mb-3 text-sm text-gray-500">
            Add a short note about why you&apos;re a good fit. Not required.
          </p>
          <Textarea
            id="coverLetter"
            {...register("coverLetter")}
            placeholder="e.g. I'm excited about this role because..."
            rows={5}
            className="resize-y min-h-[120px] rounded-lg border-gray-300 focus:border-[#2563eb] focus:ring-[#2563eb]/20"
          />
          {errors.coverLetter && (
            <p className="mt-1 text-sm text-red-600">{errors.coverLetter.message}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#2563eb] px-6 hover:bg-[#1d4ed8]"
          >
            {loading ? "Submitting..." : "Submit application"}
          </Button>
          <p className="text-xs text-gray-500">
            By applying, your profile and CV will be shared with the employer.
          </p>
        </div>
      </form>
    </div>
  );
}
