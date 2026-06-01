"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationDropdown from "@/components/user/LocationDropdown";

// Simplified schema to avoid TypeScript mismatches with zodResolver
const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      ...initialData,
    },
  });

  useEffect(() => {
    fetch("/api/categories?activeOnly=true")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const employmentType = watch("employmentType");
  const workMode = watch("workMode");
  const locationValue = watch("location") as string | undefined;
  const categoryValue = watch("category");

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
        throw new Error(errorData.error || "Failed to save job");
      }

      router.push("/employer/jobs");
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  };


  return (
    <div className="w-full bg-white rounded-[3rem] p-8 sm:p-12">
      <div className="mb-10 border-b border-slate-200 pb-10">
        <p className="mb-2 text-xs font-semibold text-primary italic">
          Job Details
        </p>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          {jobId ? "Edit Job" : "Create Job"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground font-semibold leading-relaxed">
          Fill in the details below to create your job listing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-bold animate-in slide-in-from-top-4">
            {error}
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-bold animate-in slide-in-from-top-4">
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

        {/* Section 1: Role & Location */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="text-xs font-semibold text-muted-foreground/60">Job Category & Title</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground/60">Job Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Software Engineer"
                className="h-14 rounded-2xl bg-white border-slate-200 focus-visible:ring-primary/20 font-bold shadow-sm"
              />
              {errors.title && (
                <p className="text-xs font-semibold text-red-400 mt-2">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground/60">Job Category *</Label>
              {categories.length > 0 ? (
                <Select
                  value={categoryValue || ""}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger id="category" className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold focus:ring-primary/20 shadow-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg">
                    {initialData?.category &&
                      !categories.some(
                        (c) => c.name === initialData?.category
                      ) && (
                        <SelectItem value={initialData.category} className="text-xs font-semibold text-foreground">
                          {initialData.category}
                        </SelectItem>
                      )}
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-xs font-semibold text-foreground">
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
                  className="h-14 rounded-2xl bg-white border-slate-200 focus:ring-primary/20 font-bold shadow-sm"
                />
              )}
               {errors.category && (
                <p className="text-xs font-semibold text-red-400 mt-2">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground/60">Job Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Outline the responsibilities, expected outcomes, and requirements..."
                rows={8}
                className="rounded-[2rem] bg-white border-slate-200 focus-visible:ring-primary/20 p-6 font-semibold leading-relaxed shadow-sm"
              />
              {errors.description && (
                <p className="text-xs font-semibold text-red-400 mt-2">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold text-muted-foreground/60">Location *</Label>
              <div className="p-1 rounded-[1.5rem] bg-slate-50 border border-slate-200 shadow-sm">
                <LocationDropdown
                  value={locationValue}
                  onChange={(value) => setValue("location", value)}
                  error={errors.location?.message}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Compensation & Experience */}
        <div className="space-y-8 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="text-xs font-semibold text-muted-foreground/60">Experience & Salary</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employmentType" className="text-xs font-semibold text-muted-foreground/60">Employment Type *</Label>
              <Select
                value={employmentType}
                onValueChange={(value) => setValue("employmentType", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg">
                  <SelectItem value="FULL_TIME" className="text-xs font-semibold text-foreground">Full Time</SelectItem>
                  <SelectItem value="PART_TIME" className="text-xs font-semibold text-foreground">Part Time</SelectItem>
                  <SelectItem value="CONTRACT" className="text-xs font-semibold text-foreground">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP" className="text-xs font-semibold text-foreground">Internship</SelectItem>
                  <SelectItem value="FREELANCE" className="text-xs font-semibold text-foreground">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
 
            <div className="space-y-2">
              <Label htmlFor="workMode" className="text-xs font-semibold text-muted-foreground/60">Work Mode *</Label>
              <Select
                value={workMode}
                onValueChange={(value) => setValue("workMode", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg">
                  <SelectItem value="ONSITE" className="text-xs font-semibold text-foreground">Onsite</SelectItem>
                  <SelectItem value="HYBRID" className="text-xs font-semibold text-foreground">Hybrid</SelectItem>
                  <SelectItem value="REMOTE" className="text-xs font-semibold text-foreground">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceMin" className="text-xs font-semibold text-muted-foreground/60">Min Experience (Years)</Label>
              <Input
                id="experienceMin"
                type="number"
                min={0}
                {...register("experienceMin", { valueAsNumber: true })}
                placeholder="0"
                className="h-14 rounded-2xl bg-white/5 border-slate-200 focus-visible:ring-primary/20 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceMax" className="text-xs font-semibold text-muted-foreground/60">Max Experience (Years)</Label>
              <Input
                id="experienceMax"
                type="number"
                min={0}
                {...register("experienceMax", { valueAsNumber: true })}
                placeholder="10"
                className="h-14 rounded-2xl bg-white/5 border-slate-200 focus-visible:ring-primary/20 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMin" className="text-xs font-semibold text-muted-foreground/60">Minimum Salary</Label>
              <Input
                id="salaryMin"
                type="number"
                min={0}
                step={100}
                {...register("salaryMin", { valueAsNumber: true })}
                placeholder="50000"
                className="h-14 rounded-2xl bg-white/5 border-slate-200 focus-visible:ring-primary/20 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax" className="text-xs font-semibold text-muted-foreground/60">Maximum Salary</Label>
              <Input
                id="salaryMax"
                type="number"
                min={0}
                step={100}
                {...register("salaryMax", { valueAsNumber: true })}
                placeholder="150000"
                className="h-14 rounded-2xl bg-white/5 border-slate-200 focus-visible:ring-primary/20 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground/60">Currency</Label>
              <Select
                value={watch("currency") || "INR"}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg">
                  <SelectItem value="INR" className="text-xs font-semibold text-foreground">INR</SelectItem>
                  <SelectItem value="USD" className="text-xs font-semibold text-foreground">USD</SelectItem>
                  <SelectItem value="EUR" className="text-xs font-semibold text-foreground">EUR</SelectItem>
                  <SelectItem value="GBP" className="text-xs font-semibold text-foreground">GBP</SelectItem>
                  <SelectItem value="AED" className="text-xs font-semibold text-foreground">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground/60">Pay Type</Label>
              <Select
                value={watch("payType") || "MONTHLY"}
                onValueChange={(value) => setValue("payType", value)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 text-xs font-semibold shadow-sm">
                  <SelectValue placeholder="Select Pay Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg">
                  <SelectItem value="HOURLY" className="text-xs font-semibold text-foreground">Hourly</SelectItem>
                  <SelectItem value="DAILY" className="text-xs font-semibold text-foreground">Daily</SelectItem>
                  <SelectItem value="WEEKLY" className="text-xs font-semibold text-foreground">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY" className="text-xs font-semibold text-foreground">Biweekly</SelectItem>
                  <SelectItem value="MONTHLY" className="text-xs font-semibold text-foreground">Monthly</SelectItem>
                  <SelectItem value="YEARLY" className="text-xs font-semibold text-foreground">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 3: Skills */}
        <div className="space-y-8 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="text-xs font-semibold text-muted-foreground/60">Skills & Expertise</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requiredSkills" className="text-xs font-semibold text-muted-foreground/60">Required Skills *</Label>
              <Input
                id="requiredSkills"
                {...register("requiredSkills")}
                placeholder="React, Next.js, Node.js"
                className="h-14 rounded-2xl bg-white/5 border-slate-200 focus-visible:ring-primary/20 font-bold"
              />
              <p className="text-xs font-semibold text-muted-foreground/40 mt-2 italic">Comma-separated list (e.g., React, Next.js, Node.js)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondarySkills" className="text-xs font-semibold text-muted-foreground/60">Optional Skills</Label>
              <Input
                id="secondarySkills"
                {...register("secondarySkills")}
                placeholder="Docker, Kubernetes, AWS"
                className="h-14 rounded-2xl bg-white/5 border-slate-200 focus-visible:ring-primary/20 font-bold"
              />
              <p className="text-xs font-semibold text-muted-foreground/40 mt-2 italic">Additional skills that are preferred but not mandatory</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-200">
          <p className="text-xs font-semibold text-muted-foreground/40">Please review all fields before posting your job.</p>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="h-14 px-10 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold text-foreground hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-12 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-semibold transition-all hover:scale-105 active:scale-95"
            >
              {loading ? "Saving..." : jobId ? "Update Job" : "Post Job"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}


