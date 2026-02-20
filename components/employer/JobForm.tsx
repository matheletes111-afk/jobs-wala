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

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  experienceRequired: z.number().min(0).optional(),
  experienceMin: z.number().min(0).optional(),
  experienceMax: z.number().min(0).optional(),
  salaryRange: z.string().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().optional(),
  payType: z.string().optional(),
  requiredSkills: z.string().optional(), // comma-separated, we split on submit
  secondarySkills: z.string().optional(),
  employmentType: z.string(),
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
  const locationValue = watch("location") as string | undefined;
  const categoryValue = watch("category");

  const onSubmit = async (data: JobFormData) => {
    setError("");
    setLoading(true);

    try {
      const url = jobId ? `/api/jobs/${jobId}` : "/api/jobs";
      const method = jobId ? "PUT" : "POST";

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
          experienceRequired: data.experienceMin ?? data.experienceRequired ?? 0,
          experienceMin: data.experienceMin,
          experienceMax: data.experienceMax,
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          currency: data.currency || undefined,
          payType: data.payType || undefined,
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
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Job details
        </p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">
          {jobId ? "Edit Job" : "Create New Job"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the role details so candidates can find and apply.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Role & location</p>
          <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Software Engineer"
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              {categories.length > 0 ? (
                <Select
                  value={categoryValue || ""}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialData?.category &&
                      !categories.some(
                        (c) => c.name === initialData?.category
                      ) && (
                        <SelectItem value={initialData.category}>
                          {initialData.category}
                        </SelectItem>
                      )}
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category"
                  {...register("category")}
                  placeholder="Technology"
                />
              )}
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={6}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <LocationDropdown
              value={locationValue}
              onChange={(value) => setValue("location", value)}
              error={errors.location?.message}
            />
          </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type, experience & pay</p>
          <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select
                value={employmentType}
                onValueChange={(value) => setValue("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  <SelectItem value="FREELANCE">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceMin">Experience Min (years)</Label>
              <Input
                id="experienceMin"
                type="number"
                min={0}
                {...register("experienceMin", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceMax">Experience Max (years)</Label>
              <Input
                id="experienceMax"
                type="number"
                min={0}
                {...register("experienceMax", { valueAsNumber: true })}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Salary Min</Label>
              <Input
                id="salaryMin"
                type="number"
                min={0}
                step={100}
                {...register("salaryMin", { valueAsNumber: true })}
                placeholder="30000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">Salary Max</Label>
              <Input
                id="salaryMax"
                type="number"
                min={0}
                step={100}
                {...register("salaryMax", { valueAsNumber: true })}
                placeholder="60000"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={watch("currency") || "INR"}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pay Type</Label>
              <Select
                value={watch("payType") || "MONTHLY"}
                onValueChange={(value) => setValue("payType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pay type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Skills</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
              <Input
                id="requiredSkills"
                {...register("requiredSkills")}
                placeholder="React, Node.js, TypeScript"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondarySkills">Secondary Skills (comma-separated)</Label>
              <Input
                id="secondarySkills"
                {...register("secondarySkills")}
                placeholder="Git, AWS, Docker"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
            {loading ? "Saving..." : jobId ? "Update Job" : "Post Job"}
          </Button>
        </form>
    </div>
  );
}

