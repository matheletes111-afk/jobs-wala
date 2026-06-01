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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LocationDropdown from "@/components/user/LocationDropdown";
import { formatResumeUpdatedAt } from "@/lib/utils";
import { Camera, Plus, Trash2, FileText, ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CertificateItem = { url: string; type: "image" | "pdf"; description: string };

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  experience: z.number().min(0).optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
  linkedinUrl: z.string().optional(),
  highestEducation: z.string().optional(),
  currentSalary: z.any().optional(),
  currentSalaryCurrency: z.string().optional(),
  expectedSalary: z.any().optional(),
  expectedSalaryCurrency: z.string().optional(),
  desiredLocation: z.string().optional(),
  noticePeriod: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    location?: string | null;
    jobTitle?: string | null;
    experience?: number | null;
    education?: string | null;
    bio?: string | null;
    skills: string[];
    profileImage?: string | null;
    resumeUrl?: string | null;
    resumeUpdatedAt?: Date | string | null;
    certificates?: string | null;
    linkedinUrl?: string | null;
    highestEducation?: string | null;
    currentSalary?: number | null;
    currentSalaryCurrency?: string | null;
    expectedSalary?: number | null;
    expectedSalaryCurrency?: string | null;
    desiredLocation?: string | null;
    noticePeriod?: string | null;
    dateOfBirth?: Date | string | null;
  };
  userEmail?: string;
  emailChangeStatus?: string;
  emailChangeError?: string;
}

type CertificateEntry = {
  id: string;
  url?: string;
  type?: "image" | "pdf";
  description: string;
  file?: File;
};

