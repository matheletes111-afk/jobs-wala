"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, LogIn, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationDropdown from "@/components/user/LocationDropdown";
import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center font-semibold text-xs text-slate-400 animate-pulse">
        Loading TinyMCE Editor...
      </div>
    ),
  }
);

// Simplified schema to avoid TypeScript mismatches with zodResolver
const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  companyName: z.string().min(1, "Company Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  experienceRequired: z.any().nullish(),
  experienceMin: z.any().nullish(),
  experienceMax: z.any().nullish(),
  salaryRange: z.string().nullish(),
  salaryMin: z.any().nullish(),
  salaryMax: z.any().nullish(),
  currency: z.string().nullish(),
  payType: z.string().nullish(),
  requiredSkills: z.string().nullish(), // comma-separated, we split on submit
  secondarySkills: z.string().nullish(),
  employmentType: z.string(),
  workMode: z.string(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  jobId?: string;
  initialData?: Partial<JobFormData>;
}

interface CategoryOption {
  id: string;
  name: string;
  status: string;
}

export default function JobForm({ jobId, initialData }: JobFormProps) {
  const router = useRouter();
  const { data: session, status: authState } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  
  // Employer status state
  const [employerStatus, setEmployerStatus] = useState<any>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      employmentType: initialData?.employmentType || "FULL_TIME",
      workMode: initialData?.workMode || "ONSITE",
      location: initialData?.location || "",
      payType: (() => {
        const v = (initialData as Record<string, unknown>)?.payType;
        return typeof v === "string" ? v : "MONTHLY";
      })(),
      currency: (() => {
        const v = (initialData as Record<string, unknown>)?.currency;
        return typeof v === "string" ? v : "INR";
      })(),
      companyName: initialData?.companyName || "",
      ...initialData,
    },
  });

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories?activeOnly=true")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch employer approval and status
  useEffect(() => {
    if (authState === "authenticated") {
      fetch("/api/employer/status")
        .then((res) => res.json())
        .then((data) => {
          setEmployerStatus(data);
          setFetchingStatus(false);
          // If no custom company name is provided, prefill it from profile
          if (data.companyName && !watch("companyName") && !initialData?.companyName) {
            setValue("companyName", data.companyName);
          }
        })
        .catch(() => setFetchingStatus(false));
    } else if (authState === "unauthenticated") {
      setFetchingStatus(false);
    }
  }, [authState]);

  // Load saved guest inputs
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jobsdaddy_pending_job_form");
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof JobFormData, parsed[key]);
        });
        localStorage.removeItem("jobsdaddy_pending_job_form");
      }
    } catch (e) {
      console.error("Error restoring cached form:", e);
    }
  }, [setValue]);

  const employmentType = watch("employmentType");
  const workMode = watch("workMode");
  const locationValue = watch("location") as string | undefined;
  const categoryValue = watch("category");

  // Cache values and redirect to login
  const handleLoginRequired = () => {
    const currentValues = watch();
    try {
      localStorage.setItem("jobsdaddy_pending_job_form", JSON.stringify(currentValues));
    } catch (e) {
      console.error("Failed to cache form values:", e);
    }
    router.push("/login?callbackUrl=/employer/jobs/new");
  };

  const onSubmit = async (data: JobFormData) => {
    setError("");
    setLoading(true);

    try {
      const url = jobId ? `/api/jobs/${jobId}` : "/api/jobs";
      const method = jobId ? "PUT" : "POST";

      const cleanNumber = (val: string | number | null | undefined) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const requiredSkillsArray = data.requiredSkills
        ? data.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const secondarySkillsArray = data.secondarySkills
        ? data.secondarySkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          experienceRequired: cleanNumber(data.experienceMin ?? data.experienceRequired ?? 0) ?? 0,
          experienceMin: cleanNumber(data.experienceMin),
          experienceMax: cleanNumber(data.experienceMax),
          salaryMin: cleanNumber(data.salaryMin),
          salaryMax: cleanNumber(data.salaryMax),
          currency: data.currency || null,
          payType: data.payType || null,
          requiredSkills: requiredSkillsArray,
          secondarySkills: secondarySkillsArray,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errMsg = errorData.message || errorData.error || "Failed to save job";
        if (errorData.error === "NO_ACTIVE_PLAN") {
          errMsg = "You do not have an active job posting plan. Please subscribe or upgrade to a plan to post new jobs.";
        } else if (errorData.error === "PLAN_LIMIT_REACHED") {
          errMsg = "You have reached the job posting limit for your current subscription plan. Please upgrade your plan to post more jobs.";
        }
        throw new Error(errMsg);
      }

      router.push("/employer/jobs");
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setLoading(false);
      alert(errorMessage);
    }
  };

  // Helper properties
  const isGuest = authState === "unauthenticated";
  const isEmployer = session?.user?.role === "EMPLOYER";
  const isAdmin = session?.user?.role === "ADMIN";
  const isCandidate = session?.user?.role === "JOB_SEEKER";
  const isApproved = employerStatus?.approvalStatus === "APPROVED";

  return (
    <div className="w-full bg-white rounded-[3rem] p-8 sm:p-12">
      <div className="mb-10 border-b border-slate-200 pb-10">
        <p className="mb-2 text-xs font-semibold text-blue-600 italic">
          Job Details
        </p>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          {jobId ? "Edit Job" : "Create Job"}
        </h2>
        <p className="mt-3 text-sm text-slate-500 font-semibold leading-relaxed">
          Fill in the details below to create your job listing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 font-bold animate-in slide-in-from-top-4">
            {error}
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 font-bold animate-in slide-in-from-top-4">
            <p className="mb-2">Please fix the following errors to save the job:</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, err]) => (
                <li key={field} className="capitalize">
                  {field}: {err?.message?.toString() || "Invalid value"}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Role, Company & Location */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Job Category & Company Info</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-slate-500">Job Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Software Engineer"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold shadow-sm"
              />
              {errors.title && (
                <p className="text-xs font-semibold text-rose-500 mt-2">{errors.title.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-xs font-bold text-slate-500">Company Name *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="e.g. Acme Tech Solutions"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold shadow-sm"
              />
              {errors.companyName && (
                <p className="text-xs font-semibold text-rose-500 mt-2">{errors.companyName.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-bold text-slate-500">Job Category *</Label>
              {categories.length > 0 ? (
                <Select
                  value={categoryValue || ""}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger id="category" className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold focus:ring-blue-600/20 shadow-sm text-slate-700">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-250/60 shadow-lg">
                    {initialData?.category &&
                      !categories.some(
                        (c) => c.name === initialData?.category
                      ) && (
                        <SelectItem value={initialData.category} className="text-xs font-semibold text-slate-800">
                          {initialData.category}
                        </SelectItem>
                      )}
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-xs font-semibold text-slate-800">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category"
                  {...register("category")}
                  placeholder="IT Department"
                  className="h-14 rounded-2xl bg-white border-slate-200 focus:ring-blue-600/20 font-semibold shadow-sm"
                />
              )}
              {errors.category && (
                <p className="text-xs font-semibold text-rose-500 mt-2">{errors.category.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-500">Location *</Label>
              <div className="p-1 rounded-[1.5rem] bg-slate-50 border border-slate-200 shadow-sm">
                <LocationDropdown
                  value={locationValue}
                  onChange={(value) => setValue("location", value)}
                  error={errors.location?.message}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description" className="text-xs font-bold text-slate-500">Job Description *</Label>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <Controller
                  name="description"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Editor
                      tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
                      value={value || ""}
                      onEditorChange={onChange}
                      init={{
                        height: 400,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        promotion: false,
                        branding: false
                      }}
                    />
                  )}
                />
              </div>
              {errors.description && (
                <p className="text-xs font-semibold text-rose-500 mt-2">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Compensation & Experience */}
        <div className="space-y-8 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Experience & Salary</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employmentType" className="text-xs font-bold text-slate-500">Employment Type *</Label>
              <Select
                value={employmentType}
                onValueChange={(value) => setValue("employmentType", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-250/60 shadow-lg">
                  <SelectItem value="FULL_TIME" className="text-xs font-semibold text-slate-850">Full Time</SelectItem>
                  <SelectItem value="PART_TIME" className="text-xs font-semibold text-slate-850">Part Time</SelectItem>
                  <SelectItem value="CONTRACT" className="text-xs font-semibold text-slate-850">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP" className="text-xs font-semibold text-slate-850">Internship</SelectItem>
                  <SelectItem value="FREELANCE" className="text-xs font-semibold text-slate-850">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
 
            <div className="space-y-2">
              <Label htmlFor="workMode" className="text-xs font-bold text-slate-500">Work Mode *</Label>
              <Select
                value={workMode}
                onValueChange={(value) => setValue("workMode", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-250/60 shadow-lg">
                  <SelectItem value="ONSITE" className="text-xs font-semibold text-slate-850">Onsite</SelectItem>
                  <SelectItem value="HYBRID" className="text-xs font-semibold text-slate-850">Hybrid</SelectItem>
                  <SelectItem value="REMOTE" className="text-xs font-semibold text-slate-850">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceMin" className="text-xs font-bold text-slate-500">Min Experience (Years)</Label>
              <Input
                id="experienceMin"
                type="number"
                min={0}
                {...register("experienceMin", { valueAsNumber: true })}
                placeholder="0"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceMax" className="text-xs font-bold text-slate-500">Max Experience (Years)</Label>
              <Input
                id="experienceMax"
                type="number"
                min={0}
                {...register("experienceMax", { valueAsNumber: true })}
                placeholder="10"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMin" className="text-xs font-bold text-slate-500">Minimum Salary</Label>
              <Input
                id="salaryMin"
                type="number"
                min={0}
                step={100}
                {...register("salaryMin", { valueAsNumber: true })}
                placeholder="50000"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax" className="text-xs font-bold text-slate-500">Maximum Salary</Label>
              <Input
                id="salaryMax"
                type="number"
                min={0}
                step={100}
                {...register("salaryMax", { valueAsNumber: true })}
                placeholder="150000"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">Currency</Label>
              <Select
                value={watch("currency") || "INR"}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm text-slate-700">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-250/60 shadow-lg">
                  <SelectItem value="INR" className="text-xs font-semibold text-slate-850">INR</SelectItem>
                  <SelectItem value="USD" className="text-xs font-semibold text-slate-850">USD</SelectItem>
                  <SelectItem value="EUR" className="text-xs font-semibold text-slate-850">EUR</SelectItem>
                  <SelectItem value="GBP" className="text-xs font-semibold text-slate-850">GBP</SelectItem>
                  <SelectItem value="AED" className="text-xs font-semibold text-slate-850">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">Per Type</Label>
              <Select
                value={watch("payType") || "MONTHLY"}
                onValueChange={(value) => setValue("payType", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm text-slate-700">
                  <SelectValue placeholder="Select Per Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-250/60 shadow-lg">
                  <SelectItem value="HOURLY" className="text-xs font-semibold text-slate-850">Hourly</SelectItem>
                  <SelectItem value="DAILY" className="text-xs font-semibold text-slate-850">Daily</SelectItem>
                  <SelectItem value="WEEKLY" className="text-xs font-semibold text-slate-850">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY" className="text-xs font-semibold text-slate-850">Biweekly</SelectItem>
                  <SelectItem value="MONTHLY" className="text-xs font-semibold text-slate-850">Monthly</SelectItem>
                  <SelectItem value="YEARLY" className="text-xs font-semibold text-slate-850">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 3: Skills */}
        <div className="space-y-8 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Skills & Expertise</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requiredSkills" className="text-xs font-bold text-slate-500">Required Skills *</Label>
              <Input
                id="requiredSkills"
                {...register("requiredSkills")}
                placeholder="React, Next.js, Node.js"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold"
              />
              <p className="text-xs font-semibold text-slate-400 mt-2 italic">Comma-separated list (e.g., React, Next.js, Node.js)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondarySkills" className="text-xs font-bold text-slate-500">Optional Skills</Label>
              <Input
                id="secondarySkills"
                {...register("secondarySkills")}
                placeholder="Docker, Kubernetes, AWS"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-blue-600/20 font-semibold"
              />
              <p className="text-xs font-semibold text-slate-400 mt-2 italic">Additional skills that are preferred but not mandatory</p>
            </div>
          </div>
        </div>

        {/* Status / Restriction banners before submit */}
        {fetchingStatus ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-500">
            <div className="size-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mr-2" />
            Verifying employer status...
          </div>
        ) : (
          <>
            {isCandidate && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5 flex items-start gap-3">
                <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-orange-700">Account Role Restriction</p>
                  <p className="text-xs text-orange-600 font-semibold mt-1 leading-relaxed">
                    You are logged in as a candidate. Only employers or administrators can publish jobs to the platform.
                  </p>
                </div>
              </div>
            )}

            {isEmployer && !isApproved && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 flex items-start gap-3">
                <AlertCircle className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-blue-700">Employer Approval Pending</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1 leading-relaxed">
                    Your profile is currently waiting for admin approval. You can save this job, and it will be stored under your dashboard, but it will remain hidden from candidate search results until approved.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 font-bold animate-in slide-in-from-top-4">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400">Please review all fields before posting your job.</p>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="h-14 px-10 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancel
            </Button>

            {isGuest ? (
              <Button
                type="button"
                onClick={handleLoginRequired}
                className="h-14 px-8 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Login to Post Job <LogIn className="size-4" />
              </Button>
            ) : isCandidate ? (
              <Button
                type="button"
                disabled
                className="h-14 px-10 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-not-allowed border-slate-200"
              >
                Blocked <Lock className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
              >
                {loading ? "Saving..." : jobId ? "Update Job" : "Post Job"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