export default function ProfileForm({
  profile,
  userEmail,
  emailChangeStatus,
  emailChangeError,
}: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile?.profileImage ?? null);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [certificateEntries, setCertificateEntries] = useState<CertificateEntry[]>(() => {
    if (!profile?.certificates) return [];
    try {
      const arr = JSON.parse(profile.certificates) as CertificateItem[];
      return Array.isArray(arr)
        ? arr.map((c) => ({ id: crypto.randomUUID(), url: c.url, type: c.type, description: c.description || "" }))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (emailChangeStatus === "true") {
      setEmailChangeMessage({
        type: "success",
        text: "Your email has been updated. You may need to sign in again with your new email.",
      });
      router.replace("/user/profile", { scroll: false });
    }
  }, [emailChangeStatus, router]);

  useEffect(() => {
    setPhotoPreview(profile?.profileImage ?? null);
  }, [profile?.profileImage]);

  useEffect(() => {
    if (emailChangeError) {
      const messages: Record<string, string> = {
        invalid_token: "Invalid or expired verification link.",
        token_expired: "Verification link expired. Please request a new one.",
        email_taken: "This email is already in use. Please use a different email.",
        verification_failed: "Verification failed. Please try again.",
      };
      setEmailChangeMessage({
        type: "error",
        text: messages[emailChangeError] || "Something went wrong.",
      });
      router.replace("/user/profile", { scroll: false });
    }
  }, [emailChangeError, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || "",
          location: profile.location || "",
          jobTitle: profile.jobTitle || "",
          experience: profile.experience || 0,
          education: profile.education || "",
          bio: profile.bio || "",
          skills: profile.skills.join(", "),
          linkedinUrl: profile.linkedinUrl || "",
          highestEducation: profile.highestEducation || "",
          currentSalary: profile.currentSalary ?? "",
          currentSalaryCurrency: profile.currentSalaryCurrency || "INR",
          expectedSalary: profile.expectedSalary ?? "",
          expectedSalaryCurrency: profile.expectedSalaryCurrency || "INR",
          desiredLocation: profile.desiredLocation || "",
          noticePeriod: profile.noticePeriod || "",
          dateOfBirth: profile.dateOfBirth
            ? typeof profile.dateOfBirth === "string"
              ? profile.dateOfBirth.split("T")[0]
              : new Date(profile.dateOfBirth).toISOString().split("T")[0]
            : "",
        }
      : undefined,
  });

  const locationValue = watch("location");
  const desiredLocationValue = watch("desiredLocation");

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return;
    setEmailChangeMessage(null);
    setEmailChangeLoading(true);
    try {
      const res = await fetch("/api/auth/change-email-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailChangeMessage({ type: "error", text: data.error || "Failed to send verification email." });
        return;
      }
      setEmailChangeMessage({
        type: "success",
        text: `Verification link sent to ${data.sentTo}. Check that inbox and click the link to confirm your new email.`,
      });
      setNewEmail("");
      router.refresh();
    } catch {
      setEmailChangeMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setLoading(true);

    try {
      let resumeUrl = profile?.resumeUrl || null;
      let profileImage = profile?.profileImage || null;

      // Upload photo if provided
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/upload/avatar", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload photo");
        const uploadData = await uploadRes.json();
        profileImage = uploadData.url;
      }

      // Upload resume if provided
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        const uploadResponse = await fetch("/api/upload/resume", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error("Failed to upload resume");
        const uploadData = await uploadResponse.json();
        resumeUrl = uploadData.url;
      }

      // Upload new certificate files and build certificates JSON
      const certificatesList: CertificateItem[] = [];
      for (const entry of certificateEntries) {
        if (entry.url && entry.type) {
          certificatesList.push({ url: entry.url, type: entry.type, description: entry.description || "" });
        } else if (entry.file) {
          const fd = new FormData();
          fd.append("file", entry.file);
          const certRes = await fetch("/api/upload/certificate", { method: "POST", body: fd });
          if (!certRes.ok) {
            const err = await certRes.json();
            throw new Error(err.error || "Failed to upload certificate");
          }
          const certData = await certRes.json();
          const type = entry.file.type.startsWith("image/") ? "image" as const : "pdf" as const;
          certificatesList.push({ url: certData.url, type, description: entry.description || "" });
        }
      }
      const certificatesJson = certificatesList.length > 0 ? JSON.stringify(certificatesList) : null;

      // Save profile
      const response = await fetch("/api/user/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills: data.skills
            ? data.skills.split(",").map((s) => s.trim())
            : [],
          profileImage,
          resumeUrl,
          certificates: certificatesJson,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      router.push("/user/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const triggerPhotoUpload = () => {
    (document.getElementById("profilePhoto") as HTMLInputElement)?.click();
  };

  const addCertificate = () => {
    setCertificateEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "" },
    ]);
  };
  const removeCertificate = (id: string) => {
    setCertificateEntries((prev) => prev.filter((e) => e.id !== id));
  };
  const setCertificateFile = (id: string, file: File | undefined) => {
    setCertificateEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, file } : e))
    );
  };
  const setCertificateDescription = (id: string, description: string) => {
    setCertificateEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  return (
    <div className="linear-card w-full overflow-hidden rounded-[2.5rem] p-10 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-12 flex flex-col sm:flex-row items-center gap-10">
          <div
            className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-white/10 bg-white/5 transition-all hover:border-primary/50"
            onClick={triggerPhotoUpload}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <span className="text-3xl font-black text-white/20">
                {profile?.firstName?.[0] ?? "?"}{profile?.lastName?.[0] ?? ""}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-foreground">{profile ? "My Profile" : "Create Profile"}</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Manage your personal and professional information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">
              {error}
            </div>
          )}

          {userEmail !== undefined && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={userEmail}
                  disabled
                  className="h-14 rounded-xl bg-white/5 border-white/10 text-muted-foreground font-bold cursor-not-allowed"
                />
              </div>
              <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Change Email</h3>
                </div>
                {emailChangeMessage && (
                  <div
                    className={`rounded-xl p-4 text-sm font-semibold border ${
                      emailChangeMessage.type === "success"
                         ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {emailChangeMessage.text}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-3">
                    <Label htmlFor="newEmail" className="text-xs font-semibold text-muted-foreground">New Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleRequestEmailChange())}
                      disabled={emailChangeLoading}
                      className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 text-foreground"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRequestEmailChange()}
                    disabled={emailChangeLoading || !newEmail.trim()}
                    className="h-12 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 whitespace-nowrap px-6 transition-all"
                  >
                    {emailChangeLoading ? "Sending..." : "Send Verification"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground">First Name</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="John"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
              {errors.firstName && (
                <p className="text-xs font-bold text-red-400">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground">Last Name</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Doe"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
              {errors.lastName && (
                <p className="text-xs font-bold text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-muted-foreground">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 text-foreground scheme-dark"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="linkedinUrl" className="text-xs font-semibold text-muted-foreground">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                {...register("linkedinUrl")}
                placeholder="https://linkedin.com/in/username"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+1234567890"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
              {errors.phone && (
                <p className="text-xs font-bold text-red-400">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground">Location (Current)</Label>
              <LocationDropdown
                value={locationValue}
                onChange={(value) => setValue("location", value)}
                error={errors.location?.message}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground">Desired Location (Multiple)</Label>
            <LocationDropdown
              value={desiredLocationValue}
              onChange={(value) => setValue("desiredLocation", value)}
              error={errors.desiredLocation?.message}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <Label htmlFor="jobTitle" className="text-xs font-semibold text-muted-foreground">Job Title</Label>
              <Input
                id="jobTitle"
                {...register("jobTitle")}
                placeholder="Software Engineer"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="experience" className="text-xs font-semibold text-muted-foreground">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                {...register("experience", { valueAsNumber: true })}
                placeholder="5"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="noticePeriod" className="text-xs font-semibold text-muted-foreground">Notice Period / LWD</Label>
              <Input
                id="noticePeriod"
                {...register("noticePeriod")}
                placeholder="e.g. Immediate, 30 days, LWD: 15 June"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <Label htmlFor="highestEducation" className="text-xs font-semibold text-muted-foreground">Highest Education</Label>
              <Input
                id="highestEducation"
                {...register("highestEducation")}
                placeholder="e.g. M.Tech, MBA, PhD"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="education" className="text-xs font-semibold text-muted-foreground">Education (Details)</Label>
              <Input
                id="education"
                {...register("education")}
                placeholder="Bachelor's in CS"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="skills" className="text-xs font-semibold text-muted-foreground">Skills</Label>
              <Input
                id="skills"
                {...register("skills")}
                placeholder="React, Node.js, TypeScript"
                className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground">Current Salary</Label>
              <div className="flex gap-3">
                <div className="w-[110px] shrink-0">
                  <Select
                    value={watch("currentSalaryCurrency") || "INR"}
                    onValueChange={(val) => setValue("currentSalaryCurrency", val)}
                  >
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 text-foreground focus:ring-primary/20">
                      <SelectValue placeholder="INR" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-slate-200">
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  id="currentSalary"
                  type="number"
                  {...register("currentSalary")}
                  placeholder="e.g. 1200000"
                  className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 flex-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground">Expected Salary</Label>
              <div className="flex gap-3">
                <div className="w-[110px] shrink-0">
                  <Select
                    value={watch("expectedSalaryCurrency") || "INR"}
                    onValueChange={(val) => setValue("expectedSalaryCurrency", val)}
                  >
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 text-foreground focus:ring-primary/20">
                      <SelectValue placeholder="INR" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-slate-200">
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  id="expectedSalary"
                  type="number"
                  {...register("expectedSalary")}
                  placeholder="e.g. 1500000"
                  className="h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="bio" className="text-xs font-semibold text-muted-foreground">Bio / Summary</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Write a professional summary..."
              rows={5}
              className="rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 text-foreground resize-none p-6"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">Resume / CV</h3>
            </div>
            <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6">
              <Input
                id="resume"
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="h-14 rounded-xl bg-white/5 border-white/10 file:bg-white/10 file:border-0 file:text-xs file:font-semibold file:text-foreground file:px-6 file:h-10 file:rounded-lg file:mr-6 cursor-pointer"
              />
              {profile?.resumeUrl && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-4">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Current Resume</p>
                      {profile?.resumeUpdatedAt && (
                        <p className="text-xs font-semibold text-muted-foreground">Synced: {formatResumeUpdatedAt(profile.resumeUpdatedAt)}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-6 rounded-lg bg-white/5 text-xs font-semibold text-foreground hover:bg-white/10 transition-all flex items-center"
                  >
                    View File
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground">Certifications</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addCertificate}
                className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-all"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Certificate
              </Button>
            </div>
            
            <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6">
              {certificateEntries.length === 0 ? (
                <p className="text-center py-4 text-xs font-medium text-muted-foreground italic">No certifications indexed.</p>
              ) : (
                <ul className="space-y-4">
                  {certificateEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 animate-in slide-in-from-right-4"
                    >
                      <div className="flex-1 w-full space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground/50">Certificate File</Label>
                        {entry.url ? (
                          <div className="flex items-center gap-4 h-12 px-4 rounded-xl bg-white/5 border border-white/10">
                            {entry.type === "image" ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-foreground hover:text-primary transition-colors underline decoration-primary/30">
                              View Certificate
                            </a>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept="image/*,.pdf,application/pdf"
                            className="h-12 rounded-xl bg-white/5 border-white/10"
                            onChange={(e) => setCertificateFile(entry.id, e.target.files?.[0])}
                          />
                        )}
                      </div>
                      <div className="flex-[2] w-full space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground/50">Description</Label>
                        <Input
                          placeholder="e.g. AWS Certified Solutions Architect"
                          value={entry.description}
                          onChange={(e) => setCertificateDescription(entry.id, e.target.value)}
                          className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                        onClick={() => removeCertificate(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs font-semibold text-muted-foreground/50">Save Profile Information</p>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-64 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
            >
              {loading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
            </Button>
          </div>
        </form>
      </div>
  );
}

